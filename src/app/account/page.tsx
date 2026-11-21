import type { Metadata } from 'next';
import Link from 'next/link';
import '@/styles/auth.css';
import { AccountPanel } from './AccountPanel';

export const metadata: Metadata = {
  title: 'Account — Blueprint',
};

export default function AccountPage() {
  return (
    <main className="auth-page">
      <div className="auth-top">
        <Link href="/" className="nav-logo">
          SHREY&apos;S <span>BLUEPRINT</span>
        </Link>
        <Link href="/" className="auth-back">
          ← Back to protocol
        </Link>
      </div>
      <AccountPanel />
    </main>
  );
}
