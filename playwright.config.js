// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './', // Puedes especificar otra carpeta si tus tests están agrupados
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },

  use: {
    headless: true,
    slowMo: 250,
    screenshot: 'only-on-failure',
    video: 'on',
    trace: 'on-first-retry',
    storageState: undefined
  },

  // ===============================
  // 🔥 Reporters habilitados
  // ===============================
  reporter: [
    ['list'], // muestra resultados en consola
    ['./reporters/my-reporter.ts'], // tu reporter personalizado
    ['json', { outputFile: 'playwright-report/results.json' }], // JSON usado por save-results.js
    ['html', { outputFolder: 'custom-report/reports', open: 'never' }] // HTML accesible desde el dashboard
  ],

  // ===============================
  // 🔧 Configuración adicional opcional
  // ===============================
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }

  ],

  // ===============================
  // ✅ Ruta donde Playwright guarda resultados temporales
  // ===============================
  outputDir: 'test-results',

  // ===============================
  // 🔄 Retries para mayor estabilidad
  // ===============================
  retries: 1,
});

