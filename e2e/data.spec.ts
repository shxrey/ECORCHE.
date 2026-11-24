import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { confirmDialog, dateKey, dot, expand, openApp, seed, weightBox } from './helpers';

const yesterday = dateKey(-1);

test.describe('backups and exports', () => {
  test('Export Backup saves everything, and importing it on a fresh device restores it', async ({ page, browser }) => {
    test.slow(); // two full page loads
    await seed(page, { logMap: { 'legs-a1': { [yesterday]: { 1: { w: '100', r: '8', rir: '1' } } } } });
    await openApp(page);
    await dot(page, 'legs-a2', 1).click();

    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export Backup' }).click()]);
    expect(download.suggestedFilename()).toBe(`ecorche-backup-${dateKey(0)}.json`);
    const file = await download.path();
    const backup = JSON.parse(readFileSync(file, 'utf8'));
    expect(backup).toMatchObject({
      app: 'hypertrophy-blueprint',
      schemaVersion: 3,
      doneMap: { 'legs-a2-set1': true },
      logMap: { 'legs-a1': { [yesterday]: { 1: { w: '100', r: '8', rir: '1' } } } },
      preferences: { autoRestEnabled: true, audioEnabled: true, weightUnit: 'kg' },
    });

    // A brand-new browser (another phone): import the file.
    const fresh = await browser.newPage();
    await openApp(fresh);
    await fresh.locator('#importFileInput').setInputFiles(file);
    await confirmDialog(fresh);
    await expect(fresh.locator('#toastStack')).toContainText('Progress imported successfully.');
    await expect(dot(fresh, 'legs-a2', 1)).toHaveClass(/done/);
    await expand(fresh, 'legs-a1');
    await expect(weightBox(fresh, 'legs-a1', 1)).toHaveValue('100');
    await fresh.close();
  });

  test('a file that is not a backup is refused and changes nothing', async ({ page }) => {
    await openApp(page);
    await dot(page, 'legs-a1', 1).click();
    await page.locator('#importFileInput').setInputFiles({ name: 'notes.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') });
    await expect(page.locator('#toastStack')).toContainText(/not look like|could not import/i);
    await expect(dot(page, 'legs-a1', 1)).toHaveClass(/done/);
  });

  test('Export CSV has a header and one row per logged set', async ({ page }) => {
    await seed(page, { logMap: { 'legs-a1': { [yesterday]: { 1: { w: '100', r: '8', rir: '1' }, 2: { w: '102.5', r: '6', rir: '' } } } } });
    await openApp(page);
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export CSV' }).click()]);
    expect(download.suggestedFilename()).toBe(`ecorche-log-${dateKey(0)}.csv`);
    const lines = readFileSync(await download.path(), 'utf8').split('\r\n');
    expect(lines).toEqual(['date,exercise,set,weight_kg,reps,rir', `${yesterday},legs-a1,1,100,8,1`, `${yesterday},legs-a1,2,102.5,6,`]);
  });

  test("View History counts this week's sets", async ({ page }) => {
    // A Wednesday: on Sundays the old page files the day's sets under last week (test below).
    await page.clock.setFixedTime(new Date(2026, 10, 25, 15, 0));
    await openApp(page);
    await dot(page, 'legs-a1', 1).click();
    await dot(page, 'legs-a1', 2).click();
    await page.getByRole('button', { name: 'View History' }).click();
    await expect(page.locator('#historyModalOverlay')).toHaveClass(/open/);
    await expect(page.locator('#histThisWeek')).toContainText('2');
  });

  // Known bug, fixed in Phase 3d: the week's start keeps the current time of
  // day, so on a Sunday afternoon that morning's sets count as last week and
  // "this week" reads 0. (Every other day, weeks already run Monday–Sunday.)
  test.fixme("on a Sunday, View History counts that day's sets in this week", async ({ page }) => {
    await page.clock.setFixedTime(new Date(2026, 10, 29, 15, 0)); // Sunday
    await openApp(page);
    await dot(page, 'legs-a1', 1).click();
    await page.getByRole('button', { name: 'View History' }).click();
    await expect(page.locator('#histThisWeek')).toHaveText('1');
  });
});
