/**
 * Sync connected straight to the training store (the rebuilt core, /preview),
 * through trainingStoreBridge (npm run test:unit).
 */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { TrainingStore, type KeyValueStorage } from '../training/store';
import { trainingStoreBridge } from './adapters';
import { applyChanges, flatten } from './model';

const NOW = new Date(2026, 10, 25, 18, 0);

function memoryStore(): TrainingStore {
  const data = new Map<string, string>([['hb_schemaVersion_v1', '3']]);
  const storage: KeyValueStorage = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
  return new TrainingStore(storage, { now: () => NOW });
}

describe('sync through the training store', () => {
  test("the lifter's own changes are announced; what sync applies is not", () => {
    const store = memoryStore();
    const { bridge, onChange } = trainingStoreBridge(store);
    let changes = 0;
    const stop = onChange(() => changes++);
    store.toggleSet('legsA', 'legs-a1', 1);
    assert.equal(changes, 1);
    bridge.applyState({ ...store.readState(), doneMap: { 'pull-b1-set2': true } });
    assert.equal(changes, 1);
    assert.deepEqual(store.getState().doneMap, { 'pull-b1-set2': true });
    store.setNote('pull-b1', 'grip');
    assert.equal(changes, 2);
    stop();
    store.setNote('pull-b1', '');
    assert.equal(changes, 2);
  });

  test("a change pulled from another device lands in the store, as records sync understands", () => {
    const phone = memoryStore();
    const laptop = memoryStore();
    phone.toggleSet('pushA', 'push-a1', 1);
    phone.logSet('push-a1', 1, { w: '60', r: '10', rir: '1' });
    // Flatten on the phone, apply on the laptop: what sync_pull would deliver.
    const records = Object.entries(flatten(phone.readState())).map(([key, value]) => ({ key, value }));
    const laptopBridge = trainingStoreBridge(laptop).bridge;
    laptopBridge.applyState(applyChanges(laptopBridge.readState(), records));
    assert.deepEqual(flatten(laptop.readState()), flatten(phone.readState()));
    assert.equal(laptop.getState().doneMap['push-a1-set1'], true);
  });
});
