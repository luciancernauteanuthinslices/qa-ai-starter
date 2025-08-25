import { defineConfig, devices } from '@playwright/test';


// Tip: keep PR runs under ~10 min; nightly can be heavier
export default defineConfig({
  testDir: './tests',
  timeout: 30* 1000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [
              ['html', { open: 'never' }], 
              ['json', { outputFile: 'playwright-report/report.json' }]
            ],
  outputDir: 'test-results',
  globalSetup: './fixtures/global-setup',

  use: {
    baseURL: process.env.BASE_URL!,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1366, height: 768 },
  },

  // Browsers: small matrix on PR, full matrix nightly if you want
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',  use: { ...devices['Desktop Safari'] } },
  ],

});
