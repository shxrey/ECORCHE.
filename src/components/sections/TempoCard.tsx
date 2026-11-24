import type { ReactNode } from 'react';

/** One of the big-number cards in Protocol and Standards ("3s", "⏱" …). */
export function TempoCard({ mark, title, cite, children }: { mark: string; title: string; cite?: string; children: ReactNode }) {
  return (
    <div className="tempo-card">
      <div className="tempo-number">{mark}</div>
      <h3>{title}</h3>
      <p>{children}</p>
      {cite ? <span className="cite">{cite}</span> : null}
    </div>
  );
}
