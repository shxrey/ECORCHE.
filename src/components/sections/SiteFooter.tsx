import { DocumentLink } from '@/components/DocumentLink';
import { FEEDBACK_HREF } from '@/lib/feedback';
import { SUPPORT_EMAIL } from '@/lib/site';

/** The page footer: brand, disclaimer, legal links and the signature. */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="logo-text">
        ÉCORCHÉ<span>.</span>
      </div>
      <p>Built for hypertrophy. Backed by research. No excuses. Push, Pull, Legs — one complete week.</p>
      <p style={{ marginTop: '8px', fontSize: '12px' }}>Not medical advice. Consult a physician before beginning any exercise program.</p>
      {/* Styled in src/styles/overrides.css. */}
      <p className="footer-links">
        <DocumentLink href="/privacy">Privacy</DocumentLink>
        <DocumentLink href="/terms">Terms</DocumentLink>
        <a href={`mailto:${SUPPORT_EMAIL}`}>Contact</a>
        {/* Details are filled in on click by FeedbackLinks. */}
        <a href={FEEDBACK_HREF} data-feedback="">
          Feedback
        </a>
      </p>
      <p style={{ marginTop: '18px', fontSize: '11px', letterSpacing: '0.08em', color: 'var(--ink-dim)', fontFamily: 'var(--font-mono)' }}>
        ~ shrey
      </p>
    </footer>
  );
}
