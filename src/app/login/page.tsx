import type { Metadata } from 'next';
import { DocumentLink } from '@/components/legacy/DocumentLink';
import '@/styles/auth.css';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Sign in — ÉCORCHÉ',
  description: 'Sign in to sync your workouts, PRs and notes across devices.',
  alternates: { canonical: '/login' },
};

export default function LoginPage() {
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
      <LoginForm />
    </main>
  );
}
