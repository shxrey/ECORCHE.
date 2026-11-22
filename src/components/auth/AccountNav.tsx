'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { DocumentLink } from '@/components/legacy/DocumentLink';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
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
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !userId) return;
    let cancelled = false;
    supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (!cancelled) setProfileName({ userId, username: data?.username ?? null });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!hydrated || auth.status === 'disabled' || auth.status === 'loading') return null;
  const targets = {
    desktop: document.querySelector('.top-nav .nav-links'),
    drawer: document.getElementById('mobileDrawer'),
  };

  const pill = (extraClass: string) =>
    auth.status === 'signed-in' ? (
      <DocumentLink
        href="/account"
        className={`nav-account ${extraClass}`}
        data-sync={sync.status}
        title={`${auth.user.email ?? 'Account'} · ${syncLabel(sync)}`}
      >
        <span className="dot" aria-hidden="true" />
        <span className="name">
          {(profileName?.userId === auth.user.id && profileName.username) || (auth.user.email ?? 'Account').split('@')[0]}
        </span>
      </DocumentLink>
    ) : (
      <DocumentLink href="/login" className={`nav-account cta ${extraClass}`}>
        Sign in
      </DocumentLink>
    );

  return (
    <>
      {targets.desktop ? createPortal(pill(''), targets.desktop) : null}
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
