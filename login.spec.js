import { test, expect } from '@playwright/test';

test.describe('Login VidaFIT', () => {

  // Reutilizamos el beforeEach para abrir el modal de login
  test.beforeEach(async ({ page }) => {
    await page.goto('https://front-qa.vida-fit.com/');
    await page.locator('app-header').getByRole('button').nth(1).click();
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  });

  // 📌 1. Validación: Campos vacíos
  test('Error al intentar iniciar sesión con campos vacíos', async ({ page }) => {

    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page.getByText('Campo requerido.')).toBeVisible(); // Email y contraseña vacíos
  });

  // 📌 2. Validación: Contraseña vacía
  test('Error cuando la contraseña está vacía', async ({ page }) => {

    await page.getByRole('textbox', { name: 'Email' }).fill('arijana+14@androvent.com');

    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page.getByText('Campo requerido.')).toBeVisible(); // Falta contraseña
  });

  // 📌 3. Caso exitoso (FORZAMOS UN FALLO PARA PROBAR EVIDENCIAS)
  test('Login exitoso con credenciales válidas (forzado a fallar)', async ({ page }) => {

    await page.getByRole('textbox', { name: 'Email' }).fill('arijana+14@androvent.com');
    await page.getByRole('textbox', { name: 'Contraseña' }).fill('Admin.01');

    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    // 👇 ESTA ASSERTION PROVOCA EL FALLO INTENCIONAL
    await expect(page.getByText("Este texto NO EXISTE")).toBeVisible();
  });

});
