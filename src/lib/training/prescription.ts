/**
 * Rules read from an exercise's prescription (its Sets / Reps / RIR pills):
 * rest length, the RIR target, and warm-up steps.
 */
import { plateStep } from './units';
import type { WeightUnit } from './types';

/**
 * Rest after a set, from the low end of the rep range: heavy work (≤ 6 reps,
 * or no number such as "To Fail") gets 3 minutes, 7–8 reps 2 minutes, lighter 75 s.
 */
export function restSeconds(reps: string): number {
  const low = parseInt(reps.match(/\d+/)?.[0] ?? '', 10);
  if (!low || low <= 6) return 180;
  if (low <= 8) return 120;
  return 75;
}

/**
 * The loosest RIR still within the prescription ("0-1" → 1, "1-2→0" → 2,
 * "FAILURE" → 0). null if the pill has no number.
 */
export function targetRirMax(rir: string): number | null {
  if (/FAILURE/i.test(rir)) return 0;
  const nums = rir.match(/\d+(\.\d+)?/g);
  return nums ? Math.max(...nums.map(Number)) : null;
}

/** A logged RIR above the target: the set was easier than prescribed (flagged on the row). */
export function isEasierThanPrescribed(rirText: string, targetMax: number | null): boolean {
  if (targetMax === null) return false;
  const rir = parseFloat(rirText);
  return !Number.isNaN(rir) && rir > targetMax;
}

export interface WarmupStep {
  pct: 50 | 75 | 90;
  /** In the lifter's unit, rounded to the nearest plate jump (2.5 kg / 5 lb). */
  weight: number;
}

/** Warm-up jumps toward set 1's weight (box text, in `unit`). null until there's a weight. */
export function warmupSteps(setOneWeight: string, unit: WeightUnit): WarmupStep[] | null {
  const top = parseFloat(setOneWeight);
  if (!top || top <= 0) return null;
  const step = plateStep(unit);
  // Multiplying by 0.75 (not × 75 / 100) keeps the rounding identical to the old app's.
  const steps = [[50, 0.5], [75, 0.75], [90, 0.9]] as const;
  return steps.map(([pct, f]) => ({ pct, weight: Math.round((top * f) / step) * step }));
}
