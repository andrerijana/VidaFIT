import { test, expect } from '@playwright/test';

test.describe('Login VidaFIT', () => {
  const BASE_URL = 'https://front-qa.vida-fit.com/';

  const VALID_EMAIL = 'arijana+2@androvent.com';
  const VALID_PASSWORD = 'Admin.01';

  const INVALID_EMAIL_FORMAT = 'correo-invalido';
  const WRONG_EMAIL = 'arijana+999@androvent.com';
  const WRONG_PASSWORD = 'Admin.00';

  const emailInput = (page) => page.getByRole('textbox', { name: 'Email' });
  const passwordInput = (page) => page.getByRole('textbox', { name: 'Contraseña' });
  const submitButton = (page) =>
    page.getByRole('button', { name: /^Iniciar sesión$/ }).last();

  async function openLogin(page) {
    await page.goto(BASE_URL);

    await page.locator('app-header').getByRole('button').nth(1).click();
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(emailInput(page)).toBeVisible();
    await expect(passwordInput(page)).toBeVisible();
  }

  async function submitLogin(page, email = '', password = '') {
    await emailInput(page).fill(email);
    await passwordInput(page).fill(password);
    await submitButton(page).click();
  }

  test.beforeEach(async ({ page }) => {
    await openLogin(page);
  });

  test('1. campos vacíos', async ({ page }) => {
    await submitButton(page).click();

    await expect(page.getByText('Campo requerido.', { exact: true })).toHaveCount(2);
  });

  test('2. contraseña vacía', async ({ page }) => {
    await submitLogin(page, VALID_EMAIL, '');

    await expect(page.getByText('Campo requerido.', { exact: true })).toHaveCount(1);
  });

  test('3. correo inválido', async ({ page }) => {
    await submitLogin(page, INVALID_EMAIL_FORMAT, VALID_PASSWORD);

    await expect(
      page.getByText('Correo inválido. Intenta nuevamente.', { exact: true })
    ).toBeVisible();
  });

  test('4. correo incorrecto', async ({ page }) => {
    await submitLogin(page, WRONG_EMAIL, VALID_PASSWORD);

    await expect(
      page.getByText('Correo inválido. Intenta nuevamente.', { exact: true })
    ).toBeVisible();
  });

  test('5. contraseña incorrecta', async ({ page }) => {
    await submitLogin(page, VALID_EMAIL, WRONG_PASSWORD);

    await expect(
      page.getByText('Contraseña inválida. Intenta nuevamente.', { exact: true })
    ).toBeVisible();
  });

  test('6. caso exitoso', async ({ page }) => {
    await submitLogin(page, VALID_EMAIL, VALID_PASSWORD);

    await expect(page.locator('#logo').getByRole('img')).toBeVisible();
  });
});