import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'https://front-qa.vida-fit.com/';

const MENSAJE_CAMPO_REQUERIDO = 'Campo requerido';

// Ajustar este texto si el front muestra otro mensaje exacto.
const MENSAJE_NUMERO_INVALIDO = 'La longitud mínima es 7.';

// Ajustar este texto cuando confirmemos el mensaje real del caso exitoso.
const MENSAJE_EXITO = /bienvenido|registro exitoso|prueba gratis|unido a VidaFIT|cuenta creada/i;

test.describe('Try&Buy Digitel - VidaFIT', () => {
  test.beforeEach(async ({ page }) => {
    await abrirFormularioTryBuyDigitel(page);
  });

  test('No permite unirse con campos vacíos', async ({ page }) => {
    const unirmeButton = page.getByRole('button', { name: 'Unirme a VidaFIT' });

    if (await unirmeButton.isDisabled()) {
      await expect(unirmeButton).toBeDisabled();
      return;
    }

    await unirmeButton.click();

    await expect(page.getByText(MENSAJE_CAMPO_REQUERIDO).first()).toBeVisible();

    await expect(page.getByText(MENSAJE_CAMPO_REQUERIDO)).toHaveCount(3);

    await expect(page.getByRole('button', { name: 'Intentar de nuevo' })).not.toBeVisible();
  });

  test('No permite unirse con número inválido menor a 7 dígitos', async ({ page }) => {
    await llenarFormularioTryBuyDigitel(page, {
      nombre: 'QA Andrea Digitel TB',
      apellido: 'Automatizada',
      numero: '123456',
    });

    await page.getByRole('button', { name: 'Unirme a VidaFIT' }).click();

    const numeroInput = page.getByRole('textbox', { name: 'Ej:' });

    await expect(numeroInput).toHaveAttribute('aria-invalid', 'true');

    await expect(page.getByText(MENSAJE_NUMERO_INVALIDO)).toBeVisible();

    await expect(page.getByRole('button', { name: 'Intentar de nuevo' })).not.toBeVisible();
  });

  test('Permite unirse correctamente con datos válidos', async ({ page }) => {
    const numeroValido = generarNumeroDigitelValido();

    await llenarFormularioTryBuyDigitel(page, {
      nombre: 'QA Andrea Digitel TB',
      apellido: 'Automatizada',
      numero: numeroValido,
    });

    await page.getByRole('button', { name: 'Unirme a VidaFIT' }).click();

    await expect(page.getByText(MENSAJE_EXITO)).toBeVisible({ timeout: 15000 });

    await expect(page.getByRole('button', { name: 'Intentar de nuevo' })).not.toBeVisible();
  });
});

async function abrirFormularioTryBuyDigitel(page) {
  await page.goto(BASE_URL);

  await page.getByRole('button', { name: 'Prueba gratis', exact: true }).click();

  await page.getByRole('button', { name: 'Empezar prueba gratis' }).click();

  await page.getByRole('img', { name: 'Digitel' }).click();

  await expect(page.getByRole('textbox', { name: 'Nombre' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Apellido' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Ej:' })).toBeVisible();
}

async function llenarFormularioTryBuyDigitel(page, { nombre, apellido, numero }) {
  await page.getByRole('textbox', { name: 'Nombre' }).fill(nombre);
  await page.getByRole('textbox', { name: 'Apellido' }).fill(apellido);
  await page.getByRole('textbox', { name: 'Ej:' }).fill(numero);
}

function generarNumeroDigitelValido() {
  const timestamp = Date.now().toString();
  return timestamp.slice(-7);
}