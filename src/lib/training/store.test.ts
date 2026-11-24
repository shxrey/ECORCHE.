/**
 * The training store (npm run test:unit). e2e/parity.spec.ts also checks
 * that the old page and this store read each other's saved data.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, mock, test } from 'node:test';
import { exercises } from '@/content/program';
import { readBackup } from './backup';
import { flatten } from '../sync/model';
import { emptyTrainingState, loadTrainingState, STORAGE_KEYS, TrainingStore, type KeyValueStorage } from './store';

const EXERCISES = new Set(exercises.map((e) => e.key));
const NOW = new Date(2026, 10, 24, 18, 30); // Tuesday 24 Nov 2026, 6:30pm
const TODAY = '2026-11-24';

class MemoryStorage implements KeyValueStorage {
  readonly data = new Map<string, string>();
  writes = 0;
  constructor(init: Record<string, string> = {}) {
    for (const [k, v] of Object.entries(init)) this.data.set(k, v);
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.writes++;
    this.data.set(key, value);
  }
}

const saved = (s: MemoryStorage) => JSON.parse(s.data.get(STORAGE_KEYS.state) ?? 'null');
const storeOn = (storage: MemoryStorage, now = NOW) => new TrainingStore(storage, { now: () => now });

describe('loading saved data', () => {
  test('reads hb_state_v1 and every preference', () => {
    const storage = new MemoryStorage({
      hb_state_v1: JSON.stringify({ doneMap: { 'legs-a1-set1': true }, logMap: { 'legs-a1': { [TODAY]: { 1: { w: '100', r: '8', rir: '' } } } }, notesMap: {}, sessionsMap: { [TODAY]: 1 } }),
      hb_schemaVersion_v1: '3',
      hb_autoRest_v1: 'false',
      hb_audioEnabled_v1: 'true',
      hb_highContrast_v1: 'true',
      hb_mesocycleWeek_v1: '6',
      hb_weightUnit_v1: 'lb',
      hb_sessionTimerStarts_v1: JSON.stringify({ legsA: NOW.getTime() - 60_000, pushA: NOW.getTime() - 7 * 3600_000, pullA: 'x' }),
    });
    const { state, migrated } = loadTrainingState(storage, NOW);
    assert.equal(migrated, false);
    assert.deepEqual(state, {
      doneMap: { 'legs-a1-set1': true },
      logMap: { 'legs-a1': { [TODAY]: { 1: { w: '100', r: '8', rir: '' } } } },
      notesMap: {},
      sessionsMap: { [TODAY]: 1 },
      timers: { legsA: NOW.getTime() - 60_000 }, // over 6 hours old, or not a time: dropped
      prefs: { autoRest: false, audio: true, highContrast: true, mesocycleWeek: 6, unit: 'lb' },
    });
  });

  test('a first-time visitor gets the defaults', () => {
    assert.deepEqual(loadTrainingState(new MemoryStorage({ hb_schemaVersion_v1: '3' }), NOW).state, emptyTrainingState());
    assert.deepEqual(emptyTrainingState().prefs, { autoRest: true, audio: true, highContrast: false, mesocycleWeek: 1, unit: 'kg' });
  });

  test('broken values fall back to defaults', () => {
    const { state } = loadTrainingState(new MemoryStorage({
      hb_state_v1: '{not json', hb_schemaVersion_v1: '3', hb_autoRest_v1: 'nope', hb_mesocycleWeek_v1: '9', hb_weightUnit_v1: 'stone', hb_sessionTimerStarts_v1: '[',
    }), NOW);
    assert.deepEqual(state, emptyTrainingState());
  });

  test('before hb_state_v1, each map had its own key: still read, and left in place', () => {
    const storage = new MemoryStorage({
      hb_completed_sets_v1: JSON.stringify({ 'push-a1-set1': true }),
      hb_logMap_v1: JSON.stringify({ 'push-a1': { 1: { w: '60', r: '10', rir: '' } } }),
      hb_notesMap_v1: JSON.stringify({ 'push-a1': 'flat note', 'push-a2': '' }),
      hb_sessions_v1: JSON.stringify({ '2026-08-01': 3 }),
    });
    const store = storeOn(storage);
    // The very old undated log and note are filed under today, saved at once, and the schema is marked.
    assert.deepEqual(store.getState().logMap, { 'push-a1': { [TODAY]: { 1: { w: '60', r: '10', rir: '' } } } });
    assert.deepEqual(store.getState().notesMap, { 'push-a1': { [TODAY]: 'flat note' }, 'push-a2': {} });
    assert.equal(storage.data.get(STORAGE_KEYS.schemaVersion), '3');
    assert.deepEqual(saved(storage).doneMap, { 'push-a1-set1': true });
    assert.deepEqual(saved(storage).sessionsMap, { '2026-08-01': 3 });
    assert.ok(storage.data.has('hb_completed_sets_v1'));
  });

  test("with schema 3 saved, nothing is re-dated or re-saved", () => {
    const storage = new MemoryStorage({ hb_state_v1: JSON.stringify({ doneMap: {}, logMap: {}, notesMap: {}, sessionsMap: {} }), hb_schemaVersion_v1: '3' });
    storeOn(storage);
    assert.equal(storage.writes, 0);
  });
});

describe('saving', () => {
  test('the maps are saved together, half a second after the last change', () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
      const storage = new MemoryStorage({ hb_schemaVersion_v1: '3' });
      const store = storeOn(storage);
      store.toggleSet('legsA', 'legs-a1', 1);
      mock.timers.tick(400);
      store.toggleSet('legsA', 'legs-a1', 2);
      mock.timers.tick(400);
      assert.equal(saved(storage), null);
      mock.timers.tick(100);
      assert.deepEqual(Object.keys(saved(storage)), ['doneMap', 'logMap', 'notesMap', 'sessionsMap']);
      assert.deepEqual(saved(storage).doneMap, { 'legs-a1-set1': true, 'legs-a1-set2': true });
    } finally {
      mock.timers.reset();
    }
  });

  test('flush() saves straight away; preferences and timers never wait', () => {
    const storage = new MemoryStorage({ hb_schemaVersion_v1: '3' });
    const store = storeOn(storage);
    store.toggleSet('pullB', 'pull-b1', 1);
    assert.equal(storage.data.get(STORAGE_KEYS.timers), JSON.stringify({ pullB: NOW.getTime() }));
    store.setPrefs({ autoRest: false, audio: false, highContrast: true, mesocycleWeek: 4, unit: 'lb' });
    assert.deepEqual(
      ['hb_autoRest_v1', 'hb_audioEnabled_v1', 'hb_highContrast_v1', 'hb_mesocycleWeek_v1', 'hb_weightUnit_v1'].map((k) => storage.data.get(k)),
      ['false', 'false', 'true', '4', 'lb'],
    );
    assert.equal(saved(storage), null);
    store.flush();
    assert.deepEqual(saved(storage).doneMap, { 'pull-b1-set1': true });
  });

  test('a failed write is reported, not thrown', () => {
    const errors: unknown[] = [];
    const full: KeyValueStorage = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); } };
    const store = new TrainingStore(full, { now: () => NOW, onWriteError: (e) => errors.push(e) });
    errors.length = 0; // the schema mark on first load also failed
    store.setPrefs({ unit: 'lb' });
    assert.equal(errors.length, 1);
    assert.equal(store.getState().prefs.unit, 'lb');
  });

  test('what the store saves loads back the same', () => {
    const storage = new MemoryStorage({ hb_schemaVersion_v1: '3' });
    const store = storeOn(storage);
    store.toggleSet('legsA', 'legs-a1', 1);
    store.logSet('legs-a1', 1, { w: '100', r: '8', rir: '1' });
    store.setNote('legs-a1', 'deep');
    store.setPrefs({ unit: 'lb', mesocycleWeek: 3 });
    store.flush();
    assert.deepEqual(loadTrainingState(storage, NOW).state, store.getState());
  });
});

describe('ticking sets', () => {
  test("ticking counts toward today's sets and starts the day's timer", () => {
    const store = storeOn(new MemoryStorage({ hb_schemaVersion_v1: '3' }));
    assert.equal(store.toggleSet('legsA', 'legs-a1', 1), true);
    assert.equal(store.toggleSet('legsA', 'legs-a2', 1), true);
    const s = store.getState();
    assert.deepEqual(s.doneMap, { 'legs-a1-set1': true, 'legs-a2-set1': true });
    assert.deepEqual(s.sessionsMap, { [TODAY]: 2 });
    assert.deepEqual(s.timers, { legsA: NOW.getTime() });
  });

  test('unticking takes the set back off; the timer keeps running', () => {
    const store = storeOn(new MemoryStorage({ hb_schemaVersion_v1: '3' }));
    store.toggleSet('legsA', 'legs-a1', 1);
    assert.equal(store.toggleSet('legsA', 'legs-a1', 1), false);
    assert.deepEqual(store.getState().doneMap, {});
    assert.deepEqual(store.getState().sessionsMap, {});
    assert.deepEqual(store.getState().timers, { legsA: NOW.getTime() });
  });

  test('Reset Day clears that day only, and its timer; undo puts the ticks back', () => {
    const store = storeOn(new MemoryStorage({ hb_schemaVersion_v1: '3' }));
    store.toggleSet('legsA', 'legs-a1', 1);
    store.toggleSet('legsA', 'legs-a1', 2);
    store.toggleSet('pushA', 'push-a1', 1);
    const undo = store.resetDay('legsA');
    assert.deepEqual(store.getState().doneMap, { 'push-a1-set1': true });
    assert.deepEqual(store.getState().sessionsMap, { [TODAY]: 1 });
    assert.deepEqual(Object.keys(store.getState().timers), ['pushA']);
    undo();
    assert.deepEqual(store.getState().doneMap, { 'push-a1-set1': true, 'legs-a1-set1': true, 'legs-a1-set2': true });
    assert.deepEqual(store.getState().sessionsMap, { [TODAY]: 3 });
  });

  test('Reset Entire Week moves to the next training week (6 → 1); undo restores ticks and week', () => {
    const storage = new MemoryStorage({ hb_schemaVersion_v1: '3', hb_mesocycleWeek_v1: '6' });
    const store = storeOn(storage);
    store.toggleSet('legsA', 'legs-a1', 1);
    store.toggleSet('pullB', 'pull-b2', 3);
    const undo = store.resetWeek();
    assert.deepEqual(store.getState().doneMap, {});
    assert.deepEqual(store.getState().timers, {});
    assert.equal(store.getState().prefs.mesocycleWeek, 1);
    assert.equal(storage.data.get(STORAGE_KEYS.trainingWeek), '1');
    undo();
    assert.deepEqual(Object.keys(store.getState().doneMap), ['legs-a1-set1', 'pull-b2-set3']);
    assert.equal(store.getState().prefs.mesocycleWeek, 6);
    assert.deepEqual(store.getState().sessionsMap, { [TODAY]: 2 });
  });
});

describe('logging', () => {
  const lastWeek = '2026-11-17';
  const withHistory = () => {
    const storage = new MemoryStorage({
      hb_schemaVersion_v1: '3',
      hb_state_v1: JSON.stringify({
        doneMap: {}, notesMap: {}, sessionsMap: {},
        logMap: { 'legs-a1': { [lastWeek]: { 1: { w: '100', r: '8', rir: '' }, 2: { w: '102.5', r: '6', rir: '' } } }, 'push-a1': { [lastWeek]: { 1: { w: '40', r: '10' } } } },
      }),
    });
    return { storage, store: storeOn(storage) };
  };

  test("only the set that's logged is saved", () => {
    const { store } = withHistory();
    store.logSet('legs-a1', 1, { w: '95', r: '8', rir: '2' });
    assert.deepEqual(store.getState().logMap['legs-a1'][TODAY], { 1: { w: '95', r: '8', rir: '2' } });
  });

  test('beating every earlier set is a PR, and stays one when the set is edited again', () => {
    const { store } = withHistory();
    assert.equal(store.logSet('legs-a1', 1, { w: '105', r: '8', rir: '' }), true);
    assert.equal(store.logSet('legs-a1', 1, { w: '105', r: '8', rir: '1' }), true);
    assert.equal(store.logSet('legs-a1', 2, { w: '105', r: '8', rir: '' }), true); // today's other sets don't count against it
    assert.deepEqual(store.getState().logMap['legs-a1'][TODAY], {
      1: { w: '105', r: '8', rir: '1', pr: true },
      2: { w: '105', r: '8', rir: '', pr: true },
    });
    assert.equal(store.logSet('legs-a1', 2, { w: '102.5', r: '6', rir: '' }), false); // a tie isn't a record
    assert.equal(store.getState().logMap['legs-a1'][TODAY][2].pr, undefined);
  });

  test('PRs compare shown weights: in lb, 102.5004 kg and 102.5 kg both read 225.95, so no record', () => {
    const { store } = withHistory();
    store.setPrefs({ unit: 'lb' });
    assert.equal(store.logSet('legs-a1', 1, { w: '102.5004', r: '6', rir: '' }), false);
    assert.equal(store.logSet('legs-a1', 1, { w: '102.5', r: '7', rir: '' }), true);
  });

  test('clearing every box removes the set, then the day, then the exercise', () => {
    const { store } = withHistory();
    store.logSet('push-a2', 1, { w: '20', r: '', rir: '' });
    store.logSet('push-a2', 1, { w: '', r: '', rir: '' });
    assert.equal(store.getState().logMap['push-a2'], undefined);
    store.logSet('legs-a1', 1, { w: '', r: '', rir: '' });
    assert.deepEqual(Object.keys(store.getState().logMap['legs-a1']), [lastWeek]);
  });

  test('notes are saved under today; empty removes them', () => {
    const { store } = withHistory();
    store.setNote('legs-a1', 'brace harder');
    assert.deepEqual(store.getState().notesMap, { 'legs-a1': { [TODAY]: 'brace harder' } });
    store.setNote('legs-a1', '');
    assert.deepEqual(store.getState().notesMap, {});
  });

  test("a change to one exercise leaves every other exercise's data untouched (so its card doesn't re-render)", () => {
    const { store } = withHistory();
    const before = store.getState();
    let calls = 0;
    const stop = store.subscribe(() => calls++);
    store.logSet('legs-a1', 1, { w: '95', r: '8', rir: '' });
    stop();
    const after = store.getState();
    assert.equal(calls, 1);
    assert.notEqual(after.logMap, before.logMap);
    assert.equal(after.logMap['push-a1'], before.logMap['push-a1']);
    assert.equal(after.logMap['legs-a1'][lastWeek], before.logMap['legs-a1'][lastWeek]);
    assert.equal(after.doneMap, before.doneMap);
    assert.equal(after.prefs, before.prefs);
  });
});

describe('old backups', () => {
  const dir = join(process.cwd(), 'src/lib/training/fixtures');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    test(`${file} imports, saves, and loads back the same`, () => {
      const storage = new MemoryStorage({ hb_schemaVersion_v1: '3' });
      const store = storeOn(storage);
      store.logSet('legs-b1', 1, { w: '50', r: '10', rir: '' }); // existing progress
      const read = readBackup(readFileSync(join(dir, file), 'utf8'), EXERCISES, TODAY);
      assert.ok(read.ok);
      store.importBackup(read.contents);
      store.flush();
      const reloaded = storeOn(storage).getState();
      assert.deepEqual(reloaded, store.getState());
      // Sync can turn it into records without losing any tick or log.
      const records = flatten(reloaded);
      for (const key of Object.keys(reloaded.doneMap)) {
        const [, ex, set] = /^(.*)-set(\d+)$/.exec(key)!;
        assert.equal(records[`c|${ex}|${set}`], true, key);
      }
      // A file without logs keeps the logs already on the device.
      if (!read.contents.logMap) assert.ok(reloaded.logMap['legs-b1']);
    });
  }
});

describe('cloud sync', () => {
  test('readState / applyState carry everything between devices', () => {
    const phone = storeOn(new MemoryStorage({ hb_schemaVersion_v1: '3' }));
    phone.toggleSet('legsA', 'legs-a1', 1);
    phone.logSet('legs-a1', 1, { w: '100', r: '8', rir: '1' });
    phone.setNote('legs-a1', 'easy');
    phone.setPrefs({ unit: 'lb' });
    const laptopStorage = new MemoryStorage({ hb_schemaVersion_v1: '3' });
    const laptop = storeOn(laptopStorage);
    laptop.applyState(phone.readState());
    assert.deepEqual(laptop.getState(), phone.getState());
    assert.deepEqual(saved(laptopStorage).doneMap, { 'legs-a1-set1': true }); // saved at once
    assert.equal(laptopStorage.data.get(STORAGE_KEYS.unit), 'lb');
  });

  test('readState is a copy; applyState drops timers over 6 hours old', () => {
    const store = storeOn(new MemoryStorage({ hb_schemaVersion_v1: '3' }));
    const copy = store.readState();
    copy.doneMap['legs-a1-set1'] = true;
    assert.deepEqual(store.getState().doneMap, {});
    store.applyState({ ...emptyTrainingState(), timers: { legsA: NOW.getTime() - 7 * 3600_000, pushA: NOW.getTime() - 1000 } });
    assert.deepEqual(store.getState().timers, { pushA: NOW.getTime() - 1000 });
  });

  test("reload() picks up another tab's save", () => {
    const storage = new MemoryStorage({ hb_schemaVersion_v1: '3' });
    const tab1 = storeOn(storage);
    const tab2 = storeOn(storage);
    tab2.toggleSet('pushB', 'push-b1', 1);
    tab2.flush();
    tab1.reload();
    assert.deepEqual(tab1.getState().doneMap, { 'push-b1-set1': true });
  });
});
