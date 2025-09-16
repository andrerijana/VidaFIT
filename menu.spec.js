const { test, expect } = require('@playwright/test');


test('Abrir menú hamburguesa y hacer click en Mi Inicio', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await page.goto('https://front-qa.vida-fit.com/');

  // Abre el menú hamburguesa
  const menuHamburguesa = page.locator('mat-icon[data-mat-icon-name="my-icon-menu-ham"]');
  await expect(menuHamburguesa).toBeVisible();
  await menuHamburguesa.click();

  // Espera a que el menú se despliegue
  const menuContainer = page.locator('app-navigation-hamburger-menu');
  await expect(menuContainer).toBeVisible();

  // Haz click en el "Mi Inicio" que está dentro del menú hamburguesa
  const miInicioMenu = menuContainer.locator('a', { hasText: 'Mi Inicio' });
  await expect(miInicioMenu).toBeVisible();
  await miInicioMenu.click();

  // Valida que sigues en el home
  await expect(page).toHaveURL('https://front-qa.vida-fit.com/');

  // (Opcional) esperar para visualización
  await page.waitForTimeout(1000);
});



test('Flujo completo de navegación por el menú hamburguesa (Vidafit)', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await page.goto('https://front-qa.vida-fit.com/');

  // Utilidad para abrir el menú hamburguesa
  async function abrirMenu() {
    const menuHamburguesa = page.locator('mat-icon[data-mat-icon-name="my-icon-menu-ham"]');
    await expect(menuHamburguesa).toBeVisible();
    await menuHamburguesa.click();
    await expect(page.locator('app-navigation-hamburger-menu')).toBeVisible();
  }

  // --- ¡DECLARA AQUÍ la variable menu! ---
  const menu = page.locator('app-navigation-hamburger-menu');

  // --- 1. Rutinas ---
  await abrirMenu();
  await expect(menu.getByRole('link', { name: 'Rutinas' })).toBeVisible();
  await menu.getByRole('link', { name: 'Rutinas' }).click();
  await expect(page).toHaveURL('https://front-qa.vida-fit.com/rutinas-ejercicios/');
  await page.waitForTimeout(700);

  // --- 2. Recetas ---
  await abrirMenu();
  await expect(menu.getByRole('link', { name: 'Recetas' })).toBeVisible();
  await menu.getByRole('link', { name: 'Recetas' }).click();
  await expect(page).toHaveURL('https://front-qa.vida-fit.com/recetas-fitness/');
  await page.waitForTimeout(700);

  // --- 3. Recursos ---
  await abrirMenu();
  await expect(menu.getByRole('link', { name: 'Recursos' })).toBeVisible();
  await menu.getByRole('link', { name: 'Recursos' }).click();
  await expect(page).toHaveURL('https://front-qa.vida-fit.com/recursos/');
  await page.waitForTimeout(700);

  // --- 4. Blog ---
  await abrirMenu();
  await expect(menu.getByRole('link', { name: 'Blog' })).toBeVisible();
  await menu.getByRole('link', { name: 'Blog' }).click();
  await expect(page).toHaveURL('https://front-qa.vida-fit.com/vive-fit/');
  await page.waitForTimeout(700);

  // --- 5. Perfil (abrir modal) ---
  await abrirMenu();
  const perfilTrigger = menu.locator('a, span', { hasText: 'Perfil' }).first();
  await expect(perfilTrigger).toBeVisible();
  await perfilTrigger.click();
  const botonUnete = page.locator('button', { hasText: 'Únete' });
  await expect(botonUnete).toBeVisible();
  await page.waitForTimeout(400);

  // --- 6. Únete (clic en botón Únete del modal perfil) ---
  await botonUnete.click();
  await expect(page).toHaveURL('https://front-qa.vida-fit.com/auth/signup/');
  await page.waitForTimeout(700);

  // --- 7. Iniciar sesión (y cerrar con X) ---
  await abrirMenu();
  const iniciarSesionLink = menu.locator('a', { hasText: 'Iniciar sesión' });
  await expect(iniciarSesionLink).toBeVisible();
  await iniciarSesionLink.click();
  await expect(page).toHaveURL('https://front-qa.vida-fit.com/auth/login/');
  await page.waitForTimeout(700);

  // Cierra modal con X (mat-icon con texto 'close')
  const closeIcon = page.locator('mat-icon.material-icons', { hasText: 'close' });
  await expect(closeIcon).toBeVisible();
  await closeIcon.click();
  await page.waitForTimeout(700);

  // --- 8. Volver al Home ---
  await page.goto('https://front-qa.vida-fit.com/');
  await expect(page).toHaveURL('https://front-qa.vida-fit.com/');
  await page.waitForTimeout(700);

  // --- 9. Términos y Condiciones ---
  await abrirMenu();
  const terminosLink = menu.locator('a', { hasText: 'Términos y Condiciones' });
  await expect(terminosLink).toBeVisible();
  await terminosLink.click();
  const modalTitulo = page.locator('h1.font-bold.text-center', { hasText: 'ACUERDO DE SERVICIO' });
  await expect(modalTitulo).toBeVisible();
  await page.mouse.click(10, 10); // Click fuera para cerrar
  await expect(modalTitulo).not.toBeVisible();

});

test('Buscar recursos usando el buscador del menú lateral con "creatina"', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await page.goto('https://front-qa.vida-fit.com/');

  // Abre el menú hamburguesa
  const menuHamburguesa = page.locator('mat-icon[data-mat-icon-name="my-icon-menu-ham"]');
  await expect(menuHamburguesa).toBeVisible();
  await menuHamburguesa.click();

  // Espera el menú lateral
  const menu = page.locator('app-navigation-hamburger-menu');
  await expect(menu).toBeVisible();

  // Busca el input y escribe
  const searchInput = menu.locator('input[placeholder="Buscar"]');
  await expect(searchInput).toBeVisible();
  await searchInput.evaluate(el => el.removeAttribute('readonly'));
  await searchInput.fill('creatina');
  await page.waitForTimeout(2000); // Dale más tiempo al filtro

  // Log de lo que ve Playwright
  const items = await menu.locator('*').allTextContents();
  console.log('Textos en el menú:', items);

  // Usa un selector más general para el resultado (ajusta si tu app cambia)
  // Ejemplo 1: Busca por texto en cualquier elemento del menú
  const resultado = menu.locator('text=/creatina/i');
  await expect(resultado.first()).toBeVisible();

  // Imprime los textos encontrados
  const textos = await resultado.allTextContents();
  console.log('Resultados de búsqueda:', textos);

  for (const texto of textos) {
    expect(texto.toLowerCase()).toContain('creatina');
  }

  await page.waitForTimeout(1000);
});



