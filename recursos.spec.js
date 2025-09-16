const { test, expect } = require('@playwright/test');

let emailCounter = 1;

// ✅ Usa SIEMPRE la base sin "/" final
const url_base = 'https://front-qa.vida-fit.com';

// ✅ Helper para componer rutas de forma segura
const u = (path = '') => `${url_base}${path.startsWith('/') ? path : `/${path}`}`;

test.use({
  permissions: ['geolocation']
});

test('Flujo completo del formulario desde menú hamburguesa (desktop)', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await page.goto(u('/'));

  // 1) Abrir menú hamburguesa (usando el svg único del icono)
  const hamburguesa = page.locator('svg[viewBox="0 0 24 17"]').first();
  await expect(hamburguesa).toBeVisible({ timeout: 8000 });
  await hamburguesa.click();

  // 2) Click en RECURSOS dentro del menú desplegado
  const linkRecursos = page.getByRole('link', { name: /recursos/i });
  await expect(linkRecursos).toBeVisible({ timeout: 8000 });
  await linkRecursos.click();

  // 3) Validar que estás en /recursos
  await expect(page).toHaveURL(/\/recursos\/?/);

  // --- Debug: imprime todos los títulos de cards ---
  const allTitles = await page.locator('h3.biblioteca-card-title').allTextContents();
  console.log('Títulos en recursos:', allTitles);

  // --- Buscar y hacer click en la card específica ---
  const cardTitle = 'Guía esencial de respiración consciente para aliviar el estrés y mejorar tu día hoy';
  await expect(
    page.locator('h3.biblioteca-card-title', { hasText: cardTitle })
  ).toBeVisible({ timeout: 12000 });

  await page.locator('h3.biblioteca-card-title', { hasText: cardTitle }).click();

  await expect(page).toHaveURL(
    u('/recursos/guia-esencial-de-respiracion-consciente-para-aliviar-el-estres-y-mejorar-tu-dia-hoy/')
  );

  // ------ 1. Campos vacíos ------
  await page.locator('input[formcontrolname="name"]').fill('');
  await page.locator('input[formcontrolname="lastname"]').fill('');
  await page.locator('input[formcontrolname="email"]').fill('');
  await page.getByRole('button', { name: 'Recibir por mail' }).click();
  await page.waitForTimeout(800);

  await expect(page.locator('input[formcontrolname="name"] + .error-message')).toHaveText('Campo requerido.');
  await expect(page.locator('input[formcontrolname="lastname"] + .error-message')).toHaveText('Campo requerido.');
  await expect(page.locator('input[formcontrolname="email"] + .error-message')).toHaveText('Campo requerido.');

  // ------ 2. Nombre y Apellido con números ------
  await page.locator('input[formcontrolname="name"]').fill('Esperanza1');
  await page.locator('input[formcontrolname="lastname"]').fill('Martinez2');
  const email1 = `arijana+${emailCounter}@androvent.com`; emailCounter += 1;
  await page.locator('input[formcontrolname="email"]').fill(email1);
  await page.getByRole('button', { name: 'Recibir por mail' }).click();
  await page.waitForTimeout(800);

  await expect(page.locator('input[formcontrolname="name"] + .error-message')).toHaveText('Solo se permiten letras y espacios.');
  await expect(page.locator('input[formcontrolname="lastname"] + .error-message')).toHaveText('Solo se permiten letras y espacios.');

  // ------ 3. Email inválido ------
  await page.locator('input[formcontrolname="name"]').fill('Esperanza');
  await page.locator('input[formcontrolname="lastname"]').fill('Martinez');
  await page.locator('input[formcontrolname="email"]').fill('noesuncorreo');
  await page.getByRole('button', { name: 'Recibir por mail' }).click();
  await page.waitForTimeout(800);

  await expect(page.locator('input[formcontrolname="email"] + .error-message')).toHaveText('Formato inválido. Intenta nuevamente.');

  // ------ 4. Caso exitoso ------
  const email2 = `arijana+${emailCounter}@androvent.com`; emailCounter += 1;
  await page.locator('input[formcontrolname="name"]').fill('Esperanza');
  await page.locator('input[formcontrolname="lastname"]').fill('Martinez');
  await page.locator('input[formcontrolname="email"]').fill(email2);
  await page.getByRole('button', { name: 'Recibir por mail' }).click();
  await page.waitForTimeout(1300);

  // (Opcional) valida mensaje de éxito si existe:
  // await expect(page.getByText('¡Gracias por tu interés!')).toBeVisible();
});



// Test 5 logo de Vidafit
test('Click en el logo de Vidafit lleva al home', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);

  // Abre cualquier página interna (por ejemplo, el detalle de un recurso)
  await page.goto(u('/recursos/guia-esencial-de-respiracion-consciente-para-aliviar-el-estres-y-mejorar-tu-dia-hoy/'));

  // Espera que el logo esté visible
  await expect(page.locator('img.logo[alt="Vida Fit"]')).toBeVisible();

  // Haz click en el logo
  await page.locator('img.logo[alt="Vida Fit"]').click();

  // Valida que se navega al home
  await expect(page).toHaveURL(u('/'));
});

// Flecha back
test('Navegar por varias tarjetas de recurso y regresar con back', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await page.goto(u('/recursos/'));

  // Lista de tarjetas (título y URL destino)
  const cards = [
    {
      title: '99 Guía Básica de Respiración Consciente para Reducir el Estrés Diario',
      url: u('/recursos/99-guia-basica-de-respiracion-consciente-para-reducir-el-estres-diario/')
    },
    {
      title: '7 Guía Completa de Estiramientos para Aliviar la Tensión Diaria',
      url: u('/recursos/7-guia-completa-de-estiramientos-para-aliviar-la-tension-diaria/')
    }
    // Puedes agregar más tarjetas aquí
  ];

  for (const card of cards) {
    // Espera la tarjeta y haz click
    await expect(page.locator('h3.biblioteca-card-title', { hasText: card.title })).toBeVisible();
    await page.locator('h3.biblioteca-card-title', { hasText: card.title }).click();

    // Valida URL de detalle
    await expect(page).toHaveURL(card.url);

    // Click en back (y espera que regrese)
    await expect(page.locator('mat-icon.material-icons')).toBeVisible();
    await page.locator('mat-icon.material-icons').click();

    // Valida que regresa a la vista de recursos y aparece el título principal
    await expect(page).toHaveURL(u('/recursos/'));

    // Usa solo las clases comunes o el texto directamente (más robusto)
    await expect(
      page.locator('h1.text-2xl.font-semibold', { hasText: 'Consigue los recursos que necesitas' })
    ).toBeVisible();

    // Espera un segundo para visualizar la acción (opcional)
    await page.waitForTimeout(800);
  }
});

test('Filtrar por Entrenamiento y validar chip', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await page.goto(u('/recursos/'));

  const checkboxEntrenamiento = page.locator('input[type="checkbox"].myinput').nth(0);
  await expect(checkboxEntrenamiento).toBeVisible();
  await checkboxEntrenamiento.check();
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('span.category-chip')).some(
      el => el.textContent && el.textContent.includes('Entrenamiento')
    );
  }, null, { timeout: 10000 });
  await expect(page.locator('span.category-chip', { hasText: 'Entrenamiento' })).toBeVisible();
  await page.waitForTimeout(1000);
});

test('Filtrar por Nutrición y validar chip', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await page.goto(u('/recursos/'));

  // Selecciona el checkbox de Nutrición
  const checkboxNutricion = page.locator('input[type="checkbox"].myinput').nth(3); // Ajusta el índice si cambia
  await expect(checkboxNutricion).toBeVisible();
  await checkboxNutricion.check();

  // Espera a que se muestre algún chip de "Nutrición"
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('span.category-chip')).some(
      el => el.textContent && el.textContent.toLowerCase().includes('nutrición')
    );
  }, null, { timeout: 10000 });

  // Valida que al menos un chip visible tiene el texto "Nutrición"
  await expect(page.locator('span.category-chip').filter({ hasText: 'Nutrición' }).first()).toBeVisible();

  // (Opcional) imprime los chips encontrados para debug
  const chips = await page.locator('span.category-chip').allTextContents();
  console.log('Chips Nutrición:', chips);

  await page.waitForTimeout(1000);
});

test('Filtrar por Recetas Fitness y validar chip', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await page.goto(u('/recursos/'));

  // Selecciona el checkbox de Recetas Fitness
  const checkboxRecetas = page.locator('input[type="checkbox"].myinput').nth(5); // Ajusta el índice si cambia
  await expect(checkboxRecetas).toBeVisible();
  await checkboxRecetas.check();

  // Espera a que se muestre algún chip de "Recetas Fitness"
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('span.category-chip')).some(
      el => el.textContent && el.textContent.toLowerCase().includes('recetas fitness')
    );
  }, null, { timeout: 10000 });

  // Valida que al menos un chip visible tiene el texto "Recetas Fitness"
  await expect(page.locator('span.category-chip').filter({ hasText: 'Recetas Fitness' }).first()).toBeVisible();

  // (Opcional) imprime los chips encontrados para debug
  const chips = await page.locator('span.category-chip').allTextContents();
  console.log('Chips Recetas Fitness:', chips);

  await page.waitForTimeout(1000);
});

test('Filtrar por Vive Fit y validar chip', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await page.goto(u('/recursos/'));

  const checkboxViveFit = page.locator('input[type="checkbox"].myinput').nth(8);
  await expect(checkboxViveFit).toBeVisible();
  await checkboxViveFit.check();

  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('span.category-chip')).some(
      el => el.textContent && el.textContent.toLowerCase().includes('vive fit')
    );
  }, null, { timeout: 10000 });

  await expect(page.locator('span.category-chip').filter({ hasText: 'Vive Fit' }).first()).toBeVisible();

  const chips = await page.locator('span.category-chip').allTextContents();
  console.log('Chips Vive Fit:', chips);

  await page.waitForTimeout(1000);
});

test('Filtrar por Rutinas de Ejercicios y validar chip', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await page.goto(u('/recursos/'));

  const checkboxRutinas = page.locator('input[type="checkbox"].myinput').nth(12);
  await expect(checkboxRutinas).toBeVisible();
  await checkboxRutinas.check();

  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('span.category-chip')).some(
      el => el.textContent && el.textContent.toLowerCase().includes('rutinas de ejercicios')
    );
  }, null, { timeout: 10000 });

  await expect(page.locator('span.category-chip').filter({ hasText: 'Rutinas de Ejercicios' }).first()).toBeVisible();

  const chips = await page.locator('span.category-chip').allTextContents();
  console.log('Chips Rutinas:', chips);

  await page.waitForTimeout(1000);
});

//MENU 


// ------------------------------------------------------------------

test('Abrir menú hamburguesa y hacer click en Mi Inicio', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await page.goto(u('/'));

  // Abre el menú hamburguesa
  const menuHamburguesa = page.locator('mat-icon[data-mat-icon-name="my-icon-menu-ham"]');
  await expect(menuHamburguesa).toBeVisible();
  await menuHamburguesa.click();

  // Espera a que el menú se despliegue
  const menuContainer = page.locator('app-navigation-hamburger-menu');
  await expect(menuContainer).toBeVisible();

  // Haz click en "Mi Inicio"
  const miInicioMenu = menuContainer.locator('a', { hasText: 'Mi Inicio' });
  await expect(miInicioMenu).toBeVisible();
  await miInicioMenu.click();

  // Valida que sigues en el home
  await expect(page).toHaveURL(u('/'));

  await page.waitForTimeout(1000);
});

// ------------------------------------------------------------------

test('Flujo completo de navegación por el menú hamburguesa (Vidafit)', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await page.goto(u('/'));

  // Utilidad para abrir el menú hamburguesa
  async function abrirMenu() {
    const menuHamburguesa = page.locator('mat-icon[data-mat-icon-name="my-icon-menu-ham"]');
    await expect(menuHamburguesa).toBeVisible();
    await menuHamburguesa.click();
    await expect(page.locator('app-navigation-hamburger-menu')).toBeVisible();
  }

  const menu = page.locator('app-navigation-hamburger-menu');

  // 1. Rutinas
  await abrirMenu();
  await menu.getByRole('link', { name: 'Rutinas' }).click();
  await expect(page).toHaveURL(u('/rutinas-ejercicios/'));
  await page.waitForTimeout(700);

  // 2. Recetas
  await abrirMenu();
  await menu.getByRole('link', { name: 'Recetas' }).click();
  await expect(page).toHaveURL(u('/recetas-fitness/'));
  await page.waitForTimeout(700);

  // 3. Recursos
  await abrirMenu();
  await menu.getByRole('link', { name: 'Recursos' }).click();
  await expect(page).toHaveURL(u('/recursos/'));
  await page.waitForTimeout(700);

  // 4. Blog
  await abrirMenu();
  await menu.getByRole('link', { name: 'Blog' }).click();
  await expect(page).toHaveURL(u('/vive-fit/'));
  await page.waitForTimeout(700);

  // 5. Perfil (abrir modal)
  await abrirMenu();
  const perfilTrigger = menu.locator('a, span', { hasText: 'Perfil' }).first();
  await perfilTrigger.click();
  const botonUnete = page.locator('button', { hasText: 'Únete' });
  await expect(botonUnete).toBeVisible();
  await page.waitForTimeout(400);

  // 6. Únete (clic en botón Únete)
  await botonUnete.click();
  await expect(page).toHaveURL(u('/auth/signup/'));
  await page.waitForTimeout(700);

  // 7. Iniciar sesión (y cerrar con X)
  await abrirMenu();
  const iniciarSesionLink = menu.locator('a', { hasText: 'Iniciar sesión' });
  await iniciarSesionLink.click();
  await expect(page).toHaveURL(u('/auth/login/'));
  await page.waitForTimeout(700);

  const closeIcon = page.locator('mat-icon.material-icons', { hasText: 'close' });
  await closeIcon.click();
  await page.waitForTimeout(700);

  // 8. Volver al Home
  await page.goto(u('/'));
  await expect(page).toHaveURL(u('/'));
  await page.waitForTimeout(700);

  // 9. Términos y Condiciones
  await abrirMenu();
  const terminosLink = menu.locator('a', { hasText: 'Términos y Condiciones' });
  await terminosLink.click();
  const modalTitulo = page.locator('h1.font-bold.text-center', { hasText: 'ACUERDO DE SERVICIO' });
  await expect(modalTitulo).toBeVisible();
  await page.mouse.click(10, 10); // Click fuera para cerrar
  await expect(modalTitulo).not.toBeVisible();
});

// ------------------------------------------------------------------

test('Buscar recursos usando el buscador del menú lateral con "creatina"', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await page.goto(u('/'));

  // Abre el menú hamburguesa
  const menuHamburguesa = page.locator('mat-icon[data-mat-icon-name="my-icon-menu-ham"]');
  await menuHamburguesa.click();

  const menu = page.locator('app-navigation-hamburger-menu');
  await expect(menu).toBeVisible();

  // Busca el input y escribe
  const searchInput = menu.locator('input[placeholder="Buscar"]');
  await searchInput.evaluate(el => el.removeAttribute('readonly'));
  await searchInput.fill('creatina');
  await page.waitForTimeout(2000);

  // Log de los textos del menú
  const items = await menu.locator('*').allTextContents();
  console.log('Textos en el menú:', items);

  // Busca resultados con "creatina"
  const resultado = menu.locator('text=/creatina/i');
  await expect(resultado.first()).toBeVisible();

  const textos = await resultado.allTextContents();
  console.log('Resultados de búsqueda:', textos);
  for (const texto of textos) {
    expect(texto.toLowerCase()).toContain('creatina');
  }

  await page.waitForTimeout(1000);
});

// REGISTRO

/* ================= Utils (igual que antes) ================= */
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
    phone: String(Math.floor(9000000 + Math.random() * 1000000)),
    nombre: 'QA Esperanza',
    apellido: 'QA Martinez',
    password: 'Admin.01',
  };
}

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

/* ================= TEST 1: Movistar ================= */
test('Prueba gratis con Movistar', async ({ page }) => {
  const datos = generarDatos();

  await page.goto(u('/auth/signup/'), { waitUntil: 'domcontentloaded' });

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

  await page.goto(u('/auth/signup/'), { waitUntil: 'domcontentloaded' });

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

/* = TEST 3: Codegen mejorado (Movistar 2) = */
test('prueba gratis movistar 2', async ({ page }) => {
  const datos = generarDatos();

  // Home → CTA “Prueba gratis”
  await page.goto(u('/'), { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /^Prueba gratis$/i, exact: true }).click();

  // Paso intermedio
  await expect(page.getByRole('heading', { name: /prueba gratis por 3 días/i })).toBeVisible({ timeout: 10000 });
  const empezarBtn = page.getByRole('button', { name: /Empezar prueba gratis/i });
  if (!(await empezarBtn.isVisible().catch(() => false))) {
    await page.mouse.wheel(0, 2000);
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

  // Verificación final
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