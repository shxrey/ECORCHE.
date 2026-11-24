/**
 * The Anatomy section ("The Engagement Map"): per training group, the body
 * diagram's colour key, the muscle cards and two comparison tables. The
 * diagrams themselves are drawings, in src/components/sections/AnatomyFigures.tsx.
 */
import type { Group } from './types';

export interface LegendRow {
  /** CSS colour of the dot, matching the diagram. */
  color: string;
  title: string;
  /** The small pill after the title, e.g. "peaks ~44° incline". */
  tag?: string;
  text: string;
}

export interface MuscleCard {
  /** Colour theme: the .muscle-card.<tone> and .muscle-icon.<tone> classes. */
  tone: string;
  icon: string;
  name: string;
  latin: string;
  /** [label, value] rows. */
  stats: [string, string][];
  /** The small heads diagram with its key (triceps, biceps). */
  heads?: { color: string; rows: { name: string; text: string }[] };
}

/** A table cell: text, optionally followed by a muted note such as "(programmed)". */
export type Cell = string | { text: string; note: string };

export interface Comparison {
  title: string;
  /** A paragraph between the title and the table. */
  intro?: string;
  columns: string[];
  rows: Cell[][];
  source: string;
}

export interface AnatomyTab {
  /** Whether the muscle-card grid fades in on scroll (default true). */
  revealGrid?: boolean;
  legend: LegendRow[];
  cards: MuscleCard[];
  comparisons: [Comparison, Comparison];
}

export const anatomy: Record<Group, AnatomyTab> = {
  push: {
    legend: [
      { color: 'var(--flame)', title: 'Upper Chest — Clavicular Head', tag: 'peaks ~44° incline',
        text: 'Hit hardest by incline dumbbell & Smith presses. The steeper the angle, the more work shifts here — and off the sternal fibers below.' },
      { color: 'var(--flame-dim)', title: 'Mid/Lower Chest — Sternocostal Head', tag: 'peaks at 0° flat',
        text: 'The biggest portion of the pec by mass. Flat pressing and cable crossovers with a high pulley both bias this region hardest.' },
      { color: 'var(--gold)', title: 'Front & Lateral Deltoid',
        text: 'Front delt rides along on every press; lateral delt only grows meaningfully from direct raises — it\'s largely a bystander during pressing movements.' },
      { color: 'var(--teal)', title: 'Rectus Abdominis',
        text: 'Trained at both ends of its function this program: spinal flexion (cable crunch) on Day A, hip flexion (hanging leg raise) on Day B.' },
    ],
    cards: [
      {
        tone: 'chest', icon: '🔥', name: 'Chest', latin: 'M. pectoralis major',
        stats: [
          ['Primary Exercises', 'Flat/Incline Press, Cable Crossover'],
          ['Optimal Rep Range', '3-15 reps'],
          ['Weekly Volume Target', '12-20 hard sets'],
          ['Fiber Profile', 'Fast-twitch dominant'],
          ['Growth Mechanism', 'Mechanical Tension + Stretch'],
          ['Key Study', 'Trebs et al. (2010) — angle vs. head bias'],
        ],
      },
      {
        tone: 'delt', icon: '⚡', name: 'Deltoids', latin: 'M. deltoideus (anterior, lateral)',
        stats: [
          ['Primary Exercises', 'Machine Press, Lateral Raise'],
          ['Optimal Rep Range', '8-20 reps'],
          ['Weekly Volume Target', '6-10 direct sets'],
          ['Fiber Profile', 'Fast-twitch dominant'],
          ['Growth Mechanism', 'High-Rep Peak Contraction'],
          ['Key Study', 'Larsen, Wolf, Schoenfeld (2025)'],
        ],
      },
      {
        tone: 'tri', icon: '💪', name: 'Triceps Brachii', latin: 'Long, lateral & medial heads',
        stats: [
          ['Primary Exercises', 'Overhead Extension, Pushdown'],
          ['Optimal Rep Range', '8-15 reps'],
          ['Weekly Volume Target', '10-16 hard sets'],
          ['Fiber Profile', 'Mixed across 3 heads'],
          ['Growth Mechanism', 'Long-Length Loading (Long Head)'],
          ['Key Study', 'Maeo et al. (2022) — 28.5% vs 19.6%'],
        ],
        heads: { color: 'var(--violet-bright)', rows: [
          { name: 'Long Head', text: 'crosses shoulder + elbow — only lengthens under an overhead arm position.' },
          { name: 'Lateral Head', text: 'gives the visible "horseshoe" — most active in pushdowns.' },
          { name: 'Medial Head', text: 'sits deep, active across nearly every extension variation.' },
        ] },
      },
      {
        tone: 'core', icon: '🛡', name: 'Core', latin: 'M. rectus abdominis',
        stats: [
          ['Primary Exercises', 'Cable Crunch, Hanging Leg Raise'],
          ['Optimal Rep Range', '10-20 / to failure'],
          ['Weekly Volume Target', '8-12 hard sets'],
          ['Fiber Profile', 'Mixed'],
          ['Growth Mechanism', 'Resisted Spinal / Hip Flexion'],
          ['Key Study', 'Schoenfeld et al. (2017) — volume dose-response'],
        ],
      },
    ],
    comparisons: [
      {
        title: 'Exercise Comparison — Chest Activation by Bench Angle',
        columns: ['Bench Angle', 'Upper (Clavicular)', 'Mid/Lower (Sternocostal)', 'Front Delt', 'Best For'],
        rows: [
          ['Flat (0°)', '55%', '95%', '60%', 'Overall Mass, Lower Fibers'],
          ['Incline (~30°)', '85%', '75%', '68%', 'Balanced Upper Chest'],
          ['Incline (~44-45°)', '92%', '60%', '78%', 'Maximum Clavicular Bias'],
        ],
        source: 'Values are illustrative % of MVIC, directionally consistent with controlled EMG testing. Source: Trebs, Brandenburg & Pitney (2010); Rodríguez-Ridao et al. (2020).',
      },
      {
        title: 'Exercise Comparison — Triceps Head Activation',
        columns: ['Exercise', 'Long Head', 'Lateral Head', 'Medial Head', 'Best For'],
        rows: [
          ['Cable Pushdown', '45%', '88%', '70%', 'Lateral Head Peak'],
          ['Dumbbell Kickback', '40%', '80%', '60%', 'Isolated Peak Squeeze'],
          ['Overhead Extension', '92%', '55%', '58%', 'Long Head Hypertrophy'],
        ],
        source: 'Source: Maeo et al. (2022) — overhead-position elbow extension training produced 28.5% long-head muscle growth vs. 19.6% for the neutral arm position over 12 weeks.',
      },
    ],
  },
  pull: {
    // The original page left the fade-in off this grid; kept as it was.
    revealGrid: false,
    legend: [
      { color: 'var(--moss)', title: 'Latissimus Dorsi — The V-Taper Engine', tag: 'peaks with pronated grip',
        text: 'Hit hardest by pulldowns, rows and straight-arm pullovers. Controlled research shows grip pronation, not grip width, is what actually recruits it hardest.' },
      { color: 'var(--gold)', title: 'Mid-Back — Traps & Rhomboids', tag: 'peaks under scapular retraction',
        text: 'Chest-supported rows and flexion rows, built around a hard end-range squeeze, target this region more directly than any lat-focused pull.' },
      { color: 'var(--violet)', title: 'Rear Deltoid', tag: 'hip-height cable, constant tension',
        text: 'Rides along passively during rowing, but only grows fully from direct reverse-crossover work that matches its horizontal-abduction strength curve.' },
      { color: 'var(--steel)', title: 'Biceps — Long & Short Head', tag: 'long head peaks in shoulder extension',
        text: 'Face-away and incline positions stretch the long head behind the torso plane, producing the deepest EMG activation of any curl variation tested.' },
      { color: 'var(--ember)', title: 'Forearms — Flexors & Extensors', tag: 'trained to true failure',
        text: 'Small, fast-recovering muscles that respond best to frequent, high-rep, failure-based finishing work on both sides of the forearm.' },
    ],
    cards: [
      {
        tone: 'lat', icon: '🏆', name: 'Latissimus Dorsi', latin: 'M. latissimus dorsi',
        stats: [
          ['Primary Exercises', 'Lat Pulldown, Pullover'],
          ['Optimal Rep Range', '8-15 reps'],
          ['Weekly Volume Target', '12-18 hard sets'],
          ['Fiber Profile', 'Large, fan-shaped, mixed'],
          ['Growth Mechanism', 'Stretch-Mediated + Pronated Grip'],
          ['Key Study', 'Andersen et al. (2014) — grip effects'],
        ],
      },
      {
        tone: 'midback', icon: '💪', name: 'Mid-Back', latin: 'Rhomboids & mid trapezius',
        stats: [
          ['Primary Exercises', 'Chest-Supported Row, Flexion Row'],
          ['Optimal Rep Range', '8-12 reps'],
          ['Weekly Volume Target', '10-14 hard sets'],
          ['Fiber Profile', 'Postural, endurance-biased'],
          ['Growth Mechanism', 'Scapular Retraction Under Load'],
          ['Key Study', 'Long-length training principle'],
        ],
      },
      {
        tone: 'reardelt', icon: '🎯', name: 'Rear Deltoid', latin: 'Posterior deltoid fibers',
        stats: [
          ['Primary Exercises', 'Reverse Cable Crossover'],
          ['Optimal Rep Range', '12-20 reps'],
          ['Weekly Volume Target', '8-12 hard sets'],
          ['Fiber Profile', 'Small, fast-fatiguing'],
          ['Growth Mechanism', 'Constant-Tension Horizontal Abduction'],
          ['Key Study', 'Signorile et al. (2002) — hand position EMG'],
        ],
      },
      {
        tone: 'bicep', icon: '💪', name: 'Biceps Brachii', latin: 'Long & short heads',
        stats: [
          ['Primary Exercises', 'Bayesian Curl, Incline Curl'],
          ['Optimal Rep Range', '8-15 reps'],
          ['Weekly Volume Target', '10-16 hard sets'],
          ['Fiber Profile', 'Long head stretch-sensitive'],
          ['Growth Mechanism', 'Long-Length Loading (Behind Torso)'],
          ['Key Study', 'Oliveira et al. (2009) — shoulder position'],
        ],
        heads: { color: 'var(--steel-bright)', rows: [
          { name: 'Long Head', text: 'crosses the shoulder — only reaches full stretch with the arm extended behind the torso.' },
          { name: 'Short Head', text: 'sits inner/front — dominant during preacher and concentration positions.' },
          { name: 'Brachialis', text: 'sits underneath both heads — hammer and neutral grips shift load onto it directly.' },
        ] },
      },
      {
        tone: 'forearm', icon: '✋', name: 'Forearms', latin: 'Flexors, extensors & brachioradialis',
        stats: [
          ['Primary Exercises', 'Wrist Curl, Reverse Barbell Curl'],
          ['Optimal Rep Range', 'To failure, high rep'],
          ['Weekly Volume Target', '6-10 hard sets per side'],
          ['Fiber Profile', 'Flexors (grip) vs. extensors (stability)'],
          ['Growth Mechanism', 'High-Frequency Failure Overload'],
          ['Key Study', 'Schoenfeld et al. (2017) — volume dose-response'],
        ],
      },
    ],
    comparisons: [
      {
        title: 'Exercise Comparison — Lat Activation by Grip Width & Orientation',
        columns: ['Grip / Orientation', 'Lat Activation', 'Biceps Activation', 'Best For'],
        rows: [
          ['Wide Pronated', '92%', '45%', 'Vertical Width & Teres Major'],
          ['Medium Pronated', '90%', '52%', 'Balanced Lat Recruitment'],
          ['Narrow/Close Pronated', '88%', '65%', 'Lat Sweep + Biceps Carryover'],
          ['Supinated (Chin-Up Grip)', '80%', '78%', 'Biceps-Dominant Carryover'],
        ],
        source: 'Values are illustrative % of MVIC, directionally consistent with controlled EMG testing. Source: Andersen, Fimland, Wiik, Skoglund & Sæterbakken (2014); Lusk, Hale & Russell (2010).',
      },
      {
        title: 'Exercise Comparison — Biceps Long Head Activation by Curl Variation',
        columns: ['Exercise', 'Shoulder Position', 'Long Head EMG', 'Best For'],
        rows: [
          ['Incline Dumbbell Curl', 'Extended behind torso', '91%', 'Long Head Mass'],
          ['Face-Away Bayesian Curl', 'Extended behind torso', '89%', 'Long Head Peak Stretch'],
          ['Standard Dumbbell Curl', 'Neutral, arm at side', '80%', 'General Mass'],
          ['Preacher Curl', 'Flexed in front of torso', '60%', 'Short Head / Brachialis'],
        ],
        source: 'Source: Oliveira, Matta, Alves, Garcia & Vieira (2009) — biceps brachii activation was consistently greatest when the muscle was worked at a longer length; corroborated by a 2025 exploratory EMG comparison of traditional dumbbell versus Bayesian cable curls.',
      },
    ],
  },
  legs: {
    legend: [
      { color: 'var(--frost)', title: 'Quadriceps', tag: 'rectus femoris peaks in reclined position',
        text: 'Back squat and leg press build raw mass; the leaned-back leg extension isolates the rectus femoris at its longest usable length.' },
      { color: 'var(--ham)', title: 'Hamstrings', tag: 'RDL trains at long muscle length',
        text: 'With leg curls out of the program, RDLs carry the full direct hamstring stimulus — a hip-flexed, long-length position, which the research below still favors over short-length training.' },
      { color: 'var(--glute)', title: 'Glutes',
        text: 'Never trained in true isolation here — they ride along on every squat and hinge pattern as a secondary mover, which is enough volume for most lifters.' },
      { color: 'var(--calf)', title: 'Calves — Gastrocnemius & Soleus',
        text: 'Two distinct muscles needing two distinct knee angles: straight-leg standing raises for the gastrocnemius, bent-knee seated raises for the soleus underneath.' },
    ],
    cards: [
      {
        tone: 'quad', icon: '🦵', name: 'Quadriceps', latin: 'M. quadriceps femoris',
        stats: [
          ['Primary Exercises', 'Barbell Back Squat, Leg Press, Leg Extension'],
          ['Optimal Rep Range', '8-20 reps'],
          ['Weekly Volume Target', '12-20 hard sets'],
          ['Fiber Profile', 'Fast-twitch dominant'],
          ['Growth Mechanism', 'Mechanical Tension + Stretch'],
          ['Key Study', 'Pedrosa et al. (2022) — length-biased ROM'],
        ],
      },
      {
        tone: 'ham', icon: '🦾', name: 'Hamstrings', latin: 'M. biceps femoris, semitendinosus, semimembranosus',
        stats: [
          ['Primary Exercises', 'Romanian Deadlifts (Barbell/Dumbbell)'],
          ['Optimal Rep Range', '8-12 reps'],
          ['Weekly Volume Target', '10-16 hard sets'],
          ['Fiber Profile', 'Fast-twitch dominant'],
          ['Growth Mechanism', 'Long-Length (Hip-Flexed) Loading'],
          ['Key Study', 'Maeo et al. (2021) — 14.1% vs 9.3%'],
        ],
      },
      {
        tone: 'glute', icon: '🏋', name: 'Glutes', latin: 'M. gluteus maximus, medius, minimus',
        stats: [
          ['Primary Exercises', 'RDLs, Back Squat, Leg Press'],
          ['Optimal Rep Range', '8-15 reps'],
          ['Weekly Volume Target', '10-16 indirect + direct sets'],
          ['Fiber Profile', 'Mixed'],
          ['Growth Mechanism', 'Hip Extension Under Load'],
          ['Key Study', 'Schoenfeld et al. (2017) — volume dose-response'],
        ],
      },
      {
        tone: 'calf', icon: '👢', name: 'Calves', latin: 'M. gastrocnemius, soleus',
        stats: [
          ['Primary Exercises', 'Standing & Seated Calf Raises'],
          ['Optimal Rep Range', '10-20 / to failure'],
          ['Weekly Volume Target', '12-20 hard sets'],
          ['Fiber Profile', 'Gastroc fast-twitch leaning / Soleus slow-twitch dominant'],
          ['Growth Mechanism', 'Lengthened-Position Loading'],
          ['Key Study', 'Kassiano et al. (2023) — 15.2% vs 6.7%'],
        ],
      },
    ],
    comparisons: [
      {
        title: 'Exercise Comparison — Hamstring Length & Growth',
        intro: 'Leg Curls aren\'t currently programmed — RDLs now carry the hamstrings\' full direct volume — but the underlying muscle-length research is still worth knowing if you ever want to add a curl variation back in.',
        columns: ['Leg Curl Position', 'Hip Angle', 'Muscle Length', '12-Week Hypertrophy', 'Best For'],
        rows: [
          ['Lying', 'Extended (~180°)', 'Short', '+9.3%', 'CNS-Fresh Early Isolation'],
          ['Seated', 'Flexed (~90°)', 'Long', '+14.1%', 'Maximum Hamstring Growth'],
          [{ text: 'Romanian Deadlift', note: '(programmed)' }, 'Flexed at hip, extended at knee', 'Long (hip-hinge)', '—', 'Current program\'s only direct driver'],
        ],
        source: 'Source: Maeo et al. (2021), Med Sci Sports Exerc 53(4):825-837 — 12-week trial, MRI-measured whole-hamstring muscle volume, biceps femoris long head showed the largest gap between conditions.',
      },
      {
        title: 'Exercise Comparison — Calf Raise Range of Motion',
        columns: ['Training Range', 'Medial Gastroc Growth', 'Best For'],
        rows: [
          ['Full Range of Motion', '+6.7%', 'General Conditioning'],
          ['Lengthened Partials (Stretch-Biased)', '+15.2%', 'Maximum Calf Hypertrophy'],
        ],
        source: 'Source: Kassiano et al. (2023), J Strength Cond Res 37(9):1746-1753 — 8-week trial in untrained women, ultrasound-measured medial gastrocnemius thickness.',
      },
    ],
  },
};
