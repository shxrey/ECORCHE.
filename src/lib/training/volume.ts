/**
 * The Volume section's "N logged so far · last trained …" line per muscle.
 * Muscles map to the exercises' muscle tags (the same tags shown on each
 * card), so the two can't drift apart.
 */
import { exercises } from '@/content/program';
import { formatRecency } from './dates';
import { setKey } from './progress';
import type { DoneMap, LogMap } from './types';
import type { Exercise } from '@/content/types';

interface MuscleRule {
  /** Tag tones (the .tag-<tone> class) that count. */
  tones: string[];
  /** Front and side delts share one tone; the tag text tells them apart. */
  textIncludes?: string;
}

/** Keyed by the Volume card's muscle name, lower-cased. */
export const MUSCLE_RULES: Record<string, MuscleRule> = {
  chest: { tones: ['chest'] },
  'front delts': { tones: ['delt'], textIncludes: 'front' },
  'lateral delts': { tones: ['delt'], textIncludes: 'side' },
  'rear delts': { tones: ['reardelt'] },
  back: { tones: ['lat', 'midback'] },
  biceps: { tones: ['bicep'] },
  triceps: { tones: ['tri'] },
  'upper traps': { tones: ['trap'] },
  forearms: { tones: ['forearm'] },
  quads: { tones: ['quad'] },
  hamstrings: { tones: ['ham'] },
  glutes: { tones: ['glute'] },
  calves: { tones: ['calf'] },
  'abs / core': { tones: ['core'] },
};

function trains(ex: Exercise, rule: MuscleRule): boolean {
  return ex.tags.some(
    (tag) => rule.tones.includes(tag.tone) && (!rule.textIncludes || tag.label.toLowerCase().includes(rule.textIncludes)),
  );
}

/** The exercises (all six days) that count toward `muscle`; null for a muscle with no rule. */
export function exercisesFor(muscle: string): Exercise[] | null {
  const rule = MUSCLE_RULES[muscle.toLowerCase()];
  return rule ? exercises.filter((ex) => trains(ex, rule)) : null;
}

/** Ticked sets this training week across every exercise that trains `muscle`. */
export function completedSetsFor(muscle: string, done: DoneMap): number | null {
  const list = exercisesFor(muscle);
  if (!list) return null;
  return list.reduce((n, ex) => n + ex.setDots.filter((dot) => done[setKey(ex.key, dot.idx)]).length, 0);
}

/** The latest date anything training `muscle` was logged (logs are the only dated record). */
export function lastTrainedDate(muscle: string, log: LogMap): string | null {
  let latest: string | null = null;
  for (const ex of exercisesFor(muscle) ?? []) {
    for (const date of Object.keys(log[ex.key] ?? {})) if (!latest || date > latest) latest = date;
  }
  return latest;
}

/** "12 logged so far · last trained yesterday". null for a muscle with no rule. */
export function volumeLine(muscle: string, done: DoneMap, log: LogMap, today: string): string | null {
  const count = completedSetsFor(muscle, done);
  if (count === null) return null;
  const last = lastTrainedDate(muscle, log);
  return `${count} logged so far` + (last ? ` · last trained ${formatRecency(last, today)}` : '');
}
