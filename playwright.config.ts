import 'dotenv/config'; // <-- load .env here
import { defineConfig, devices } from '@playwright/test';

import * as dotenv from 'dotenv';
dotenv.config({ override: true });


export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.@(js|ts)',
  timeout: 30 * 1000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/report.json' }],
  ],
  outputDir: 'test-results',
  globalSetup: './fixtures/global-setup',

  use: {
    baseURL: process.env.BASE_URL!,     // now guaranteed to be loaded
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1366, height: 768 },
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',  use: { ...devices['Desktop Safari'] } },
  ],
});
