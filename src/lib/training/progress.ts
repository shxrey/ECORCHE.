/**
 * Progress through the week: ticked sets per day and overall, the training
 * week (1–6, week 6 is the deload), and the daily set counts behind View History.
 */
import { days, exerciseByKey } from '@/content/program';
import { dateKey, fromDateKey } from './dates';
import type { DoneMap, SessionsMap } from './types';

/** The six training days, in tracker order. */
export const DAY_IDS = ['pushA', 'pushB', 'pullA', 'pullB', 'legsA', 'legsB'] as const;
export type TrainingDayId = (typeof DAY_IDS)[number];

/** The doneMap key for one set dot, e.g. "legs-a1-set2". */
export function setKey(exercise: string, setIdx: string | number): string {
  return `${exercise}-set${setIdx}`;
}

/** Every set dot on a day, as doneMap keys. */
export function daySetKeys(dayId: string): string[] {
  const day = days.find((d) => d.id === dayId);
  return (day?.exerciseKeys ?? []).flatMap((ex) => (exerciseByKey[ex]?.setDots ?? []).map((dot) => setKey(ex, dot.idx)));
}

export interface DayProgress {
  done: number;
  total: number;
  complete: boolean;
}

/**
 * Ticked sets on a day. Only today's set dots count: old saves can hold ticks
 * for sets or exercises that were since removed from the program.
 */
export function dayProgress(done: DoneMap, dayId: string): DayProgress {
  const keys = daySetKeys(dayId);
  const count = keys.filter((k) => done[k]).length;
  const total = days.find((d) => d.id === dayId)?.totalSets ?? 0;
  return { done: count, total, complete: total > 0 && count >= total };
}

export interface WeekProgress {
  days: Record<TrainingDayId, DayProgress>;
  done: number;
  total: number;
  /** 0–1. */
  fraction: number;
}

export function weekProgress(done: DoneMap): WeekProgress {
  const perDay = Object.fromEntries(DAY_IDS.map((id) => [id, dayProgress(done, id)])) as Record<TrainingDayId, DayProgress>;
  const count = DAY_IDS.reduce((n, id) => n + perDay[id].done, 0);
  const total = DAY_IDS.reduce((n, id) => n + perDay[id].total, 0);
  return { days: perDay, done: count, total, fraction: total ? count / total : 0 };
}

// ---------- training week ----------

/** Week 6 is the deload; "Reset Entire Week" moves 1 → 2 → … → 6 → 1. */
export function nextTrainingWeek(week: number): number {
  return week >= 6 ? 1 : week + 1;
}

export function trainingWeekBanner(week: number): { text: string; deload: boolean } {
  return week === 6
    ? { text: 'Week 6 of 6 — Deload: drop sets, skip failure work', deload: true }
    : { text: `Week ${week} of 6`, deload: false };
}

// ---------- daily set counts (View History) ----------

/** Adds `delta` ticked sets to `date`'s count; a count that drops to 0 or below is removed. */
export function addSetsOn(sessions: SessionsMap, date: string, delta: number): SessionsMap {
  if (!delta) return sessions;
  const next = { ...sessions, [date]: (sessions[date] || 0) + delta };
  if (next[date] <= 0) delete next[date];
  return next;
}

/** The last 14 days, oldest first, with each day's set count. */
export function recentDays(sessions: SessionsMap, now: Date, count = 14): { date: string; sets: number }[] {
  const out: { date: string; sets: number }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    out.push({ date: key, sets: sessions[key] || 0 });
  }
  return out;
}

/**
 * Sets ticked this week and last week. Weeks run Monday to Sunday.
 *
 * (The old app meant to start weeks on Sunday but kept the current time of
 * day, so Sunday's sets landed in the previous week: Monday–Sunday every day
 * except Sunday itself, when "this week" read 0. Monday–Sunday is what
 * lifters saw on the other six days, so that's the rule now.)
 */
export function weeklySetCounts(sessions: SessionsMap, now: Date): { thisWeek: number; lastWeek: number } {
  const thisWeekStart = startOfWeek(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);
  let thisWeek = 0;
  let lastWeek = 0;
  for (const [key, sets] of Object.entries(sessions)) {
    const d = fromDateKey(key);
    if (d >= thisWeekStart) thisWeek += sets;
    else if (d >= lastWeekStart) lastWeek += sets;
  }
  return { thisWeek, lastWeek };
}

/** Local midnight on the Monday of `now`'s week. */
export function startOfWeek(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
}
