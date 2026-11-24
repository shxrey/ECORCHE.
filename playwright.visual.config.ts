import { defineConfig, devices } from '@playwright/test';

/**
 * Pixel comparison (npm run test:visual), against a server that is already
 * running: VISUAL_BASE, or the test port 3100 by default. See
 * docs/react-rebuild-plan.md, "Pixel check", for taking the baselines.
 *
 * "desktop" photographs the live page ("/"). "preview" photographs the
 * rebuilt training core (/preview) and compares it with the live page's
 * pictures: the two must look the same.
 */
export default defineConfig({
  testDir: 'visual',
  workers: 2,
  reporter: [['list']],
  use: { baseURL: process.env.VISUAL_BASE ?? 'http://127.0.0.1:3100' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'preview',
      use: { ...devices['Desktop Chrome'] },
      metadata: { appPath: '/preview' },
      snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}-desktop-{platform}{ext}',
    },
  ],
});
