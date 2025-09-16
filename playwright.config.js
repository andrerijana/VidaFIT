// playwright.config.js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  use: {
    headless: false,
    slowMo: 300,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',  // MUY IMPORTANTE para que se guarde en los fails
    trace: 'on-first-retry'
  },
  reporter: [
    ['list'],
    ['./reporters/my-reporter.ts']  // tu reporter custom
  ]
});

