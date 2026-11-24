import { expect, test } from '@playwright/test';
import { openApp } from './helpers';

/** The reading sections around the workout: what a visitor can do with them. */
test.describe('reading sections', () => {
  test('the page loads and scrolls through without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      // Vercel's visitor-stats script only exists on Vercel, not on this test server.
      if (m.type() === 'error' && !m.text().includes('/_vercel/') && !m.location().url.includes('/_vercel/')) {
        errors.push(`${m.text()} (from ${m.location().url || 'unknown'})`);
      }
    });
    page.on('pageerror', (e) => errors.push(e.message));
    await openApp(page);
    for (const id of ['#protocol', '#volume', '#anatomy', '#sources']) await page.locator(id).scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });

  test('Anatomy tabs show one day at a time, Legs first', async ({ page }) => {
    await openApp(page);
    const tabs = page.locator('#anatomyTabs');
    const panel = (g: string) => page.locator(`.anatomy-panel[data-group="${g}"]`);
    await expect(panel('legs')).toBeVisible();
    await expect(panel('push')).toBeHidden();
    await expect(tabs.getByRole('button', { name: 'Legs' })).toHaveClass(/active/);

    await tabs.getByRole('button', { name: 'Pull' }).click();
    await expect(panel('pull')).toBeVisible();
    await expect(panel('legs')).toBeHidden();
    await expect(tabs.getByRole('button', { name: 'Pull' })).toHaveClass(/active/);
    await expect(tabs.getByRole('button', { name: 'Legs' })).not.toHaveClass(/active/);
    await expect(panel('pull').locator('.muscle-card h3')).toHaveText(['Latissimus Dorsi', 'Mid-Back', 'Rear Deltoid', 'Biceps Brachii', 'Forearms']);
  });

  test('Sources: 4 core studies, then tabs; long lists show 3 until "Show more"', async ({ page }) => {
    await openApp(page);
    await expect(page.locator('#sources > .source-card')).toHaveCount(4);
    const tabs = page.locator('#sourcesTabs');
    const panel = (g: string) => page.locator(`.sources-group-panel[data-group="${g}"]`);

    await expect(panel('legs')).toBeVisible();
    await expect(panel('legs').locator('.source-card:visible')).toHaveCount(3);
    await panel('legs').getByRole('button', { name: 'Show 2 more studies' }).click();
    await expect(panel('legs').locator('.source-card:visible')).toHaveCount(5);
    await expect(panel('legs').getByRole('button', { name: /more studies/ })).toHaveCount(0);

    await tabs.getByRole('button', { name: 'Pull' }).click();
    await expect(panel('legs')).toBeHidden();
    await expect(panel('pull').locator('.source-card:visible')).toHaveCount(3);
    await panel('pull').getByRole('button', { name: 'Show 5 more studies' }).click();
    await expect(panel('pull').locator('.source-card:visible')).toHaveCount(8);
    // Each study links out in a new tab.
    const link = panel('pull').locator('.source-link').first();
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('href', /^https:\/\//);
  });

  test('Volume bars grow to their share once scrolled into view', async ({ page }) => {
    await openApp(page);
    const fill = page.locator('.volume-card[data-muscle="Chest"] .volume-fill');
    await fill.scrollIntoViewIfNeeded();
    // 18 of 24 sets: scaleX(0.75), as a transform matrix once the 1.1 s transition ends.
    await expect.poll(() => fill.evaluate((el) => getComputedStyle(el).transform), { timeout: 5000 }).toBe('matrix(0.75, 0, 0, 1, 0, 0)');
  });

  test("tapping a Volume card highlights it and the shown day's exercises for that muscle", async ({ page }) => {
    await openApp(page, '#legsA');
    const quads = page.locator('.volume-card[data-muscle="Quads"]');
    await quads.click();
    await expect(quads).toHaveClass(/pulse-highlight/);
    // Legs A's quad exercises glow briefly, and the first one is scrolled to.
    const squat = page.locator('#legsA .exercise-card[data-exercise="legs-a1"]');
    await expect(squat).toHaveCSS('box-shadow', /rgb/);
    await expect(squat).toBeInViewport();
    await page.locator('.volume-card[data-muscle="Calves"]').click();
    await expect(quads).not.toHaveClass(/pulse-highlight/);
  });

  test('the footer links to privacy, terms, contact and feedback', async ({ page }) => {
    await openApp(page);
    const footer = page.locator('footer.site-footer');
    await expect(footer.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
    await expect(footer.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
    await expect(footer.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', 'mailto:support@ecorche.app');
    await expect(footer.getByRole('link', { name: 'Feedback' })).toHaveAttribute('href', /^mailto:support@ecorche\.app\?subject=/);
  });
});
