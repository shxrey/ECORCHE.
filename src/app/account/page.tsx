import type { Metadata } from 'next';
import { DocumentLink } from '@/components/legacy/DocumentLink';
import '@/styles/auth.css';
import { AccountPanel } from './AccountPanel';

export const metadata: Metadata = {
  title: 'Account — ÉCORCHÉ',
  robots: { index: false }, // private page: keep it out of search results
};

export default function AccountPage() {
  return (
    <main className="auth-page">
      <div className="auth-top">
        <DocumentLink href="/" className="nav-logo">
          ÉCORCHÉ<span>.</span>
        </DocumentLink>
        <DocumentLink href="/" className="auth-back">
          ← Back to protocol
        </DocumentLink>
      </div>
      <AccountPanel />
    </main>
  );
}
