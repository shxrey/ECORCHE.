import type { Metadata } from 'next';
import Link from 'next/link';
import '@/styles/auth.css';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Sign in — Blueprint',
  description: 'Sign in to sync your workouts, PRs and notes across devices.',
};

export default function LoginPage() {
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
      <LoginForm />
    </main>
  );
}
