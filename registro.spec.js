import { test, expect } from '@playwright/test';

test.use({ permissions: ['geolocation'] });
test.setTimeout(120000);

/* ================= (definir una sola vez) ================= */
async function scrollToTop(page) {
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  for (const sel of ['.mat-drawer-content', '.mat-sidenav-content', '[cdkScrollable]', '[class*="scroll"]']) {
    const el = page.locator(sel).first();
    if (await el.count()) await el.evaluate(e => { try { e.scrollTop = 0; } catch {} });
  }
  await page.waitForTimeout(150);
}

async function centerInView(locator) {
  const h = await locator.elementHandle();
  if (h) await h.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'nearest' })).catch(() => {});
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  await locator.waitFor({ state: 'visible', timeout: 5000 });
}

async function safeFill(locator, value) {
  try {
    await locator.fill(value, { timeout: 3000 });
  } catch {
    await locator.click({ timeout: 1500 }).catch(() => {});
    await locator.type(value, { delay: 20 });
  }
}

function generarDatos() {
  const ts = Date.now();
  return {
    email: `arijana+${ts}@androvent.com`,
    phone: String(Math.floor(9000000 + Math.random() * 1000000)), // 7 dígitos
    nombre: 'QA Esperanza',
    apellido: 'QA Martinez',
    password: 'Admin.01',
  };
}

async function completarFormularioRegistro(page, { nombre, apellido, phone, email, password }) {
  await scrollToTop(page);

  // Nombre
  let nombreInput = page.getByPlaceholder('Nombre');
  if (await nombreInput.count() === 0) nombreInput = page.getByRole('textbox', { name: /^Nombre$/i });
  await centerInView(nombreInput);
  await safeFill(nombreInput, nombre);

  // Apellido
  let apellidoInput = page.getByPlaceholder('Apellido');
  if (await apellidoInput.count() === 0) apellidoInput = page.getByRole('textbox', { name: /^Apellido$/i });
  await centerInView(apellidoInput);
  await safeFill(apellidoInput, apellido);

  // Teléfono (campo “Ej:”)
  const phoneInput = page.getByRole('textbox', { name: /ej:/i });
  await centerInView(phoneInput);
  await safeFill(phoneInput, phone);

  // Email
  let emailInput = page.getByPlaceholder(/email/i);
  if (await emailInput.count() === 0) emailInput = page.getByRole('textbox', { name: /^Email$/i });
  await centerInView(emailInput);
  await safeFill(emailInput, email);

  // Contraseña
  let passInput = page.getByPlaceholder(/contraseña/i);
  if (await passInput.count() === 0) passInput = page.getByRole('textbox', { name: /^Contraseña$/i });
  await centerInView(passInput);
  await safeFill(passInput, password);
}

/* ================= TEST 1: Movistar ================= */
test('Prueba gratis con Movistar', async ({ page }) => {
  const datos = generarDatos();

  await page.goto('https://front-qa.vida-fit.com/auth/signup/', { waitUntil: 'domcontentloaded' });

  const movistarImg = page.getByRole('img', { name: /movistar/i });
  if (await movistarImg.isVisible().catch(() => false)) {
    await centerInView(movistarImg);
    await movistarImg.click();
  }

  await completarFormularioRegistro(page, datos);

  const joinButton = page.getByRole('button', { name: /unirme a vida ?fit/i });
  await centerInView(joinButton);
  await Promise.all([
    page.waitForURL(/\/auth\/account-success\/?$/i, { timeout: 30000 }),
    joinButton.click(),
  ]);

  await expect(page).toHaveURL(/\/auth\/account-success\/?$/i, { timeout: 30000 });
  await expect(page.getByRole('heading', { name: /tu cuenta ha sido creada/i })).toBeVisible({ timeout: 10000 });

  console.log(`Usuario creado (Movistar): ${datos.email} | Tel: ${datos.phone}`);
});

/* ================= TEST 2: Digitel ================= */
test('Prueba gratis con Digitel', async ({ page }) => {
  const datos = generarDatos();

  await page.goto('https://front-qa.vida-fit.com/auth/signup/', { waitUntil: 'domcontentloaded' });

  const digitelImg = page.getByRole('img', { name: /digitel/i });
  await expect(digitelImg).toBeVisible({ timeout: 10000 });
  await centerInView(digitelImg);
  await digitelImg.click();

  await completarFormularioRegistro(page, datos);

  const joinButton = page.getByRole('button', { name: /unirme a vida ?fit/i });
  await centerInView(joinButton);
  await Promise.all([
    page.waitForURL(/\/auth\/account-success\/?$/i, { timeout: 30000 }),
    joinButton.click(),
  ]);

  await expect(page).toHaveURL(/\/auth\/account-success\/?$/i, { timeout: 30000 });
  await expect(page.getByRole('heading', { name: /tu cuenta ha sido creada/i })).toBeVisible({ timeout: 10000 });

  console.log(`Usuario creado (Digitel): ${datos.email} | Tel: ${datos.phone}`);
});

/* ================= TEST 3: Codegen mejorado (Movistar 2) ================= */
test('prueba gratis movistar 2', async ({ page }) => {
  const datos = generarDatos();

  // Home → CTA “Prueba gratis”
  await page.goto('https://front-qa.vida-fit.com/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /^Prueba gratis$/i, exact: true }).click();

  // Paso intermedio
  await expect(page.getByRole('heading', { name: /prueba gratis por 3 días/i })).toBeVisible({ timeout: 10000 });
  const empezarBtn = page.getByRole('button', { name: /Empezar prueba gratis/i });
  if (!(await empezarBtn.isVisible().catch(() => false))) {
    await page.mouse.wheel(0, 2000); // por si está abajo
  }
  await empezarBtn.click();

  // Elegir operador Movistar
  const movistarImg = page.getByRole('img', { name: /movistar/i });
  await centerInView(movistarImg);
  await movistarImg.click();

  // Completar formulario
  await completarFormularioRegistro(page, datos);

    // Enviar + verificación
  const joinButton = page.getByRole('button', { name: /Unirme a Vida ?FIT/i });
  await centerInView(joinButton);
  await Promise.all([
    page.waitForURL(/\/auth\/account-success\/?$/i, { timeout: 30000 }).catch(() => {}),
    joinButton.click(),
  ]);

  // 👇 Verificación final
  if (page.url().match(/\/auth\/account-success\/?$/i)) {
    await expect(page).toHaveURL(/\/auth\/account-success\/?$/i, { timeout: 30000 });
    await expect(page.getByRole('heading', { name: /TE DAMOS LA BIENVENIDA/i }))
      .toBeVisible({ timeout: 10000 });
  } else {
    await expect(page.getByRole('heading', { name: /TE DAMOS LA BIENVENIDA/i }))
      .toBeVisible({ timeout: 30000 });
  }

  // Opcional: volver al inicio si aparece el botón
  const irAlInicio = page.getByRole('button', { name: /Ir al inicio/i });
  if (await irAlInicio.isVisible().catch(() => false)) await irAlInicio.click();

  const logo = page.locator('#logo').getByRole('img');
  if (await logo.isVisible().catch(() => false)) await logo.click();

  console.log(`Usuario creado (Movistar 2): ${datos.email} | Tel: ${datos.phone}`);
});


