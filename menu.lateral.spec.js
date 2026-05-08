import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'https://front-qa.vida-fit.com/';

test.describe('Redireccionamientos del menú lateral - VidaFIT', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await abrirMenuLateral(page);
  });

  test('Redirecciona correctamente a Rutinas', async ({ page }) => {
    await menuLateral(page).getByRole('link', { name: 'Rutinas' }).click();

    await expect(
      page.getByRole('heading', { name: 'Entrenamiento del día' })
    ).toBeVisible();
  });

  test('Redirecciona correctamente a Recetas', async ({ page }) => {
    await menuLateral(page).getByRole('link', { name: 'Recetas' }).click();

    await expect(
      page.getByRole('heading', { name: 'Receta del día' })
    ).toBeVisible();
  });

  test('Redirecciona correctamente a Recursos', async ({ page }) => {
    await menuLateral(page).getByRole('link', { name: 'Recursos' }).click();

    await expect(
      page.getByRole('heading', { name: /Consigue los recursos/i })
    ).toBeVisible();
  });

  test('Redirecciona correctamente a Blog', async ({ page }) => {
    await menuLateral(page).getByRole('link', { name: 'Blog' }).click();

    await expect(
      page.getByRole('textbox', { name: 'Buscar', exact: true })
    ).toBeVisible();
  });

  test('Redirecciona correctamente desde Perfil a Prueba gratis', async ({ page }) => {
    await menuLateral(page).getByText('Perfil').click();

    await page.getByRole('button', { name: 'Prueba gratis' }).click();

    await expect(
      page.getByRole('button', { name: 'Empezar prueba gratis' })
    ).toBeVisible();
  });

  test('Redirecciona correctamente a Iniciar sesión', async ({ page }) => {
    await menuLateral(page).getByRole('link', { name: 'Iniciar sesión' }).click();

    await expect(
      page.getByRole('img', { name: 'Vida Fit' }).nth(1)
    ).toBeVisible();

    await expect(
      page.getByRole('textbox', { name: /email|correo/i })
    ).toBeVisible();

    await expect(
      page.getByRole('textbox', { name: /contraseña/i })
    ).toBeVisible();
  });

  test('Redirecciona correctamente a Tienda en nueva pestaña', async ({ page }) => {
    const popupPromise = page.waitForEvent('popup');

    await menuLateral(page).getByRole('link', { name: 'Tienda' }).click();

    const tiendaPage = await popupPromise;

    await tiendaPage.waitForLoadState('domcontentloaded');

    await expect(tiendaPage).toHaveURL(/.+/);
  });
});

function menuLateral(page) {
  return page.locator('app-navigation-hamburger-menu');
}

async function abrirMenuLateral(page) {
  await page.locator('mat-drawer-content svg').first().click();

  await expect(menuLateral(page)).toBeVisible();

  await expect(
    menuLateral(page).getByRole('link', { name: 'Rutinas' })
  ).toBeVisible();
}