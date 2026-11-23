import type { Metadata } from 'next';
import { DocumentLink } from '@/components/legacy/DocumentLink';
import '@/styles/auth.css';

export const metadata: Metadata = {
  title: 'Page not found — ÉCORCHÉ',
};

/** Shown for any URL that doesn't exist, in the same style as the account pages. */
export default function NotFound() {
  return (
    <main className="auth-page">
      <div className="auth-top">
        <DocumentLink href="/" className="nav-logo">
          ÉCORCHÉ<span>.</span>
        </DocumentLink>
      </div>
      <div className="auth-card">
        <div className="section-eyebrow">Error 404</div>
        <h1 className="section-title">
          Wrong <span className="accent">Turn</span>
        </h1>
        <p className="section-subtitle">
          This page doesn&apos;t exist. The link may be old or mistyped. Your workouts are fine.
        </p>
        <DocumentLink href="/" className="auth-btn auth-btn-link">
          Back to the protocol
        </DocumentLink>
      </div>
    </main>
  );
}
