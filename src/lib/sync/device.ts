'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { loadTrainingState } from '@/lib/training/store';
import { localSyncStore, supabaseRemote } from './adapters';
import { SyncEngine, type SyncBridge } from './engine';
import type { LegacyState } from './model';

/**
 * Everything the app keeps on a device that is the lifter's own progress
 * (preferences such as voice or auto-rest are left alone). Includes the
 * pre-unified keys: the legacy app falls back to reading those whenever
 * `hb_state_v1` is missing, so leaving them would bring old data back.
 */
const PROGRESS_KEYS = [
  'hb_state_v1',
  'hb_completed_sets_v1',
  'hb_logMap_v1',
  'hb_notesMap_v1',
  'hb_sessions_v1',
  'hb_sessionTimerStarts_v1',
  'hb_sync_v1',
  'hb_sync_backup_v1',
];

/**
 * The progress saved on this device, read the way the app loads it (for
 * pages where it isn't running). Includes running workout timers: without
 * them, signing out would look like a reset and clear a timer still running
 * on the lifter's other device.
 */
function readSavedState(): LegacyState {
  return loadTrainingState(localStorage).state;
}

/**
 * Last sync before signing out: uploads anything this device has that the
 * account doesn't yet. Returns how many changes are still not uploaded
 * (0 = safe to wipe the device).
 */
export async function uploadBeforeSignOut(supabase: SupabaseClient, userId: string): Promise<number> {
  const meta = localSyncStore.load();
  // Synced to a different account: that progress isn't this lifter's to upload.
  if (meta?.owner && meta.owner !== userId) return 0;

  const bridge: SyncBridge = { readState: readSavedState, applyState: () => {}, isBusy: () => false };
  const engine = new SyncEngine(userId, bridge, supabaseRemote(supabase), localSyncStore);
  try {
    await engine.sync();
  } catch {
    return Math.max(engine.pendingCount, 1);
  }
  return engine.pendingCount;
}

/** Removes the lifter's progress from this device. It stays safe in their account. */
export function forgetDeviceProgress(): void {
  for (const key of PROGRESS_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* storage unavailable: nothing to remove */
    }
  }
}
