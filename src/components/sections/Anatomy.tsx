import { anatomy, type AnatomyTab, type Cell, type Comparison, type MuscleCard } from '@/content/anatomy';
import type { ReactNode } from 'react';
import type { Group } from '@/content/types';
import { BODY_FIGURES, HeadsDiagram } from './AnatomyFigures';
import { GroupTabs } from './GroupTabs';
import { Accent, SectionIntro } from './SectionIntro';

/** "The Engagement Map": where each day's sets land, muscle by muscle. */
export function Anatomy() {
  const panels = Object.fromEntries(
    (Object.keys(anatomy) as Group[]).map((g) => [g, <AnatomyPanel key={g} group={g} tab={anatomy[g]} />]),
  ) as Record<Group, ReactNode>;
  return (
    <section className="section anatomy-section" id="anatomy">
      <SectionIntro eyebrow="Muscle Infographic" title={<>The <Accent>Engagement</Accent> Map</>}>
        Where every set across all 6 sessions actually lands, down to the muscle and the approximate share of the work — and why the exercise selection is built around it. Switch tabs to explore each day's muscles.
      </SectionIntro>
      <GroupTabs id="anatomyTabs" labels={{ push: 'Push', pull: 'Pull', legs: 'Legs' }} panelClass="anatomy-panel" panels={panels} />
    </section>
  );
}

function AnatomyPanel({ group, tab }: { group: Group; tab: AnatomyTab }) {
  return (
    <>
      <div className="silhouette-panel reveal">
        <div>{BODY_FIGURES[group]}</div>
        <div className="silhouette-legend">
          {tab.legend.map((row) => (
            <div key={row.title} className="legend-row">
              <div className="legend-dot" style={{ background: row.color }} />
              <div>
                <h5>
                  {row.title}
                  {row.tag ? <span className="pct-tag">{row.tag}</span> : null}
                </h5>
                <p>{row.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={tab.revealGrid === false ? 'muscle-grid' : 'muscle-grid reveal'}>
        {tab.cards.map((card) => (
          <MuscleCardView key={card.tone} card={card} />
        ))}
      </div>
      {tab.comparisons.map((cmp, i) => (
        <ComparisonView key={cmp.title} comparison={cmp} first={i === 0} />
      ))}
    </>
  );
}

function MuscleCardView({ card }: { card: MuscleCard }) {
  return (
    <div className={`muscle-card ${card.tone}`}>
      <div className="muscle-card-header">
        <div className={`muscle-icon ${card.tone}`}>{card.icon}</div>
        <div>
          <h3>{card.name}</h3>
          <p className="latin">{card.latin}</p>
        </div>
      </div>
      {card.stats.map(([label, value]) => (
        <div key={label} className="muscle-stat-row">
          <span className="muscle-stat-label">{label}</span>
          <span className="muscle-stat-value">{value}</span>
        </div>
      ))}
      {card.heads ? (
        <div className="tri-head-panel">
          <HeadsDiagram />
          <div>
            {card.heads.rows.map((row) => (
              <div key={row.name} className="tri-legend-row">
                <strong style={{ color: card.heads!.color }}>{row.name}</strong> {row.text}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const HEADING_STYLE = { marginBottom: '20px', fontSize: '18px', fontWeight: 700, color: 'var(--ink)' };

function ComparisonView({ comparison: cmp, first }: { comparison: Comparison; first: boolean }) {
  return (
    <>
      <h3 style={{ marginTop: first ? '52px' : '48px', ...HEADING_STYLE }} className="reveal">
        {cmp.title}
      </h3>
      {cmp.intro ? (
        <p className="section-subtitle reveal" style={{ marginBottom: '16px' }}>
          {cmp.intro}
        </p>
      ) : null}
      <div className="reveal" style={{ overflowX: 'auto' }}>
        <table className="comparison-table">
          <thead>
            <tr>
              {cmp.columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cmp.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c}>
                    <CellView cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="source-note reveal" style={{ marginTop: '12px' }}>
        {cmp.source}
      </p>
    </>
  );
}

function CellView({ cell }: { cell: Cell }) {
  if (typeof cell === 'string') return cell;
  return (
    <>
      {cell.text} <span style={{ color: 'var(--ink-muted)' }}>{cell.note}</span>
    </>
  );
}
