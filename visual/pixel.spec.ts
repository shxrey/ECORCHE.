// Pixel comparison for the React rebuild (npm run test:visual): proves a ported
// section looks exactly as it did, at desktop and phone width, in its default
// and clicked states. Not part of test:e2e: screenshots differ between
// machines, so baselines are taken on this laptop from the version before the
// change, and never committed. Steps: docs/react-rebuild-plan.md, "Pixel check".
import { expect, test, type Page } from '@playwright/test';
import { openApp } from '../e2e/helpers';

interface Case {
  name: string;
  /** What to photograph. */
  sel: string;
  /** Address to open (default #legsA). */
  hash?: string;
  /** Clicked in order before the picture (a tab, "Show more", the menu button). */
  click?: string[];
  /** It floats over the page (nav, mini-bar, menu): photograph it where it is. */
  floating?: boolean;
  /** Scrolled into view first (the mini-bar only shows once the hero is gone). */
  scrollTo?: string;
  /** Only at these widths (default both). */
  widths?: number[];
}

const SECTIONS = ['#protocol', '#standards', '#gauge', '#volume', '#anatomy', '#sources', 'footer.site-footer'];
const CASES: Case[] = [
  ...SECTIONS.map((sel) => ({ sel, name: sel.replace(/[^a-z]/g, '') })),
  { sel: '#anatomy', name: 'anatomy-push', click: ['#anatomyTabs [data-tab-group="push"]'] },
  { sel: '#anatomy', name: 'anatomy-pull', click: ['#anatomyTabs [data-tab-group="pull"]'] },
  { sel: '#sources', name: 'sources-pull', click: ['#sourcesTabs [data-tab-group="pull"]'] },
  { sel: '#sources', name: 'sources-push-expanded', click: ['#sourcesTabs [data-tab-group="push"]', '.sources-group-panel.active .sources-show-more'] },
  // Phase 2: the hero, the nav, the phone menu and the mini-bar.
  { sel: '.hero', name: 'hero' },
  { sel: '.hero', name: 'hero-push', click: ['#groupTabs [data-tab-group="push"]'] },
  { sel: '.hero', name: 'hero-pull-b', hash: '#pullB' },
  { sel: '.hero', name: 'hero-legs-b', click: ['#btnDayB'] },
  { sel: '.top-nav', name: 'nav', floating: true },
  { sel: '#mobileDrawer', name: 'menu', floating: true, click: ['#hamburgerBtn'], widths: [390] },
  { sel: '#sessionMinibar', name: 'minibar', floating: true, scrollTo: '#protocol' },
];

/** Hides whatever floats over the page, except `keep` (and what's inside it). */
function hideFloating(page: Page, keep: string | null) {
  return page.evaluate((k) => {
    const kept = k ? document.querySelector(k) : null;
    for (const e of document.querySelectorAll<HTMLElement>('body *')) {
      if (getComputedStyle(e).position !== 'fixed') continue;
      if (kept && (kept === e || kept.contains(e) || e.contains(kept))) continue;
      e.style.visibility = 'hidden';
    }
  }, keep);
}

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  for (const c of CASES) {
    if (c.widths && !c.widths.includes(viewport.width)) continue;
    test(`${c.name} at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openApp(page, c.hash ?? '#legsA');
      // The hero's particles drift at random: not part of any comparison.
      await page.addStyleTag({ content: '.hero-particle { visibility: hidden !important; }' });
      for (const sel of c.click ?? []) await page.locator(sel).click();
      const el = page.locator(c.sel);
      if (c.floating) {
        if (c.scrollTo) await page.locator(c.scrollTo).scrollIntoViewIfNeeded();
        await page.waitForTimeout(800);
        await hideFloating(page, c.sel);
      } else {
        // Scroll through the whole section so every bar and reveal plays out.
        await page.evaluate((s) => {
          document.querySelectorAll('.reveal').forEach((e) => e.classList.add('visible'));
          const r = document.querySelector(s)!.getBoundingClientRect();
          (window as unknown as { __span: number[] }).__span = [r.top + scrollY, r.bottom + scrollY];
        }, c.sel);
        const [top, bottom] = await page.evaluate(() => (window as unknown as { __span: number[] }).__span);
        for (let y = top - 200; y < bottom; y += 300) {
          await page.evaluate((v) => window.scrollTo(0, v), y);
          await page.waitForTimeout(120);
        }
        await page.waitForTimeout(1500);
        // Floating things' position depends on scrolling, not on the section.
        await hideFloating(page, null);
        await el.scrollIntoViewIfNeeded();
      }
      await page.mouse.move(0, 0);
      await expect(el).toHaveScreenshot(`${c.name}-${viewport.width}.png`, { animations: 'disabled', maxDiffPixels: 0 });
    });
  }
}
