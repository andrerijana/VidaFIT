import { test, expect } from '@playwright/test';

test.describe('Login VidaFIT - Operadora Digitel', () => {
  const BASE_URL = 'https://front-qa.vida-fit.com/';

  const VALID_PHONE = '0000002';
  const INVALID_PHONE = '123';
  const UNREGISTERED_PHONE = '9999991';

  const operatorSelector = (page) =>
    page.locator('.country-option > .mat-icon > svg > g > path').first();

  const digitelOption = (page) =>
    page.getByRole('img', { name: 'Digitel' });

  const phoneInput = (page) =>
    page.getByRole('textbox', { name: 'Ej:' });

  const submitButton = (page) =>
    page.getByRole('button', { name: /^Iniciar sesión$/ }).last();

  async function openDigitelLogin(page) {
    await page.goto(BASE_URL);
    await page.locator('app-header').getByRole('button').nth(1).click();
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await operatorSelector(page).click();
    await digitelOption(page).click();

    await expect(phoneInput(page)).toBeVisible();
  }

  async function submitDigitelLogin(page, phone = '') {
    await phoneInput(page).fill(phone);
    await submitButton(page).click();
  }

  test.beforeEach(async ({ page }) => {
    await openDigitelLogin(page);
  });

  test('1. campo en blanco', async ({ page }) => {
    await submitButton(page).click();

    await expect(page.getByText('Campo requerido.', { exact: true })).toBeVisible();
  });

  test('2. número inválido', async ({ page }) => {
    await submitDigitelLogin(page, INVALID_PHONE);

    // Reemplazar por el mensaje exacto real
    await expect(
      page.getByText(/La longitud mínima es 7./i)
    ).toBeVisible();
  });

  test('3. número no registrado', async ({ page }) => {
    await submitDigitelLogin(page, UNREGISTERED_PHONE);

    // Reemplazar por el mensaje exacto real
    await expect(
      page.getByText(/Número de teléfono no registrado/i)
    ).toBeVisible();
  });

  test('4. caso exitoso', async ({ page }) => {
    await submitDigitelLogin(page, VALID_PHONE);

    await expect(page.locator('#logo').getByRole('img')).toBeVisible();
  });
});