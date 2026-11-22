'use client';

import { useSyncExternalStore } from 'react';
import type { SyncStatus } from './engine';

export interface SyncState {
  status: SyncStatus | 'off';
  pending: number;
}

let state: SyncState = { status: 'off', pending: 0 };
const listeners = new Set<() => void>();

export function setSyncState(next: SyncState) {
  if (next.status === state.status && next.pending === state.pending) return;
  state = next;
  listeners.forEach(l => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const OFF: SyncState = { status: 'off', pending: 0 };

/** Live sync status for UI (the nav pill's dot). */
export function useSyncState(): SyncState {
  return useSyncExternalStore(subscribe, () => state, () => OFF);
}
