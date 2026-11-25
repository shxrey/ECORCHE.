import type { BlockItem, DetailBlock } from '@/content/types';

/**
 * Pieces of an exercise card drawn straight from the program data
 * (src/content/program.ts): the sets / reps / RIR pills and the "details"
 * blocks (notes, sources, activation bars). Same markup as the original
 * single-file app, checked by `npm run verify:legacy`.
 */
export function MetaPill({ className, label, value }: { className: string; label: string; value: string }) {
  return (
    <div className={className}>
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  );
}

export function DetailBlockView({ block }: { block: DetailBlock }) {
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
