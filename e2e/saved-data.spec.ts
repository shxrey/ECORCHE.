/**
 * The page on real-shaped saved data: random but repeatable workout
 * histories (a fixed seed per test) must show exactly what the training
 * modules work out. (Until the switch-over on 25 Nov 2026 this also checked
 * that the old page and the rebuilt core read each other's saves.)
 */
import { expect, test } from '@playwright/test';
import { days, exercises } from '../src/content/program';
import { trainingWeekBanner, weekProgress } from '../src/lib/training/progress';
import { volumeLine } from '../src/lib/training/volume';
import { expectedCards, readCards, splitHeights } from './cards';
import { openApp, seed } from './helpers';
import { NOW, randomData, TODAY } from './random-data';

for (const [seedNo, unit] of [[1, 'kg'], [2, 'lb']] as const) {
  test(`every card's session log shows what the modules work out (random history #${seedNo}, ${unit})`, async ({ page }) => {
    const data = randomData(seedNo, unit);
    await page.clock.setFixedTime(NOW);
    await seed(page, data.seed);
    await openApp(page);
    const shown = await readCards(page);
    const expected = expectedCards(data.state);
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
    await openApp(page);

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
