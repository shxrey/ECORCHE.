import { expect, test } from '@playwright/test';
import { openApp } from './helpers';

/*
 * The security policy (next.config.ts). Inline event handlers are blocked,
 * so HTML slipped into the page can't run code through onclick="…" or
 * onerror="…"; the site's own pages have none.
 */
test.describe('security policy', () => {
  test('every page is served with the policy, inline event handlers blocked', async ({ request }) => {
    for (const path of ['/', '/login', '/privacy', '/terms']) {
      const csp = (await request.get(path)).headers()['content-security-policy'];
      expect(csp, path).toContain("script-src-attr 'none'");
      expect(csp, path).toContain("frame-ancestors 'none'");
    }
  });

  test('an injected onerror="…" handler does not run', async ({ page }) => {
    await openApp(page);
    const blocked = await page.evaluate(
      () =>
        new Promise<string>((resolve) => {
          document.addEventListener('securitypolicyviolation', (e) => resolve(e.effectiveDirective), { once: true });
          const box = document.createElement('div');
          box.innerHTML = '<img src="/no-such-image.png" onerror="window.__injected = true">';
          document.body.appendChild(box);
        }),
    );
    expect(blocked).toBe('script-src-attr');
    expect(await page.evaluate(() => (window as unknown as { __injected?: boolean }).__injected)).toBeUndefined();
  });
});
