'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { DocumentLink } from '@/components/DocumentLink';
import { loadSupabase } from '@/lib/supabase/load';
import { useUser } from '@/lib/supabase/useUser';
import { useSyncState, type SyncState } from '@/lib/sync/status';

const noopSubscribe = () => () => {};
/** false during server render and hydration, true afterwards. */
const useHydrated = () => useSyncExternalStore(noopSubscribe, () => true, () => false);

/**
 * Puts the account pill into the existing nav without changing its layout:
 * at the end of the desktop nav links, and at the bottom of the mobile menu.
 * Both targets live in legacy HTML fragments, so this mounts into them with
 * portals after hydration. Renders nothing when Supabase isn't configured.
 */
export function AccountNav() {
  const auth = useUser();
  const hydrated = useHydrated();
  const sync = useSyncState();
  const userId = auth.status === 'signed-in' ? auth.user.id : null;
  // Keyed by user so a sign-out/sign-in as someone else never shows a stale name.
  const [profileName, setProfileName] = useState<{ userId: string; username: string | null } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    // Signed in, so the client library is already loaded (or loading).
    loadSupabase()
      .then(supabase => supabase?.from('profiles').select('username').eq('id', userId).single())
      .then(result => {
        if (!cancelled && result) setProfileName({ userId, username: result.data?.username ?? null });
      })
      .catch(() => {
        /* no username: the pill falls back to the email name */
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!hydrated || auth.status === 'disabled' || auth.status === 'loading') return null;
  const targets = {
    desktop: document.querySelector('.top-nav .nav-links'),
    // Phones: the nav links are hidden behind the menu button, so a compact
    // account button sits in the bar itself to keep the sync dot in view.
    bar: document.querySelector('.top-nav'),
    drawer: document.getElementById('mobileDrawer'),
  };

  const name = auth.status === 'signed-in'
    ? (profileName?.userId === auth.user.id && profileName.username) || (auth.user.email ?? 'Account').split('@')[0]
    : '';
  const label = auth.status === 'signed-in' ? `${auth.user.email ?? 'Account'} · ${syncLabel(sync)}` : '';

  const pill = (extraClass: string) =>
    auth.status === 'signed-in' ? (
      <DocumentLink href="/account" className={`nav-account ${extraClass}`} data-sync={sync.status} title={label}>
        <span className="dot" aria-hidden="true" />
        <span className="name">{name}</span>
      </DocumentLink>
    ) : (
      <DocumentLink href="/login" className={`nav-account cta ${extraClass}`}>
        Sign in
      </DocumentLink>
    );

  const barButton =
    auth.status === 'signed-in' ? (
      <DocumentLink
        href="/account"
        className="nav-account-mobile"
        data-sync={sync.status}
        title={label}
        aria-label={`Account: ${name}. ${syncLabel(sync)}`}
      >
        <span className="initial" aria-hidden="true">{name.charAt(0).toUpperCase() || '?'}</span>
        <span className="dot" aria-hidden="true" />
      </DocumentLink>
    ) : (
      <DocumentLink href="/login" className="nav-account-mobile signed-out" aria-label="Sign in">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      </DocumentLink>
    );

  return (
    <>
      {targets.desktop ? createPortal(pill(''), targets.desktop) : null}
      {targets.bar ? createPortal(barButton, targets.bar) : null}
      {targets.drawer ? createPortal(pill('nav-account-drawer'), targets.drawer) : null}
    </>
  );
}

function syncLabel({ status, pending }: SyncState): string {
  const waiting = pending ? ` (${pending} change${pending === 1 ? '' : 's'} waiting)` : '';
  switch (status) {
    case 'synced': return 'All changes saved to your account';
    case 'syncing': return 'Syncing…';
    case 'offline': return `Offline: saved on this device, will sync when you're back online${waiting}`;
    case 'error': return `Sync paused: saved on this device, retrying soon${waiting}`;
    default: return 'Account';
  }
}
