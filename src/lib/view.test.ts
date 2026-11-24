/** The which-day-is-showing store (npm run test:unit). Browser behaviour: e2e/shell.spec.ts. */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { createViewStore, dayHash, DEFAULT_VIEW, parseDayHash, type Address } from './view';

function fakeAddress(hash = '') {
  const writes: string[] = [];
  const address: Address & { hash: string; writes: string[] } = {
    hash,
    writes,
    readHash: () => address.hash,
    replaceHash: (h) => {
      address.hash = h;
      writes.push(h);
    },
  };
  return address;
}

describe('day addresses', () => {
  test('"#pushB" and friends, in any case; anything else is not a day', () => {
    assert.deepEqual(parseDayHash('#pushB'), { group: 'push', day: 'B' });
    assert.deepEqual(parseDayHash('legsa'), { group: 'legs', day: 'A' });
    assert.deepEqual(parseDayHash('#PULLb'), { group: 'pull', day: 'B' });
    for (const other of ['', '#', '#sources', '#pushC', '#push', '#pushBB', '#workout']) assert.equal(parseDayHash(other), null, other);
    assert.equal(dayHash({ group: 'pull', day: 'B' }), '#pullB');
  });
});

describe('the view store', () => {
  test('starts from the address, else Legs A', () => {
    assert.deepEqual(createViewStore(fakeAddress('#pullB')).get(), { group: 'pull', day: 'B' });
    assert.deepEqual(createViewStore(fakeAddress('#sources')).get(), DEFAULT_VIEW);
    assert.deepEqual(createViewStore(fakeAddress()).get(), DEFAULT_VIEW);
  });

  test('writes the shown day into the address on request (the page does on load)', () => {
    const address = fakeAddress('#sources');
    const store = createViewStore(address);
    assert.deepEqual(address.writes, []); // nothing until asked
    store.writeAddress();
    assert.equal(address.hash, '#legsA');
  });

  test('switching group keeps the day letter, and the other way round', () => {
    const address = fakeAddress('#legsB');
    const store = createViewStore(address);
    store.showGroup('push');
    assert.deepEqual(store.get(), { group: 'push', day: 'B' });
    store.showDay('A');
    assert.deepEqual(store.get(), { group: 'push', day: 'A' });
    assert.deepEqual(address.writes, ['#pushB', '#pushA']);
  });

  test('every change is announced once; choosing the shown day changes nothing', () => {
    const address = fakeAddress();
    const store = createViewStore(address);
    let calls = 0;
    const stop = store.subscribe(() => calls++);
    store.show('legs', 'A');
    store.showDay('A');
    assert.equal(calls, 0);
    assert.deepEqual(address.writes, []);
    const before = store.get();
    store.show('pull', 'A');
    assert.equal(calls, 1);
    assert.notEqual(store.get(), before); // a new object, so React sees the change
    stop();
    store.show('push', 'B');
    assert.equal(calls, 1);
  });

  test('follows the address when it changes to a day, and ignores other anchors', () => {
    const address = fakeAddress('#legsA');
    const store = createViewStore(address);
    address.hash = '#pullB';
    store.followAddress();
    assert.deepEqual(store.get(), { group: 'pull', day: 'B' });
    address.hash = '#sources';
    store.followAddress();
    assert.deepEqual(store.get(), { group: 'pull', day: 'B' });
  });

  test('a listener can switch the day without losing other listeners', () => {
    const store = createViewStore(fakeAddress());
    const seen: string[] = [];
    store.subscribe(() => seen.push('first ' + dayHash(store.get())));
    store.subscribe(() => seen.push('second ' + dayHash(store.get())));
    store.show('push', 'A');
    assert.deepEqual(seen, ['first #pushA', 'second #pushA']);
  });
});
