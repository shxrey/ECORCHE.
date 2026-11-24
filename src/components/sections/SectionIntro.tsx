import type { ReactNode } from 'react';

/**
 * How every reading section opens: a small eyebrow label, the big title (with
 * an accent-coloured part), and a lead paragraph.
 */
export function SectionIntro({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children: ReactNode }) {
  return (
    <>
      <div className="section-eyebrow reveal">{eyebrow}</div>
      <h2 className="section-title reveal">{title}</h2>
      <p className="section-subtitle reveal">{children}</p>
    </>
  );
}

/** The accent-coloured words in a section title. */
export function Accent({ children }: { children: ReactNode }) {
  return <span className="accent">{children}</span>;
}
