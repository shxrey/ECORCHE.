export type Group = 'push' | 'pull' | 'legs';
export type DayLetter = 'A' | 'B';
export type DayId = `${Group}${DayLetter}`;

export interface Day {
  id: DayId | string;
  group: Group | string;
  letter: DayLetter | string;
  /** id of the inner <section>, e.g. "workoutPushA" */
  sectionId: string;
  /** the day shown before any JS runs (Legs A) */
  active: boolean;
  eyebrow: string;
  /** "Push Day" — the A/B accent letter is appended by the component */
  title: string;
  subtitleHtml: string;
  totalSets: number;
  progressHeading: string;
  progressHint: string;
  resetLabel: string;
  exerciseKeys: string[];
}

export interface MuscleTag {
  /** maps to the .tag-{tone} class, e.g. "chest" */
  tone: string;
  label: string;
}

export interface SetDot {
  /** permanent set index used in storage keys ("push-a1-set2") */
  idx: string;
  label: string;
}

export interface ActivationRow {
  label: string;
  /** maps to the .bar-{tone} class */
  tone: string;
  /** % of MVIC */
  pct: number;
  /** scaleX value exactly as authored, e.g. "0.82" */
  scale: string;
  /** optional hue shift for second/third bars of the same tone */
  filter: string | null;
}

export type BlockItem =
  | { kind: 'subLabel'; html: string }
  | { kind: 'text'; html: string }
  | { kind: 'sourceNote'; html: string }
  | { kind: 'cite'; html: string }
  | { kind: 'divider'; html: string }
  | { kind: 'intensity'; level: string; html: string }
  | { kind: 'activation'; rows: ActivationRow[] };

export interface DetailBlock {
  heading: string | null;
  items: BlockItem[];
}

export interface Exercise {
  key: string;
  number: number;
  name: string;
  /** the smaller span after the name: grey qualifier or red "Peak Intensity" */
  nameSuffix: { text: string; tone: 'muted' | 'danger' | string } | null;
  tags: MuscleTag[];
  sets: string;
  reps: string;
  rir: string;
  /** null = default pill, "danger" = failure-focused red pills */
  pillVariant: string | null;
  setDots: SetDot[];
  blocks: DetailBlock[];
}
