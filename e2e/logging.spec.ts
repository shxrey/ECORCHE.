import { expect, test, type Page } from '@playwright/test';
import { card, dateKey, dot, enter, expand, openApp, reload, repsBox, row, saved, seed, weightBox } from './helpers';

const EX = 'legs-a1';
const yesterday = dateKey(-1);
const today = dateKey(0);

/** Yesterday: set 1 at 100 kg × 8, set 2 at 102.5 kg × 6. */
async function withYesterday(page: Page, extra?: Record<string, string>) {
  await seed(page, {
    logMap: { [EX]: { [yesterday]: { 1: { w: '100', r: '8', rir: '' }, 2: { w: '102.5', r: '6', rir: '' } } } },
    notesMap: { [EX]: { [yesterday]: 'elbows in' } },
    extra,
  });
  await openApp(page, '#legsA');
  await expand(page, EX);
}

test.describe('logging weight, reps and RIR', () => {
  test("suggests last session's numbers and shows last session and est. 1RM", async ({ page }) => {
    await withYesterday(page);
    await expect(weightBox(page, EX, 1)).toHaveValue('100');
    await expect(weightBox(page, EX, 1)).toHaveClass(/log-input-suggested/);
    await expect(repsBox(page, EX, 1)).toHaveValue('8');
    await expect(weightBox(page, EX, 2)).toHaveValue('102.5');
    await expect(page.locator(`#lastSession-${EX}`)).toHaveText('Last session: 102.5kg × 6');
    // Best Epley estimate from yesterday: 100 × (1 + 8/30) = 126.7
    await expect(page.locator(`#est1rm-${EX}`)).toHaveText('Est. 1RM: ~126.7kg');
  });

  test('a heavier set is logged, gets "▲ +5kg ready", and beating every past set is a PR', async ({ page }) => {
    await withYesterday(page);
    await enter(page, weightBox(page, EX, 1), '105');
    await expect(row(page, EX, 1).locator('.delta-badge')).toHaveText('▲ +5kg ready');
    await expect(row(page, EX, 1).locator('.pr-persistent-badge')).toBeVisible();
    const log = (await saved(page)).logMap[EX][today];
    expect(log['1']).toMatchObject({ w: '105', r: '8', pr: true });
  });

  test('more reps at the same weight reads "▲ +1 rep"; the same reads "hold"; less reads "below"', async ({ page }) => {
    await withYesterday(page);
    const badge = row(page, EX, 1).locator('.delta-badge');
    await enter(page, repsBox(page, EX, 1), '9');
    await expect(badge).toHaveText('▲ +1 rep');
    await enter(page, repsBox(page, EX, 1), '8');
    await expect(badge).toHaveText('— hold, rebuild reps');
    await enter(page, weightBox(page, EX, 1), '95');
    await expect(badge).toHaveText('▼ below last time');
  });

  test('ticking a set saves that set from its boxes, and only that set', async ({ page }) => {
    await withYesterday(page);
    await dot(page, EX, 1).click();
    const log = (await saved(page)).logMap[EX][today];
    expect(log['1']).toMatchObject({ w: '100', r: '8' });
    expect(log['2']).toBeUndefined();
    await expect(page.locator(`#lastLog-${EX}`)).toHaveText('Last: 100kg × 8');
  });

  // Old-page bug, fixed in the rebuild: typing in one set's box also saves the
  // suggested numbers sitting in the card's other rows as real sets (so here
  // set 2 gets 102.5 × 6 "logged", and "Last:" shows it).
  test("editing one set doesn't save the other rows' suggestions as sets", async ({ page }) => {
    await withYesterday(page);
    await enter(page, weightBox(page, EX, 1), '105');
    expect((await saved(page)).logMap[EX][today]['2']).toBeUndefined();
    await expect(page.locator(`#lastLog-${EX}`)).toHaveText('Last: 105kg × 8');
  });

  // Old-page bug, fixed in the rebuild: a re-save compares the set with its own
  // earlier save today, so typing the RIR after a PR wipes the PR.
  test('a PR stays a PR when the same set is edited again', async ({ page }) => {
    await withYesterday(page);
    await enter(page, weightBox(page, EX, 1), '110');
    await expect(row(page, EX, 1).locator('.pr-persistent-badge')).toBeVisible();
    await enter(page, row(page, EX, 1).locator('.log-rir'), '1');
    await expect(row(page, EX, 1).locator('.pr-persistent-badge')).toBeVisible();
    expect((await saved(page)).logMap[EX][today]['1']).toMatchObject({ w: '110', rir: '1', pr: true });
  });

  // Old-page bug, fixed in the rebuild: the lasting "PR" tag is only drawn when the
  // PR happens, never when the page loads, so a reload hides it.
  test('a PR still shows its tag after a reload', async ({ page }) => {
    await withYesterday(page);
    await enter(page, weightBox(page, EX, 1), '110');
    await expect(row(page, EX, 1).locator('.pr-persistent-badge')).toBeVisible();
    await saved(page);
    await reload(page);
    await expand(page, EX);
    await expect(row(page, EX, 1).locator('.pr-persistent-badge')).toBeVisible();
  });

  // Old-page bug, fixed in the rebuild: on narrower phones the row is
  // wider than the card, so badges run off its edge and are cut off (at 360px
  // wide, by 21-34px; at 375px by up to 19px; at 390px only "hold" by 4px).
  test('on a phone, every ▲ / hold / ▼ badge stays inside the card', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await seed(page, { logMap: { [EX]: { [yesterday]: { 1: { w: '100', r: '8', rir: '' }, 2: { w: '102.5', r: '6', rir: '' }, 3: { w: '100', r: '8', rir: '' } } } } });
    await openApp(page, '#legsA');
    await expand(page, EX);
    await enter(page, weightBox(page, EX, 1), '102.5');
    await enter(page, weightBox(page, EX, 3), '95');
    const badges = card(page, EX).locator('.delta-badge');
    await expect(badges).toHaveText(['▲ +2.5kg ready', '— hold, rebuild reps', '▼ below last time']);
    const edge = await card(page, EX).evaluate((el) => el.getBoundingClientRect().right);
    for (const right of await badges.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().right))) {
      expect(right).toBeLessThanOrEqual(edge);
    }
  });

  test('warm-up steps are 50 / 75 / 90% of set 1, rounded to 2.5 kg', async ({ page }) => {
    await withYesterday(page);
    await card(page, EX).getByRole('button', { name: 'Warmup %' }).click();
    await expect(page.locator(`#warmupCalc-${EX}`)).toHaveText('50%: 50kg75%: 75kg90%: 90kg');
  });

  test('kg/lb changes what is shown and typed; saved weights stay in kg', async ({ page }) => {
    await withYesterday(page);
    await page.locator('.unit-toggle [data-unit="lb"]').click();
    await expect(weightBox(page, EX, 1)).toHaveValue('220.45');
    await expect(page.locator(`#lastSession-${EX}`)).toHaveText('Last session: 225.95lb × 6');
    await enter(page, weightBox(page, EX, 1), '225');
    expect((await saved(page)).logMap[EX][today]['1'].w).toBe('102.06');
    await expect(row(page, EX, 1).locator('.delta-badge')).toHaveText('▲ +4.55lb ready');

    await reload(page);
    await expand(page, EX);
    await expect(page.locator('.unit-toggle [data-unit="lb"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(weightBox(page, EX, 1)).toHaveValue('225');
  });

  test("notes are saved under today's date; the last earlier note is shown", async ({ page }) => {
    await withYesterday(page);
    await expect(page.locator(`#lastNote-${EX}`)).toHaveText(`Last note (${yesterday}): elbows in`);
    await card(page, EX).locator('.exercise-notes').fill('seat 4');
    await expect.poll(async () => (await saved(page)).notesMap?.[EX]?.[today]).toBe('seat 4');
  });

  test('every log box has a screen-reader name', async ({ page }) => {
    await withYesterday(page);
    await expect(weightBox(page, EX, 2)).toHaveAttribute('aria-label', 'Seated Machine Shoulder Press, set 2, weight in kilograms');
    const unnamed = await page.evaluate(() =>
      [...document.querySelectorAll('.log-input, .exercise-notes')].filter(el => !el.getAttribute('aria-label')).length);
    expect(unnamed).toBe(0);
  });
});
