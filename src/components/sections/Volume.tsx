import { volumeCards } from '@/content/volume';
import { Accent, SectionIntro } from './SectionIntro';
import { VolumeGrid } from './VolumeGrid';

const STATS = [
  { num: '132', label: 'Total working sets logged across all 6 sessions' },
  { num: '6 / 14', label: 'Muscles landing directly inside the 10–20 zone' },
  { num: '3', label: 'Muscles with real room to add sets — lateral delts, hamstrings & calves' },
];

/**
 * Weekly hard sets per muscle, against the 10–20 set hypertrophy zone.
 * `liveCounts`: the rebuilt training core draws each card's "N logged so far" line.
 */
export function Volume({ liveCounts = false }: { liveCounts?: boolean }) {
  return (
    <section className="section" id="volume">
      <SectionIntro eyebrow="Volume Audit" title={<>Weekly <Accent>Set Volume</Accent>, Muscle By Muscle</>}>
        The evidence-based sweet spot for hypertrophy sits at roughly <strong>10–20 hard sets per muscle per week</strong>, with smaller, faster-recovering muscles often needing less and large multi-region muscles like the back sometimes benefiting from a bit more. Here's every muscle in this program counted straight from the exercise cards above — not estimated. Updated for the new 6-day split: triceps split into two standalone lifts, core/shrugs/forearms isolated onto Push/Pull/Legs respectively, and Hack Squat + Leg Curls swapped for Back Squat + a 4th RDL set.
      </SectionIntro>
      <div className="volume-stats reveal">
        {STATS.map((s) => (
          <div key={s.num} className="volume-stat">
            <div className="num">{s.num}</div>
            <div className="lbl">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="volume-legend reveal">
        <span className="volume-legend-swatch" /> Shaded band = the general 10–20 set/week hypertrophy zone{' '}
        <span className="cite" style={{ marginLeft: '8px' }}>
          Schoenfeld, Ogborn &amp; Krieger (2017), J Sports Sci 35(11) — volume dose-response meta-analysis
        </span>
      </div>
      <VolumeGrid cards={volumeCards} liveCounts={liveCounts} />
      <div className="volume-callout reveal">
        <h4>🧮 How these numbers were counted</h4>
        <p>
          Every set is credited to every muscle its exercise card explicitly tags as a target — a Back Squat's 3 sets count toward both Quads and Glutes, because it's a genuine primary driver of both, not just a stabilizer. Unilateral work (the plate-loaded row) is counted once per side, matching how much stimulus each side of the muscle actually receives. Nothing here is padded with loose "indirect" credit beyond what the program's own activation data already shows.
        </p>
        <p>
          <strong>The verdict:</strong> splitting the triceps superset into two standalone lifts and isolating core/shrugs/forearms onto their own days didn't change any muscle's total weekly volume — it just cleaned up the session structure. The one number that actually moved is hamstrings, down to 8 sets/wk now that Leg Curls are gone in favor of a 4th RDL set; that's the one spot in the new split worth keeping an eye on. Front delts remain the other muscle running hotter than the rest, and lateral delts, hamstrings &amp; calves are the three spots with legitimate headroom if any of them is a priority for you.
        </p>
      </div>
    </section>
  );
}
