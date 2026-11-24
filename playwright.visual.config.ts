import { defineConfig, devices } from '@playwright/test';

/**
 * Pixel comparison (npm run test:visual), against a server that is already
 * running: VISUAL_BASE, or the test port 3100 by default. See
 * docs/react-rebuild-plan.md, "Pixel check", for taking the baselines.
 */
export default defineConfig({
  testDir: 'visual',
  workers: 2,
  reporter: [['list']],
  use: { baseURL: process.env.VISUAL_BASE ?? 'http://127.0.0.1:3100' },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }],
});
