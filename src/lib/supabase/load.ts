'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabaseUrl } from './config';
import { hasSessionCookie } from './session-cookie';

let loading: Promise<SupabaseClient | null> | null = null;

/**
 * The browser client, loaded on first use. The library is about a quarter
 * of the protocol page's scripts, so a visitor who isn't signed in never
 * downloads it there. (The login and account pages import it directly.)
 */
export function loadSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return Promise.resolve(null);
  loading ??= import('./client').then(
    m => m.getSupabaseBrowserClient(),
    err => {
      loading = null; // let a later call try again (e.g. back online)
      throw err;
    },
  );
  return loading;
}

/** Whether this browser might be signed in: it holds the session cookie. Always false on the server. */
export function mightBeSignedIn(): boolean {
  return isSupabaseConfigured && typeof document !== 'undefined' && hasSessionCookie(document.cookie, supabaseUrl);
}
