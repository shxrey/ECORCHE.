import { Accent, SectionIntro } from './SectionIntro';
import { TempoCard } from './TempoCard';

/** Rest, warm-up, progression and deload: the rules that string sessions together. */
export function Standards() {
  return (
    <section className="section" id="standards">
      <SectionIntro eyebrow="Programming Standards" title={<>Rest, <Accent>Progression</Accent> &amp; Deload</>}>
        The tempo and RIR targets tell you how to perform a set. These four rules tell you how to string sessions together over months without stalling or breaking down. Weekly order: <strong>Legs A → Push A → Pull A → Legs B → Push B → Pull B → 1 full rest day.</strong> If a second rest day is needed, take it after Pull A rather than skipping a session.
      </SectionIntro>
      <div className="tempo-grid reveal">
        <TempoCard mark="⏱" title="Rest Periods">
          Heavy compounds and singles (Back Squat, Flat/Incline Bench, RDLs, rows): <strong>2–3 min</strong>. Standard isolation (curls, extensions, raises, pushdowns): <strong>60–90 sec</strong>. The lat pulldown pre-exhaust superset and the calf pairing: <strong>15–20 sec</strong> between A→B, then a full <strong>90 sec</strong> after the pair before moving on.
        </TempoCard>
        <TempoCard mark="🔥" title="Warm-Up">
          5 minutes of light cardio, then 1–2 ramping sets (roughly 50%→75%→90% of your top working weight) before the first compound of each day. Isolation and machine movements only need a single light warm-up set — save the ramping for whatever's heaviest and most technical.
        </TempoCard>
        <TempoCard mark="📈" title="Double Progression">
          Work within the given rep range on every exercise. Hit the <strong>top</strong> of the range on every working set at your target RIR → add weight next session (small jumps: +2.5–5% for compounds, the smallest available plate/pin for isolation). Drop below the <strong>bottom</strong> of the range at the same weight → hold the load and rebuild reps first. For FAILURE/PEAK sets, the target is simply beating last session's rep count at the same weight. Log weight × reps × RIR every session — without a written log, RIR targets quietly drift within 2–3 weeks.
        </TempoCard>
        <TempoCard mark="🔄" title="Deload — Every 6th Week">
          Cut every exercise to roughly 60% of normal volume (drop 1 set per exercise, 2 sets max), keep everything at 3+ RIR, and skip every FAILURE/PEAK set entirely for the week. Non-negotiable at this volume and frequency — it's what lets the program run indefinitely without the joints or CNS quietly breaking down underneath it.
        </TempoCard>
      </div>
    </section>
  );
}
