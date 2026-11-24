import {
  applyChanges, diff, emptyState, flatten, fromPullResult, normalizePrefs, sameValue, toPushPayload,
  type Change, type LegacyState, type PullResult, type PushPayload, type RecordMap, type RecordValue,
} from './model';

/** The legacy app, seen from the sync engine (implemented in scripts/legacy-bridge.js). */
export interface SyncBridge {
  readState(): LegacyState;
  applyState(state: LegacyState): void;
  /** True while the lifter is typing, so a pull never yanks an input out from under them. */
  isBusy(): boolean;
}

export interface SyncRemote {
  push(payload: PushPayload): Promise<void>;
  pull(since: string | null): Promise<PullResult>;
}

/** Device-local bookkeeping, persisted between visits. */
export interface SyncMeta {
  v: 1;
  /** The account this device's progress belongs to. */
  owner: string | null;
  /** server_time of the last successful pull. */
  cursor: string | null;
  /** The device's state as of the last sync step; null = never synced. */
  shadow: RecordMap | null;
  /** Changes not yet confirmed by the server (the offline outbox). */
  pending: Record<string, { value: RecordValue | null; ts: number }>;
}

export interface SyncStore {
  load(): SyncMeta | null;
  save(meta: SyncMeta): void;
  /** Keeps a copy of another account's progress before this device switches accounts. */
  backup(owner: string, state: LegacyState): void;
}

export type SyncStatus = 'syncing' | 'synced' | 'offline' | 'error';

export class SyncError extends Error {
  constructor(message: string, readonly kind: 'network' | 'data' | 'other') {
    super(message);
  }
}

/** Seconds of overlap between pulls, so a row committed just after a pull is never skipped. */
const PULL_OVERLAP_MS = 10_000;
const PUSH_BATCH = 400;
/**
 * Timestamp for progress that was on a device before its first sync. Just
 * after the epoch, so it beats an account value that was never set (the
 * database's default timestamp is the epoch) but loses to any real edit,
 * including another device's unknown-age upload (ties go to the account).
 */
const UNKNOWN_AGE = 1;

const fresh = (owner: string | null): SyncMeta => ({ v: 1, owner, cursor: null, shadow: null, pending: {} });

/**
 * A snapshot saved before a preference existed (e.g. the weight unit) gets
 * that preference's default. Otherwise the next capture would see "settings
 * changed", stamp them with the current time and push them, overwriting
 * newer settings from another device that this one hasn't pulled yet.
 */
function withCurrentPrefs(meta: SyncMeta): SyncMeta {
  const s = meta.shadow?.s;
  if (meta.shadow && s && typeof s === 'object' && 'mesocycleWeek' in s) meta.shadow.s = normalizePrefs(s);
  const p = meta.pending.s?.value;
  if (p && typeof p === 'object' && 'mesocycleWeek' in p) meta.pending.s.value = normalizePrefs(p);
  return meta;
}

/**
 * Offline-first, last-write-wins sync between this device and the lifter's
 * account. The device always works on its own copy (the legacy app never
 * waits on the network); the engine catches up whenever it can:
 *
 *   capture  diff the app's state against the last snapshot; every change
 *            goes into the outbox stamped with the time it was noticed.
 *   pull     fetch rows changed on the server since last time. A remote row
 *            replaces the local one unless the outbox holds a newer edit.
 *   push     send the outbox; the server keeps whichever edit is newest.
 *
 * The first sync on a device stamps existing local progress as "age
 * unknown" (UNKNOWN_AGE): it uploads anything the account doesn't have, but
 * never overrides what the account already has. Ties go to the account.
 */
export class SyncEngine {
  private meta: SyncMeta;
  private running: Promise<void> | null = null;
  private again = false;

  constructor(
    private readonly userId: string,
    private readonly bridge: SyncBridge,
    private readonly remote: SyncRemote,
    private readonly store: SyncStore,
    private readonly onStatus: (status: SyncStatus, pending: number) => void = () => {},
    private readonly now: () => number = Date.now,
  ) {
    const saved = store.load();
    if (saved?.v === 1 && saved.owner === userId) {
      this.meta = withCurrentPrefs(saved);
    } else if (saved?.owner && saved.owner !== userId) {
      // This device was synced to a different account. Keep a copy of that
      // progress, then start this lifter from their own cloud data.
      store.backup(saved.owner, bridge.readState());
      const blank = emptyState(bridge.readState().prefs);
      bridge.applyState(blank);
      this.meta = fresh(userId);
      this.meta.shadow = flatten(blank);
    } else {
      // Never synced: whatever is on this device becomes this lifter's.
      this.meta = { ...fresh(userId), cursor: saved?.cursor ?? null };
    }
    this.store.save(this.meta);
  }

  get pendingCount(): number {
    return Object.keys(this.meta.pending).length;
  }

  /** Runs capture → pull → push. Calls made while one is running coalesce into one more run. */
  sync(): Promise<void> {
    if (this.running) {
      this.again = true;
      return this.running;
    }
    this.running = (async () => {
      try {
        do {
          this.again = false;
          await this.cycle();
        } while (this.again);
      } finally {
        this.running = null;
      }
    })();
    return this.running;
  }

  private async cycle(): Promise<void> {
    try {
      this.capture();
      // Only uploads show as "syncing": background catch-up pulls stay silent.
      if (this.pendingCount) this.onStatus('syncing', this.pendingCount);
      await this.pull();
      await this.push();
      this.onStatus('synced', this.pendingCount);
    } catch (e) {
      this.onStatus(e instanceof SyncError && e.kind === 'network' ? 'offline' : 'error', this.pendingCount);
      if (!(e instanceof SyncError)) throw e;
    }
  }

  /** Moves any local edits since the last snapshot into the outbox. Synchronous by design. */
  capture(): void {
    const current = flatten(this.bridge.readState());
    const first = this.meta.shadow === null;
    for (const c of diff(this.meta.shadow ?? {}, current, first ? UNKNOWN_AGE : this.now())) {
      this.meta.pending[c.key] = { value: c.value, ts: c.ts };
    }
    this.meta.shadow = current;
    this.store.save(this.meta);
  }

  private async pull(): Promise<void> {
    if (this.bridge.isBusy()) return; // try again next cycle; the cursor doesn't move
    const since = this.meta.cursor ? new Date(Date.parse(this.meta.cursor) - PULL_OVERLAP_MS).toISOString() : null;
    const result = await this.remote.pull(since);

    // The fetch took time: take in anything typed meanwhile, so it's in the
    // outbox (and wins if newer) before remote rows are applied.
    this.capture();
    if (this.bridge.isBusy()) return;

    const current = this.meta.shadow ?? {};
    const toApply: Change[] = [];
    for (const incoming of fromPullResult(result)) {
      const mine = this.meta.pending[incoming.key];
      if (mine && mine.ts > incoming.ts) continue; // local edit is newer: it will be pushed
      if (mine) delete this.meta.pending[incoming.key];
      if (!sameValue(current[incoming.key], incoming.value)) toApply.push(incoming);
    }

    if (toApply.length) {
      this.bridge.applyState(applyChanges(this.bridge.readState(), toApply));
      this.meta.shadow = flatten(this.bridge.readState());
    }
    this.meta.cursor = result.server_time;
    this.store.save(this.meta);
  }

  private async push(): Promise<void> {
    const batch = Object.entries(this.meta.pending).map(([key, p]) => ({ key, value: p.value, ts: p.ts }));
    for (let i = 0; i < batch.length; i += PUSH_BATCH) {
      const chunk = batch.slice(i, i + PUSH_BATCH);
      try {
        await this.remote.push(toPushPayload(chunk));
        this.confirm(chunk);
      } catch (e) {
        if (!(e instanceof SyncError) || e.kind !== 'data') throw e;
        // One bad record must not block everything behind it forever:
        // send the chunk one record at a time and drop only what's rejected.
        for (const c of chunk) {
          try {
            await this.remote.push(toPushPayload([c]));
          } catch (err) {
            if (!(err instanceof SyncError) || err.kind !== 'data') throw err;
            console.warn('[sync] server rejected', c.key, err.message);
          }
          this.confirm([c]);
        }
      }
    }
  }

  /** Clears outbox entries the server now has, unless they were edited again meanwhile. */
  private confirm(sent: Change[]): void {
    for (const c of sent) {
      const p = this.meta.pending[c.key];
      if (p && p.ts === c.ts && sameValue(p.value, c.value)) delete this.meta.pending[c.key];
    }
    this.store.save(this.meta);
  }
}
