'use client';

import { useEffect } from 'react';
import { loadSupabase } from '@/lib/supabase/load';
import { useUser } from '@/lib/supabase/useUser';
import type { SyncEngine } from '@/lib/sync/engine';
import { setSyncState } from '@/lib/sync/status';

/** Wait this long after the last tap/keystroke before syncing, so a set of rapid edits goes up as one request. */
const CHANGE_DEBOUNCE_MS = 1500;
/** Background catch-up while the page is visible (picks up edits from the lifter's other devices). */
const POLL_MS = 45_000;

/**
 * Runs cloud sync while a lifter is signed in on the protocol page. Renders
 * nothing: the app keeps working on its own local copy exactly as before,
 * and this quietly keeps that copy and the account in step. The sync code
 * and the client library are only downloaded once someone is signed in.
 * It syncs the training store (src/lib/training/client.ts).
 */
export function CloudSync() {
  const auth = useUser();
  const userId = auth.status === 'signed-in' ? auth.user.id : null;

  useEffect(() => {
    if (!userId) return;

    let stopped = false;
    let engine: SyncEngine | null = null;
    let debounce: ReturnType<typeof setTimeout> | undefined;
    const cleanups: (() => void)[] = [];

    const run = () => {
      if (!engine || stopped) return;
      engine.sync().catch(err => console.error('[sync]', err));
    };
    const on = (target: EventTarget, type: string, fn: () => void) => {
      target.addEventListener(type, fn);
      cleanups.push(() => target.removeEventListener(type, fn));
    };

    Promise.all([loadSupabase(), import('@/lib/sync/engine'), import('@/lib/sync/adapters')]).then(async ([supabase, { SyncEngine }, adapters]) => {
      if (stopped || !supabase) return;
      const onEdit = () => {
        clearTimeout(debounce);
        debounce = setTimeout(run, CHANGE_DEBOUNCE_MS);
      };
      const { trainingStore } = await import('@/lib/training/client');
      if (stopped) return;
      const connected = adapters.trainingStoreBridge(trainingStore());
      cleanups.push(connected.onChange(onEdit));
      engine = new SyncEngine(userId, connected.bridge, adapters.supabaseRemote(supabase), adapters.localSyncStore,
        (status, pending) => setSyncState({ status, pending }),
      );
      run();

      on(window, 'online', run);
      on(document, 'visibilitychange', () => {
        if (document.visibilityState === 'visible') run();
        // Leaving the page: record the latest edits in the outbox right away,
        // so they survive even if the tab is closed before the next sync.
        else engine?.capture();
      });
      const poll = setInterval(() => {
        if (document.visibilityState === 'visible') run();
      }, POLL_MS);
      cleanups.push(() => clearInterval(poll));
    }).catch(err => console.error('[sync] could not start', err));

    return () => {
      stopped = true;
      clearTimeout(debounce);
      cleanups.forEach(c => c());
      setSyncState({ status: 'off', pending: 0 });
    };
  }, [userId]);

  return null;
}
