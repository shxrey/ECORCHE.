/**
 * The rebuilt training core (/preview) on real-shaped saved data, and its
 * compatibility with the live page: both must read and write the same data.
 * Runs in the "preview" project only (playwright.config.ts).
 */
import { expect, test, type Page } from '@playwright/test';
import { days, exercises } from '../src/content/program';
import { trainingWeekBanner, weekProgress } from '../src/lib/training/progress';
import { volumeLine } from '../src/lib/training/volume';
import type { TrainingState } from '../src/lib/training/types';
import { expectedCards, readCards, splitHeights } from './cards';
import { dot, saved, seed } from './helpers';
import { NOW, randomData, TODAY } from './random-data';

async function openAt(page: Page, path: string, hash = '#legsA') {
  await page.goto(path + hash);
  await page.waitForFunction(() => '__legacyBridge' in window || '__training' in window);
}

for (const [seedNo, unit] of [[1, 'kg'], [2, 'lb']] as const) {
  test(`every card's session log shows what the modules work out (random history #${seedNo}, ${unit})`, async ({ page }) => {
    const data = randomData(seedNo, unit);
    await page.clock.setFixedTime(NOW);
    await seed(page, data.seed);
    await openAt(page, '/preview');
    const shown = await readCards(page, { oldPage: false });
    const expected = expectedCards(data.state, { oldPage: false });
    const shownHeights = splitHeights(shown);
    const expectedHeights = splitHeights(expected);
    expect(shown).toEqual(expected);
    for (const ex of Object.keys(expectedHeights)) {
      expectedHeights[ex].forEach((h, i) => expect(shownHeights[ex][i], ex).toBeCloseTo(h, 2));
    }
  });
}

for (const seedNo of [11, 12]) {
  test(`saved progress shows exactly as the modules work it out (random history #${seedNo})`, async ({ page }) => {
    const { seed: data, state } = randomData(seedNo, 'kg');
    await page.clock.setFixedTime(NOW);
    await seed(page, data);
    await openAt(page, '/preview');

    // Every set button, on all six days.
    const shown = await page.evaluate(() =>
      Object.fromEntries([...document.querySelectorAll<HTMLElement>('.exercise-card')].map((card) => [
        card.dataset.exercise!,
        [...card.querySelectorAll('.set-dot')].map((d) => d.classList.contains('done')),
      ])),
    );
    for (const ex of exercises) {
      expect(shown[ex.key], ex.key).toEqual(ex.setDots.map((d) => !!state.doneMap[`${ex.key}-set${d.idx}`]));
    }

    // Day rings, tracker cards, the week ring and the banner.
    const week = weekProgress(state.doneMap);
    for (const day of days) {
      const cap = day.id[0].toUpperCase() + day.id.slice(1);
      const p = week.days[day.id as keyof typeof week.days];
      await expect(page.locator(`#ringText${cap}`)).toHaveText(`${p.done}/${p.total}`);
      await expect(page.locator(`#count${cap}`)).toHaveText(`${p.done}/${p.total} sets`);
    }
    await expect(page.locator('#masterRingSets')).toHaveText(`${week.done}/${week.total} sets`);
    await expect(page.locator('#mesocycleBanner')).toHaveText(trainingWeekBanner(state.prefs.mesocycleWeek).text);

    // Volume: "N logged so far · last trained …".
    const lines = await page.locator('.volume-card').evaluateAll((cards) =>
      cards.map((c) => [(c as HTMLElement).dataset.muscle!, c.querySelector('.volume-completed')?.textContent ?? null]),
    );
    for (const [muscle, line] of lines) expect(line, muscle!).toBe(volumeLine(muscle!, state.doneMap, state.logMap, TODAY));
  });
}

/** Everything the live page's old script holds, through its bridge. */
const legacyState = (page: Page) => page.evaluate(() => (window as unknown as { __legacyBridge: { readState(): TrainingState } }).__legacyBridge.readState());
/** Everything the preview's store holds. */
const storeState = (page: Page) => page.evaluate(() => (window as unknown as { __training: { readState(): TrainingState } }).__training.readState());

test('what the preview saves, the live page reads', async ({ page }) => {
  await openAt(page, '/preview');
  await dot(page, 'legs-a1', 1).click();
  await dot(page, 'legs-a1', 2).click();
  await page.locator('.unit-toggle [data-unit="lb"]').click();
  await page.locator('.auto-rest-toggle').click(); // the styled switch over the checkbox: Auto-Rest off
  await expect(page.locator('#autoRestToggle')).not.toBeChecked();
  await saved(page);
  const fromPreview = await storeState(page);
  expect(Object.keys(fromPreview.doneMap)).toEqual(['legs-a1-set1', 'legs-a1-set2']);

  await openAt(page, '/');
  expect(await legacyState(page)).toEqual(fromPreview);
});

test('what the live page saves, the preview reads', async ({ page }) => {
  await openAt(page, '/', '#pushB');
  await dot(page, 'push-b1', 1).click();
  await dot(page, 'push-b3', 2).click();
  await page.locator('#mbHighContrastBtn').evaluate((b: HTMLElement) => b.click());
  await saved(page);
  const fromLive = await legacyState(page);

  await openAt(page, '/preview', '#pushB');
  expect(await storeState(page)).toEqual(fromLive);
  await expect(dot(page, 'push-b3', 2)).toHaveClass(/done/);
  await expect(page.locator('body')).toHaveClass(/high-contrast/);
});
