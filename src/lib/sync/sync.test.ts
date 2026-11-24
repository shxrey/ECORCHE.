// npm run test:sync — the sync model and engine, with simulated devices
// talking to an in-memory server that follows the same last-write-wins
// rules as supabase/migrations/0002_sync.sql.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SyncEngine, SyncError, type SyncBridge, type SyncMeta, type SyncRemote, type SyncStore } from './engine';
import {
  applyChanges, emptyState, flatten, fromPullResult, normalizeLog, normalizePrefs, toPushPayload,
  type LegacyPrefs, type LegacyState, type PullResult, type PushPayload,
} from './model';
import { forgetDeviceProgress, uploadBeforeSignOut } from './device';

// ---------- fakes ----------

type Table = 'checks' | 'logs' | 'notes' | 'days' | 'timers';
const TABLES: Table[] = ['checks', 'logs', 'notes', 'days', 'timers'];
const rowKey: Record<Table, (r: Record<string, unknown>) => string> = {
  checks: r => `${r.exercise_key}|${r.set_idx}`,
  logs: r => `${r.exercise_key}|${r.log_date}|${r.set_idx}`,
  notes: r => `${r.exercise_key}|${r.note_date}`,
  days: r => `${r.day}`,
  timers: r => `${r.day_id}`,
};

/** One lifter's account on the server. */
class FakeServer {
  clock = Date.parse('2026-11-23T00:00:00Z');
  rows = new Map<string, { table: Table; row: Record<string, unknown>; updated: number }>();
  settings: { row: NonNullable<PushPayload['settings']>; updated: number } = {
    row: {
      auto_rest: true, voice_announcements: true, high_contrast: false, mesocycle_week: 1, weight_unit: 'kg',
      ts: new Date(0).toISOString(),
    },
    updated: this.clock,
  };
  reject: (row: Record<string, unknown>) => boolean = () => false;

  push(p: PushPayload) {
    this.clock += 1000;
    for (const table of TABLES) {
      for (const row of (p[table] ?? []) as Record<string, unknown>[]) {
        if (this.reject(row)) throw new SyncError('check constraint', 'data');
      }
    }
    for (const table of TABLES) {
      for (const row of (p[table] ?? []) as Record<string, unknown>[]) {
        const key = `${table}|${rowKey[table](row)}`;
        const existing = this.rows.get(key);
        if (!existing || Date.parse(existing.row.ts as string) <= Date.parse(row.ts as string)) {
          this.rows.set(key, { table, row, updated: this.clock });
        }
      }
    }
    if (p.settings && Date.parse(this.settings.row.ts) <= Date.parse(p.settings.ts)) {
      this.settings = { row: p.settings, updated: this.clock };
    }
  }

  pull(since: string | null): PullResult {
    this.clock += 1000;
    const after = since ? Date.parse(since) : -Infinity;
    const result: PullResult = {
      server_time: new Date(this.clock).toISOString(), checks: [], logs: [], notes: [], days: [], timers: [],
      settings: this.settings.updated > after ? this.settings.row : null,
    };
    for (const { table, row, updated } of this.rows.values()) {
      if (updated > after) (result[table] as unknown[]).push(row);
    }
    return result;
  }

  get(key: string) {
    return this.rows.get(key)?.row;
  }
}

class Device {
  state: LegacyState = emptyState();
  busy = false;
  online = true;
  time = Date.parse('2026-11-23T08:00:00Z');
  stored: SyncMeta | null = null;
  backups: { owner: string; state: LegacyState }[] = [];

  bridge: SyncBridge = {
    readState: () => JSON.parse(JSON.stringify(this.state)),
    applyState: s => { this.state = JSON.parse(JSON.stringify(s)); },
    isBusy: () => this.busy,
  };
  store: SyncStore = {
    load: () => (this.stored ? JSON.parse(JSON.stringify(this.stored)) : null),
    save: m => { this.stored = JSON.parse(JSON.stringify(m)); },
    backup: (owner, state) => { this.backups.push({ owner, state }); },
  };

  remoteFor(server: FakeServer): SyncRemote {
    return {
      push: async p => {
        if (!this.online) throw new SyncError('offline', 'network');
        server.push(p);
      },
      pull: async since => {
        if (!this.online) throw new SyncError('offline', 'network');
        return server.pull(since);
      },
    };
  }

  connect(userId: string, server: FakeServer) {
    return new SyncEngine(userId, this.bridge, this.remoteFor(server), this.store, () => {}, () => this.time);
  }

  /** Simulates the lifter doing something in the app (time moves forward). */
  edit(fn: (s: LegacyState) => void, minutes = 1) {
    this.time += minutes * 60_000;
    fn(this.state);
  }
}

const tick = (s: LegacyState, ex: string, set: number) => { s.doneMap[`${ex}-set${set}`] = true; };
const log = (s: LegacyState, ex: string, date: string, set: number, w: string, r: string, rir = '') => {
  ((s.logMap[ex] ??= {})[date] ??= {})[set] = { w, r, rir };
};

// ---------- model ----------

describe('model', () => {
  it('round-trips a full state through records', () => {
    const s = emptyState({ autoRest: false, audio: true, highContrast: true, mesocycleWeek: 4, unit: 'lb' });
    tick(s, 'push-a1', 1);
    tick(s, 'legs-b7', 3);
    log(s, 'push-a1', '2026-11-20', 1, '62.5', '8', '1');
    s.logMap['push-a1']['2026-11-20'][1].pr = true;
    s.notesMap['pull-a2'] = { '2026-11-19': 'drop 2.5kg next time' };
    s.sessionsMap['2026-11-20'] = 9;

    const records = flatten(s);
    const rebuilt = applyChanges(emptyState(), Object.entries(records).map(([key, value]) => ({ key, value })));
    assert.deepEqual(flatten(rebuilt), records);
  });

  it('treats "60" and "60.0" as the same weight, and rejects what the database cannot hold', () => {
    assert.deepEqual(normalizeLog({ w: '60.0', r: '8', rir: '' }), { w: 60, r: 8, rir: null, pr: false });
    assert.equal(normalizeLog({ w: '', r: '', rir: '' }), null);
    assert.equal(normalizeLog({ w: '60', r: '8.5' }), undefined, 'fractional reps');
    assert.equal(normalizeLog({ w: '2500', r: '1' }), undefined, 'over 2000 kg');
    assert.equal(normalizeLog({ w: 'abc', r: '1' }), undefined);
  });

  it('carries the weight unit to the database and back; everyone starts on kg', () => {
    const prefs: LegacyPrefs = { autoRest: true, audio: false, highContrast: false, mesocycleWeek: 2, unit: 'lb' };
    const payload = toPushPayload([{ key: 's', value: prefs, ts: 5 }]);
    assert.equal(payload.settings?.weight_unit, 'lb');
    const [back] = fromPullResult({ server_time: '', checks: [], logs: [], notes: [], days: [], settings: payload.settings! });
    assert.deepEqual(back.value, prefs);
    assert.equal(normalizePrefs({}).unit, 'kg');
    assert.equal(normalizePrefs({ unit: 'stone' as never }).unit, 'kg', 'anything unexpected falls back to kg');
  });

  it('carries workout timers, and resets, to the database and back', () => {
    const start = Date.parse('2026-11-24T10:00:00.123Z');
    const s = emptyState();
    s.timers = { legsA: start, armsA: 5, pushB: Number.NaN };
    const records = flatten(s);
    assert.deepEqual(Object.keys(records).filter(k => k.startsWith('t|')), ['t|legsA'], 'only real days and real times');
    const payload = toPushPayload([
      { key: 't|legsA', value: start, ts: 7 },
      { key: 't|pullB', value: null, ts: 8 },
    ]);
    assert.deepEqual(payload.timers.map(t => [t.day_id, t.started_at]), [['legsA', '2026-11-24T10:00:00.123Z'], ['pullB', null]]);
    const back = fromPullResult({ server_time: '', checks: [], logs: [], notes: [], days: [], timers: payload.timers, settings: null });
    assert.deepEqual(back.map(c => [c.key, c.value]), [['t|legsA', start], ['t|pullB', null]]);
  });

  it('skips records with unknown exercises or set labels instead of failing', () => {
    const s = emptyState();
    s.doneMap['unknown-set1'] = true;
    s.doneMap['push-a1-setL'] = true;
    tick(s, 'push-a1', 2);
    assert.deepEqual(Object.keys(flatten(s)).filter(k => k.startsWith('c|')), ['c|push-a1|2']);
  });
});

// ---------- engine ----------

describe('engine', () => {
  const USER = 'user-1';

  it('a set ticked on the phone shows up on the laptop', async () => {
    const server = new FakeServer();
    const phone = new Device(), laptop = new Device();
    const p = phone.connect(USER, server), l = laptop.connect(USER, server);
    await p.sync();
    await l.sync();

    phone.edit(s => { tick(s, 'push-a1', 1); log(s, 'push-a1', '2026-11-23', 1, '80', '8', '1'); });
    await p.sync();
    await l.sync();
    assert.equal(laptop.state.doneMap['push-a1-set1'], true);
    assert.equal(laptop.state.logMap['push-a1']['2026-11-23'][1].w, '80');
    assert.equal(p.pendingCount, 0);
  });

  it('an untick (removal) syncs too', async () => {
    const server = new FakeServer();
    const phone = new Device(), laptop = new Device();
    const p = phone.connect(USER, server), l = laptop.connect(USER, server);
    phone.edit(s => tick(s, 'pull-a1', 2));
    await p.sync();
    await l.sync();
    assert.equal(laptop.state.doneMap['pull-a1-set2'], true);

    laptop.edit(s => { delete s.doneMap['pull-a1-set2']; });
    await l.sync();
    await p.sync();
    assert.equal(phone.state.doneMap['pull-a1-set2'], undefined);
  });

  it('offline edits queue up and upload when back online', async () => {
    const server = new FakeServer();
    const phone = new Device();
    const p = phone.connect(USER, server);
    await p.sync();

    phone.online = false;
    phone.edit(s => log(s, 'legs-a1', '2026-11-23', 1, '140', '6', '2'));
    await p.sync();
    assert.equal(p.pendingCount, 1);
    assert.equal(server.get('logs|legs-a1|2026-11-23|1'), undefined);

    phone.online = true;
    await p.sync();
    assert.equal(p.pendingCount, 0);
    assert.equal(server.get('logs|legs-a1|2026-11-23|1')?.weight, 140);
  });

  it('newest edit wins, no matter which device reconnects last', async () => {
    const server = new FakeServer();
    const phone = new Device(), laptop = new Device();
    const p = phone.connect(USER, server), l = laptop.connect(USER, server);
    await p.sync();
    await l.sync();

    // Laptop edits first, offline; phone edits the same set later, online.
    laptop.online = false;
    laptop.edit(s => log(s, 'push-b1', '2026-11-23', 1, '50', '10'), 1);
    await l.sync();
    phone.edit(s => log(s, 'push-b1', '2026-11-23', 1, '55', '10'), 5);
    await p.sync();

    // The stale laptop edit reaches the server last, but must not win.
    laptop.online = true;
    await l.sync();
    await p.sync();
    assert.equal(server.get('logs|push-b1|2026-11-23|1')?.weight, 55);
    assert.equal(laptop.state.logMap['push-b1']['2026-11-23'][1].w, '55');
    assert.equal(phone.state.logMap['push-b1']['2026-11-23'][1].w, '55');
  });

  it("first sign-in uploads this device's progress but never overrides the account's", async () => {
    const server = new FakeServer();
    const phone = new Device();
    phone.edit(s => log(s, 'push-a1', '2026-11-20', 1, '70', '8'));
    const p = phone.connect(USER, server);
    await p.sync();

    // An old laptop with older local-only data signs in for the first time.
    const laptop = new Device();
    laptop.state = emptyState();
    log(laptop.state, 'push-a1', '2026-11-20', 1, '60', '8'); // conflicts with the account
    log(laptop.state, 'pull-b2', '2026-11-01', 1, '30', '12'); // only on this laptop
    const l = laptop.connect(USER, server);
    await l.sync();

    assert.equal(laptop.state.logMap['push-a1']['2026-11-20'][1].w, '70', 'account wins the conflict');
    assert.equal(server.get('logs|pull-b2|2026-11-01|1')?.weight, 30, "laptop's unique history is uploaded");
    assert.equal(server.get('logs|push-a1|2026-11-20|1')?.weight, 70);
  });

  it("a different account on the same device gets its own data; the previous lifter's is backed up, not uploaded", async () => {
    const serverA = new FakeServer(), serverB = new FakeServer();
    const shared = new Device();
    shared.edit(s => tick(s, 'legs-a3', 1));
    await shared.connect('A', serverA).sync();

    const b = shared.connect('B', serverB);
    await b.sync();
    assert.equal(shared.state.doneMap['legs-a3-set1'], undefined, "B doesn't see A's ticks");
    assert.equal(serverB.get('checks|legs-a3|1'), undefined, "A's data never reaches B's account");
    assert.equal(shared.backups[0]?.owner, 'A');
    assert.equal(shared.backups[0]?.state.doneMap['legs-a3-set1'], true);
  });

  it('never applies a pull while the lifter is typing, but still uploads', async () => {
    const server = new FakeServer();
    const phone = new Device(), laptop = new Device();
    const p = phone.connect(USER, server), l = laptop.connect(USER, server);
    await p.sync();
    await l.sync();

    phone.edit(s => tick(s, 'push-a2', 1));
    await p.sync();
    laptop.busy = true;
    laptop.edit(s => tick(s, 'push-a3', 1));
    await l.sync();
    assert.equal(laptop.state.doneMap['push-a2-set1'], undefined, 'pull deferred');
    assert.ok(server.get('checks|push-a3|1'), 'push still happened');

    laptop.busy = false;
    await l.sync();
    assert.equal(laptop.state.doneMap['push-a2-set1'], true);
  });

  it('one record the server rejects does not block the rest', async () => {
    const server = new FakeServer();
    server.reject = row => row.exercise_key === 'pull-a4';
    const phone = new Device();
    const p = phone.connect(USER, server);
    phone.edit(s => { tick(s, 'pull-a4', 1); tick(s, 'pull-a5', 1); });
    await p.sync();
    assert.ok(server.get('checks|pull-a5|1'));
    assert.equal(p.pendingCount, 0, 'outbox is not stuck retrying the bad record');
  });

  it('syncs preferences, newest wins', async () => {
    const server = new FakeServer();
    const phone = new Device(), laptop = new Device();
    const p = phone.connect(USER, server), l = laptop.connect(USER, server);
    await p.sync();
    await l.sync();
    phone.edit(s => { s.prefs = { ...s.prefs, mesocycleWeek: 3, highContrast: true, unit: 'lb' }; });
    await p.sync();
    await l.sync();
    assert.equal(laptop.state.prefs.mesocycleWeek, 3);
    assert.equal(laptop.state.prefs.highContrast, true);
    assert.equal(laptop.state.prefs.unit, 'lb');
  });

  it("a device last synced before the unit setting existed doesn't overwrite newer settings", async () => {
    const server = new FakeServer();
    const phone = new Device(), laptop = new Device();
    await phone.connect(USER, server).sync();
    const l = laptop.connect(USER, server);
    await l.sync();
    // The phone's saved snapshot comes from the app before the update: it has no unit.
    const old: Partial<LegacyPrefs> = { ...(phone.stored!.shadow!.s as LegacyPrefs) };
    delete old.unit;
    phone.stored!.shadow!.s = old as LegacyPrefs;
    // The laptop changes the training week; later the phone opens the updated app.
    laptop.edit(s => { s.prefs = { ...s.prefs, mesocycleWeek: 3 }; });
    await l.sync();
    phone.time = laptop.time + 60 * 60_000;
    await phone.connect(USER, server).sync();
    assert.equal(server.settings.row.mesocycle_week, 3, "the phone's stale settings weren't pushed");
    assert.equal(phone.state.prefs.mesocycleWeek, 3, "the phone took the laptop's change");
  });

  it('a workout timer started on the phone shows on the laptop; resetting the day clears it on both', async () => {
    const server = new FakeServer();
    const phone = new Device(), laptop = new Device();
    const p = phone.connect(USER, server), l = laptop.connect(USER, server);
    phone.edit(s => { s.timers.legsA = phone.time; });
    await p.sync();
    await l.sync();
    assert.equal(laptop.state.timers.legsA, phone.time);
    laptop.edit(s => { delete s.timers.legsA; }, 5);
    await l.sync();
    await p.sync();
    assert.equal(phone.state.timers.legsA, undefined);
  });

  it("an old timer expiring on one device never cancels a session just started on another", async () => {
    const server = new FakeServer();
    const phone = new Device(), laptop = new Device();
    // Last week's leg day: the laptop saw that session's timer.
    phone.edit(s => { s.timers.legsA = phone.time; });
    await phone.connect(USER, server).sync();
    await laptop.connect(USER, server).sync();
    assert.ok(laptop.state.timers.legsA);
    // A week later the phone starts leg day again...
    phone.time += 7 * 24 * 60 * 60_000;
    phone.edit(s => { s.timers.legsA = phone.time; });
    await phone.connect(USER, server).sync();
    const today = phone.time;
    // ...and 20 minutes in, the laptop opens the app, which drops last week's timer as it loads.
    laptop.time = today + 20 * 60_000;
    delete laptop.state.timers.legsA;
    await laptop.connect(USER, server).sync();
    assert.equal(server.get('timers|legsA')?.started_at, new Date(today).toISOString(), "today's session wasn't cancelled");
    assert.equal(laptop.state.timers.legsA, today, "the laptop shows today's session");
  });

  it("a timer running from before the update can't beat a session started later elsewhere", async () => {
    const server = new FakeServer();
    const phone = new Device(), laptop = new Device();
    await phone.connect(USER, server).sync();
    const l = laptop.connect(USER, server);
    await l.sync();
    // The phone's timer started 30 minutes ago, under the version that didn't sync timers.
    const old = phone.time - 30 * 60_000;
    phone.state.timers.pushA = old;
    // Meanwhile the laptop starts Push A (10 minutes from now) and syncs it.
    laptop.time = phone.time;
    laptop.edit(s => { s.timers.pushA = laptop.time; }, 10);
    await l.sync();
    const later = laptop.time;
    // Then the phone opens the updated app.
    phone.time = later + 5 * 60_000;
    await phone.connect(USER, server).sync();
    assert.equal(server.get('timers|pushA')?.started_at, new Date(later).toISOString());
    assert.equal(phone.state.timers.pushA, later);
  });
});

// ---------- signing out (src/lib/sync/device.ts) ----------

describe('sign-out', () => {
  const USER = 'user-1';

  /** A Map-backed localStorage, as the account page sees it (the legacy app isn't running there). */
  function fakeStorage() {
    const data = new Map<string, string>();
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, String(v)),
      removeItem: (k: string) => void data.delete(k),
    };
    return data;
  }
  /** Just enough of a Supabase client for the two sync RPCs. */
  function fakeSupabase(server: FakeServer, online = () => true) {
    return {
      rpc: async (fn: string, args: { p?: PushPayload; since?: string | null }) => {
        if (!online()) throw new TypeError('Failed to fetch');
        if (fn === 'sync_push') { server.push(args.p!); return { data: null, error: null }; }
        return { data: server.pull(args.since ?? null), error: null };
      },
    } as unknown as Parameters<typeof uploadBeforeSignOut>[0];
  }
  /** What the device looks like after a sync, plus one edit made since. */
  function deviceWithUnsyncedEdit(data: Map<string, string>, owner = USER) {
    const state = emptyState();
    tick(state, 'push-a1', 1);
    log(state, 'push-a1', '2026-11-23', 1, '80', '8', '1');
    data.set('hb_state_v1', JSON.stringify({ doneMap: state.doneMap, logMap: state.logMap, notesMap: {}, sessionsMap: {} }));
    data.set('hb_completed_sets_v1', JSON.stringify({ 'pull-a1-set1': true })); // old pre-unified key
    data.set('hb_audioEnabled_v1', 'false');
    const meta: SyncMeta = { v: 1, owner, cursor: null, shadow: flatten(emptyState()), pending: {} };
    data.set('hb_sync_v1', JSON.stringify(meta));
  }

  it('uploads the last edits first, then the device forgets the progress but keeps preferences', async () => {
    const data = fakeStorage();
    const server = new FakeServer();
    deviceWithUnsyncedEdit(data);

    assert.equal(await uploadBeforeSignOut(fakeSupabase(server), USER), 0);
    assert.equal(server.get('checks|push-a1|1')?.checked, true, 'tick reached the account');
    assert.equal(server.get('logs|push-a1|2026-11-23|1')?.weight, 80, 'log reached the account');

    forgetDeviceProgress();
    for (const key of ['hb_state_v1', 'hb_completed_sets_v1', 'hb_sync_v1']) assert.equal(data.has(key), false, key);
    assert.equal(data.get('hb_audioEnabled_v1'), 'false', 'preferences stay');
  });

  it('offline: reports the changes that would be lost instead of deleting them', async () => {
    const data = fakeStorage();
    const server = new FakeServer();
    deviceWithUnsyncedEdit(data);

    const left = await uploadBeforeSignOut(fakeSupabase(server, () => false), USER);
    assert.ok(left > 0, 'unsent changes reported');
    assert.equal(server.get('checks|push-a1|1'), undefined);
    assert.ok(data.has('hb_state_v1'), 'nothing removed');
  });

  it('keeps the weight unit (the account page reads it from the device too)', async () => {
    const data = fakeStorage();
    const server = new FakeServer();
    deviceWithUnsyncedEdit(data);
    data.set('hb_weightUnit_v1', 'lb');

    assert.equal(await uploadBeforeSignOut(fakeSupabase(server), USER), 0);
    assert.equal(server.settings.row.weight_unit, 'lb');
  });

  it("doesn't clear a workout timer that's still running on another device", async () => {
    const data = fakeStorage();
    const server = new FakeServer();
    deviceWithUnsyncedEdit(data);
    const start = Date.now() - 10 * 60_000;
    const iso = new Date(start).toISOString();
    server.push({ checks: [], logs: [], notes: [], days: [], timers: [{ day_id: 'legsA', started_at: iso, ts: iso }] });
    // This device had synced that timer too.
    const meta = JSON.parse(data.get('hb_sync_v1')!) as SyncMeta;
    meta.shadow!['t|legsA'] = start;
    data.set('hb_sync_v1', JSON.stringify(meta));
    data.set('hb_sessionTimerStarts_v1', JSON.stringify({ legsA: start }));

    assert.equal(await uploadBeforeSignOut(fakeSupabase(server), USER), 0);
    assert.equal(server.get('timers|legsA')?.started_at, iso);
  });

  it("never uploads another account's progress", async () => {
    const data = fakeStorage();
    const server = new FakeServer();
    deviceWithUnsyncedEdit(data, 'someone-else');

    assert.equal(await uploadBeforeSignOut(fakeSupabase(server), USER), 0);
    assert.equal(server.get('checks|push-a1|1'), undefined);
  });
});
