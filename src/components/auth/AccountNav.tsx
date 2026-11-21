'use client';

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useUser } from '@/lib/supabase/useUser';

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

  if (!hydrated || auth.status === 'disabled' || auth.status === 'loading') return null;
  const targets = {
    desktop: document.querySelector('.top-nav .nav-links'),
    drawer: document.getElementById('mobileDrawer'),
  };

  const pill = (extraClass: string) =>
    auth.status === 'signed-in' ? (
      <Link href="/account" className={`nav-account ${extraClass}`} title={auth.user.email ?? 'Account'}>
        <span className="dot" aria-hidden="true" />
        <span className="name">{(auth.user.email ?? 'Account').split('@')[0]}</span>
      </Link>
    ) : (
      <Link href="/login" className={`nav-account cta ${extraClass}`}>
        Sign in
      </Link>
    );

  return (
    <>
      {targets.desktop ? createPortal(pill(''), targets.desktop) : null}
      {targets.drawer ? createPortal(pill('nav-account-drawer'), targets.drawer) : null}
    </>
  );
}
