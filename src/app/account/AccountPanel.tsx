'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/supabase/useUser';

interface Profile {
  username: string | null;
  display_name: string | null;
  created_at: string;
}

/** Profile (username + display name) and sign-out. Reads and writes go through RLS. */
export function AccountPanel() {
  const router = useRouter();
  const auth = useUser();
  const supabase = getSupabaseBrowserClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const userId = auth.status === 'signed-in' ? auth.user.id : null;

  useEffect(() => {
    if (auth.status === 'signed-out') router.replace('/login');
  }, [auth.status, router]);

  useEffect(() => {
    if (!supabase || !userId) return;
    supabase
      .from('profiles')
      .select('username, display_name, created_at')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setMsg({ kind: 'error', text: "Couldn't load your profile. Refresh to try again." });
          return;
        }
        setProfile(data);
        setUsername(data.username ?? '');
        setDisplayName(data.display_name ?? '');
      });
  }, [supabase, userId]);

  if (auth.status !== 'signed-in' || !supabase) {
    return <div className="auth-card"><p className="section-subtitle" style={{ margin: 0 }}>Loading…</p></div>;
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !userId) return;
    const u = username.trim().toLowerCase();
    if (u && !/^[a-z0-9_]{3,20}$/.test(u)) {
      setMsg({ kind: 'error', text: 'Usernames are 3–20 characters: lowercase letters, numbers and _ only.' });
      return;
    }
    setBusy(true);
    setMsg(null);
    const { error } = await supabase
      .from('profiles')
      .update({ username: u || null, display_name: displayName.trim() || null })
      .eq('id', userId);
    setBusy(false);
    if (error) {
      setMsg({
        kind: 'error',
        text: error.code === '23505' ? 'That username is taken. Try another.' : "Couldn't save. Check your connection and try again.",
      });
      return;
    }
    setUsername(u);
    setMsg({ kind: 'ok', text: 'Saved.' });
  }

  async function signOut() {
    if (!supabase) return;
    setBusy(true);
    await supabase.auth.signOut();
    // Full load, not router.replace: the protocol page's legacy script must boot fresh.
    window.location.replace('/');
  }

  const since = profile ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '…';

  return (
    <div className="auth-card">
      <div className="section-eyebrow">Account</div>
      <h1 className="section-title">
        Your <span className="accent">Profile</span>
      </h1>

      <div className="auth-row"><span className="k">Email</span><span className="v">{auth.user.email}</span></div>
      <div className="auth-row"><span className="k">Lifting since</span><span className="v">{since}</span></div>

      <div className="auth-divider" />

      <form className="auth-form" onSubmit={save}>
        <label className="auth-label" htmlFor="displayName">Display name</label>
        <input id="displayName" className="auth-input" maxLength={40} autoComplete="nickname" placeholder="Shrey"
          value={displayName} onChange={e => setDisplayName(e.target.value)} />
        <label className="auth-label" htmlFor="username" style={{ marginTop: 'var(--space-2)' }}>Username</label>
        <input id="username" className="auth-input" maxLength={20} autoCapitalize="none" autoCorrect="off" spellCheck={false}
          placeholder="shrey_lifts" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} />
        {msg ? <p className={`auth-msg ${msg.kind}`} role="status">{msg.text}</p> : null}
        <button className="auth-btn" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
      </form>

      <p className="auth-note">
        <strong>Cloud sync is on.</strong> Your ticked sets, weights, reps, RIR, PRs, notes and settings save to your account
        and appear on every device you sign in on. It works offline too: changes upload once you&apos;re back online.
        Have an old backup file? Open the protocol while signed in and use <em>Import Backup</em>; it uploads automatically.
      </p>

      <div className="auth-divider" />
      <button className="auth-btn secondary" type="button" onClick={signOut} disabled={busy} style={{ width: '100%' }}>
        Sign out
      </button>
    </div>
  );
}
