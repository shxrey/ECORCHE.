/**
 * The Volume section: weekly hard sets per muscle, counted from the exercise
 * cards (the section's callout explains how). `muscle` is also how the page
 * finds a muscle's exercises, so keep it as written.
 */

export interface VolumeCard {
  muscle: string;
  /** Smaller grey text after the name, e.g. "(Lats + Mid-Back)". */
  detail?: string;
  verdict: { tone: 'optimal' | 'high' | 'low' | 'indirect'; label: string };
  /** Weekly hard sets. */
  sets: number;
  /** CSS colour of the big number. */
  color: string;
  /** Bar length as a share of 24 sets, exactly as authored (e.g. "0.7917"). */
  scale: string;
  /** CSS background of the bar. */
  fill: string;
  note: string;
}

export const volumeCards: VolumeCard[] = [
  {
    muscle: 'Chest',
    verdict: { tone: 'optimal', label: 'Optimal' },
    sets: 18,
    color: 'var(--flame-bright)',
    scale: '0.75',
    fill: 'linear-gradient(90deg,var(--flame),var(--flame-bright))',
    note: '9 sets a day across the incline/flat press rotation plus a dedicated fly, on both Push A and B. Dead center of the range regardless of which day you count.',
  },
  {
    muscle: 'Front Delts',
    verdict: { tone: 'high', label: 'High — Monitor' },
    sets: 19,
    color: 'var(--gold-bright)',
    scale: '0.7917',
    fill: 'linear-gradient(90deg,var(--gold),var(--gold-bright))',
    note: 'Only 6 of these are true isolation sets (the leg-day shoulder press); the other 13 come from spillover off the four press variations across Push A and B. Still at the top of the range — the one muscle worth watching for anterior shoulder fatigue.',
  },
  {
    muscle: 'Lateral Delts',
    verdict: { tone: 'low', label: 'Low End' },
    sets: 6,
    color: 'var(--ember-bright)',
    scale: '0.25',
    fill: 'linear-gradient(90deg,var(--ember),var(--ember-bright))',
    note: 'The side delt is one of the slowest-responding muscles in most physiques and rarely gets meaningful crossover from pressing. If width is a goal, this is still the most defensible place in the whole program to add 2–3 sets.',
  },
  {
    muscle: 'Rear Delts',
    verdict: { tone: 'optimal', label: 'Optimal' },
    sets: 6,
    color: 'var(--violet-bright)',
    scale: '0.25',
    fill: 'linear-gradient(90deg,var(--violet),var(--violet-bright))',
    note: '6 direct sets of Reverse Crossovers looks low in isolation, but rear delts are a synergist in nearly every one of the 24 back-day rowing sets — total exposure is comfortably in range.',
  },
  {
    muscle: 'Back',
    detail: '(Lats + Mid-Back)',
    verdict: { tone: 'optimal', label: 'Optimal' },
    sets: 24,
    color: 'var(--moss-bright)',
    scale: '1',
    fill: 'linear-gradient(90deg,var(--moss),var(--moss-bright))',
    note: 'Up to 24 with the new unilateral plate-loaded row added to Pull A. Technically over the general ceiling, but the back isn\'t one muscle — it\'s lats, rhomboids and traps sharing the load across 8 different pulling angles a week. Worth watching if recovery lags, but not an alarm on its own.',
  },
  {
    muscle: 'Biceps',
    detail: '+ Brachialis',
    verdict: { tone: 'optimal', label: 'Optimal' },
    sets: 12,
    color: 'var(--steel-bright)',
    scale: '0.5',
    fill: 'linear-gradient(90deg,var(--steel),var(--steel-bright))',
    note: '12 direct sets across 4 curl variations, plus real secondary work from the pulldown/row sets that also tag biceps each week. Comfortably mid-range even before counting the spillover.',
  },
  {
    muscle: 'Triceps',
    verdict: { tone: 'optimal', label: 'Optimal' },
    sets: 12,
    color: 'var(--violet-bright)',
    scale: '0.5',
    fill: 'linear-gradient(90deg,var(--violet),var(--violet-bright))',
    note: 'Now two standalone lifts instead of a superset — 3 lateral/medial-biased sets and 3 long-head-stretch sets per day, still 12 total per week. Splitting them out just means each one gets a clean rest period instead of racing the clock.',
  },
  {
    muscle: 'Upper Traps',
    verdict: { tone: 'optimal', label: 'Optimal' },
    sets: 6,
    color: 'var(--gold-bright)',
    scale: '0.25',
    fill: 'linear-gradient(90deg,#B8862A,var(--gold))',
    note: 'Relocated from push to pull day this update — one shrug variation per Pull session, 6 direct sets total. Looks low, but traps are working isometrically through basically every row, pulldown and RDL in the program too. A sensible top-up dose, not a primary driver.',
  },
  {
    muscle: 'Forearms',
    verdict: { tone: 'optimal', label: 'Optimal' },
    sets: 6,
    color: 'var(--ember-bright)',
    scale: '0.25',
    fill: 'linear-gradient(90deg,var(--ember),var(--ember-bright))',
    note: 'Living on leg days, so grip stays fresh for the heavy rowing work — one flexor-biased and one extensor-biased wrist-curl variation, 6 total sets. Small, fast-recovering muscles like this generally need less dedicated volume, not more.',
  },
  {
    muscle: 'Quads',
    detail: '(incl. Rectus Femoris)',
    verdict: { tone: 'optimal', label: 'Optimal' },
    sets: 14,
    color: 'var(--frost-bright)',
    scale: '0.5833',
    fill: 'linear-gradient(90deg,var(--frost),var(--frost-bright))',
    note: '7 sets a day between Barbell Back Squats, Leg Press and Leg Extensions. Dead center of the range — swapping Hack Squat for the free-bar version didn\'t change the volume math at all.',
  },
  {
    muscle: 'Hamstrings',
    verdict: { tone: 'low', label: 'Low End' },
    sets: 8,
    color: 'var(--ham-bright)',
    scale: '0.3333',
    fill: 'linear-gradient(90deg,var(--ham),var(--ham-bright))',
    note: 'Down from 12 now that Leg Curls are gone — RDLs (4 sets/day) are the only direct hamstring driver left. Still a genuine hip-hinge stretch stimulus, but this is the one real trade-off of the new split: no more short-length curl work. Worth adding a curl variation back in if hamstring growth stalls.',
  },
  {
    muscle: 'Glutes',
    verdict: { tone: 'indirect', label: 'Indirect Only' },
    sets: 16,
    color: 'var(--glute-bright)',
    scale: '0.6667',
    fill: 'linear-gradient(90deg,var(--glute),var(--glute-bright))',
    note: 'All 16 sets come as a secondary mover on Back Squats, Leg Press and RDLs — there\'s no hip thrust or glute bridge in the program. Fine for general lower-body development; worth adding a dedicated movement if glutes are a specific focus.',
  },
  {
    muscle: 'Calves',
    verdict: { tone: 'low', label: 'Low End' },
    sets: 8,
    color: 'var(--calf-bright)',
    scale: '0.3333',
    fill: 'linear-gradient(90deg,var(--calf),var(--calf-bright))',
    note: 'Taken to true dead-stop failure, so quality is high — but calves are an unusually stubborn, slow-twitch-dominant muscle that often responds better to more volume and frequency than average, not less. A likely candidate to expand if growth stalls here.',
  },
  {
    muscle: 'Abs / Core',
    verdict: { tone: 'optimal', label: 'Optimal' },
    sets: 6,
    color: 'var(--teal-bright)',
    scale: '0.25',
    fill: 'linear-gradient(90deg,var(--teal),var(--teal-bright))',
    note: 'Now living on push day — an upper-bias cable crunch on Day A, a lower-bias hanging raise on Day B. Weighted/loaded and taken to failure, plus heavy isometric bracing from every squat, hinge and press elsewhere in the week. 6 dedicated sets is plenty on top of that.',
  },
];
