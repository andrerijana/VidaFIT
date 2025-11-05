import { test, expect } from '@playwright/test';

const url_base = 'https://front-qa.vida-fit.com';
const u = (path = '') => `${url_base}${path.startsWith('/') ? path : `/${path}`}`;

// 🔹 Abrir menú hamburguesa y devolver el contenedor
async function abrirMenu(page) {
  const menuHamburguesa = page.locator('mat-icon[data-mat-icon-name="my-icon-menu-ham"]');
  await expect(menuHamburguesa).toBeVisible({ timeout: 8000 });
  await menuHamburguesa.click();

  const menu = page.locator('app-navigation-hamburger-menu');
  await expect(menu).toBeVisible({ timeout: 8000 });

  return menu;
}

// 🔹 Ir al formulario de un recurso específico
async function irAlFormulario(page, context) {
  await context.grantPermissions(['geolocation']);
  await page.goto(u('/'));

  const menu = await abrirMenu(page);
  const linkRecursos = menu.getByText(/recursos/i);
  await expect(linkRecursos).toBeVisible({ timeout: 8000 });
  await linkRecursos.click();
  await expect(page).toHaveURL(/\/recursos\/?/);

  const cardTitle = 'Guía esencial de respiración consciente para aliviar el estrés y mejorar tu día hoy';
  const card = page.locator('h3.biblioteca-card-title', { hasText: cardTitle });
  await expect(card).toBeVisible({ timeout: 12000 });
  await card.click();

  await expect(page).toHaveURL(
    u('/recursos/guia-esencial-de-respiracion-consciente-para-aliviar-el-estres-y-mejorar-tu-dia-hoy/')
  );
}

// 🔹 Scroll to top (útil en registro)
async function scrollToTop(page) {
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  for (const sel of ['.mat-drawer-content', '.mat-sidenav-content', '[cdkScrollable]', '[class*="scroll"]']) {
    const el = page.locator(sel).first();
    if (await el.count()) await el.evaluate(e => { try { e.scrollTop = 0; } catch {} });
  }
  await page.waitForTimeout(150);
}

// 🔹 Centrar elemento en pantalla
async function centerInView(locator) {
  const h = await locator.elementHandle();
  if (h) await h.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'nearest' })).catch(() => {});
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  await locator.waitFor({ state: 'visible', timeout: 5000 });
}

// 🔹 Rellenar input de forma segura
async function safeFill(locator, value) {
  try {
    await locator.fill(value, { timeout: 3000 });
  } catch {
    await locator.click({ timeout: 1500 }).catch(() => {});
    await locator.type(value, { delay: 20 });
  }
}

// 🔹 Generar datos dinámicos de registro
function generarDatos() {
  const ts = Date.now();
  return {
    email: `arijana+${ts}@androvent.com`,
    phone: String(Math.floor(9000000 + Math.random() * 1000000)),
    nombre: 'QA Esperanza',
    apellido: 'QA Martinez',
    password: 'Admin.01',
  };
}

// 🔹 Completar formulario de registro
async function completarFormularioRegistro(page, { nombre, apellido, phone, email, password }) {
  await scrollToTop(page);

  let nombreInput = page.getByPlaceholder('Nombre');
  if (await nombreInput.count() === 0) nombreInput = page.getByRole('textbox', { name: /^Nombre$/i });
  await centerInView(nombreInput);
  await safeFill(nombreInput, nombre);

  let apellidoInput = page.getByPlaceholder('Apellido');
  if (await apellidoInput.count() === 0) apellidoInput = page.getByRole('textbox', { name: /^Apellido$/i });
  await centerInView(apellidoInput);
  await safeFill(apellidoInput, apellido);

  const phoneInput = page.getByRole('textbox', { name: /ej:/i });
  await centerInView(phoneInput);
  await safeFill(phoneInput, phone);

  let emailInput = page.getByPlaceholder(/email/i);
  if (await emailInput.count() === 0) emailInput = page.getByRole('textbox', { name: /^Email$/i });
  await centerInView(emailInput);
  await safeFill(emailInput, email);

  let passInput = page.getByPlaceholder(/contraseña/i);
  if (await passInput.count() === 0) passInput = page.getByRole('textbox', { name: /^Contraseña$/i });
  await centerInView(passInput);
  await safeFill(passInput, password);
}

export {
  u,
  abrirMenu,
  irAlFormulario,
  scrollToTop,
  centerInView,
  safeFill,
  generarDatos,
  completarFormularioRegistro
};

let emailCounter = 1;

test.describe('Formulario Recursos', () => {
  test('1. Campos vacíos', async ({ page, context }) => {
    await irAlFormulario(page, context);

    await page.locator('input[formcontrolname="name"]').fill('');
    await page.locator('input[formcontrolname="lastname"]').fill('');
    await page.locator('input[formcontrolname="email"]').fill('');
    await page.getByRole('button', { name: 'Recibir por mail' }).click();

    await expect(page.locator('input[formcontrolname="name"] + .error-message'))
      .toHaveText('Campo requerido.');
    await expect(page.locator('input[formcontrolname="lastname"] + .error-message'))
      .toHaveText('Campo requerido.');
    await expect(page.locator('input[formcontrolname="email"] + .error-message'))
      .toHaveText('Campo requerido.');
  });

  test('2. Nombre y Apellido con números', async ({ page, context }) => {
    await irAlFormulario(page, context);

    await page.locator('input[formcontrolname="name"]').fill('Esperanza1');
    await page.locator('input[formcontrolname="lastname"]').fill('Martinez2');
    const email = `arijana+${emailCounter++}@androvent.com`;
    await page.locator('input[formcontrolname="email"]').fill(email);
    await page.getByRole('button', { name: 'Recibir por mail' }).click();

    await expect(page.locator('input[formcontrolname="name"] + .error-message'))
      .toHaveText('Solo se permiten letras y espacios.');
    await expect(page.locator('input[formcontrolname="lastname"] + .error-message'))
      .toHaveText('Solo se permiten letras y espacios.');
  });

  test('3. Email inválido', async ({ page, context }) => {
    await irAlFormulario(page, context);

    await page.locator('input[formcontrolname="name"]').fill('Esperanza');
    await page.locator('input[formcontrolname="lastname"]').fill('Martinez');
    await page.locator('input[formcontrolname="email"]').fill('noesuncorreo');
    await page.getByRole('button', { name: 'Recibir por mail' }).click();

    await expect(page.locator('input[formcontrolname="email"] + .error-message'))
      .toHaveText('Formato inválido. Intenta nuevamente.');
  });

  test('4. Caso exitoso', async ({ page, context }) => {
    await irAlFormulario(page, context);

    const email = `arijana+${emailCounter++}@androvent.com`;
    await page.locator('input[formcontrolname="name"]').fill('Esperanza');
    await page.locator('input[formcontrolname="lastname"]').fill('Martinez');
    await page.locator('input[formcontrolname="email"]').fill(email);
    await page.getByRole('button', { name: 'Recibir por mail' }).click();

    // Opcional: validar mensaje de éxito
    // await expect(page.getByText('¡Gracias por tu interés!')).toBeVisible();
  });
});

test.describe('Navegación menú hamburguesa (Vidafit)', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await page.goto(u('/'));
  });

  test('1. Ir a Rutinas', async ({ page }) => {
    const menu = await abrirMenu(page);
    await menu.getByText('Rutinas', { exact: true }).click();
    await expect(page).toHaveURL(u('/rutinas-ejercicios/'));
  });

  test('2. Ir a Recetas', async ({ page }) => {
    const menu = await abrirMenu(page);
    await menu.getByText('Recetas', { exact: true }).click();
    await expect(page).toHaveURL(u('/recetas-fitness/'));
  });

  test('3. Ir a Recursos', async ({ page }) => {
    const menu = await abrirMenu(page);
    await menu.getByText('Recursos', { exact: true }).click();
    await expect(page).toHaveURL(u('/recursos/'));
  });

  test('4. Ir a Blog', async ({ page }) => {
    const menu = await abrirMenu(page);
    await menu.getByText('Blog', { exact: true }).click();
    await expect(page).toHaveURL(u('/vive-fit/'));
  });

  test('5. Abrir Perfil muestra botón Únete', async ({ page }) => {
    const menu = await abrirMenu(page);
    await menu.getByText('Perfil', { exact: true }).click();
    await expect(page.getByRole('button', { name: 'Únete' })).toBeVisible();
  });

  test('6. Ir a Únete', async ({ page }) => {
    const menu = await abrirMenu(page);
    await menu.getByText('Perfil', { exact: true }).click();
    await page.getByRole('button', { name: 'Únete' }).click();
    await expect(page).toHaveURL(u('/auth/signup/'));
  });

  test('7. Ir a Iniciar sesión y cerrar modal', async ({ page }) => {
    const menu = await abrirMenu(page);
    await menu.getByText('Iniciar sesión', { exact: true }).click();
    await expect(page).toHaveURL(u('/auth/login/'));
    await page.locator('mat-icon.material-icons', { hasText: 'close' }).click();
  });

  test('8. Volver al Home', async ({ page }) => {
    const menu = await abrirMenu(page);
    await menu.getByText('Mi Inicio', { exact: true }).click();
    await expect(page).toHaveURL(u('/'));
  });

  test('9. Abrir y cerrar Términos y Condiciones', async ({ page }) => {
    const menu = await abrirMenu(page);
    await menu.getByText('Términos y Condiciones').click();
    const modal = page.locator('h1', { hasText: 'ACUERDO DE SERVICIO' });
    await expect(modal).toBeVisible();
    await page.mouse.click(10, 10);
    await expect(modal).not.toBeVisible();
  });
});

/* ------------------- FILTROS DE RECURSOS ------------------- */
test.describe('Filtros de recursos', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await page.goto(u('/recursos/'));
  });

  test('Filtrar por Entrenamiento', async ({ page }) => {
    await page.locator('input[type="checkbox"].myinput').nth(0).check();
    await expect(page.locator('span.category-chip', { hasText: 'Entrenamiento' })).toBeVisible();
  });

  test('Filtrar por Nutrición', async ({ page }) => {
    await page.locator('input[type="checkbox"].myinput').nth(3).check();
    await expect(
      page.locator('span.category-chip', { hasText: 'Nutrición' }).first()
    ).toBeVisible();
  });

 test('Filtrar por Recetas Fitness', async ({ page }) => {
  await page.locator('input[type="checkbox"].myinput').nth(5).check();
  await expect(
    page.locator('span.category-chip', { hasText: 'Recetas Fitness' }).first()
  ).toBeVisible();
});

  test('Filtrar por Vive Fit', async ({ page }) => {
    await page.locator('input[type="checkbox"].myinput').nth(8).check();
    await expect(
      page.locator('span.category-chip', { hasText: 'Vive Fit' }).first()
    ).toBeVisible();
  });

  test('Filtrar por Rutinas de Ejercicios', async ({ page }) => {
    await page.locator('input[type="checkbox"].myinput').nth(12).check();
    await expect(
      page.locator('span.category-chip', { hasText: 'Rutinas de Ejercicios' }).first()
    ).toBeVisible();
  });
});

/* ------------------- REGISTRO ------------------- */
test.describe('Registro de usuario', () => {
  test('Movistar', async ({ page }) => {
    const datos = generarDatos();
    await page.goto(u('/auth/signup/'), { waitUntil: 'domcontentloaded' });

    const movistarImg = page.getByRole('img', { name: /movistar/i });
    if (await movistarImg.isVisible().catch(() => false)) {
      await movistarImg.click();
    }

    await completarFormularioRegistro(page, datos);
    const joinButton = page.getByRole('button', { name: /unirme a vida ?fit/i });
    await Promise.all([
      page.waitForURL(/\/auth\/account-success\/?$/i, { timeout: 30000 }),
      joinButton.click(),
    ]);

    await expect(page).toHaveURL(/\/auth\/account-success\/?$/i);
  });

test('Digitel', async ({ page, context }) => {
  const datos = generarDatos();

  // 🔹 Permitir geolocalización antes de cargar la página
  await context.grantPermissions(['geolocation']);

  await page.goto(u('/auth/signup/'), { waitUntil: 'domcontentloaded' });

  const digitelImg = page.getByRole('img', { name: /digitel/i });
  await expect(digitelImg).toBeVisible({ timeout: 10000 });
  await digitelImg.click();

  await completarFormularioRegistro(page, datos);

  const joinButton = page.getByRole('button', { name: /unirme a vida ?fit/i });
  await Promise.all([
    page.waitForURL(/\/auth\/account-success\/?$/i, { timeout: 30000 }),
    joinButton.click(),
  ]);

  await expect(page).toHaveURL(/\/auth\/account-success\/?$/i);
});


test('Prueba gratis Movistar 2', async ({ page }) => {
  const datos = generarDatos();


  await page.goto(u('/'), { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /^Prueba gratis$/i }).click();
  await expect(page.getByRole('heading', { name: /prueba gratis por 3 días/i }))
    .toBeVisible({ timeout: 10000 });

  await page.getByRole('button', { name: /Empezar prueba gratis/i }).click();
  await page.getByRole('img', { name: /movistar/i }).click();

  await completarFormularioRegistro(page, datos);

  // 🔹 Clic en "Unirme a VidaFIT"
  const joinButton = page.getByRole('button', { name: /Unirme a Vida ?FIT/i });
  await Promise.all([
    page.waitForURL(/\/premium\/subscribe-direct-success\/?$/i, { timeout: 30000 }),
    joinButton.click(),
  ]);

  // 🔹 Validar que estamos en la vista de suscripción exitosa
  await expect(page).toHaveURL(/\/premium\/subscribe-direct-success\/?$/i);
  await expect(page.getByRole('heading', { name: /te damos la bienvenida/i }))
    .toBeVisible({ timeout: 10000 });
});



});
