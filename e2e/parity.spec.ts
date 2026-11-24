/**
 * Parity: the new training modules (src/lib/training) against the old app,
 * running in the browser on the same data. Random but repeatable workout
 * histories (a fixed seed per test) are loaded into the old page; every line,
 * box, badge and count it shows must match what the modules work out.
 *
 * The clock is fixed to a Wednesday so both sides agree on "today" (and the
 * old app's Sunday week-count bug, fixed in the modules, can't show up).
 *
 * Differences that are deliberate bug fixes are listed where they apply.
 * Set BACKUP_DIR to a folder of real backup files to also import each of
 * them both ways (nothing from the files is printed).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { exercises } from '../src/content/program';
import { applyBackup, buildBackup, readBackup } from '../src/lib/training/backup';
import { csvCell, logToCsv } from '../src/lib/training/csv';
import { formatRecency } from '../src/lib/training/dates';
import { DAY_IDS, recentDays, trainingWeekBanner, weekProgress, weeklySetCounts } from '../src/lib/training/progress';
import { estimate1RM } from '../src/lib/training/strength';
import { loadTrainingState, TrainingStore, type KeyValueStorage } from '../src/lib/training/store';
import type { TrainingState } from '../src/lib/training/types';
import { formatEstimate, inputToKg, toUnit, weightToInput } from '../src/lib/training/units';
import { volumeLine } from '../src/lib/training/volume';
import { expectedCards, readCards, splitHeights } from './cards';
import { confirmDialog, type Seed } from './helpers';
import { daysFromToday, NOW, randomData, TODAY } from './random-data';

const EXERCISE_KEYS = new Set(exercises.map((e) => e.key));

// ---------- the old page ----------

type Fn = (...args: unknown[]) => unknown;
/** The old script's global functions used here. */
type Legacy = Record<'estimate1RM' | 'toUnit' | 'weightToInput' | 'inputToKg' | 'formatEstimate' | 'csvEscape' | 'formatRecency'
  | 'openHistoryModal', Fn>
  & { __legacyBridge: { readState(): TrainingState } };

async function openOldApp(page: Page, seed: Seed) {
  await page.clock.setFixedTime(NOW);
  await page.addInitScript((s: Seed) => {
    if (sessionStorage.getItem('__seeded')) return;
    sessionStorage.setItem('__seeded', '1');
    localStorage.setItem('hb_state_v1', JSON.stringify({ doneMap: s.doneMap ?? {}, logMap: s.logMap ?? {}, notesMap: s.notesMap ?? {}, sessionsMap: s.sessionsMap ?? {} }));
    localStorage.setItem('hb_schemaVersion_v1', '3');
    for (const [k, v] of Object.entries(s.extra ?? {})) localStorage.setItem(k, v);
  }, seed);
  await page.goto('/#legsA');
  await page.waitForFunction(() => '__legacyBridge' in window);
}

const jsonCopy = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

for (const [seedNo, unit] of [[1, 'kg'], [2, 'lb'], [3, 'kg'], [4, 'lb']] as const) {
  test(`every card shows what the modules work out (random history #${seedNo}, ${unit})`, async ({ page }) => {
    const data = randomData(seedNo, unit);
    await openOldApp(page, data.seed);
    const shown = await readCards(page, { oldPage: true });
    const expected = expectedCards(data.state, { oldPage: true });
    const shownHeights = splitHeights(shown);
    const expectedHeights = splitHeights(expected);
    expect(shown).toEqual(expected);
    for (const ex of Object.keys(expectedHeights)) {
      expectedHeights[ex].forEach((h, i) => expect(shownHeights[ex][i], ex).toBeCloseTo(h, 2));
    }
  });
}

test('progress, training week, volume, history and both exports match', async ({ page }) => {
  const { seed, state } = randomData(5, 'lb');
  await openOldApp(page, seed);

  // Day and week progress.
  const week = weekProgress(state.doneMap);
  for (const id of DAY_IDS) {
    const name = id[0].toUpperCase() + id.slice(1);
    await expect(page.locator(`#ringText${name}`)).toHaveText(`${week.days[id].done}/${week.days[id].total}`);
    await expect(page.locator(`#count${name}`)).toHaveText(`${week.days[id].done}/${week.days[id].total} sets`);
  }
  await expect(page.locator('#masterRingSets')).toHaveText(`${week.done}/${week.total} sets`);
  await expect(page.locator('#masterRingText')).toHaveText(`${Math.round(week.fraction * 100)}%`);

  // Training week banner.
  const banner = trainingWeekBanner(state.prefs.mesocycleWeek);
  await expect(page.locator('#mesocycleBanner')).toHaveText(banner.text);

  // Volume: "N logged so far · last trained …" per muscle.
  const volume = await page.locator('.volume-card').evaluateAll((cards) => cards.map((c) => [
    c.querySelector('.volume-card-top h4')!.childNodes[0].textContent!.trim(),
    c.querySelector('.volume-completed')?.textContent ?? null,
  ]));
  expect(volume.length).toBe(14);
  for (const [muscle, line] of volume) expect(line, muscle!).toBe(volumeLine(muscle!, state.doneMap, state.logMap, TODAY));

  // View History: this week / last week, and the 14-day bars.
  await page.evaluate(() => (window as unknown as Legacy).openHistoryModal());
  const counts = weeklySetCounts(state.sessionsMap, NOW);
  await expect(page.locator('#histThisWeek')).toHaveText(String(counts.thisWeek));
  await expect(page.locator('#histLastWeek')).toHaveText(String(counts.lastWeek));
  const bars = await page.locator('#historySparkline .hs-bar').evaluateAll((els) => els.map((e) => (e as HTMLElement).title));
  expect(bars).toEqual(recentDays(state.sessionsMap, NOW).map((d) => `${d.date}: ${d.sets} sets`));
  await page.keyboard.press('Escape');
  await page.evaluate(() => document.getElementById('historyModalOverlay')!.classList.remove('open'));

  // Export CSV.
  const [csv] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export CSV' }).click()]);
  expect(readFileSync(await csv.path(), 'utf8')).toBe(logToCsv(state.logMap, 'lb'));

  // Export Backup: the whole file, byte for byte.
  const [backup] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export Backup' }).click()]);
  expect(readFileSync(await backup.path(), 'utf8')).toBe(JSON.stringify(buildBackup(state, NOW), null, 2));
});

test('the small rules agree on a grid of inputs', async ({ browser }) => {
  const inputs = ['', '0', '1', '8', '12', '2.5', '100', '102.5', '220.45', '225', 'abc', '-5', 100, 8, 0, null];
  const cells = ['plain', 'a,b', 'say "hi"', 'two\nlines', 'cr\r', ''];
  for (const unit of ['kg', 'lb'] as const) {
    const context = await browser.newContext();
    const fresh = await context.newPage();
    await openOldApp(fresh, { extra: { hb_weightUnit_v1: unit } });
    const old = await fresh.evaluate(([xs, cs]) => {
      const w = window as unknown as Legacy;
      return {
        e1rm: xs.flatMap((a) => xs.map((b) => w.estimate1RM(a, b))),
        toUnit: xs.map((x) => String(w.toUnit(x))),
        toInput: xs.map((x) => w.weightToInput(x)),
        toKg: xs.filter((x) => typeof x === 'string').map((x) => w.inputToKg(x)),
        estimate: [1, 99.99, 126.6666, 0.123].map((x) => w.formatEstimate(x)),
        csv: cs.map((x) => w.csvEscape(x)),
      };
    }, [inputs, cells] as const);
    expect(old).toEqual({
      e1rm: inputs.flatMap((a) => inputs.map((b) => estimate1RM(a, b))),
      toUnit: inputs.map((x) => String(toUnit(x, unit))),
      toInput: inputs.map((x) => weightToInput(x, unit)),
      toKg: inputs.filter((x): x is string => typeof x === 'string').map((x) => inputToKg(x, unit)),
      estimate: [1, 99.99, 126.6666, 0.123].map((x) => formatEstimate(x, unit)),
      csv: cells.map(csvCell),
    });
    const dates = [-40, -2, -1, 0, 1].map(daysFromToday);
    expect(await fresh.evaluate((ds) => ds.map((d) => (window as unknown as Legacy).formatRecency(d)), dates)).toEqual(dates.map((d) => formatRecency(d, TODAY)));
    await context.close();
  }
});

// ---------- saved data: the old page and the new store read each other ----------

/** The old page's localStorage, as a store-readable storage. */
async function storageOf(page: Page): Promise<KeyValueStorage> {
  const entries = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)!])));
  return { getItem: (k) => entries[k] ?? null, setItem: () => {} };
}

test('the store loads exactly what the old page holds, after using the old page', async ({ page }) => {
  const { seed } = randomData(6, 'kg');
  await openOldApp(page, seed);
  // Use the old page: tick sets (starts a timer), log a set, write a note, change preferences.
  await page.locator('.exercise-card[data-exercise="legs-a1"] .set-dot[data-set-idx="1"]').click();
  await page.locator('.exercise-card[data-exercise="legs-a2"] .set-dot[data-set-idx="2"]').click();
  await page.evaluate(() => {
    const w = window as unknown as Record<string, Fn>;
    w.setWeightUnit('lb');
    w.toggleHighContrast();
    w.flushUnifiedState();
  });
  const bridge = await page.evaluate(() => (window as unknown as Legacy).__legacyBridge.readState());
  const loaded = loadTrainingState(await storageOf(page), NOW).state;
  expect(jsonCopy(loaded)).toEqual(bridge);
  expect(Object.keys(loaded.timers)).toEqual(['legsA']);
  expect(loaded.prefs).toMatchObject({ unit: 'lb', highContrast: true });
});

test('the old page loads exactly what the store saved', async ({ page }) => {
  const saved = new Map<string, string>();
  const store = new TrainingStore({ getItem: (k) => saved.get(k) ?? null, setItem: (k, v) => void saved.set(k, v) }, { now: () => NOW });
  store.toggleSet('pushB', 'push-b1', 1);
  store.toggleSet('pushB', 'push-b1', 2);
  store.logSet('push-b1', 1, { w: '62.5', r: '10', rir: '1' });
  store.setNote('push-b1', 'pause at the chest');
  store.setPrefs({ unit: 'lb', audio: false, mesocycleWeek: 4 });
  store.flush();

  await page.clock.setFixedTime(NOW);
  await page.addInitScript((entries: [string, string][]) => {
    if (sessionStorage.getItem('__seeded')) return;
    sessionStorage.setItem('__seeded', '1');
    for (const [k, v] of entries) localStorage.setItem(k, v);
  }, [...saved]);
  await page.goto('/#pushB');
  await page.waitForFunction(() => '__legacyBridge' in window);
  expect(await page.evaluate(() => (window as unknown as Legacy).__legacyBridge.readState())).toEqual(jsonCopy(store.getState()));
  await expect(page.locator('#mesocycleBanner')).toHaveText('Week 4 of 6');
  await expect(page.locator('#ringTextPushB')).toHaveText('2/21');
});

// ---------- importing backups both ways ----------

const fixtureDir = join(process.cwd(), 'src/lib/training/fixtures');
const backupFiles = [
  ...readdirSync(fixtureDir).filter((f) => f.endsWith('.json')).map((f) => ({ name: f, path: join(fixtureDir, f) })),
  ...(process.env.BACKUP_DIR
    ? readdirSync(process.env.BACKUP_DIR).filter((f) => f.endsWith('.json')).map((f, i) => ({ name: `your backup #${i + 1}`, path: join(process.env.BACKUP_DIR!, f) }))
    : []),
];

for (const file of backupFiles) {
  test(`importing ${file.name} gives the same result as the old page`, async ({ page }) => {
    const { seed, state } = randomData(7, 'kg'); // existing progress, replaced or kept by the import
    await openOldApp(page, seed);
    await page.locator('#importFileInput').setInputFiles(file.path);
    await confirmDialog(page);
    await expect(page.locator('#toastStack')).toContainText('Progress imported successfully.');
    const old = await page.evaluate(() => (window as unknown as Legacy).__legacyBridge.readState());

    const read = readBackup(readFileSync(file.path, 'utf8'), EXERCISE_KEYS, TODAY);
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(old).toEqual(jsonCopy(applyBackup(state, read.contents)));
  });
}
