'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from './client';

export type AuthState =
  | { status: 'disabled' } // Supabase not configured
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: User };

/** Current auth state for UI purposes; updates live on sign-in and sign-out. */
export function useUser(): AuthState {
  const [state, setState] = useState<AuthState>(() =>
    getSupabaseBrowserClient() ? { status: 'loading' } : { status: 'disabled' },
  );

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    // Fires immediately with INITIAL_SESSION, then on every change.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(session?.user ? { status: 'signed-in', user: session.user } : { status: 'signed-out' });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return state;
}
