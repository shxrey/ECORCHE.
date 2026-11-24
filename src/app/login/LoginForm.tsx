'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type ClipboardEvent, type FormEvent } from 'react';
import { DocumentLink } from '@/components/legacy/DocumentLink';
import { friendlyAuthError } from '@/lib/supabase/auth-errors';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type Step = 'email' | 'code';
const noopSubscribe = () => () => {};
// Supabase's email OTP length is set per project (6–10 digits; this one sends 8).
const MIN_CODE = 6;
const MAX_CODE = 10;

/**
 * Passwordless sign-in: enter your email, receive a one-time code, type it in.
 * A code (instead of only a magic link) matters on phones, where tapping a
 * link in the mail app often opens a different browser than the one you
 * started in. The email carries a link too, handled by /auth/confirm.
 * A code that arrives whole (pasted, or the keyboard's suggestion) signs in at once.
 * New emails get an account automatically: sign-up and sign-in are one flow.
 */
export function LoginForm() {
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
  // Set by the account page after "Delete account" succeeds.
  const accountDeleted = useSyncExternalStore(
    noopSubscribe,
    () => new URLSearchParams(window.location.search).get('deleted') === '1',
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
      setError(friendlyAuthError(error));
      return;
    }
    setStep('code');
    setCode('');
    setCooldown(60);
    setTimeout(() => codeRef.current?.focus(), 50);
  }

  async function verify(token: string) {
    if (!supabase || busy) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: 'email' });
    if (error) {
      setBusy(false);
      setError(friendlyAuthError(error));
      return;
    }
    // Full load, not router.replace: the protocol page's legacy script must boot fresh.
    window.location.replace('/');
  }

  function verifyCode(e: FormEvent) {
    e.preventDefault();
    void verify(code);
  }

  // A whole code arriving at once (pasted from the email, or the keyboard's
  // one-time-code suggestion) signs in straight away; typing digit by digit
  // still waits for the Sign in button.
  function onCodeChange(value: string) {
    const next = value.replace(/\D/g, '');
    const arrivedWhole = next.length >= MIN_CODE && next.length - code.length >= MIN_CODE - 1;
    setCode(next);
    if (arrivedWhole) void verify(next);
  }

  // Pasting "Your code is 12345678" or "1234 5678" would otherwise be cut off by
  // maxLength before the digits are pulled out, so read the clipboard text whole.
  function onCodePaste(e: ClipboardEvent<HTMLInputElement>) {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '');
    if (digits.length < MIN_CODE || digits.length > MAX_CODE) return; // let the browser paste it as usual
    e.preventDefault();
    setCode(digits);
    void verify(digits);
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
          {accountDeleted && !shownError ? (
            <p className="auth-msg ok" role="status" style={{ marginBottom: 'var(--space-4)' }}>
              Your account and all its data have been deleted.
            </p>
          ) : null}
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
            New here? The same button creates your account. Your existing progress on this device stays put. By
            continuing, you agree to the <DocumentLink href="/terms">Terms</DocumentLink> and{' '}
            <DocumentLink href="/privacy">Privacy Policy</DocumentLink>.
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
              pattern={`[0-9]{${MIN_CODE},${MAX_CODE}}`}
              maxLength={MAX_CODE}
              placeholder="00000000"
              required
              value={code}
              onChange={e => onCodeChange(e.target.value)}
              onPaste={onCodePaste}
            />
            {shownError ? <p className="auth-msg error" role="alert">{shownError}</p> : null}
            <button className="auth-btn" type="submit" disabled={busy || code.length < MIN_CODE}>
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
