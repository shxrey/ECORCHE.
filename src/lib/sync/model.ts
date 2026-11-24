/**
 * Pure data mapping between the legacy app's in-memory state and the cloud.
 *
 * The legacy runtime keeps four nested maps plus a few preferences. To sync
 * them, everything is flattened into one map of small "records", each with a
 * stable key, so two states can be diffed record by record and each record
 * can win or lose a conflict on its own (last-write-wins per record).
 *
 *   c|<exercise>|<set>         ticked set dot          → set_checks
 *   l|<exercise>|<date>|<set>  weight / reps / RIR     → set_logs
 *   n|<exercise>|<date>        note                    → exercise_notes
 *   d|<date>                   sets done that day      → daily_set_counts
 *   s                          preferences             → user_settings
 *
 * A key missing from a RecordMap means "no value" (unticked, cleared, …).
 * Records the database can't hold (an unknown exercise, reps of 8.5) are
 * left out of the map: they stay on the device exactly as before, they just
 * don't sync.
 */

export interface LegacyLogEntry {
  w?: string | number | null;
  r?: string | number | null;
  rir?: string | number | null;
  pr?: boolean;
}

/** How weights are shown and typed. Saved weights are always kilograms. */
export type WeightUnit = 'kg' | 'lb';

export interface LegacyPrefs {
  autoRest: boolean;
  audio: boolean;
  highContrast: boolean;
  mesocycleWeek: number;
  unit: WeightUnit;
}

export interface LegacyState {
  doneMap: Record<string, boolean>;
  logMap: Record<string, Record<string, Record<string, LegacyLogEntry>>>;
  notesMap: Record<string, Record<string, string>>;
  sessionsMap: Record<string, number>;
  prefs: LegacyPrefs;
}

export interface LogValue {
  w: number | null;
  r: number | null;
  rir: number | null;
  pr: boolean;
}

export type RecordValue = true | LogValue | string | number | LegacyPrefs;
export type RecordMap = Record<string, RecordValue>;

/** One record that changed. `value: null` means it was removed. */
export interface Change {
  key: string;
  value: RecordValue | null;
  /** When the lifter made the change (ms since epoch). */
  ts: number;
}

// ---------- validation (mirrors supabase/migrations) ----------

const EXERCISE_KEY = /^(push|pull|legs)-[ab][1-9][0-9]?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SET_KEY = /^(.*)-set(\d+)$/;

const isExercise = (k: string) => EXERCISE_KEY.test(k);
const isDate = (d: string) => DATE.test(d) && !Number.isNaN(Date.parse(d));
const isSetIdx = (s: string) => /^\d+$/.test(s) && Number(s) >= 1 && Number(s) <= 12;

/** Parses one logged field; undefined = invalid (don't sync this record). */
function field(v: unknown, max: number, integer: boolean): number | null | undefined {
  if (v === '' || v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.trim()) : NaN;
  if (!Number.isFinite(n) || n < 0 || n > max) return undefined;
  if (integer) return Number.isInteger(n) ? n : undefined;
  return Math.round(n * 100) / 100;
}

export function normalizeLog(e: LegacyLogEntry | null | undefined): LogValue | null | undefined {
  if (!e || typeof e !== 'object') return undefined;
  const w = field(e.w, 2000, false);
  const r = field(e.r, 200, true);
  const rir = field(e.rir, 20, true);
  if (w === undefined || r === undefined || rir === undefined) return undefined;
  if (w === null && r === null && rir === null) return null; // an empty row is "no log"
  return { w, r, rir, pr: e.pr === true };
}

/** Fills in defaults, including for preferences added after a snapshot was saved. */
export function normalizePrefs(p: Partial<LegacyPrefs> | null | undefined): LegacyPrefs {
  const week = Number(p?.mesocycleWeek);
  return {
    autoRest: p?.autoRest !== false,
    audio: p?.audio !== false,
    highContrast: p?.highContrast === true,
    mesocycleWeek: Number.isInteger(week) && week >= 1 && week <= 6 ? week : 1,
    unit: p?.unit === 'lb' ? 'lb' : 'kg',
  };
}

// ---------- state → records ----------

export function flatten(state: LegacyState): RecordMap {
  const out: RecordMap = {};

  for (const [key, done] of Object.entries(state.doneMap ?? {})) {
    const m = SET_KEY.exec(key);
    if (done === true && m && isExercise(m[1]) && isSetIdx(m[2])) out[`c|${m[1]}|${Number(m[2])}`] = true;
  }

  for (const [ex, dates] of Object.entries(state.logMap ?? {})) {
    if (!isExercise(ex) || !dates || typeof dates !== 'object') continue;
    for (const [date, sets] of Object.entries(dates)) {
      if (!isDate(date) || !sets || typeof sets !== 'object') continue;
      for (const [idx, entry] of Object.entries(sets)) {
        if (!isSetIdx(idx)) continue;
        const v = normalizeLog(entry);
        if (v) out[`l|${ex}|${date}|${Number(idx)}`] = v;
      }
    }
  }

  for (const [ex, dates] of Object.entries(state.notesMap ?? {})) {
    if (!isExercise(ex) || !dates || typeof dates !== 'object') continue;
    for (const [date, body] of Object.entries(dates)) {
      if (isDate(date) && typeof body === 'string' && body && body.length <= 2000) out[`n|${ex}|${date}`] = body;
    }
  }

  for (const [date, count] of Object.entries(state.sessionsMap ?? {})) {
    if (isDate(date) && Number.isInteger(count) && count > 0 && count <= 2000) out[`d|${date}`] = count;
  }

  out.s = normalizePrefs(state.prefs);
  return out;
}

// ---------- comparing ----------

export function sameValue(a: RecordValue | null | undefined, b: RecordValue | null | undefined): boolean {
  if (a === b) return true;
  if (a == null || b == null || typeof a !== 'object' || typeof b !== 'object') return false;
  return JSON.stringify(a, Object.keys(a).sort()) === JSON.stringify(b, Object.keys(b).sort());
}

/** Every record that differs between two snapshots, stamped with `ts`. */
export function diff(prev: RecordMap, next: RecordMap, ts: number): Change[] {
  const changes: Change[] = [];
  for (const key of new Set([...Object.keys(prev), ...Object.keys(next)])) {
    if (!sameValue(prev[key], next[key])) changes.push({ key, value: next[key] ?? null, ts });
  }
  return changes;
}

// ---------- records → state ----------

const str = (n: number | null) => (n === null ? '' : String(n));

/** Returns a copy of `state` with the given records written into it. */
export function applyChanges(state: LegacyState, changes: Pick<Change, 'key' | 'value'>[]): LegacyState {
  const s: LegacyState = JSON.parse(JSON.stringify(state));
  s.doneMap ??= {};
  s.logMap ??= {};
  s.notesMap ??= {};
  s.sessionsMap ??= {};

  for (const { key, value } of changes) {
    const [kind, a, b, c] = key.split('|');
    if (kind === 'c') {
      if (value === true) s.doneMap[`${a}-set${b}`] = true;
      else delete s.doneMap[`${a}-set${b}`];
    } else if (kind === 'l') {
      if (value && typeof value === 'object' && 'w' in value) {
        ((s.logMap[a] ??= {})[b] ??= {})[c] = { w: str(value.w), r: str(value.r), rir: str(value.rir), pr: value.pr };
      } else if (s.logMap[a]?.[b]) {
        delete s.logMap[a][b][c];
        if (!Object.keys(s.logMap[a][b]).length) delete s.logMap[a][b];
        if (!Object.keys(s.logMap[a]).length) delete s.logMap[a];
      }
    } else if (kind === 'n') {
      if (typeof value === 'string' && value) (s.notesMap[a] ??= {})[b] = value;
      else if (s.notesMap[a]) {
        delete s.notesMap[a][b];
        if (!Object.keys(s.notesMap[a]).length) delete s.notesMap[a];
      }
    } else if (kind === 'd') {
      if (typeof value === 'number' && value > 0) s.sessionsMap[a] = value;
      else delete s.sessionsMap[a];
    } else if (kind === 's') {
      if (value && typeof value === 'object' && 'mesocycleWeek' in value) s.prefs = normalizePrefs(value);
    }
  }
  return s;
}

export function emptyState(prefs?: Partial<LegacyPrefs>): LegacyState {
  return { doneMap: {}, logMap: {}, notesMap: {}, sessionsMap: {}, prefs: normalizePrefs(prefs) };
}

// ---------- records ↔ database rows ----------

export interface PushPayload {
  checks: { exercise_key: string; set_idx: number; checked: boolean; ts: string }[];
  logs: {
    exercise_key: string; log_date: string; set_idx: number;
    weight: number | null; reps: number | null; rir: number | null; is_pr: boolean; ts: string;
  }[];
  notes: { exercise_key: string; note_date: string; body: string; ts: string }[];
  days: { day: string; sets: number; ts: string }[];
  settings?: {
    auto_rest: boolean; voice_announcements: boolean; high_contrast: boolean; mesocycle_week: number;
    weight_unit: WeightUnit; ts: string;
  };
}

export interface PullResult {
  server_time: string;
  checks: PushPayload['checks'];
  logs: PushPayload['logs'];
  notes: PushPayload['notes'];
  days: PushPayload['days'];
  settings: PushPayload['settings'] | null;
}

const iso = (ms: number) => new Date(ms).toISOString();

export function toPushPayload(changes: Change[]): PushPayload {
  const p: PushPayload = { checks: [], logs: [], notes: [], days: [] };
  for (const { key, value, ts } of changes) {
    const [kind, a, b, c] = key.split('|');
    if (kind === 'c') {
      p.checks.push({ exercise_key: a, set_idx: Number(b), checked: value === true, ts: iso(ts) });
    } else if (kind === 'l') {
      const v = value && typeof value === 'object' && 'w' in value ? value : null;
      p.logs.push({
        exercise_key: a, log_date: b, set_idx: Number(c),
        weight: v?.w ?? null, reps: v?.r ?? null, rir: v?.rir ?? null, is_pr: v?.pr ?? false, ts: iso(ts),
      });
    } else if (kind === 'n') {
      p.notes.push({ exercise_key: a, note_date: b, body: typeof value === 'string' ? value : '', ts: iso(ts) });
    } else if (kind === 'd') {
      p.days.push({ day: a, sets: typeof value === 'number' ? value : 0, ts: iso(ts) });
    } else if (kind === 's' && value && typeof value === 'object' && 'mesocycleWeek' in value) {
      p.settings = {
        auto_rest: value.autoRest, voice_announcements: value.audio,
        high_contrast: value.highContrast, mesocycle_week: value.mesocycleWeek, weight_unit: value.unit, ts: iso(ts),
      };
    }
  }
  return p;
}

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

/** Converts a sync_pull result back into records ("tombstone" rows become value: null). */
export function fromPullResult(r: PullResult): Change[] {
  const out: Change[] = [];
  const ms = (t: string) => Date.parse(t) || 0;
  for (const x of r.checks ?? []) {
    out.push({ key: `c|${x.exercise_key}|${x.set_idx}`, value: x.checked ? true : null, ts: ms(x.ts) });
  }
  for (const x of r.logs ?? []) {
    const v = normalizeLog({ w: num(x.weight), r: num(x.reps), rir: num(x.rir), pr: x.is_pr });
    out.push({ key: `l|${x.exercise_key}|${x.log_date}|${x.set_idx}`, value: v ?? null, ts: ms(x.ts) });
  }
  for (const x of r.notes ?? []) {
    out.push({ key: `n|${x.exercise_key}|${x.note_date}`, value: x.body ? x.body : null, ts: ms(x.ts) });
  }
  for (const x of r.days ?? []) {
    out.push({ key: `d|${x.day}`, value: x.sets > 0 ? x.sets : null, ts: ms(x.ts) });
  }
  if (r.settings) {
    out.push({
      key: 's',
      value: normalizePrefs({
        autoRest: r.settings.auto_rest, audio: r.settings.voice_announcements,
        highContrast: r.settings.high_contrast, mesocycleWeek: r.settings.mesocycle_week,
        unit: r.settings.weight_unit,
      }),
      ts: ms(r.settings.ts),
    });
  }
  return out;
}
