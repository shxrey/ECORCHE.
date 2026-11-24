/**
 * Strength numbers: estimated 1-rep max, the load trend, the ▲/▼ badge and
 * personal records. Comparisons use weights as shown in the lifter's unit
 * (see units.ts).
 */
import { toUnit } from './units';
import type { DayLog, ExerciseLog, LogEntry, WeightUnit, WeightValue } from './types';

/**
 * Estimated 1-rep max (kg), Epley formula: weight × (1 + reps / 30).
 * Chosen over Brzycki, which breaks down above ~10–12 reps, and this
 * program's failure sets regularly go past that. null without a weight and reps.
 */
export function estimate1RM(w: WeightValue, r: WeightValue): number | null {
  const weight = parseFloat(String(w));
  const reps = parseFloat(String(r));
  if (!weight || !reps || reps <= 0) return null;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/** The best estimated 1RM among one day's sets, or null. */
export function bestEstimate(sets: DayLog | undefined): number | null {
  let best: number | null = null;
  for (const s of Object.values(sets ?? {})) {
    const est = estimate1RM(s?.w, s?.r);
    if (est && (!best || est > best)) best = est;
  }
  return best;
}

/** The "Est. 1RM" figure (kg): from today's sets once there are any, otherwise the last earlier session's. */
export function currentEstimate(history: ExerciseLog | undefined, today: string): number | null {
  if (!history) return null;
  const date = history[today] ? today : Object.keys(history).sort().filter((d) => d < today).pop();
  return date ? bestEstimate(history[date]) : null;
}

export interface TrendPoint {
  date: string;
  /** Best estimated 1RM that day (kg), or null if no weight × reps was logged. */
  est: number | null;
  /** Bar height in px, 2–22, relative to the best day shown. */
  height: number;
}

/** The load trend: best e1RM for each of the last 8 logged days. Empty below 2 days, when a trend means nothing. */
export function loadTrend(history: ExerciseLog | undefined): TrendPoint[] {
  const dates = Object.keys(history ?? {}).sort().slice(-8);
  if (!history || dates.length < 2) return [];
  const points = dates.map((date) => ({ date, est: bestEstimate(history[date]) }));
  const max = Math.max(1, ...points.map((p) => p.est || 0));
  return points.map((p) => ({ ...p, height: p.est ? Math.max(2, (p.est / max) * 22) : 2 }));
}

// ---------- ▲ / ▼ against last time ----------

export interface Delta {
  kind: 'up' | 'flat' | 'down';
  /** CSS class on the badge. */
  className: 'delta-up' | 'delta-flat' | 'delta-down';
  text: string;
}

/**
 * The badge beside a set: what today's numbers do against the same set last
 * session. Up = heavier, or the same weight for more reps. null (no badge)
 * unless both sides have a weight and reps.
 */
export function compareToLastTime(
  weightKg: WeightValue,
  reps: WeightValue,
  last: LogEntry | null | undefined,
  unit: WeightUnit,
): Delta | null {
  const w = toUnit(weightKg, unit);
  const r = parseFloat(String(reps));
  const lastW = last ? toUnit(last.w, unit) : NaN;
  const lastR = last ? parseFloat(String(last.r)) : NaN;
  if ([w, r, lastW, lastR].some(Number.isNaN)) return null;
  if (w > lastW) {
    return { kind: 'up', className: 'delta-up', text: `▲ +${Math.round((w - lastW) * 100) / 100}${unit} ready` };
  }
  if (w === lastW && r > lastR) {
    const more = r - lastR;
    return { kind: 'up', className: 'delta-up', text: `▲ +${more} rep${more > 1 ? 's' : ''}` };
  }
  if (w === lastW && r === lastR) return { kind: 'flat', className: 'delta-flat', text: '— hold, rebuild reps' };
  return { kind: 'down', className: 'delta-down', text: '▼ below last time' };
}

// ---------- personal records ----------

export interface ShownSet {
  w: number;
  r: number;
}

/** Every set in `history` with a weight and reps, as shown in `unit`. */
export function shownSets(history: ExerciseLog | undefined, unit: WeightUnit): ShownSet[] {
  const sets: ShownSet[] = [];
  for (const day of Object.values(history ?? {})) {
    for (const entry of Object.values(day ?? {})) {
      const w = toUnit(entry?.w, unit);
      const r = parseFloat(String(entry?.r));
      if (!Number.isNaN(w) && !Number.isNaN(r)) sets.push({ w, r });
    }
  }
  return sets;
}

/** Better = heavier, or the same weight for more reps. */
export function isStrictlyGreater(a: ShownSet, b: ShownSet): boolean {
  return a.w > b.w || (a.w === b.w && a.r > b.r);
}

/**
 * Whether `entry` beats every set in `earlier`. null when there's nothing to
 * judge: no weight × reps on the entry, or no earlier sets at all (a first
 * session sets no records).
 */
export function isPersonalRecord(entry: LogEntry | null | undefined, earlier: ShownSet[], unit: WeightUnit): boolean | null {
  const w = toUnit(entry?.w, unit);
  const r = parseFloat(String(entry?.r));
  if (Number.isNaN(w) || Number.isNaN(r) || !earlier.length) return null;
  return earlier.every((old) => isStrictlyGreater({ w, r }, old));
}
