'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
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

function read(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}

const asMap = <T,>(v: unknown): Record<string, T> => (v && typeof v === 'object' ? (v as Record<string, T>) : {});

/** The progress saved on this device, read the way the legacy app loads it (for pages where it isn't running). */
function readSavedState(): LegacyState {
  const unified = read('hb_state_v1') as Partial<LegacyState> | null;
  const maps = unified && typeof unified === 'object'
    ? unified
    : { doneMap: read('hb_completed_sets_v1'), logMap: read('hb_logMap_v1'), notesMap: read('hb_notesMap_v1'), sessionsMap: read('hb_sessions_v1') };
  const flag = (key: string, fallback: boolean) => {
    const v = read(key);
    return v === null ? fallback : !!v;
  };
  const week = Number.parseInt(localStorage.getItem('hb_mesocycleWeek_v1') ?? '', 10);
  return {
    doneMap: asMap(maps.doneMap),
    logMap: asMap(maps.logMap),
    notesMap: asMap(maps.notesMap),
    sessionsMap: asMap(maps.sessionsMap),
    prefs: {
      autoRest: flag('hb_autoRest_v1', true),
      audio: flag('hb_audioEnabled_v1', true),
      highContrast: flag('hb_highContrast_v1', false),
      mesocycleWeek: week >= 1 && week <= 6 ? week : 1,
    },
  };
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
