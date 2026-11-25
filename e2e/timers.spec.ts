import { expect, test, type Page } from '@playwright/test';
import { card, confirmDialog, dot, expand, openApp, reload } from './helpers';

/** Scrolls to the workout so the sticky mini-bar (and its buttons) appears. */
async function showMinibar(page: Page) {
  await page.locator('#legsA').scrollIntoViewIfNeeded();
  await expect(page.locator('#sessionMinibar')).toHaveClass(/visible/);
}

test.describe('timers', () => {
  test('ticking a set starts the rest timer (Auto-Rest is on by default)', async ({ page }) => {
    await openApp(page);
    await dot(page, 'legs-a1', 1).click();
    await expect(page.locator('#restTimer')).toHaveClass(/visible/);
    await expect(page.locator('#rtTime')).toHaveText(/^\d+:\d\d$/);
  });

  test('with Auto-Rest off, ticking a set does not start it, and the choice is remembered', async ({ page }) => {
    await openApp(page);
    await page.locator('label.auto-rest-toggle').click();
    await expect(page.locator('#autoRestToggle')).not.toBeChecked();
    await dot(page, 'legs-a1', 1).click();
    await expect(page.locator('#restTimer')).not.toHaveClass(/visible/);
    await reload(page);
    await expect(page.locator('#autoRestToggle')).not.toBeChecked();
  });

  test('the rest timer takes ±15 seconds, counts down in the session bar too, and closes', async ({ page }) => {
    await openApp(page);
    await dot(page, 'legs-a1', 1).click();
    await expect(page.locator('#restTimer')).toHaveClass(/visible/);
    const seconds = async () => {
      const [m, sec] = (await page.locator('#rtTime').textContent())!.split(':').map(Number);
      return m * 60 + sec;
    };
    const before = await seconds();
    await page.getByRole('button', { name: 'Add 15 seconds' }).click();
    const added = await seconds();
    expect(added).toBeGreaterThanOrEqual(before + 13);
    expect(added).toBeLessThanOrEqual(before + 15);
    await page.getByRole('button', { name: 'Subtract 15 seconds' }).click();
    expect(await seconds()).toBeLessThanOrEqual(before);
    await expect(page.locator('#mbRest')).toHaveText(/^\d+:\d\d rest$/);

    await page.getByRole('button', { name: 'Dismiss timer' }).click();
    await expect(page.locator('#restTimer')).not.toHaveClass(/visible/);
    await expect(page.locator('#mbRest')).toHaveText('');
  });

  test("the session timer starts with the day's first set and resets with the day", async ({ page }) => {
    await openApp(page);
    await expect(page.locator('#mbSessionTimer')).toHaveText('00:00');
    await dot(page, 'legs-a1', 1).click();
    await expect(page.locator('#mbSessionTimer')).not.toHaveText('00:00', { timeout: 4000 });
    expect(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('hb_sessionTimerStarts_v1') || '{}')))).toEqual(['legsA']);

    await page.locator('#legsA').getByRole('button', { name: /^Reset/ }).first().click();
    await confirmDialog(page);
    await expect(page.locator('#mbSessionTimer')).toHaveText('00:00');
    expect(await page.evaluate(() => localStorage.getItem('hb_sessionTimerStarts_v1'))).toBe('{}');
  });
});

test.describe('Workout Mode and gym settings', () => {
  test('Start Workout enters Workout Mode and Finish Workout leaves it', async ({ page }) => {
    await openApp(page);
    const button = page.locator('#legsA .progress-kiosk-btn');
    await button.click();
    await expect(page.locator('body')).toHaveClass(/kiosk-mode/);
    await expect(button).toHaveText('Finish Workout');
    await button.click();
    await expect(page.locator('body')).not.toHaveClass(/kiosk-mode/);
    await expect(button).toHaveText('Start Workout');
  });

  test('Workout Mode folds away the rest of the page and keeps the session bar up', async ({ page }) => {
    await openApp(page);
    await page.locator('#legsA .progress-kiosk-btn').click();
    await expect(page.locator('.hero')).toBeHidden();
    await expect(page.locator('#tracker')).toBeHidden();
    await expect(page.locator('#sessionMinibar')).toHaveClass(/visible/);
    await expect(page.locator('#kioskMinibarBtn')).toHaveText('Finish Workout');

    await page.locator('#kioskMinibarBtn').click();
    await expect(page.locator('body')).not.toHaveClass(/kiosk-mode/);
    await expect(page.locator('.hero')).toBeVisible();
    await expect(page.locator('#legsA .progress-kiosk-btn')).toHaveText('Start Workout');
  });

  test('Escape first closes an open dialog, then leaves Workout Mode', async ({ page }) => {
    await openApp(page);
    await page.locator('#legsA .progress-kiosk-btn').click();
    await expect(page.locator('body')).toHaveClass(/kiosk-mode/);
    await page.locator('#legsA').getByRole('button', { name: /^Reset/ }).first().click();
    await expect(page.locator('#confirmModalOverlay')).toHaveClass(/open/);

    await page.keyboard.press('Escape');
    await expect(page.locator('#confirmModalOverlay')).not.toHaveClass(/open/);
    await expect(page.locator('body')).toHaveClass(/kiosk-mode/);
    await page.keyboard.press('Escape');
    await expect(page.locator('body')).not.toHaveClass(/kiosk-mode/);
  });

  test('in Workout Mode an open exercise says what comes next, and finishing it folds it away', async ({ page }) => {
    await openApp(page);
    await expand(page, 'legs-a3');
    await page.locator('#legsA .progress-kiosk-btn').click();
    const teaser = card(page, 'legs-a3').locator('.next-up-teaser');
    await expect(teaser).toHaveText(/^Next: Barbell Romanian Deadlifts/);
    await expect(teaser).toBeVisible();

    await dot(page, 'legs-a3', 1).click(); // its only set
    await expect(card(page, 'legs-a3')).toHaveClass(/exercise-complete/);
    await expect(card(page, 'legs-a3')).not.toHaveClass(/expanded/);
  });

  test('high contrast and voice cues are remembered after a reload', async ({ page }) => {
    await openApp(page);
    await showMinibar(page);
    await page.locator('#mbHighContrastBtn').click();
    await page.locator('#mbAudioBtn').click();
    await expect(page.locator('body')).toHaveClass(/high-contrast/);
    await expect(page.locator('#mbAudioBtn')).toHaveAttribute('aria-pressed', 'false');

    await reload(page);
    await expect(page.locator('body')).toHaveClass(/high-contrast/);
    await expect(page.locator('#mbHighContrastBtn')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#mbAudioBtn')).toHaveAttribute('aria-pressed', 'false');
  });

  test('the tempo pacer turns on and off', async ({ page }) => {
    await openApp(page);
    await showMinibar(page);
    await page.locator('#mbTempoBtn').click();
    await expect(page.locator('#tempoPacer')).toHaveClass(/visible/);
    await expect(page.locator('#mbTempoBtn')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#mbTempoBtn').click();
    await expect(page.locator('#tempoPacer')).not.toHaveClass(/visible/);
  });
});
