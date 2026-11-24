/**
 * Kilograms and pounds. Saved weights are always kilograms; the kg/lb setting
 * only changes what is shown and typed.
 *
 * - In kg, a weight is shown and saved exactly as typed ("102.5" stays "102.5").
 * - In lb, saved kg are shown rounded to the nearest 0.05 lb, and typed lb are
 *   saved as kg to 2 decimals.
 * - A box still showing, unchanged, the weight it was filled with keeps that
 *   exact kg value, so 100 kg shown as 220.45 lb isn't re-saved as 99.99 kg.
 * - Comparisons (▲/▼, PRs) use the shown values, so a weight that round-trips
 *   through lb never reads as a tiny PR or drop.
 */
import type { WeightUnit, WeightValue } from './types';

/** Exact, by definition. */
export const KG_PER_LB = 0.45359237;

/** A saved (kg) weight as a number in `unit`; NaN when blank or not a number. */
export function toUnit(kg: WeightValue, unit: WeightUnit): number {
  const n = parseFloat(String(kg));
  if (Number.isNaN(n)) return NaN;
  return unit === 'lb' ? Math.round((n / KG_PER_LB) * 20) / 20 : n;
}

/** A saved (kg) weight as weight-box text. */
export function weightToInput(kg: WeightValue, unit: WeightUnit): string {
  if (kg === '' || kg == null) return '';
  if (unit === 'kg') return String(kg);
  const n = toUnit(kg, unit);
  return Number.isNaN(n) ? '' : String(Math.round(n * 100) / 100);
}

/** Weight-box text → the value to save (kg). Blank and unreadable text pass through. */
export function inputToKg(text: string, unit: WeightUnit): string {
  if (unit === 'kg' || text === '') return text;
  const n = parseFloat(text);
  return Number.isNaN(n) ? text : String(Math.round(n * KG_PER_LB * 100) / 100);
}

/**
 * What to save for a weight box. `filledKg` is the saved or suggested kg value
 * the box was filled with ('' or null if none); if the box still shows exactly
 * that, the original kg value is kept.
 */
export function weightBoxToKg(text: string, filledKg: string | null, unit: WeightUnit): string {
  if (unit === 'lb' && filledKg !== null && weightToInput(filledKg, unit) === text) return filledKg;
  return inputToKg(text, unit);
}

/** An estimated 1RM (kg, unrounded) as text: "126.7kg", "279.3lb". */
export function formatEstimate(kg: number, unit: WeightUnit): string {
  const n = unit === 'lb' ? kg / KG_PER_LB : kg;
  return Math.round(n * 10) / 10 + unit;
}

/** The smallest plate jump in `unit`, used to round warm-up weights. */
export function plateStep(unit: WeightUnit): number {
  return unit === 'lb' ? 5 : 2.5;
}

/** The notes box's hint, with a drop that makes sense in `unit`. */
export function notesPlaceholder(unit: WeightUnit): string {
  return `Notes — e.g. elbows flared on set 2, drop ${unit === 'lb' ? '5lb' : '2.5kg'} next time`;
}
