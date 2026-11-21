import type { BlockItem, DetailBlock, Exercise } from '@/content/types';

/**
 * One exercise card, rendered from program data with markup identical to the
 * original single-file app (verified by `npm run verify:legacy`).
 *
 * The data-legacy-on* attributes carry the original inline handlers. React
 * cannot emit inline handler strings, so public/legacy/protocol.js turns them
 * back into real onclick/onkeydown attributes before the legacy logic runs.
 * They disappear once each interaction is ported to React.
 */
export function ExerciseCard({ exercise: ex }: { exercise: Exercise }) {
  const pillClass = ex.pillVariant ? `meta-pill ${ex.pillVariant}` : 'meta-pill';
  return (
    <div className="exercise-card reveal" data-exercise={ex.key}>
      <div
        className="exercise-header"
        data-legacy-onclick="toggleCard(this, event)"
        role="button"
        tabIndex={0}
        aria-expanded="false"
        data-legacy-onkeydown="handleHeaderKey(event, this)"
      >
        <div className="exercise-number">{ex.number}</div>
        <div className="exercise-info">
          <h3>
            {ex.name}
            {ex.nameSuffix ? ' ' : null}
            {ex.nameSuffix ? (
              <span
                style={{
                  color: ex.nameSuffix.tone === 'danger' ? 'var(--danger-bright)' : 'var(--ink-muted)',
                  fontWeight: 600,
                }}
              >
                {ex.nameSuffix.text}
              </span>
            ) : null}
          </h3>
          <div className="muscle-tags">
            {ex.tags.map(tag => (
              <span key={tag.label} className={`muscle-tag tag-${tag.tone}`}>
                {tag.label}
              </span>
            ))}
          </div>
        </div>
        <div className="exercise-meta">
          <MetaPill className={pillClass} label="Sets" value={ex.sets} />
          <MetaPill className={pillClass} label="Reps" value={ex.reps} />
          <MetaPill className={pillClass} label="RIR" value={ex.rir} />
        </div>
        <div className="set-tracker" data-legacy-onclick="event.stopPropagation()">
          {ex.setDots.map(dot => (
            <button
              key={dot.idx}
              type="button"
              className="set-dot"
              data-legacy-onclick="toggleSet(this)"
              data-set-idx={dot.idx}
            >
              {dot.label}
            </button>
          ))}
        </div>
        <div className="expand-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
      <div className="exercise-body">
        <div className="exercise-body-inner">
          <div className="body-grid">
            {ex.blocks.map((block, i) => (
              <DetailBlockView key={i} block={block} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaPill({ className, label, value }: { className: string; label: string; value: string }) {
  return (
    <div className={className}>
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  );
}

function DetailBlockView({ block }: { block: DetailBlock }) {
  return (
    <div className="detail-block">
      {block.heading !== null ? <h4>{block.heading}</h4> : null}
      {block.items.map((item, i) => (
        <BlockItemView key={i} item={item} />
      ))}
    </div>
  );
}

function BlockItemView({ item }: { item: BlockItem }) {
  switch (item.kind) {
    case 'subLabel':
      return <span className="sub-label" dangerouslySetInnerHTML={{ __html: item.html }} />;
    case 'text':
      return <p className="detail-text" dangerouslySetInnerHTML={{ __html: item.html }} />;
    case 'sourceNote':
      return <p className="source-note" dangerouslySetInnerHTML={{ __html: item.html }} />;
    case 'cite':
      return (
        <span className="cite" style={{ display: 'block', marginTop: 8 }} dangerouslySetInnerHTML={{ __html: item.html }} />
      );
    case 'divider':
      return (
        <div className="superset-divider">
          <span dangerouslySetInnerHTML={{ __html: item.html }} />
        </div>
      );
    case 'intensity':
      return <div className={`intensity-badge intensity-${item.level}`} dangerouslySetInnerHTML={{ __html: item.html }} />;
    case 'activation':
      return (
        <div className="activation-chart">
          {item.rows.map(row => (
            <div key={row.label} className="activation-row">
              <span className="activation-label">{row.label}</span>
              <div className="activation-bar-wrap">
                <div
                  className={`activation-bar bar-${row.tone}`}
                  style={{ transform: `scaleX(${row.scale})`, ...(row.filter ? { filter: row.filter } : {}) }}
                  role="img"
                  aria-label={`${row.label} activation: ${row.pct} percent of MVIC`}
                >
                  <span className="pct">{row.pct}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
  }
}
