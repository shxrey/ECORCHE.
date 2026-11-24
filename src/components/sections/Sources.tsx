import { coreStudies, groupStudies } from '@/content/sources';
import { GroupTabs } from './GroupTabs';
import { Accent, SectionIntro } from './SectionIntro';
import { SourceCard } from './SourceCard';
import { StudyList } from './StudyList';

/** The research behind the program: four core studies, then per-group tabs. */
export function Sources() {
  return (
    <section className="section sources-section" id="sources">
      <SectionIntro eyebrow="References" title={<>Research <Accent>Sources</Accent></>}>
        Peer-reviewed studies and practitioner breakdowns that inform the exercise selection, tempo, and intensity prescriptions across all 6 sessions — the same literature Jeff Nippard and Dr. Mike Israetel draw on for their own evidence-based programming.
      </SectionIntro>
      <p className="sources-core-note reveal">
        <strong>Core science, applied to every day:</strong> these four sources underpin the universal tempo, RIR, and volume rules used across Push, Pull and Legs alike.
      </p>
      {coreStudies.map((study, i) => (
        <SourceCard key={study.title} study={study} index={i} />
      ))}
      <GroupTabs
        id="sourcesTabs"
        style={{ marginTop: '12px' }}
        labels={{ push: 'Push-Specific', pull: 'Pull-Specific', legs: 'Legs-Specific' }}
        panelClass="sources-group-panel"
        panels={{
          push: <StudyList studies={groupStudies.push} />,
          pull: <StudyList studies={groupStudies.pull} />,
          legs: <StudyList studies={groupStudies.legs} />,
        }}
      />
    </section>
  );
}
