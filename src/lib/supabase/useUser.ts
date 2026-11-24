'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured } from './config';
import { loadSupabase, mightBeSignedIn } from './load';

export type AuthState =
  | { status: 'disabled' } // Supabase not configured
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: User };

// Someone with a session cookie: start fetching the client library right
// away, alongside the rest of the page, rather than after it has rendered.
if (mightBeSignedIn()) void loadSupabase();

function initialState(): AuthState {
  if (!isSupabaseConfigured) return { status: 'disabled' };
  // In the browser, no session cookie settles it: signed out, nothing to load.
  // (The server can't know, so its render starts as "loading". Every caller
  // renders the same thing for both until hydration has finished.)
  if (typeof document !== 'undefined' && !mightBeSignedIn()) return { status: 'signed-out' };
  return { status: 'loading' };
}

/** Current auth state for UI purposes; updates live on sign-in and sign-out. */
export function useUser(): AuthState {
  const [state, setState] = useState<AuthState>(initialState);

  useEffect(() => {
    if (!mightBeSignedIn()) return;
    let cancelled = false;
    let unsubscribe = () => {};
    loadSupabase().then(
      supabase => {
        if (cancelled || !supabase) return;
        // Fires immediately with INITIAL_SESSION, then on every change.
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          setState(session?.user ? { status: 'signed-in', user: session.user } : { status: 'signed-out' });
        });
        unsubscribe = () => data.subscription.unsubscribe();
      },
      err => console.error('[auth] could not load sign-in', err),
    );
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return state;
}
