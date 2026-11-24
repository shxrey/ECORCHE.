import { defineConfig, devices } from '@playwright/test';

/**
 * Behaviour tests (npm run test:e2e): pin down what the protocol page does today,
 * so each step of the React rebuild (docs/react-rebuild-plan.md) can prove it
 * still does the same. They run against a fresh production build on 127.0.0.1,
 * so they're always signed out and never touch anyone's account.
 */
const PORT = 3100;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  // Each test loads the full protocol page; more at once than this makes laptops slow and tests flaky.
  workers: process.env.CI ? 2 : 4,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
