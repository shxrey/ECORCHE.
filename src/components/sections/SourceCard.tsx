import type { CSSProperties } from 'react';
import type { Study } from '@/content/sources';

/** One study: its number in the list, citation, why it matters, and a link out. */
export function SourceCard({ study, index, style }: { study: Study; index: number; style?: CSSProperties }) {
  return (
    <div className="source-card reveal" style={style}>
      <div className="source-number">{String(index + 1).padStart(2, '0')}</div>
      <div className="source-content">
        <h4>{study.title}</h4>
        <p>{study.summary}</p>
        <a className="source-link" href={study.link.href} target="_blank" rel="noopener">
          {study.link.label} →
        </a>
      </div>
    </div>
  );
}
