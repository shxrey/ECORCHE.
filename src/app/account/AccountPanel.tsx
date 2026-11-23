'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/supabase/useUser';
import { forgetDeviceProgress, uploadBeforeSignOut } from '@/lib/sync/device';

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
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  // Set when signing out would lose changes that couldn't be uploaded (e.g. offline).
  const [unsent, setUnsent] = useState(0);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

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
    setSaving(true);
    setMsg(null);
    const { error } = await supabase
      .from('profiles')
      .update({ username: u || null, display_name: displayName.trim() || null })
      .eq('id', userId);
    setBusy(false);
    setSaving(false);
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

  // Signing out also clears this device's copy of the lifter's progress, so the
  // next person on a shared phone or laptop can't see it. Upload first, so
  // nothing is lost; if that fails, ask before throwing changes away.
  async function signOut(force = false) {
    if (!supabase || !userId) return;
    setBusy(true);
    setSigningOut(true);
    setSignOutError(null);
    const stop = () => {
      setBusy(false);
      setSigningOut(false);
    };
    if (!force) {
      const left = await uploadBeforeSignOut(supabase, userId);
      if (left > 0) {
        setUnsent(left);
        stop();
        return;
      }
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      stop();
      setSignOutError("Couldn't sign out. Check your connection and try again.");
      return;
    }
    forgetDeviceProgress();
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
        <input id="displayName" className="auth-input" maxLength={40} autoComplete="nickname" placeholder="Alex"
          value={displayName} onChange={e => setDisplayName(e.target.value)} />
        <label className="auth-label" htmlFor="username" style={{ marginTop: 'var(--space-2)' }}>Username</label>
        <input id="username" className="auth-input" maxLength={20} autoCapitalize="none" autoCorrect="off" spellCheck={false}
          placeholder="alex_lifts" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} />
        {msg ? <p className={`auth-msg ${msg.kind}`} role="status">{msg.text}</p> : null}
        <button className="auth-btn" type="submit" disabled={busy}>{saving ? 'Saving…' : 'Save profile'}</button>
      </form>

      <p className="auth-note">
        <strong>Cloud sync is on.</strong> Your ticked sets, weights, reps, RIR, PRs, notes and settings save to your account
        and appear on every device you sign in on. It works offline too: changes upload once you&apos;re back online.
        Have an old backup file? Open the protocol while signed in and use <em>Import Backup</em>; it uploads automatically.
      </p>

      <div className="auth-divider" />
      {unsent > 0 ? (
        <div className="auth-msg error" role="alert">
          <p style={{ margin: '0 0 var(--space-2)' }}>
            {unsent === 1 ? '1 change' : `${unsent} changes`} on this device haven&apos;t reached your account yet (you may be
            offline). Signing out now deletes {unsent === 1 ? 'it' : 'them'}.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="auth-btn secondary" type="button" onClick={() => setUnsent(0)} disabled={busy} style={{ flex: 1 }}>
              Keep them
            </button>
            <button className="auth-btn secondary" type="button" onClick={() => signOut(true)} disabled={busy} style={{ flex: 1 }}>
              Sign out anyway
            </button>
          </div>
        </div>
      ) : (
        <button className="auth-btn secondary" type="button" onClick={() => signOut()} disabled={busy} style={{ width: '100%' }}>
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      )}
      {signOutError ? <p className="auth-msg error" role="alert" style={{ marginTop: 'var(--space-2)' }}>{signOutError}</p> : null}
      <p className="auth-note" style={{ marginTop: 'var(--space-2)' }}>
        Signing out removes your workouts from this device. They stay safe in your account.
      </p>

      <div className="auth-divider" />
      <DeleteAccount disabled={busy} onBusy={setBusy} />
    </div>
  );
}

/**
 * Permanently deletes the account and everything in it (see
 * supabase/migrations/0003_delete_account.sql), after the lifter types DELETE.
 */
function DeleteAccount({ disabled, onBusy }: { disabled: boolean; onBusy: (busy: boolean) => void }) {
  const supabase = getSupabaseBrowserClient();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmed = typed.trim().toUpperCase() === 'DELETE';

  async function deleteForever() {
    if (!supabase || !confirmed) return;
    setDeleting(true);
    onBusy(true);
    setError(null);
    const { error } = await supabase.rpc('delete_my_account');
    if (error) {
      setDeleting(false);
      onBusy(false);
      setError("Couldn't delete your account. Check your connection and try again.");
      return;
    }
    // The account is gone on the server; drop this browser's session and its copy of the data too.
    await supabase.auth.signOut({ scope: 'local' });
    forgetDeviceProgress();
    window.location.replace('/login?deleted=1');
  }

  return (
    <div className="auth-danger">
      <div className="auth-label">Delete account</div>
      <p className="auth-note" style={{ marginTop: 'var(--space-2)' }}>
        Permanently deletes your account and everything in it: your profile and every logged set, PR, note and setting.
        This can&apos;t be undone. Want to keep your history? Use <em>Export Backup</em> on the protocol page first.
      </p>
      {!open ? (
        <button className="auth-btn danger" type="button" onClick={() => setOpen(true)} disabled={disabled} style={{ width: '100%' }}>
          Delete account…
        </button>
      ) : (
        <div className="auth-form" style={{ marginTop: 'var(--space-3)' }}>
          <label className="auth-label" htmlFor="confirmDelete">Type DELETE to confirm</label>
          <input id="confirmDelete" className="auth-input" autoComplete="off" autoCapitalize="characters" spellCheck={false}
            placeholder="DELETE" value={typed} onChange={e => setTyped(e.target.value)} disabled={deleting} />
          {error ? <p className="auth-msg error" role="alert">{error}</p> : null}
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="auth-btn secondary" type="button" disabled={deleting} style={{ flex: 1 }}
              onClick={() => { setOpen(false); setTyped(''); setError(null); }}>
              Cancel
            </button>
            <button className="auth-btn danger" type="button" onClick={deleteForever} disabled={!confirmed || deleting} style={{ flex: 1 }}>
              {deleting ? 'Deleting…' : 'Delete forever'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
