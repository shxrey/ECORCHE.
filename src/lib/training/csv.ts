/**
 * "Export CSV": one row per logged set, for spreadsheets. Notes are left out
 * on purpose (they belong to a day, not to a set).
 */
import { weightToInput } from './units';
import type { LogMap, WeightUnit } from './types';

/** Quotes a cell only when it holds a comma, quote or line break. */
export function csvCell(value: unknown): string {
  const s = String(value);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/** The CSV text: sorted by exercise, then date, then set; lines end in CRLF; weights in `unit`. */
export function logToCsv(log: LogMap, unit: WeightUnit): string {
  const rows: unknown[][] = [['date', 'exercise', 'set', 'weight_' + unit, 'reps', 'rir']];
  for (const exercise of Object.keys(log).sort()) {
    for (const date of Object.keys(log[exercise]).sort()) {
      const sets = log[exercise][date];
      for (const idx of Object.keys(sets).map(Number).sort((a, b) => a - b)) {
        const s = sets[idx];
        if (!s || (!s.w && !s.r && !s.rir)) continue;
        rows.push([date, exercise, idx, weightToInput(s.w, unit), s.r || '', s.rir || '']);
      }
    }
  }
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
}

export const csvFileName = (today: string) => `ecorche-log-${today}.csv`;
