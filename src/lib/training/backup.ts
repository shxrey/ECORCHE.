/**
 * Backup files: "Export Backup" writes one, "Import Backup" reads one back.
 *
 * Every format the app has ever exported still imports:
 *   - the oldest: a bare doneMap, {"push-a1-set1": true, …}, with no wrapper
 *   - {app, exportedAt, doneMap}                                  (July 2026)
 *   - … plus logMap, notesMap, sessionsMap                        (August 2026)
 *   - schemaVersion 2, plus preferences {autoRestEnabled, audioEnabled}
 *   - schemaVersion 3: notes are dated; preferences add weightUnit (today)
 *   - logs saved before they were dated ({set: entry} per exercise) and
 *     undated notes (one string per exercise) are filed under today
 *
 * Importing checks the whole file before anything changes. Entries that are
 * malformed, out of range, or for exercises no longer in the program are
 * dropped; the rest of the file still imports.
 */
import { isDateKey } from './dates';
import type { DoneMap, LogEntry, LogMap, NotesMap, SessionsMap, TrainingState, WeightUnit } from './types';

export const BACKUP_APP = 'hypertrophy-blueprint';
export const SCHEMA_VERSION = 3;
/** A workout log has no reason to be anywhere near this. */
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export interface BackupPreferences {
  autoRestEnabled: boolean;
  audioEnabled: boolean;
  weightUnit: WeightUnit;
}

export interface BackupFile {
  app: typeof BACKUP_APP;
  schemaVersion: number;
  exportedAt: string;
  doneMap: DoneMap;
  logMap: LogMap;
  notesMap: NotesMap;
  sessionsMap: SessionsMap;
  preferences: BackupPreferences;
}

/** The file "Export Backup" saves (pretty-printed JSON, the same field order as ever). */
export function buildBackup(state: TrainingState, now: Date): BackupFile {
  return {
    app: BACKUP_APP,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    doneMap: state.doneMap,
    logMap: state.logMap,
    notesMap: state.notesMap,
    sessionsMap: state.sessionsMap,
    preferences: { autoRestEnabled: state.prefs.autoRest, audioEnabled: state.prefs.audio, weightUnit: state.prefs.unit },
  };
}

export const backupFileName = (today: string) => `ecorche-backup-${today}.json`;

// ---------- reading old shapes ----------

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object';

/**
 * Logs saved before they were dated ({set: entry} per exercise) are filed
 * under `today`. An exercise with any date key is already dated; its bad keys
 * are dropped later by cleanLogMap. (The old app wrapped it whole under today,
 * as junk sets named after dates, and the page then failed to draw them.)
 */
export function datedLogs(map: Record<string, unknown>, today: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [ex, entry] of Object.entries(map)) {
    const keys = isObject(entry) ? Object.keys(entry) : [];
    out[ex] = keys.length && !keys.some(isDateKey) ? { [today]: entry } : entry;
  }
  return out;
}

/** Undated notes (one string per exercise) are filed under `today`; anything else that isn't an object becomes {}. */
export function datedNotes(map: Record<string, unknown>, today: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [ex, entry] of Object.entries(map)) {
    if (typeof entry === 'string') out[ex] = entry ? { [today]: entry } : {};
    else out[ex] = isObject(entry) ? entry : {};
  }
  return out;
}

// ---------- cleaning ----------

const UNSAFE_KEYS = ['__proto__', 'constructor', 'prototype'];

/** True if any key (to 7 levels deep) could tamper with object prototypes. */
export function hasUnsafeKeys(value: unknown, depth = 0): boolean {
  if (depth > 6 || !isObject(value)) return false;
  return Object.keys(value).some((k) => UNSAFE_KEYS.includes(k) || hasUnsafeKeys(value[k], depth + 1));
}

/** Blank, or a number from 0 to `max`. Text such as "100" stays as it was saved. */
function inRange(v: unknown, max: number): boolean {
  if (v === '' || v == null) return true;
  const n = parseFloat(String(v));
  return Number.isFinite(n) && n >= 0 && n <= max;
}

/** Keeps ticks (=== true) for exercises in the program. Set numbers aren't checked: old ticks for removed sets are harmless. */
export function cleanDoneMap(raw: Record<string, unknown>, exercises: ReadonlySet<string>): DoneMap {
  const clean: DoneMap = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === true && exercises.has(key.replace(/-set[^-]+$/, ''))) clean[key] = true;
  }
  return clean;
}

/**
 * Keeps entries with weight 0–2000, reps 0–100 and RIR 0–20 (each may be
 * blank), on dated keys and numbered sets, for known exercises.
 */
export function cleanLogMap(raw: Record<string, unknown>, exercises: ReadonlySet<string>): LogMap {
  const clean: LogMap = {};
  for (const [ex, dates] of Object.entries(raw)) {
    if (!exercises.has(ex) || !isObject(dates)) continue;
    const cleanDates: LogMap[string] = {};
    for (const [date, sets] of Object.entries(dates)) {
      if (!isDateKey(date) || !isObject(sets)) continue;
      const cleanSets: Record<string, LogEntry> = {};
      for (const [idx, s] of Object.entries(sets)) {
        // The old app didn't check set numbers; the app never wrote anything else.
        if (!/^\d+$/.test(idx) || !isObject(s)) continue;
        if (inRange(s.w, 2000) && inRange(s.r, 100) && inRange(s.rir, 20)) {
          cleanSets[idx] = { w: s.w as LogEntry['w'], r: s.r as LogEntry['r'], rir: s.rir as LogEntry['rir'], pr: s.pr === true };
        }
      }
      if (Object.keys(cleanSets).length) cleanDates[date] = cleanSets;
    }
    if (Object.keys(cleanDates).length) clean[ex] = cleanDates;
  }
  return clean;
}

/** Keeps non-empty text notes (cut to 2,000 characters) on dated keys, for known exercises. */
export function cleanNotesMap(raw: Record<string, unknown>, exercises: ReadonlySet<string>): NotesMap {
  const clean: NotesMap = {};
  for (const [ex, dates] of Object.entries(raw)) {
    if (!exercises.has(ex) || !isObject(dates)) continue;
    const cleanDates: Record<string, string> = {};
    for (const [date, text] of Object.entries(dates)) {
      if (isDateKey(date) && typeof text === 'string' && text) cleanDates[date] = text.slice(0, 2000);
    }
    if (Object.keys(cleanDates).length) clean[ex] = cleanDates;
  }
  return clean;
}

// ---------- importing ----------

export interface BackupContents {
  /** Always replaced on import. */
  doneMap: DoneMap;
  /** null = the file has none, so the current one is kept. */
  logMap: LogMap | null;
  notesMap: NotesMap | null;
  sessionsMap: SessionsMap | null;
  preferences: Partial<BackupPreferences> | null;
}

export type ReadResult = { ok: true; contents: BackupContents; summary: string } | { ok: false; reason: 'too-large' | 'not-a-backup' };

/**
 * Reads a backup file's text. `exercises` is every exercise key in the
 * program; `today` files undated logs and notes. Nothing is changed: apply
 * `contents` once the lifter confirms `summary`.
 */
export function readBackup(text: string, exercises: ReadonlySet<string>, today: string, sizeBytes = text.length): ReadResult {
  if (sizeBytes > MAX_IMPORT_BYTES) return { ok: false, reason: 'too-large' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'not-a-backup' };
  }
  if (hasUnsafeKeys(parsed)) return { ok: false, reason: 'not-a-backup' };
  if (!isObject(parsed)) return { ok: false, reason: 'not-a-backup' };

  const ownBackup = parsed.app === BACKUP_APP;
  const bareDoneMap = !parsed.app && Object.values(parsed).every((v) => typeof v === 'boolean');
  if (!ownBackup && !bareDoneMap) return { ok: false, reason: 'not-a-backup' };

  const done = ownBackup ? parsed.doneMap : parsed;
  if (!isObject(done)) return { ok: false, reason: 'not-a-backup' };

  const section = (k: string) => (ownBackup && isObject(parsed[k]) ? (parsed[k] as Record<string, unknown>) : null);
  const logs = section('logMap');
  const notes = section('notesMap');
  const contents: BackupContents = {
    doneMap: cleanDoneMap(done, exercises),
    logMap: logs && cleanLogMap(datedLogs(logs, today), exercises),
    notesMap: notes && cleanNotesMap(datedNotes(notes, today), exercises),
    sessionsMap: section('sessionsMap') as SessionsMap | null,
    preferences: section('preferences') as Partial<BackupPreferences> | null,
  };
  return { ok: true, contents, summary: importSummary(contents) };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "This backup contains 3 completed sets, 2 logged entries across 1 exercise, … Continue?" */
export function importSummary(c: BackupContents): string {
  const parts = [plural(Object.keys(c.doneMap).length, 'completed set', 'completed sets')];
  const logged = Object.values(c.logMap ?? {}).reduce((n, dates) => n + Object.values(dates).reduce((m, sets) => m + Object.keys(sets).length, 0), 0);
  if (logged) {
    parts.push(`${plural(logged, 'logged entry', 'logged entries')} across ${plural(Object.keys(c.logMap ?? {}).length, 'exercise', 'exercises')}`);
  }
  const notes = Object.values(c.notesMap ?? {}).reduce((n, dates) => n + Object.keys(dates).length, 0);
  if (notes) parts.push(plural(notes, 'note', 'notes'));
  if (c.preferences) parts.push('your saved preferences');
  return `This backup contains ${parts.join(', ')}. Importing will replace your current progress with this data — this can't be undone. Continue?`;
}

/** The state after importing: the doneMap is replaced, the other maps only if the file has them; known preferences are applied. */
export function applyBackup(state: TrainingState, c: BackupContents): TrainingState {
  const p = c.preferences;
  return {
    ...state,
    doneMap: c.doneMap,
    logMap: c.logMap ?? state.logMap,
    notesMap: c.notesMap ?? state.notesMap,
    sessionsMap: c.sessionsMap ?? state.sessionsMap,
    prefs: {
      ...state.prefs,
      ...(typeof p?.autoRestEnabled === 'boolean' && { autoRest: p.autoRestEnabled }),
      ...(typeof p?.audioEnabled === 'boolean' && { audio: p.audioEnabled }),
      ...((p?.weightUnit === 'kg' || p?.weightUnit === 'lb') && { unit: p.weightUnit }),
    },
  };
}
