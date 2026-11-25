import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { appPath, confirmDialog, dateKey, dot, expand, openApp, seed, weightBox } from './helpers';

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

  // Known bug on the old page, fixed in the rebuild: the week's start keeps
  // the current time of day, so on a Sunday afternoon that morning's sets
  // count as last week and "this week" reads 0. (Every other day, weeks
  // already run Monday–Sunday.)
  test("on a Sunday, View History counts that day's sets in this week", async ({ page }) => {
    test.fixme(appPath() === '/', 'old page: Sunday counts as last week');
    await page.clock.setFixedTime(new Date(2026, 10, 29, 15, 0)); // Sunday
    await openApp(page);
    await dot(page, 'legs-a1', 1).click();
    await page.getByRole('button', { name: 'View History' }).click();
    await expect(page.locator('#histThisWeek')).toHaveText('1');
  });

  test('View History draws the last 14 days, today last, and closes with ✕, Escape or the backdrop', async ({ page }) => {
    await seed(page, { sessionsMap: { [dateKey(-3)]: 4, [dateKey(-20)]: 9 } });
    await openApp(page);
    await dot(page, 'legs-a1', 1).click();
    await dot(page, 'legs-a1', 2).click();
    const dialog = page.locator('#historyModalOverlay');
    const bars = page.locator('#historySparkline .hs-bar');

    await page.getByRole('button', { name: 'View History' }).click();
    await expect(dialog).toHaveClass(/open/);
    await expect(bars).toHaveCount(14);
    await expect(bars.nth(13)).toHaveAttribute('title', `${dateKey(0)}: 2 sets`);
    await expect(bars.nth(13)).not.toHaveClass(/empty/);
    await expect(bars.nth(10)).toHaveAttribute('title', `${dateKey(-3)}: 4 sets`);
    await expect(bars.nth(10)).toHaveAttribute('style', /height: 74px/); // the busiest day is full height
    await expect(bars.nth(0)).toHaveClass(/empty/);
    await expect(bars.nth(0)).toHaveAttribute('style', /height: 3px/);

    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).not.toHaveClass(/open/);
    await page.getByRole('button', { name: 'View History' }).click();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toHaveClass(/open/);
    await page.getByRole('button', { name: 'View History' }).click();
    await dialog.click({ position: { x: 5, y: 5 } });
    await expect(dialog).not.toHaveClass(/open/);
  });

  test('cancelling an import changes nothing', async ({ page }) => {
    await openApp(page);
    await dot(page, 'legs-a1', 1).click();
    const other = { app: 'hypertrophy-blueprint', schemaVersion: 3, doneMap: { 'push-a1-set1': true } };
    await page.locator('#importFileInput').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(other)) });
    const dialog = page.locator('#confirmModalOverlay');
    await expect(dialog).toHaveClass(/open/);
    await expect(page.locator('#confirmModalMessage')).toHaveText(/^This backup contains 1 completed set\. Importing will replace/);
    await dialog.locator('.confirm-modal-actions').getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).not.toHaveClass(/open/);
    await expect(dot(page, 'legs-a1', 1)).toHaveClass(/done/);
    await expect(dot(page, 'push-a1', 1)).not.toHaveClass(/done/);
  });

  test('a file over 5 MB is refused', async ({ page }) => {
    await openApp(page);
    await page.locator('#importFileInput').setInputFiles({ name: 'big.json', mimeType: 'application/json', buffer: Buffer.alloc(5 * 1024 * 1024 + 1, 32) });
    await expect(page.locator('#toastStack')).toContainText('That file is too large to be a valid backup.');
    await expect(page.locator('#confirmModalOverlay')).not.toHaveClass(/open/);
  });
});

/** Stands in for Chrome's save dialog: the "file" is a list of what was written to it. */
async function fakeSaveDialog(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __backupWrites: string[]; __pickerName?: string; showSaveFilePicker: unknown };
    w.__backupWrites = [];
    w.showSaveFilePicker = async (options: { suggestedName: string }) => {
      w.__pickerName = options.suggestedName;
      return {
        createWritable: async () => {
          let text = '';
          return {
            write: async (chunk: string) => {
              text += chunk;
            },
            close: async () => {
              w.__backupWrites.push(text);
            },
          };
        },
      };
    };
  });
}

const backupWrites = (page: Page) =>
  page.evaluate(() => (window as unknown as { __backupWrites: string[] }).__backupWrites.map((t) => JSON.parse(t) as { app: string; doneMap: Record<string, boolean> }));

test.describe('auto-backup', () => {
  test('writes the chosen file at once and 5 seconds after a change, until turned off', async ({ page }) => {
    await fakeSaveDialog(page);
    await page.clock.install();
    await openApp(page);
    const button = page.locator('#autoBackupBtn');

    await button.click();
    await expect(button).toHaveText('Auto-Backup: On');
    await expect(button).toHaveClass(/active-toggle/);
    await expect(page.locator('#toastStack')).toContainText('Auto-backup enabled for this session.');
    expect(await page.evaluate(() => (window as unknown as { __pickerName: string }).__pickerName)).toBe('ecorche-autobackup.json');
    let writes = await backupWrites(page);
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({ app: 'hypertrophy-blueprint', doneMap: {} });

    await dot(page, 'legs-a1', 1).click();
    await dot(page, 'legs-a1', 2).click();
    await page.clock.runFor(6000);
    await expect.poll(async () => (await backupWrites(page)).length).toBe(2); // two taps, one write
    writes = await backupWrites(page);
    expect(writes[1].doneMap).toEqual({ 'legs-a1-set1': true, 'legs-a1-set2': true });

    await button.click();
    await expect(button).toHaveText('Enable Auto-Backup');
    await expect(button).not.toHaveClass(/active-toggle/);
    await expect(page.locator('#toastStack')).toContainText('Auto-backup turned off.');
    await dot(page, 'legs-a1', 3).click();
    await page.clock.runFor(6000);
    expect(await backupWrites(page)).toHaveLength(2);
  });

  test('a browser without the save dialog is told so, and nothing turns on', async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(window, 'showSaveFilePicker', { value: undefined, configurable: true }));
    await openApp(page);
    await page.locator('#autoBackupBtn').click();
    await expect(page.locator('#toastStack')).toContainText('Auto-backup needs a browser with File System Access support');
    await expect(page.locator('#autoBackupBtn')).toHaveText('Enable Auto-Backup');
  });
});
