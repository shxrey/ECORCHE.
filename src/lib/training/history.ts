/**
 * Looking back: "last time this set", the last earlier note, the "Last:" and
 * "Last session:" lines, and the numbers suggested in today's empty boxes.
 * "Earlier" always means a date strictly before the one given (usually today).
 */
import { weightToInput } from './units';
import type { DayLog, ExerciseLog, LogEntry, WeightUnit } from './types';

const datesBefore = (history: Record<string, unknown>, before: string) =>
  Object.keys(history).filter((d) => d < before).sort();

/** The most recent entry for set `setIdx` on a date before `before`. */
export function lastTimeThisSet(history: ExerciseLog | undefined, setIdx: string | number, before: string): LogEntry | null {
  if (!history) return null;
  const dates = datesBefore(history, before);
  for (let i = dates.length - 1; i >= 0; i--) {
    const entry = history[dates[i]]?.[setIdx];
    if (entry) return entry;
  }
  return null;
}

/** The most recent note on a date before `before`. */
export function lastEarlierNote(notes: Record<string, string> | undefined, before: string): { date: string; text: string } | null {
  if (!notes) return null;
  const date = datesBefore(notes, before).pop();
  return date ? { date, text: notes[date] } : null;
}

/** One logged set as text: "102.5kg × 6 @ 1 RIR" (parts left out when blank). */
export function formatLogEntry(entry: LogEntry, unit: WeightUnit): string {
  const parts: string[] = [];
  if (entry.w) parts.push(weightToInput(entry.w, unit) + unit);
  if (entry.r) parts.push('× ' + entry.r);
  if (entry.rir !== '' && entry.rir != null) parts.push('@ ' + entry.rir + ' RIR');
  return parts.join(' ');
}

/** The highest-numbered set logged that day, as text ('' if none). */
function lastSetText(day: DayLog | undefined, unit: WeightUnit): string {
  const idxs = Object.keys(day ?? {}).map(Number).sort((a, b) => a - b);
  return day && idxs.length ? formatLogEntry(day[idxs[idxs.length - 1]], unit) : '';
}

/** The "Last:" line under an exercise name: today's highest-numbered logged set. */
export function lastLoggedText(history: ExerciseLog | undefined, today: string, unit: WeightUnit): string {
  const text = lastSetText(history?.[today], unit);
  return text ? 'Last: ' + text : '';
}

/** "Last session: …": the highest-numbered set from the most recent earlier day. */
export function lastSessionText(history: ExerciseLog | undefined, today: string, unit: WeightUnit): string {
  const date = history ? datesBefore(history, today).pop() : undefined;
  const text = date ? lastSetText(history![date], unit) : '';
  return 'Last session: ' + (text || '—');
}

export interface SetBoxes {
  /** Weight-box text, in `unit`. */
  weight: string;
  /** The kg value behind `weight` (see units.weightBoxToKg); '' if none. */
  weightKg: string;
  reps: string;
  rir: string;
  /** Which boxes hold last time's numbers rather than today's (shown dashed). */
  suggested: { weight: boolean; reps: boolean };
  /** Today's saved entry was a personal record. */
  pr: boolean;
}

/**
 * What a set's boxes show: today's saved entry, or else last time's weight and
 * reps as a suggestion to beat. RIR is never suggested: that's today's call.
 */
export function setBoxes(history: ExerciseLog | undefined, setIdx: string | number, today: string, unit: WeightUnit): SetBoxes {
  const saved = history?.[today]?.[setIdx];
  if (saved) {
    return {
      weight: weightToInput(saved.w, unit),
      weightKg: saved.w ? String(saved.w) : '',
      reps: saved.r ? String(saved.r) : '',
      rir: saved.rir ? String(saved.rir) : '',
      suggested: { weight: false, reps: false },
      pr: !!saved.pr,
    };
  }
  const last = lastTimeThisSet(history, setIdx, today);
  return {
    weight: last?.w ? weightToInput(last.w, unit) : '',
    weightKg: last?.w ? String(last.w) : '',
    reps: last?.r ? String(last.r) : '',
    rir: '',
    suggested: { weight: !!last?.w, reps: !!last?.r },
    pr: false,
  };
}
