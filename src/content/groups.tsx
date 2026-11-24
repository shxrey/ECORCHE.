/**
 * The hero's words and numbers for each training group (Push / Pull / Legs).
 * The numbers are per training day (a group's A and B days match).
 */
import type { ReactNode } from 'react';
import type { Group } from './types';

export interface GroupIntro {
  /** The tab label. */
  label: string;
  /** The big heading, above "PROTOCOL". */
  title: string;
  /** The paragraph under the heading. */
  summary: ReactNode;
  exercises: number;
  sets: number;
  muscles: number;
  /** Session length, as shown (e.g. "~60"). */
  minutes: string;
}

/** The tabs' order in the hero. */
export const HERO_GROUPS: Group[] = ['legs', 'push', 'pull'];

/** Shown before the page comes alive (and to search engines): the whole program, not one group. */
export const PROGRAM_SUMMARY = (
  <>
    An evidence-based 6-day Push / Pull / Legs A-B split. Built on the EMG and hypertrophy literature of Schoenfeld, Helms, Grgic, Maeo &amp; Nippard — one complete, science-backed program.
  </>
);

export const groupIntros: Record<Group, GroupIntro> = {
  push: {
    label: 'Push',
    title: 'PUSH DAY',
    summary: (
      <>
        An evidence-based A/B split for chest, shoulders &amp; triceps — now with the triceps split into two standalone lifts and core anchored here permanently. Built on the EMG and hypertrophy research of <strong>Schoenfeld, Helms, Trebs &amp; Maeo</strong> — the same literature Jeff Nippard draws on for his own programming.
      </>
    ),
    exercises: 8,
    sets: 21,
    muscles: 4,
    minutes: '~60',
  },
  pull: {
    label: 'Pull',
    title: 'PULL DAY',
    summary: (
      <>
        An evidence-based A/B split for lats, mid-back, rear delts, traps &amp; biceps — now with shrugs and a heavy unilateral row added. Built on the EMG and hypertrophy research of <strong>Andersen, Oliveira, Signorile &amp; Schoenfeld</strong> — the same literature Jeff Nippard and Dr. Mike Israetel draw on for their own back &amp; arm programming.
      </>
    ),
    exercises: 8,
    sets: 24,
    muscles: 5,
    minutes: '~68',
  },
  legs: {
    label: 'Legs',
    title: 'LEG DAY',
    summary: (
      <>
        An evidence-based A/B split for quads, hamstrings, glutes, calves, shoulders &amp; forearms — now built around the Back Squat with leg curls dropped in favor of a 4th RDL set. Built on the muscle-length and EMG research of <strong>Maeo, Schoenfeld, Kassiano &amp; Helms</strong> — the same literature Jeff Nippard draws on for his own leg programming.
      </>
    ),
    exercises: 7,
    sets: 21,
    muscles: 6,
    minutes: '~65',
  },
};
