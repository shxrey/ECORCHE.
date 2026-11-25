import type { Exercise } from './types';

/** An exercise's name as its card heading shows it, suffix included ("Barbell Back Squats Peak Intensity"). */
export function displayName(ex: Exercise): string {
  return ex.nameSuffix ? `${ex.name} ${ex.nameSuffix.text}` : ex.name;
}
