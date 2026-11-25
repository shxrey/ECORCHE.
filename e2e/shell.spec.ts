import { expect, test, type Page } from '@playwright/test';
import { appReady, openApp } from './helpers';

/** The page around the workout: hero, which day is showing, nav, phone menu, scrolling effects. */

const hero = (page: Page) => ({
  title: page.locator('#heroTitle'),
  subtitle: page.locator('#heroSubtitle'),
  stats: page.locator('#heroStats .num'),
  tab: (g: string) => page.locator(`#groupTabs [data-tab-group="${g}"]`),
});

test.describe('hero and the day that is showing', () => {
  test('each group shows its own title, description and numbers', async ({ page }) => {
    await openApp(page, '#legsA');
    const h = hero(page);
    await expect(h.subtitle).toContainText('quads, hamstrings');
    await expect(h.stats).toHaveText(['7', '21', '6', '~65']);

    await h.tab('push').click();
    await expect(h.title).toHaveText(/PUSH DAY\s*PROTOCOL/);
    await expect(h.subtitle).toContainText('chest, shoulders');
    await expect(h.subtitle.locator('strong')).toHaveText('Schoenfeld, Helms, Trebs & Maeo');
    await expect(h.stats).toHaveText(['8', '21', '4', '~60']);
    await expect(h.tab('push')).toHaveClass(/active/);
    await expect(h.tab('legs')).not.toHaveClass(/active/);
    await expect(page.locator('body')).toHaveAttribute('data-group', 'push');

    await h.tab('pull').click();
    await expect(h.title).toHaveText(/PULL DAY\s*PROTOCOL/);
    await expect(h.stats).toHaveText(['8', '24', '5', '~68']);
    await expect(page.locator('#btnDayA')).toHaveClass(/active/);
  });

  test('before the page comes alive, the hero describes the whole program', async ({ request }) => {
    const html = await (await request.get('/')).text();
    expect(html).toMatch(/id="heroSubtitle">An evidence-based 6-day Push \/ Pull \/ Legs A-B split/);
    expect(html).toMatch(/id="heroTitle">LEG DAY<br\/?>/);
  });

  test('the old /preview address opens the page (a temporary redirect)', async ({ request }) => {
    const res = await request.get('/preview', { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(res.headers().location).toBe('/');
  });

  test('opening the site with no address shows Legs A and writes #legsA', async ({ page }) => {
    await page.goto('/');
    await appReady(page);
    await expect(page).toHaveURL(/#legsA$/);
    await expect(page.locator('#legsA')).toHaveClass(/active/);
  });

  test('changing the address switches the day', async ({ page }) => {
    await openApp(page, '#legsA');
    await page.evaluate(() => (location.hash = '#pushB'));
    await expect(page.locator('#pushB')).toHaveClass(/active/);
    await expect(page.locator('#legsA')).not.toHaveClass(/active/);
    await expect(hero(page).title).toHaveText(/PUSH DAY/);
    await expect(page.locator('#btnDayB')).toHaveClass(/active/);
  });

  test("a tracker day card jumps to that day and scrolls to the workout", async ({ page }) => {
    await openApp(page, '#legsA');
    await page.locator('.tracker-day-card[data-jump="pull"][data-day="B"]').click();
    await expect(page.locator('#pullB')).toHaveClass(/active/);
    await expect(page).toHaveURL(/#pullB$/);
    await expect(hero(page).tab('pull')).toHaveClass(/active/);
    await expect(page.locator('#workout')).toBeInViewport();
    await expect(page.locator('.tracker-day-card[data-jump="pull"][data-day="B"]')).toHaveClass(/active-day/);
  });

  test('in Workout Mode, swiping left and right switches between Day A and B', async ({ page }) => {
    await openApp(page, '#legsA');
    await page.locator('#legsA .progress-kiosk-btn').click();
    await expect(page.locator('body')).toHaveClass(/kiosk-mode/);
    const swipe = (fromX: number, toX: number) =>
      page.evaluate(([a, b]) => {
        const at = (x: number) => new Touch({ identifier: 1, target: document.body, clientX: x, clientY: 400 });
        document.dispatchEvent(new TouchEvent('touchstart', { touches: [at(a)], changedTouches: [at(a)] }));
        document.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [at(b)] }));
      }, [fromX, toX]);
    await swipe(300, 100);
    await expect(page.locator('#legsB')).toHaveClass(/active/);
    await expect(page).toHaveURL(/#legsB$/);
    await swipe(100, 300);
    await expect(page.locator('#legsA')).toHaveClass(/active/);
  });
});

test.describe('nav, phone menu and scrolling', () => {
  test('nav links scroll smoothly to their section and leave the address alone', async ({ page }) => {
    await openApp(page, '#legsA');
    await page.locator('.nav-links a', { hasText: 'Sources' }).click();
    await expect(page.locator('#sources')).toBeInViewport();
    await expect(page).toHaveURL(/#legsA$/);
  });

  test('the phone menu opens, keeps focus inside, and closes with Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openApp(page, '#legsA');
    const button = page.locator('#hamburgerBtn');
    const drawer = page.locator('#mobileDrawer');
    await button.click();
    await expect(drawer).toHaveClass(/open/);
    await expect(button).toHaveClass(/open/);
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
    await expect(drawer.getByRole('button', { name: 'Close menu' })).toBeFocused();

    // Wraps round to the menu's last item (the account's "Sign in", added after load, when accounts are on).
    await page.keyboard.press('Shift+Tab');
    await expect(drawer.locator('a, button').last()).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(drawer.getByRole('button', { name: 'Close menu' })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(drawer).not.toHaveClass(/open/);
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
    await expect(button).toBeFocused();
  });

  test('a phone menu link closes the menu and scrolls to its section', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openApp(page, '#legsA');
    await page.locator('#hamburgerBtn').click();
    await page.locator('#mobileDrawer').getByRole('link', { name: 'Anatomy' }).click();
    await expect(page.locator('#mobileDrawer')).not.toHaveClass(/open/);
    await expect(page.locator('#anatomy')).toBeInViewport();
  });

  test('sections fade in as they scroll into view, and a newly shown day fades in again', async ({ page }) => {
    await openApp(page, '#legsA');
    const eyebrow = page.locator('#sources .section-eyebrow');
    await expect(eyebrow).toHaveClass(/reveal/);
    await expect(eyebrow).not.toHaveClass(/visible/);
    await eyebrow.scrollIntoViewIfNeeded();
    await expect(eyebrow).toHaveClass(/visible/);

    await page.locator('#legsA').scrollIntoViewIfNeeded();
    await page.locator('#legsA .exercise-card').first().scrollIntoViewIfNeeded();
    await page.locator('.tracker-day-card[data-jump="push"][data-day="A"]').evaluate((el: HTMLElement) => el.click());
    // Revealed: the visible class, or (where React redraws the card) the data-revealed mark.
    await expect(page.locator('#pushA .exercise-card').first()).toHaveAttribute('data-revealed', '');
  });

  test('the hero has 18 drifting particles', async ({ page }) => {
    await openApp(page, '#legsA');
    await expect(page.locator('#heroParticles .hero-particle')).toHaveCount(18);
  });

  test('with reduced motion, there are no particles', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openApp(page, '#legsA');
    await page.waitForTimeout(300);
    await expect(page.locator('#heroParticles .hero-particle')).toHaveCount(0);
  });

  test('the session mini-bar shows whenever the hero is out of view', async ({ page }) => {
    await openApp(page, '#legsA');
    const bar = page.locator('#sessionMinibar');
    // An address like #legsA opens at that day's workout, so the bar is already up.
    await expect(bar).toHaveClass(/visible/);
    await expect(page.locator('#mbDay')).toHaveText('Leg Day A');
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(bar).not.toHaveClass(/visible/);
    await page.locator('#protocol').scrollIntoViewIfNeeded();
    await expect(bar).toHaveClass(/visible/);
  });
});
