/**
 * Repeatable random workout histories for e2e/parity.spec.ts: the same seed
 * always gives the same data. The clock is fixed to NOW on both sides.
 */
import { exercises } from '../src/content/program';
import { dateKey } from '../src/lib/training/dates';
import type { LogMap, TrainingState, WeightUnit } from '../src/lib/training/types';
import type { Seed } from './helpers';

/** Wednesday 25 November 2026, 3pm local time. */
export const NOW = new Date(2026, 10, 25, 15, 0, 0);
export const TODAY = dateKey(NOW);

// ---------- repeatable random data ----------

function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function daysFromToday(n: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

export interface Data {
  seed: Seed;
  state: TrainingState;
}

export function randomData(seedNo: number, unit: WeightUnit): Data {
  const rnd = random(seedNo);
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rnd() * xs.length)];
  const weights = ['', '60', '62.5', '100', '102.5', '0.5', 100, 72.25, '225'] as const;
  const reps = ['', '8', '10', '6', 12, '5', '1'] as const;
  const rirs = ['', '0', '1', '2', '3', 1] as const;
  // Today, the last 3 weeks, and (rarely) tomorrow: lookups must only use earlier days.
  const datePool = [0, -1, -2, -3, -5, -7, -8, -9, -12, -14, -15, -19, -21, 1].map(daysFromToday);

  const doneMap: Record<string, boolean> = { 'legs-a8-set1': true, 'push-b6-set5': true }; // old ticks for removed sets
  const logMap: LogMap = {};
  const notesMap: Record<string, Record<string, string>> = {};
  for (const ex of exercises) {
    for (const dot of ex.setDots) if (rnd() < 0.3) doneMap[`${ex.key}-set${dot.idx}`] = true;
    if (rnd() < 0.8) {
      const history: LogMap[string] = {};
      const count = Math.floor(rnd() * 6);
      for (let i = 0; i < count; i++) {
        const date = pick(datePool);
        const sets: LogMap[string][string] = {};
        for (const dot of ex.setDots) {
          if (rnd() < 0.7) sets[dot.idx] = { w: pick(weights), r: pick(reps), rir: pick(rirs), ...(rnd() < 0.2 && { pr: true }) };
        }
        if (Object.keys(sets).length) history[date] = sets;
      }
      if (Object.keys(history).length) logMap[ex.key] = history;
    }
    if (rnd() < 0.4) notesMap[ex.key] = { [pick(datePool)]: pick(['go heavier', 'elbows in, slow down', 'a "quoted", note']) };
  }
  const sessionsMap: Record<string, number> = {};
  for (let i = -20; i <= 0; i++) if (rnd() < 0.6) sessionsMap[daysFromToday(i)] = 1 + Math.floor(rnd() * 30);
  const week = 1 + Math.floor(rnd() * 6);

  return {
    seed: {
      doneMap, logMap: logMap as Seed['logMap'], notesMap, sessionsMap,
      extra: { hb_weightUnit_v1: unit, hb_mesocycleWeek_v1: String(week), hb_autoRest_v1: 'false' },
    },
    state: {
      doneMap, logMap, notesMap, sessionsMap, timers: {},
      prefs: { autoRest: false, audio: true, highContrast: false, mesocycleWeek: week, unit },
    },
  };
}
