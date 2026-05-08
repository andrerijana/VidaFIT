import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'https://front-qa.vida-fit.com/';
const PASSWORD = process.env.TEST_REGISTER_PASSWORD ?? 'Admin.01';

const registroCardSelector =
  '.max-w-\\[436px\\].rounded-lg.p-4.flex.gap-4.items-start.cursor-pointer.bg-white';

test.describe('Registro de usuario - VidaFIT', () => {
  test.beforeEach(async ({ page }) => {
    await abrirFormularioRegistro(page);
  });

  test('No permite crear cuenta con campos en blanco', async ({ page }) => {
    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    await expect(page.getByText('Campo requerido').first()).toBeVisible();

    await expect(page.getByText('Campo requerido')).toHaveCount(4);

    await expect(
      page.getByRole('heading', { name: '¡Tu cuenta ha sido creada!' })
    ).not.toBeVisible();
  });

  test('No permite crear cuenta con correo inválido', async ({ page }) => {
    await llenarFormularioRegistro(page, {
      nombre: 'QA Andrea',
      apellido: 'Prueba Automatizada',
      email: 'correo-invalido',
      password: PASSWORD,
    });

    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    await expect(
      page.getByText('Formato inválido. Intenta nuevamente.')
    ).toBeVisible();

    await expect(
      page.getByRole('heading', { name: '¡Tu cuenta ha sido creada!' })
    ).not.toBeVisible();
  });

  test('Permite crear cuenta correctamente con datos válidos', async ({ page }) => {
    const emailUnico = `arijana+qa-${Date.now()}@androvent.com`;

    await llenarFormularioRegistro(page, {
      nombre: 'QA Andrea',
      apellido: 'Prueba Automatizada',
      email: emailUnico,
      password: PASSWORD,
    });

    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    await expect(
      page.getByRole('heading', { name: '¡Tu cuenta ha sido creada!' })
    ).toBeVisible({ timeout: 15000 });
  });
});

async function abrirFormularioRegistro(page) {
  await page.goto(BASE_URL);

  await page.locator('mat-drawer-content path').click();

  await page.getByRole('link', { name: 'Únete' }).click();

  const registroCard = page.locator(registroCardSelector).first();

  await expect(registroCard).toBeVisible();
  await registroCard.click();
}

async function llenarFormularioRegistro(page, { nombre, apellido, email, password }) {
  await page.getByRole('textbox', { name: 'Nombre' }).fill(nombre);
  await page.getByRole('textbox', { name: 'Apellido' }).fill(apellido);
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(password);
}