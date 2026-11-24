import type { ReactNode } from 'react';
import { DocumentLink } from '@/components/legacy/DocumentLink';
import '@/styles/auth.css'; // shared top bar (.auth-top, .auth-back)
import '@/styles/legal.css';
import { FEEDBACK_HREF } from '@/lib/feedback';
import { SUPPORT_EMAIL } from '@/lib/site';

export { SUPPORT_EMAIL };
export const LEGAL_UPDATED = '24 November 2026';

/** Shared layout for the Privacy Policy and Terms: logo bar, readable column, links between the two. */
export function LegalPage({ eyebrow, title, summary, children }: { eyebrow: string; title: ReactNode; summary: ReactNode; children: ReactNode }) {
  return (
    <main className="legal-page">
      <div className="auth-top legal-top">
        <DocumentLink href="/" className="nav-logo">
          ÉCORCHÉ<span>.</span>
        </DocumentLink>
        <DocumentLink href="/" className="auth-back">
          ← Back to protocol
        </DocumentLink>
      </div>
      <article className="legal-doc">
        <div className="section-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p className="legal-updated">Last updated {LEGAL_UPDATED}</p>
        <div className="legal-summary">{summary}</div>
        {children}
        <h2>Contact</h2>
        <p>
          Questions, requests or complaints: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We reply as soon as we can,
          and always within 30 days.
        </p>
      </article>
      <nav className="legal-foot" aria-label="Legal">
        <DocumentLink href="/privacy">Privacy Policy</DocumentLink>
        <DocumentLink href="/terms">Terms of Service</DocumentLink>
        <a href={`mailto:${SUPPORT_EMAIL}`}>Contact</a>
        <a href={FEEDBACK_HREF} data-feedback>Feedback</a>
      </nav>
    </main>
  );
}
