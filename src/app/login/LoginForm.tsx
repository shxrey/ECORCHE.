'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type Step = 'email' | 'code';
const noopSubscribe = () => () => {};

/**
 * Passwordless sign-in: enter your email, receive a one-time code, type it in.
 * A code (instead of only a magic link) matters on phones, where tapping a
 * link in the mail app often opens a different browser than the one you
 * started in. The email carries a link too, handled by /auth/confirm.
 * New emails get an account automatically: sign-up and sign-in are one flow.
 */
export function LoginForm() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  // Set by /auth/confirm when an emailed link fails. Read without an effect so
  // the static page hydrates cleanly and the message shows on first paint.
  const linkFailed = useSyncExternalStore(
    noopSubscribe,
    () => new URLSearchParams(window.location.search).get('error') === 'link',
    () => false,
  );
  const shownError =
    error ?? (linkFailed && step === 'email' ? 'That sign-in link expired or was already used. Request a new code below.' : null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!supabase) {
    return (
      <div className="auth-card">
        <div className="section-eyebrow">Accounts</div>
        <h1 className="section-title">
          Coming <span className="accent">Soon</span>
        </h1>
        <p className="section-subtitle">Accounts aren&apos;t switched on yet. Your progress is saved on this device in the meantime.</p>
      </div>
    );
  }

  async function sendCode(e?: FormEvent) {
    e?.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    setBusy(false);
    if (error) {
      setError(friendlyError(error.message));
      return;
    }
    setStep('code');
    setCode('');
    setCooldown(60);
    setTimeout(() => codeRef.current?.focus(), 50);
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
    if (error) {
      setBusy(false);
      setError(friendlyError(error.message));
      return;
    }
    router.replace('/');
    router.refresh();
  }

  return (
    <div className="auth-card">
      <div className="section-eyebrow">{step === 'email' ? 'Account' : 'Check your inbox'}</div>
      {step === 'email' ? (
        <>
          <h1 className="section-title">
            Sign <span className="accent">In</span>
          </h1>
          <p className="section-subtitle">
            Sync every set, PR and note between your phone at the gym and your laptop. No password: we email you a code.
          </p>
          <form className="auth-form" onSubmit={sendCode}>
            <label className="auth-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="auth-input"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@thapar.edu"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            {shownError ? <p className="auth-msg error" role="alert">{shownError}</p> : null}
            <button className="auth-btn" type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Send code'}
            </button>
          </form>
          <p className="auth-note">
            New here? The same button creates your account. Your existing progress on this device stays put.
          </p>
        </>
      ) : (
        <>
          <h1 className="section-title">
            Enter <span className="accent">Code</span>
          </h1>
          <p className="section-subtitle">
            We sent a code to <strong style={{ color: 'var(--ink)' }}>{email}</strong>. You can also tap the link in that email.
          </p>
          <form className="auth-form" onSubmit={verifyCode}>
            <label className="auth-label" htmlFor="code">
              One-time code
            </label>
            <input
              id="code"
              ref={codeRef}
              className="auth-input code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,10}"
              maxLength={10}
              placeholder="000000"
              required
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            />
            {shownError ? <p className="auth-msg error" role="alert">{shownError}</p> : null}
            <button className="auth-btn" type="submit" disabled={busy || code.length < 6}>
              {busy ? 'Checking…' : 'Sign in'}
            </button>
          </form>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-3)' }}>
            <button className="auth-link-btn" type="button" onClick={() => { setStep('email'); setError(null); }}>
              ← Different email
            </button>
            <button className="auth-link-btn" type="button" disabled={cooldown > 0 || busy} onClick={() => sendCode()}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('rate limit') || m.includes('security purposes')) return 'Too many attempts. Wait a minute, then try again.';
  if (m.includes('expired') || m.includes('invalid')) return "That code didn't work. Check it, or request a new one.";
  if (m.includes('email')) return 'Enter a valid email address.';
  return message;
}
