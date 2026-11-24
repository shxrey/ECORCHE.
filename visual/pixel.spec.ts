// Pixel comparison for the React rebuild (npm run test:visual): proves a ported
// section looks exactly as it did, at desktop and phone width, in its default
// and clicked states. Not part of test:e2e: screenshots differ between
// machines, so baselines are taken on this laptop from the version before the
// change, and never committed. Steps: docs/react-rebuild-plan.md, "Pixel check".
import { expect, test } from '@playwright/test';
import { openApp } from '../e2e/helpers';

const SECTIONS = ['#protocol', '#standards', '#gauge', '#volume', '#anatomy', '#sources', 'footer.site-footer'];
/** Other states: a tab clicked, or "Show more" pressed, before the picture. */
const STATES: { sel: string; name: string; click: string[] }[] = [
  { sel: '#anatomy', name: 'anatomy-push', click: ['#anatomyTabs [data-tab-group="push"]'] },
  { sel: '#anatomy', name: 'anatomy-pull', click: ['#anatomyTabs [data-tab-group="pull"]'] },
  { sel: '#sources', name: 'sources-pull', click: ['#sourcesTabs [data-tab-group="pull"]'] },
  { sel: '#sources', name: 'sources-push-expanded', click: ['#sourcesTabs [data-tab-group="push"]', '.sources-group-panel.active .sources-show-more'] },
];
const CASES = [
  ...SECTIONS.map((sel) => ({ sel, name: sel.replace(/[^a-z]/g, ''), click: [] as string[] })),
  ...STATES,
];

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  for (const { sel, name, click } of CASES) {
    test(`${name} at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openApp(page);
      for (const c of click) await page.locator(c).click();
      const el = page.locator(sel);
      // Scroll through the whole section so every bar and reveal plays out.
      await page.evaluate((s) => {
        document.querySelectorAll('.reveal').forEach((e) => e.classList.add('visible'));
        const r = document.querySelector(s)!.getBoundingClientRect();
        (window as unknown as { __span: number[] }).__span = [r.top + scrollY, r.bottom + scrollY];
      }, sel);
      const [top, bottom] = await page.evaluate(() => (window as unknown as { __span: number[] }).__span);
      for (let y = top - 200; y < bottom; y += 300) {
        await page.evaluate((v) => window.scrollTo(0, v), y);
        await page.waitForTimeout(120);
      }
      await page.waitForTimeout(1500);
      // Hide everything that floats over the page (nav, mini-bar, buttons): its
      // position depends on scrolling, not on the section.
      await page.evaluate(() => {
        for (const e of document.querySelectorAll<HTMLElement>('body *')) {
          if (getComputedStyle(e).position === 'fixed') e.style.visibility = 'hidden';
        }
      });
      await el.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      await expect(el).toHaveScreenshot(`${name}-${viewport.width}.png`, { animations: 'disabled', maxDiffPixels: 0 });
    });
  }
}
