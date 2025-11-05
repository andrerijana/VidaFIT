import { test, expect } from '@playwright/test';

test.describe('AQUSTICO - Validaciones de inicio de sesión', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('https://prepro.conectium.com/aqustico-qa/home');

    // Abrir menú de 3 puntos
    await page.getByText('more_vert').click();

    // Click en "Iniciar Sesión"
    await page.getByRole('menuitem', { name: 'Iniciar Sesión' }).click();

    // Confirmar que el input esté visible
    await expect(page.getByRole('textbox', { name: /Ej:/ })).toBeVisible();
  });

  test('Validación 1: número con menos de 10 dígitos', async ({ page }) => {
    await page.getByRole('textbox', { name: /Ej:/ }).fill('12345');
    // Hacer blur: clic en el body
    await page.locator('body').click();
    await expect(page.getByText(/El número debe tener al menos/)).toBeVisible();
  });

  test('Validación 2: número con 10 dígitos (formato inválido)', async ({ page }) => {
    await page.getByRole('textbox', { name: /Ej:/ }).fill('1234567890');
    await page.locator('body').click();
    await expect(page.getByText(/Formato inválido/)).toBeVisible();
  });

  test('Validación 3: número válido pero no registrado', async ({ page }) => {
    await page.getByRole('textbox', { name: /Ej:/ }).fill('584122412535');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page.getByText(/Suscriptor no activo/)).toBeVisible();
  });

  test('Validación 4: inicio de sesión exitoso', async ({ page }) => {
    await page.getByRole('textbox', { name: /Ej:/ }).fill('584241730613');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page.getByRole('heading', { name: 'Tu colección' })).toBeVisible();
  });

});

