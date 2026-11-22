import type { SupabaseClient } from '@supabase/supabase-js';
import { SyncError, type SyncBridge, type SyncMeta, type SyncRemote, type SyncStore } from './engine';
import type { LegacyState, PullResult, PushPayload } from './model';

const META_KEY = 'hb_sync_v1';
const BACKUP_KEY = 'hb_sync_backup_v1';

/** Sync bookkeeping lives next to the app's own data in localStorage. */
export const localSyncStore: SyncStore = {
  load() {
    try {
      const raw = localStorage.getItem(META_KEY);
      return raw ? (JSON.parse(raw) as SyncMeta) : null;
    } catch {
      return null;
    }
  },
  save(meta) {
    try {
      localStorage.setItem(META_KEY, JSON.stringify(meta));
    } catch {
      // Storage full: the outbox stays in memory for this visit; the legacy
      // app already warns the lifter to export a backup in this case.
    }
  },
  backup(owner, state) {
    try {
      localStorage.setItem(BACKUP_KEY, JSON.stringify({ owner, savedAt: new Date().toISOString(), state }));
    } catch {
      /* best effort */
    }
  },
};

function classify(error: { code?: string; message?: string }): SyncError {
  const code = error.code ?? '';
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  if (offline || /fetch|network|load failed/i.test(error.message ?? '')) return new SyncError(error.message ?? 'offline', 'network');
  if (code.startsWith('22') || code.startsWith('23')) return new SyncError(error.message ?? code, 'data');
  return new SyncError(error.message ?? code, 'other');
}

export function supabaseRemote(supabase: SupabaseClient): SyncRemote {
  return {
    async push(p: PushPayload) {
      let error;
      try {
        ({ error } = await supabase.rpc('sync_push', { p }));
      } catch (e) {
        throw classify({ message: String(e) });
      }
      if (error) throw classify(error);
    },
    async pull(since: string | null) {
      let data, error;
      try {
        ({ data, error } = await supabase.rpc('sync_pull', { since }));
      } catch (e) {
        throw classify({ message: String(e) });
      }
      if (error) throw classify(error);
      return data as PullResult;
    },
  };
}

/** The handle scripts/legacy-bridge.js puts on window once the legacy app has booted. */
interface LegacyBridgeHandle {
  readState(): LegacyState;
  applyState(state: LegacyState): void;
}

declare global {
  interface Window {
    __legacyBridge?: LegacyBridgeHandle;
  }
}

export function legacyBridge(handle: LegacyBridgeHandle): SyncBridge {
  return {
    readState: () => handle.readState(),
    applyState: state => handle.applyState(state),
    isBusy: () => {
      const el = document.activeElement;
      return !!el && el.matches('input, textarea') && !!el.closest('.exercise-card, #workout');
    },
  };
}

/** Resolves once the legacy runtime has booted and exposed its bridge. */
export function whenLegacyReady(): Promise<LegacyBridgeHandle> {
  return new Promise(resolve => {
    if (window.__legacyBridge) return resolve(window.__legacyBridge);
    window.addEventListener('legacy:ready', () => resolve(window.__legacyBridge!), { once: true });
  });
}
