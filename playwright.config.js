// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  use: {
    headless: true,
    slowMo: 250,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    storageState: undefined
  },
  reporter: [
    ['list'],
    ['./reporters/my-reporter.ts'],
    ['json', { outputFile: 'playwright-report/results.json' }] 
  ]
});
