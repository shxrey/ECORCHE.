/**
 * The Sources section: the studies and practitioner write-ups behind the
 * program. Core studies apply to every day; the rest are grouped by Push /
 * Pull / Legs. Cards are numbered by their order in each list.
 */
import type { Group } from './types';

export interface Study {
  title: string;
  summary: string;
  /** Opens in a new tab. The label gets a "→" after it. */
  link: { href: string; label: string };
}

export const coreStudies: Study[] = [
  {
    title: 'Schoenfeld, B.J. (2010). The Mechanisms of Muscle Hypertrophy and Their Application to Resistance Training.',
    summary: 'The foundational review defining mechanical tension, metabolic stress, and muscle damage as the three drivers of hypertrophy. Forms the theoretical basis for the tempo protocol used on every day of this program.',
    link: { href: 'https://doi.org/10.1519/JSC.0b013e3181e840f3', label: 'View DOI' },
  },
  {
    title: 'Helms, E.R., Cronin, J., Storey, A., & Zourdos, M.C. (2016). Application of the Repetitions in Reserve-Based Rating of Perceived Exertion Scale for Resistance Training.',
    summary: 'Introduced the RIR-based effort scale used throughout every session\'s intensity prescriptions, letting load autoregulate to daily readiness instead of chasing a fixed number on the bar.',
    link: { href: 'https://pubmed.ncbi.nlm.nih.gov/27531969/', label: 'View on PubMed' },
  },
  {
    title: 'Grgic, J., Schoenfeld, B.J., Orazem, J., & Sabol, F. (2022). Effects of Resistance Training Performed to Repetition Failure or Non-Failure on Muscular Strength and Hypertrophy.',
    summary: 'A meta-analysis of 11 studies concluding training to failure isn\'t required for hypertrophy — the basis for prescribing 1-2 RIR on most sets across all 6 days and reserving true failure for a handful of strategic moments per session.',
    link: { href: 'https://pubmed.ncbi.nlm.nih.gov/33497853/', label: 'View on PubMed' },
  },
  {
    title: 'Schoenfeld, B.J., Ogborn, D., & Krieger, J.W. (2017). Dose-Response Relationship Between Weekly Resistance Training Volume and Increases in Muscle Mass.',
    summary: 'The foundational meta-analysis establishing a graded, roughly linear relationship between weekly hard sets and hypertrophy — the basis for the weekly volume targets referenced throughout the Anatomy section.',
    link: { href: 'https://doi.org/10.1080/02640414.2016.1210197', label: 'View DOI' },
  },
];

export const groupStudies: Record<Group, Study[]> = {
  push: [
    {
      title: 'Trebs, A.A., Brandenburg, J.P., & Pitney, W.A. (2010). An Electromyography Analysis of 3 Muscles Surrounding the Shoulder Joint During a Chest Press at Several Angles.',
      summary: 'Compared pectoralis and deltoid activation across bench angles from 0° to 56°. Found the clavicular head peaks at a steep ~44° incline — the basis for the incline vs. flat exercise pairing in Push Day A/B.',
      link: { href: 'https://scholar.google.com/scholar?q=Trebs+Brandenburg+Pitney+2010+electromyography+chest+press+angles', label: 'Find on Scholar' },
    },
    {
      title: 'Rodríguez-Ridao, D. et al. (2020). Effect of Five Bench Inclinations on the EMG Activity of the Pectoralis Major, Anterior Deltoid & Triceps Brachii During the Bench Press.',
      summary: 'Tested 0°, 15°, 30°, 45° and 60°. Upper pec peaked near 30°, mid/lower pec peaked at 0° flat, and anterior deltoid activation rose steadily with steeper angles — directly informing the Day A/B angle split.',
      link: { href: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7579505/', label: 'View on PMC' },
    },
    {
      title: 'Maeo, S. et al. (2022). Triceps Brachii Hypertrophy Is Substantially Greater After Elbow Extension Training Performed in the Overhead Versus Neutral Arm Position.',
      summary: 'A 12-week MRI-tracked trial: overhead-position training produced 28.5% long-head growth vs. 19.6% neutral, even at a lighter absolute load — the core evidence behind pairing overhead extensions with pushdowns/kickbacks.',
      link: { href: 'https://pubmed.ncbi.nlm.nih.gov/35819335/', label: 'View on PubMed' },
    },
    {
      title: 'Larsen, S., Wolf, M., Schoenfeld, B.J. et al. (2025). Dumbbell Versus Cable Lateral Raises for Lateral Deltoid Hypertrophy: An Experimental Study.',
      summary: 'An 8-week within-participant ultrasound trial finding dumbbell and cable lateral raises produced statistically equivalent lateral deltoid growth — supporting the use of both variations across the two sessions.',
      link: { href: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12277279/', label: 'View on PMC' },
    },
    {
      title: 'Jeff Nippard — Chest, Shoulder & Triceps Hypertrophy Breakdowns (YouTube & Science Applied Programs)',
      summary: 'Nippard\'s public breakdowns synthesize this same body of EMG and hypertrophy literature into practical programming — the exercise-selection philosophy Push Day\'s structure draws on.',
      link: { href: 'https://www.jeffnippard.com/', label: 'Visit JeffNippard.com' },
    },
  ],
  pull: [
    {
      title: 'Andersen, V., Fimland, M.S., Wiik, E., Skoglund, A., & Sæterbakken, A.H. (2014). Effects of Grip Width on Muscle Strength and Activation in the Lat Pull-Down.',
      summary: 'Compared narrow, medium, and wide pronated grips using 6RM loads and EMG. Found lat activation was remarkably similar across all three widths, challenging the popular belief that wider is always better for the lats.',
      link: { href: 'https://www.researchgate.net/publication/261067362_Effects_of_Grip_Width_on_Muscle_Strength_and_Activation_in_the_Lat_Pull-Down', label: 'Find on ResearchGate' },
    },
    {
      title: 'Lusk, S.J., Hale, B.D., & Russell, D.M. (2010). Grip Width and Forearm Orientation Effects on Muscle Activity During the Lat Pull-Down.',
      summary: 'Compared wide-pronated, wide-supinated, narrow-pronated, and narrow-supinated grips. Found a pronated grip activates the lats more than a supinated one, regardless of width — the basis for defaulting to pronated grips throughout Pull Day.',
      link: { href: 'https://pure.psu.edu/en/publications/grip-width-and-forearm-orientation-effects-on-muscle-activity-dur/', label: 'View Publication' },
    },
    {
      title: 'Signorile, J.F., Zink, A.J., & Szwed, S.P. (2002). A Comparative Electromyographical Investigation of Muscle Utilization Patterns Using Various Hand Positions During the Lat Pull-Down.',
      summary: 'Examined posterior deltoid, latissimus dorsi, pectoralis major, teres major, and triceps long head activity across pulldown hand positions — the underlying data behind pairing pulling movements with dedicated rear-delt isolation.',
      link: { href: 'https://scholar.google.com/scholar?q=Signorile+Zink+Szwed+2002+lat+pull-down+hand+positions', label: 'Find on Scholar' },
    },
    {
      title: 'Oliveira, L.F., Matta, T.T., Alves, D.S., Garcia, M.A.C., & Vieira, T.M.M. (2009). Effect of the Shoulder Position on the Biceps Brachii EMG in Different Dumbbell Curls.',
      summary: 'Found the greatest biceps brachii activation occurs when the muscle is worked at a longer length — the direct evidence behind prioritizing incline and behind-the-torso curl positions in this program.',
      link: { href: 'https://pubmed.ncbi.nlm.nih.gov/24150552/', label: 'View on PubMed' },
    },
    {
      title: 'An Exploratory Study of Biceps Brachii Electromyographic Activity During Traditional Dumbbell Versus Bayesian Cable Curls (2025).',
      summary: 'A direct EMG comparison of the standard dumbbell curl against the behind-the-body "Bayesian" cable curl position — the specific study behind the Face-Away Bayesian Cable Curl programmed on Pull Day A.',
      link: { href: 'https://www.mdpi.com/2813-0413/4/4/45', label: 'View Study' },
    },
    {
      title: 'Muscle Hypertrophy from Partial Repetition at Long vs. Short Muscle Length: A Systematic Review and Meta-Analysis (2025), Sport Sciences for Health.',
      summary: 'Found resistance training performed at longer muscle lengths produced significantly greater overall, distal, and central hypertrophy than training at shorter lengths — the basis for the deep-stretch pause built into every pull and curl in this program.',
      link: { href: 'https://link.springer.com/10.1007/s11332-025-01586-5', label: 'View DOI' },
    },
    {
      title: 'Dr. Mike Israetel — Back & Biceps Training Breakdowns (YouTube & RP Strength)',
      summary: 'The source of the Cable Flexion Row\'s signature round-and-extend technique and the broader "stretched muscle positions drive the most growth" philosophy applied across this program\'s rowing and curling movements.',
      link: { href: 'https://rpstrength.com/', label: 'Visit RP Strength' },
    },
    {
      title: 'Jeff Nippard — Back & Biceps Hypertrophy Breakdowns (YouTube & Science Applied Programs)',
      summary: 'Nippard\'s public breakdowns synthesize this same body of EMG and hypertrophy literature into practical programming — the exercise-selection philosophy Pull Day\'s structure draws on.',
      link: { href: 'https://www.jeffnippard.com/', label: 'Visit JeffNippard.com' },
    },
  ],
  legs: [
    {
      title: 'Maeo, S. et al. (2021). Greater Hamstrings Muscle Hypertrophy but Similar Damage Protection after Training at Long versus Short Muscle Lengths.',
      summary: 'A 12-week within-subject trial comparing seated (hip-flexed, long-length) to prone (hip-extended, short-length) leg curl training: +14.1% versus +9.3% whole-hamstring hypertrophy. Leg curls aren\'t currently programmed, but this is the same long-length principle behind using RDLs as the hamstrings\' sole direct driver — and the case for adding a seated curl back in if you want more volume.',
      link: { href: 'https://doi.org/10.1249/MSS.0000000000002523', label: 'View DOI' },
    },
    {
      title: 'Pedrosa, G.F. et al. (2022). Partial Range of Motion Training Elicits Favorable Improvements in Muscular Adaptations When Carried Out at Long Muscle Lengths.',
      summary: 'Found leg-extension training performed at the lengthened (initial-ROM) portion of the range produced greater vastus lateralis hypertrophy than the same volume trained at shorter angles — supporting the reclined leg-extension setup used on both days.',
      link: { href: 'https://pubmed.ncbi.nlm.nih.gov/33977835/', label: 'View on PubMed' },
    },
    {
      title: 'Clark, D.R., Lambert, M.I., & Hunter, A.M. (2019). Trunk Muscle Activation in the Back and Hack Squat at the Same Relative Loads.',
      summary: 'Found the hack squat requires significantly less trunk stabilization than the free barbell back squat. This program now uses the Back Squat as its primary quad/glute compound instead — quad and glute activation are broadly comparable between the two, and the extra trunk demand is a reasonable trade for a movement that needs no specialty machine.',
      link: { href: 'https://doi.org/10.1519/JSC.0000000000002144', label: 'View DOI' },
    },
    {
      title: 'Kassiano, W. et al. (2023). Greater Gastrocnemius Muscle Hypertrophy After Partial Range of Motion Training Performed at Long Muscle Lengths.',
      summary: 'An 8-week ultrasound trial finding calf raises trained through the lengthened portion of the range produced 15.2% medial gastrocnemius growth versus 6.7% for full range of motion — direct support for the mandatory 2-second stretch hold on both calf variations.',
      link: { href: 'https://pubmed.ncbi.nlm.nih.gov/37015016/', label: 'View on PubMed' },
    },
    {
      title: 'Jeff Nippard — Leg Hypertrophy Breakdowns (YouTube & Science Applied Programs)',
      summary: 'Nippard\'s public breakdowns synthesize this same body of muscle-length and hypertrophy literature into practical programming — the exercise-selection philosophy Leg Day\'s structure draws on.',
      link: { href: 'https://www.jeffnippard.com/', label: 'Visit JeffNippard.com' },
    },
  ],
};
