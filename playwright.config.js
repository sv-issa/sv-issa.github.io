// @ts-check
import { defineConfig, devices } from '@playwright/test';

const PORT = 1313;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * Playwright runs against a local Hugo server.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `hugo server --port ${PORT} --baseURL ${BASE_URL}/ --disableLiveReload`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
