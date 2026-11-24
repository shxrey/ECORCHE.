import { Accent, SectionIntro } from './SectionIntro';
import { TempoCard } from './TempoCard';

/** The 3-1-X tempo every working set follows. */
export function Protocol() {
  return (
    <section className="section" id="protocol">
      <SectionIntro eyebrow="Execution Standard" title={<>The <Accent>S-Tier</Accent> Execution Protocol</>}>
        Apply this 3-1-X tempo to every working set across all 6 sessions. It isn't decoration — each phase targets a distinct, evidence-backed driver of hypertrophy, whatever muscle is on the bar that day.
      </SectionIntro>
      <div className="tempo-grid reveal">
        <TempoCard mark="3s" title="Controlled Negative" cite="Schoenfeld (2010), J Strength Cond Res 24(10)">
          Yield to the load on the way back to the stretch — never let the weight free-fall. A slow, resisted eccentric keeps the target muscle under mechanical tension longer per rep, the mechanism Schoenfeld's review identifies as a primary driver of hypertrophic signaling.
        </TempoCard>
        <TempoCard
          mark="1s"
          title="Deep Stretch Hold"
          cite="Sport Sciences for Health (2025); Maeo et al. (2021, 2022); Pedrosa et al. (2022); Kassiano et al. (2023)"
        >
          Dead-stop at the point of maximum muscle lengthening before reversing — full stretch on a press, full flexion on a curl, full hip hinge on an RDL. A growing body of muscle-length research finds training performed at longer lengths produces significantly greater hypertrophy than the same exercise stopped short — the basis for pairing every movement in this program with a genuine end-range pause.
        </TempoCard>
        <TempoCard mark="X" title="Explosive Concentric" cite="Intent-based loading principle">
          Drive back with maximum intentional velocity while keeping strict form. Intent, not just load, recruits the highest-threshold motor units — the difference between a rep that merely moves weight and one that actually signals growth.
        </TempoCard>
      </div>
    </section>
  );
}
