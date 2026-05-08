import { test, expect } from '@playwright/test';

test.describe('Login con Movistar', () => {
  const URL = 'https://front-qa.vida-fit.com/';
  const numeroValido = '0000001';
  const numeroInvalido = '123';
  const numeroNoRegistrado = '9999999';

  async function abrirLoginMovistar(page) {
    await page.goto(URL);
    await page.locator('app-header').getByRole('button').nth(1).click();
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await page.locator('svg').nth(3).click();
    await page.getByRole('img', { name: 'Movistar' }).click();
  }

  test.beforeEach(async ({ page }) => {
    await abrirLoginMovistar(page);
  });

  test('1. Caso con campos en blanco', async ({ page }) => {
    const inputNumero = page.getByRole('textbox', { name: 'Ej:' });
    const botonIniciarSesion = page.getByRole('button', { name: 'Iniciar sesión' });

    await expect(inputNumero).toBeVisible();
    await botonIniciarSesion.click();

    // Ajustar este mensaje según lo que muestra realmente la aplicación
    await expect(page.getByText(/campo requerido|ingresa tu número|este campo es obligatorio/i)).toBeVisible();
  });

  test('2. Caso con número inválido', async ({ page }) => {
    const inputNumero = page.getByRole('textbox', { name: 'Ej:' });
    const botonIniciarSesion = page.getByRole('button', { name: 'Iniciar sesión' });

    await inputNumero.click();
    await inputNumero.fill(numeroInvalido);
    await botonIniciarSesion.click();

    // Ajustar este mensaje según la validación real del sistema
    await expect(page.getByText(/La longitud mínima es 7./i)).toBeVisible();
  });

  test('3. Caso con número no registrado', async ({ page }) => {
    const inputNumero = page.getByRole('textbox', { name: 'Ej:' });
    const botonIniciarSesion = page.getByRole('button', { name: 'Iniciar sesión' });

    await inputNumero.click();
    await inputNumero.fill(numeroNoRegistrado);
    await botonIniciarSesion.click();

    // Ajustar este mensaje según lo que muestra realmente la aplicación
    await expect(page.getByText(/no registrado|no existe|no se encontró|no está afiliado/i)).toBeVisible();
  });

  test('4. Caso exitoso', async ({ page }) => {
    const inputNumero = page.getByRole('textbox', { name: 'Ej:' });
    const botonIniciarSesion = page.getByRole('button', { name: 'Iniciar sesión' });

    await inputNumero.click();
    await inputNumero.fill(numeroValido);
    await botonIniciarSesion.click();

    // Aquí conviene validar una redirección, modal, pantalla o elemento del flujo exitoso
    await expect(page.locator('#logo').getByRole('img')).toBeVisible();
  });
});