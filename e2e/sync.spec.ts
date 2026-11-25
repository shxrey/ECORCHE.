import { expect, test } from '@playwright/test';
import { dateKey, dot, expand, openApp, weightBox } from './helpers';

/*
 * What cloud sync relies on (src/lib/sync, through trainingStoreBridge): the
 * training store reads the whole state, and replacing it re-draws the page
 * at once. (The old script's bridge offered the same; announcing changes is
 * checked in src/lib/sync/store-bridge.test.ts.)
 */
type Store = { readState(): Record<string, unknown>; applyState(s: unknown): void };
const today = dateKey(0);

test.describe('what sync relies on', () => {
  test('readState reports every map, the running timers and every preference', async ({ page }) => {
    await openApp(page);
    await dot(page, 'legs-a1', 1).click();
    const state = await page.evaluate(() => (window as unknown as { __training: Store }).__training.readState());
    expect(state).toMatchObject({
      doneMap: { 'legs-a1-set1': true },
      logMap: {}, // ticking a set with empty boxes logs nothing
      notesMap: {},
      sessionsMap: { [today]: 1 },
      timers: { legsA: expect.any(Number) },
      prefs: { autoRest: true, audio: true, highContrast: false, mesocycleWeek: 1, unit: 'kg' },
    });
  });

  test('applyState shows the new state straight away, like an import', async ({ page }) => {
    await openApp(page);
    await page.evaluate(today => {
      const bridge = (window as unknown as { __training: Store }).__training;
      const s = bridge.readState() as { doneMap: object; logMap: object; prefs: object };
      bridge.applyState({
        ...s,
        doneMap: { 'legs-a2-set1': true },
        logMap: { 'legs-a1': { [today]: { 1: { w: '90', r: '10', rir: '' } } } },
        prefs: { ...s.prefs, unit: 'lb', mesocycleWeek: 3 },
      });
    }, today);
    await expect(dot(page, 'legs-a2', 1)).toHaveClass(/done/);
    await expect(page.locator('#mesocycleBanner')).toHaveText('Week 3 of 6');
    await expect(page.locator('.unit-toggle [data-unit="lb"]')).toHaveAttribute('aria-pressed', 'true');
    await expand(page, 'legs-a1');
    await expect(weightBox(page, 'legs-a1', 1)).toHaveValue('198.4');
  });
});
