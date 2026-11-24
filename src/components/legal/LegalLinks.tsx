import { DocumentLink } from '@/components/legacy/DocumentLink';
import { FEEDBACK_HREF } from '@/lib/feedback';
import { SUPPORT_EMAIL } from '@/lib/site';

/** Small "Privacy · Terms · Contact · Feedback" row under the sign-in and account cards. */
export function LegalLinks() {
  return (
    <nav className="auth-legal" aria-label="Legal">
      <DocumentLink href="/privacy">Privacy</DocumentLink>
      <DocumentLink href="/terms">Terms</DocumentLink>
      <a href={`mailto:${SUPPORT_EMAIL}`}>Contact</a>
      {/* Details are filled in on click by FeedbackLinks. */}
      <a href={FEEDBACK_HREF} data-feedback>Feedback</a>
    </nav>
  );
}
