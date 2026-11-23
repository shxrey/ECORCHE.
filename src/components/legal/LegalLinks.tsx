import { DocumentLink } from '@/components/legacy/DocumentLink';

/** Small "Privacy · Terms · Contact" row under the sign-in and account cards. */
export function LegalLinks() {
  return (
    <nav className="auth-legal" aria-label="Legal">
      <DocumentLink href="/privacy">Privacy</DocumentLink>
      <DocumentLink href="/terms">Terms</DocumentLink>
      <a href="mailto:support@ecorche.app">Contact</a>
    </nav>
  );
}
