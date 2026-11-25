/**
 * The training store: the one place the rebuilt app keeps training data.
 *
 * It replaces the old script's globals (doneMap, logMap, notesMap,
 * sessionsMap, the workout timers and the preferences) and reads and writes
 * exactly the same localStorage keys in the same formats, so the old page,
 * the new page, backups and cloud sync all see the same data.
 *
 * - State is immutable: each change makes a new state object and reuses
 *   everything it didn't touch, so a component watching one exercise only
 *   re-renders when that exercise changes (works with React's useSyncExternalStore).
 * - The four maps are saved together as one JSON blob, half a second after the
 *   last change (call flush() when the page is hidden or closed). Preferences
 *   and timers are saved straight away, each under its own key.
 * - It also offers readState() / applyState() in the shape cloud sync expects.
 */
import { applyBackup, datedLogs, datedNotes, SCHEMA_VERSION, type BackupContents } from './backup';
import { dateKey } from './dates';
import { addSetsOn, daySetKeys, dayProgress, nextTrainingWeek, setKey } from './progress';
import { isPersonalRecord, shownSets } from './strength';
import { normalizePrefs, TIMER_MAX_AGE_MS } from '../sync/model';
import type { DoneMap, LogEntry, LogMap, NotesMap, Prefs, SessionsMap, TrainingState } from './types';

/** Every key the training data lives under. Never rename these: saved data depends on them. */
export const STORAGE_KEYS = {
  /** {doneMap, logMap, notesMap, sessionsMap} as one JSON blob. */
  state: 'hb_state_v1',
  /** "3" once logs and notes are dated. */
  schemaVersion: 'hb_schemaVersion_v1',
  /** Before hb_state_v1 the four maps had a key each. Still read (never deleted) if hb_state_v1 is missing. */
  oldDoneMap: 'hb_completed_sets_v1',
  oldLogMap: 'hb_logMap_v1',
  oldNotesMap: 'hb_notesMap_v1',
  oldSessionsMap: 'hb_sessions_v1',
  /** {"legsA": start ms}. */
  timers: 'hb_sessionTimerStarts_v1',
  /** JSON true / false. */
  autoRest: 'hb_autoRest_v1',
  audio: 'hb_audioEnabled_v1',
  highContrast: 'hb_highContrast_v1',
  /** "1" … "6". */
  trainingWeek: 'hb_mesocycleWeek_v1',
  /** Plain "kg" / "lb", not JSON. */
  unit: 'hb_weightUnit_v1',
} as const;

/** localStorage, or a stand-in for tests. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function emptyTrainingState(): TrainingState {
  return { doneMap: {}, logMap: {}, notesMap: {}, sessionsMap: {}, timers: {}, prefs: normalizePrefs(null) };
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object';

function readJson(storage: KeyValueStorage, key: string): unknown {
  try {
    return JSON.parse(storage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}

/** Running timers less than 6 hours old (an older one is a session someone forgot to reset). */
function freshTimers(raw: unknown, now: number): Record<string, number> {
  const out: Record<string, number> = {};
  if (isObject(raw)) {
    for (const [day, ts] of Object.entries(raw)) if (typeof ts === 'number' && now - ts < TIMER_MAX_AGE_MS) out[day] = ts;
  }
  return out;
}

/**
 * Reads the saved training data the way the old app does. `migrated` is true
 * when logs or notes had to be dated (first load after an old version), so
 * the result should be saved.
 */
export function loadTrainingState(storage: KeyValueStorage, now: Date = new Date()): { state: TrainingState; migrated: boolean } {
  const unified = readJson(storage, STORAGE_KEYS.state);
  const maps = isObject(unified)
    ? unified
    : {
        doneMap: readJson(storage, STORAGE_KEYS.oldDoneMap),
        logMap: readJson(storage, STORAGE_KEYS.oldLogMap),
        notesMap: readJson(storage, STORAGE_KEYS.oldNotesMap),
        sessionsMap: readJson(storage, STORAGE_KEYS.oldSessionsMap),
      };
  const map = <T,>(v: unknown) => (isObject(v) ? (v as T) : ({} as T));
  let logMap = map<LogMap>(maps.logMap);
  let notesMap = map<NotesMap>(maps.notesMap);

  let migrated = false;
  if (storage.getItem(STORAGE_KEYS.schemaVersion) !== String(SCHEMA_VERSION)) {
    logMap = datedLogs(logMap, dateKey(now)) as LogMap;
    notesMap = datedNotes(notesMap, dateKey(now)) as NotesMap;
    migrated = true;
  }

  const flag = (key: string, fallback: boolean) => {
    const v = readJson(storage, key);
    return v === null ? fallback : !!v;
  };
  const week = parseInt(storage.getItem(STORAGE_KEYS.trainingWeek) ?? '', 10);
  return {
    migrated,
    state: {
      doneMap: map<DoneMap>(maps.doneMap),
      logMap,
      notesMap,
      sessionsMap: map<SessionsMap>(maps.sessionsMap),
      timers: freshTimers(readJson(storage, STORAGE_KEYS.timers), now.getTime()),
      prefs: {
        autoRest: flag(STORAGE_KEYS.autoRest, true),
        audio: flag(STORAGE_KEYS.audio, true),
        highContrast: flag(STORAGE_KEYS.highContrast, false),
        mesocycleWeek: week >= 1 && week <= 6 ? week : 1,
        unit: storage.getItem(STORAGE_KEYS.unit) === 'lb' ? 'lb' : 'kg',
      },
    },
  };
}

export interface TrainingStoreOptions {
  /** The clock (tests pass a fixed one). */
  now?: () => Date;
  /** Delay before the maps are written; 500 ms, like the old app. */
  saveDelayMs?: number;
  /** A write failed (usually storage full). The old app shows a warning once. */
  onWriteError?: (error: unknown) => void;
}

/** What a set's boxes hold when it's logged. Blank boxes are ''. */
export interface SetInput {
  w: string;
  r: string;
  rir: string;
}

type Listener = () => void;

export class TrainingStore {
  private state: TrainingState;
  private readonly listeners = new Set<Listener>();
  private readonly now: () => Date;
  private readonly saveDelayMs: number;
  private readonly onWriteError: (error: unknown) => void;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private mapsDirty = false;

  constructor(private readonly storage: KeyValueStorage, options: TrainingStoreOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.saveDelayMs = options.saveDelayMs ?? 500;
    this.onWriteError = options.onWriteError ?? (() => {});
    const { state, migrated } = loadTrainingState(storage, this.now());
    this.state = state;
    if (migrated) {
      this.mapsDirty = true;
      this.flush();
      this.write(STORAGE_KEYS.schemaVersion, String(SCHEMA_VERSION));
    }
  }

  // ---------- reading ----------

  /** The current state. Never mutate it: every change goes through the methods below. */
  getState = (): TrainingState => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private today(): string {
    return dateKey(this.now());
  }

  // ---------- saving ----------

  private write(key: string, value: string) {
    try {
      this.storage.setItem(key, value);
    } catch (error) {
      this.onWriteError(error);
    }
  }

  /** Writes any pending changes now (call on visibilitychange → hidden and pagehide). */
  flush = (): void => {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    if (!this.mapsDirty) return;
    this.mapsDirty = false;
    const { doneMap, logMap, notesMap, sessionsMap } = this.state;
    this.write(STORAGE_KEYS.state, JSON.stringify({ doneMap, logMap, notesMap, sessionsMap }));
  };

  /** Swaps in the next state, saves what changed, and tells subscribers. */
  private commit(next: TrainingState) {
    const prev = this.state;
    if (next === prev) return;
    this.state = next;

    if (next.doneMap !== prev.doneMap || next.logMap !== prev.logMap || next.notesMap !== prev.notesMap || next.sessionsMap !== prev.sessionsMap) {
      this.mapsDirty = true;
      if (this.saveTimer) clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(this.flush, this.saveDelayMs);
    }
    if (next.timers !== prev.timers) this.write(STORAGE_KEYS.timers, JSON.stringify(next.timers));
    const a = prev.prefs;
    const b = next.prefs;
    if (b.autoRest !== a.autoRest) this.write(STORAGE_KEYS.autoRest, JSON.stringify(b.autoRest));
    if (b.audio !== a.audio) this.write(STORAGE_KEYS.audio, JSON.stringify(b.audio));
    if (b.highContrast !== a.highContrast) this.write(STORAGE_KEYS.highContrast, JSON.stringify(b.highContrast));
    if (b.mesocycleWeek !== a.mesocycleWeek) this.write(STORAGE_KEYS.trainingWeek, String(b.mesocycleWeek));
    if (b.unit !== a.unit) this.write(STORAGE_KEYS.unit, b.unit);

    for (const listener of this.listeners) listener();
  }

  // ---------- ticking sets ----------

  /**
   * Ticks or unticks one set dot and counts it toward today's sets. The day's
   * workout timer starts when the day has a ticked set and no timer yet.
   * Returns whether the set is now ticked. (Logging the set's boxes is a
   * separate logSet() call.)
   */
  toggleSet(dayId: string, exercise: string, setIdx: string | number): boolean {
    const key = setKey(exercise, setIdx);
    const s = this.state;
    const nowDone = !s.doneMap[key];
    const doneMap = { ...s.doneMap };
    if (nowDone) doneMap[key] = true;
    else delete doneMap[key];
    let timers = s.timers;
    if (!timers[dayId] && dayProgress(doneMap, dayId).done > 0) timers = { ...timers, [dayId]: this.now().getTime() };
    this.commit({ ...s, doneMap, sessionsMap: addSetsOn(s.sessionsMap, this.today(), nowDone ? 1 : -1), timers });
    return nowDone;
  }

  /** Clears a day's ticks and its timer. Returns an undo that puts the ticks back (not the timer, as before). */
  resetDay(dayId: string): () => void {
    const s = this.state;
    const cleared = daySetKeys(dayId).filter((k) => s.doneMap[k]);
    const doneMap = { ...s.doneMap };
    for (const k of cleared) delete doneMap[k];
    const timers = { ...s.timers };
    delete timers[dayId];
    this.commit({ ...s, doneMap, sessionsMap: addSetsOn(s.sessionsMap, this.today(), -cleared.length), timers });
    return () => {
      const t = this.state;
      const restored = { ...t.doneMap };
      for (const k of cleared) restored[k] = true;
      this.commit({ ...t, doneMap: restored, sessionsMap: addSetsOn(t.sessionsMap, this.today(), cleared.length) });
    };
  }

  /**
   * "Reset Entire Week": clears every tick and timer and moves to the next
   * training week (6 → 1). Returns an undo that restores the ticks and the week.
   */
  resetWeek(): () => void {
    const s = this.state;
    const snapshot = s.doneMap;
    // Every saved tick, even ones for sets since removed from the program, as before.
    const count = Object.keys(snapshot).length;
    const week = s.prefs.mesocycleWeek;
    this.commit({
      ...s,
      doneMap: {},
      sessionsMap: addSetsOn(s.sessionsMap, this.today(), -count),
      timers: Object.keys(s.timers).length ? {} : s.timers,
      prefs: { ...s.prefs, mesocycleWeek: nextTrainingWeek(week) },
    });
    return () => {
      const t = this.state;
      this.commit({
        ...t,
        doneMap: { ...snapshot },
        sessionsMap: addSetsOn(t.sessionsMap, this.today(), count),
        prefs: { ...t.prefs, mesocycleWeek: week },
      });
    };
  }

  // ---------- logging ----------

  /**
   * Saves one set's weight (kg), reps and RIR under today's date; all blank
   * removes it. Only this set changes (the old page also saved the
   * suggestions in the card's other rows: fixed here).
   *
   * It's a PR if it beats every set from earlier days, in the shown unit. (The
   * old page also compared it with today's earlier save of the same set, so
   * a PR vanished when that set was edited again: fixed here.) Returns
   * whether it's a PR.
   */
  logSet(exercise: string, setIdx: string | number, input: SetInput): boolean {
    const s = this.state;
    const today = this.today();
    const history = s.logMap[exercise] ?? {};
    const day = { ...history[today] };
    let pr = false;
    if (!input.w && !input.r && !input.rir) {
      if (!(setIdx in day)) return false;
      delete day[setIdx];
    } else {
      const earlier = Object.fromEntries(Object.entries(history).filter(([d]) => d < today));
      const entry: LogEntry = { w: input.w, r: input.r, rir: input.rir };
      pr = isPersonalRecord(entry, shownSets(earlier, s.prefs.unit), s.prefs.unit) === true;
      if (pr) entry.pr = true;
      day[setIdx] = entry;
    }
    const nextHistory = { ...history, [today]: day };
    if (!Object.keys(day).length) delete nextHistory[today];
    const logMap = { ...s.logMap, [exercise]: nextHistory };
    if (!Object.keys(nextHistory).length) delete logMap[exercise];
    this.commit({ ...s, logMap });
    return pr;
  }

  /** Saves today's note for an exercise; empty text removes it. */
  setNote(exercise: string, text: string): void {
    const s = this.state;
    const today = this.today();
    const notes = { ...s.notesMap[exercise] };
    if (text) notes[today] = text;
    else delete notes[today];
    const notesMap = { ...s.notesMap, [exercise]: notes };
    if (!Object.keys(notes).length) delete notesMap[exercise];
    this.commit({ ...s, notesMap });
  }

  // ---------- preferences ----------

  setPrefs(changes: Partial<Prefs>): void {
    const prefs = normalizePrefs({ ...this.state.prefs, ...changes });
    this.commit({ ...this.state, prefs });
  }

  // ---------- backups and sync ----------

  /** Applies a checked backup (see backup.readBackup) after the lifter confirms, and saves it at once. */
  importBackup(contents: BackupContents): void {
    this.commit(applyBackup(this.state, contents));
    this.flush();
  }

  /** A copy of everything, for cloud sync and exports. */
  readState = (): TrainingState => structuredClone(this.state);

  /** Replaces everything with synced data. Timers over 6 hours old are dropped, as before. */
  applyState = (next: TrainingState): void => {
    const copy = structuredClone(next);
    this.commit({ ...copy, timers: freshTimers(copy.timers, this.now().getTime()), prefs: normalizePrefs(copy.prefs) });
    this.flush();
  };

  /** Re-reads storage, e.g. after another tab saved (the window "storage" event). */
  reload(): void {
    this.flush();
    this.commit(loadTrainingState(this.storage, this.now()).state);
    this.mapsDirty = false;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = null;
  }
}
