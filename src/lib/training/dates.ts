/**
 * Date keys. Every dated record (logs, notes, daily set counts) is keyed by
 * the lifter's local calendar date as "YYYY-MM-DD", never a UTC date: a set
 * logged at 11pm belongs to that evening's session, wherever the lifter is.
 * ISO keys sort correctly as plain strings, so no date parsing is needed to
 * order them.
 */

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** The local-date key for `date` (default: now), e.g. "2026-11-24". */
export function dateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** True for anything shaped like a date key. (The old app checks shape only.) */
export function isDateKey(key: string): boolean {
  return DATE_KEY.test(key);
}

/** A date key as a local-midnight Date (never `new Date(key)`, which is UTC). */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole days from `earlier` to `later`, both date keys. DST can't skew it. */
export function daysBetween(earlier: string, later: string): number {
  return Math.round((Date.parse(later + 'T00:00:00Z') - Date.parse(earlier + 'T00:00:00Z')) / 86_400_000);
}

/** "today", "yesterday", "3 days ago"; "recently" for a date after `today`. */
export function formatRecency(date: string, today: string): string {
  if (date === today) return 'today';
  const days = daysBetween(date, today);
  if (days === 1) return 'yesterday';
  if (days > 1) return `${days} days ago`;
  return 'recently';
}
