import { expect, type Page } from '@playwright/test';

type LogEntry = { w?: string; r?: string; rir?: string; pr?: boolean };

/** The page has booted: its training store is up (TrainingRuntime). */
export async function appReady(page: Page) {
  await page.waitForFunction(() => '__training' in window);
}

export interface Seed {
  doneMap?: Record<string, boolean>;
  logMap?: Record<string, Record<string, Record<string, LogEntry>>>;
  notesMap?: Record<string, Record<string, string>>;
  sessionsMap?: Record<string, number>;
  /** Other localStorage keys (preferences), stored as given. */
  extra?: Record<string, string>;
}

/** A local-date key ("YYYY-MM-DD") `days` from today, the way the app makes them. */
export function dateKey(days = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Puts saved progress in place before the first load, like a returning lifter's phone. */
export async function seed(page: Page, s: Seed) {
  await page.addInitScript((s: Seed) => {
    // First load only: after that, reloads must see what the app itself saved.
    if (sessionStorage.getItem('__seeded')) return;
    sessionStorage.setItem('__seeded', '1');
    localStorage.setItem('hb_state_v1', JSON.stringify({
      doneMap: s.doneMap ?? {}, logMap: s.logMap ?? {}, notesMap: s.notesMap ?? {}, sessionsMap: s.sessionsMap ?? {},
    }));
    localStorage.setItem('hb_schemaVersion_v1', '3');
    for (const [k, v] of Object.entries(s.extra ?? {})) localStorage.setItem(k, v);
  }, s);
}

/** Opens the protocol page and waits for it to finish booting. */
export async function openApp(page: Page, hash = '#legsA') {
  await page.goto('/' + hash);
  await appReady(page);
}

export async function reload(page: Page) {
  await page.reload();
  await appReady(page);
}

export const card = (page: Page, ex: string) => page.locator(`.exercise-card[data-exercise="${ex}"]`);
export const dot = (page: Page, ex: string, set: number) => card(page, ex).locator(`.set-dot[data-set-idx="${set}"]`);
export const row = (page: Page, ex: string, set: number) => card(page, ex).locator('.set-log-row').nth(set - 1);
export const weightBox = (page: Page, ex: string, set: number) => row(page, ex, set).locator('.log-weight');
export const repsBox = (page: Page, ex: string, set: number) => row(page, ex, set).locator('.log-reps');

/** Opens an exercise card (clicking its title side, away from the set buttons). */
export async function expand(page: Page, ex: string) {
  const header = card(page, ex).locator('.exercise-header');
  if ((await header.getAttribute('aria-expanded')) !== 'true') await header.click({ position: { x: 24, y: 24 } });
  await expect(header).toHaveAttribute('aria-expanded', 'true');
}

/** Types into a box and leaves it, which is when the app saves. */
export async function enter(page: Page, box: ReturnType<typeof weightBox>, value: string) {
  await box.fill(value);
  await box.press('Tab');
}

/** What the app has saved, after skipping its half-second save delay. */
export async function saved(page: Page) {
  return page.evaluate(() => {
    (window as unknown as { __training: { flush(): void } }).__training.flush();
    return JSON.parse(localStorage.getItem('hb_state_v1') || '{}');
  });
}

/** Clicks Confirm in the app's "Are you sure?" dialog. */
export async function confirmDialog(page: Page) {
  const dialog = page.locator('#confirmModalOverlay');
  await expect(dialog).toHaveClass(/open/);
  await dialog.getByRole('button', { name: 'Confirm' }).click();
  await expect(dialog).not.toHaveClass(/open/);
}
