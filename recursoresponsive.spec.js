const { test, expect, devices } = require('@playwright/test');


let emailCounter = 1;

const samsungS23Plus = {
  name: 'Samsung Galaxy S23+',
  viewport: { width: 500, height: 800 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S916B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36'
};

test.use(samsungS23Plus);

test('Flujo completo del formulario responsive: vacíos, inválidos y éxito', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await page.goto('https://front-qa.vida-fit.com/');

  // 1. Espera el ícono hamburguesa
  const menuHamburguesa = page.locator('mat-icon[data-mat-icon-name="my-icon-menu-ham"]');
  await expect(menuHamburguesa).toBeVisible();
  await menuHamburguesa.click();

  // 2. Espera que aparezca el menú desplegable
  await expect(page.locator('app-navigation-hamburger-menu')).toBeVisible();

  // 3. Ahora puedes interactuar con los links del menú...
  // Ejemplo: Click en Recursos
  await expect(page.getByRole('link', { name: 'RECURSOS' })).toBeVisible();
  await page.getByRole('link', { name: 'RECURSOS' }).click();

  // Debug: imprime los títulos para asegurar que el card existe
  const allTitles = await page.locator('h3.biblioteca-card-title').allTextContents();
  console.log('Títulos en recursos:', allTitles);

  const cardTitle = 'Guía esencial de respiración consciente para aliviar el estrés y mejorar tu día hoy';
  await expect(page.locator('h3.biblioteca-card-title', { hasText: cardTitle })).toBeVisible({ timeout: 12000 });
  await page.locator('h3.biblioteca-card-title', { hasText: cardTitle }).click();

  await expect(page).toHaveURL(
    'https://front-qa.vida-fit.com/recursos/guia-esencial-de-respiracion-consciente-para-aliviar-el-estres-y-mejorar-tu-dia-hoy/'
  );

  // ------ 1. Campos vacíos ------
  // SCROLL hacia los inputs (responsive/mobile)
  const nameInput = page.locator('input[formcontrolname="name"]');
  const lastnameInput = page.locator('input[formcontrolname="lastname"]');
  const emailInput = page.locator('input[formcontrolname="email"]');
  await nameInput.scrollIntoViewIfNeeded();
  await lastnameInput.scrollIntoViewIfNeeded();
  await emailInput.scrollIntoViewIfNeeded();

  await nameInput.fill('');
  await lastnameInput.fill('');
  await emailInput.fill('');
  await page.getByRole('button', { name: 'Recibir por mail' }).scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Recibir por mail' }).click();
  await page.waitForTimeout(800);

  await expect(nameInput.locator('+ .error-message')).toHaveText('Campo requerido.');
  await expect(lastnameInput.locator('+ .error-message')).toHaveText('Campo requerido.');
  await expect(emailInput.locator('+ .error-message')).toHaveText('Campo requerido.');

  // ------ 2. Nombre y Apellido con números ------
  await nameInput.fill('Esperanza1');
  await lastnameInput.fill('Martinez2');
  const email1 = `arijana+${emailCounter}@androvent.com`; emailCounter += 1;
  await emailInput.fill(email1);
  await page.getByRole('button', { name: 'Recibir por mail' }).click();
  await page.waitForTimeout(800);

  await expect(nameInput.locator('+ .error-message')).toHaveText('Solo se permiten letras y espacios.');
  await expect(lastnameInput.locator('+ .error-message')).toHaveText('Solo se permiten letras y espacios.');

  // ------ 3. Email inválido ------
  await nameInput.fill('Esperanza');
  await lastnameInput.fill('Martinez');
  await emailInput.fill('noesuncorreo');
  await page.getByRole('button', { name: 'Recibir por mail' }).click();
  await page.waitForTimeout(800);

  await expect(emailInput.locator('+ .error-message')).toHaveText('Formato inválido. Intenta nuevamente.');

  // ------ 4. Caso exitoso ------
  const email2 = `arijana+${emailCounter}@androvent.com`; emailCounter += 1;
  await nameInput.fill('Esperanza');
  await lastnameInput.fill('Martinez');
  await emailInput.fill(email2);
  await page.getByRole('button', { name: 'Recibir por mail' }).click();
  await page.waitForTimeout(1300);

  // Opcional: valida mensaje de éxito si existe en la UI
  // await expect(page.locator('text=¡Gracias por tu interés!')).toBeVisible();
});

//Test 5 logo de Vidafit
test('Click en el logo de Vidafit lleva al home', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  
  // Abre cualquier página interna (por ejemplo, el detalle de un recurso)
  await page.goto('https://front-qa.vida-fit.com/recursos/guia-esencial-de-respiracion-consciente-para-aliviar-el-estres-y-mejorar-tu-dia-hoy/');
  
  // Espera que el logo esté visible
  await expect(page.locator('img.logo[alt="Vida Fit"]')).toBeVisible();
  
  // Haz click en el logo
  await page.locator('img.logo[alt="Vida Fit"]').click();
  
  // Valida que se navega al home
  await expect(page).toHaveURL('https://front-qa.vida-fit.com/');
});
//Flecha back
test('Navegar por varias tarjetas de recurso y regresar con back', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await page.goto('https://front-qa.vida-fit.com/recursos/');

  // Lista de tarjetas (título y URL destino)
  const cards = [
    {
      title: '99 Guía Básica de Respiración Consciente para Reducir el Estrés Diario',
      url: 'https://front-qa.vida-fit.com/recursos/99-guia-basica-de-respiracion-consciente-para-reducir-el-estres-diario/'
    },
    {
      title: '7 Guía Completa de Estiramientos para Aliviar la Tensión Diaria',
      url: 'https://front-qa.vida-fit.com/recursos/7-guia-completa-de-estiramientos-para-aliviar-la-tension-diaria/'
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
    await expect(page).toHaveURL('https://front-qa.vida-fit.com/recursos/');

    // Usa solo las clases comunes o el texto directamente (más robusto)
    await expect(
      page.locator('h1.text-2xl.font-semibold', { hasText: 'Consigue los recursos que necesitas' })
    ).toBeVisible();

    // O alternativamente, SOLO con el texto (si hay un solo h1):
    // await expect(page.getByRole('heading', { level: 1, name: 'Consigue los recursos que necesitas' })).toBeVisible();

    // Espera un segundo para visualizar la acción (opcional)
    await page.waitForTimeout(800);
  }
});


test('Filtro responsive: Entrenamiento', async ({ page }) => {
await context.grantPermissions(['geolocation']);
  await page.goto('https://front-qa.vida-fit.com/recursos/');

  // Abre panel de filtros
  await page.getByText('Filtros', { exact: true }).click();

  // Checkbox Entrenamiento (normalmente .nth(0))
  const check = page.locator('input[type="checkbox"].myinput').nth(0);
  await expect(check).toBeVisible();
  await check.check();

  // Mostrar resultados
  await page.getByText('Mostrar resultados', { exact: true }).click();

  // Valida chip
  await expect(page.locator('span.category-chip', { hasText: 'Entrenamiento' })).toBeVisible();
});

/** Nutrición */
test('Filtro responsive: Nutrición', async ({ page }) => {
await context.grantPermissions(['geolocation']);
  await page.goto('https://front-qa.vida-fit.com/recursos/');
  await page.getByText('Filtros', { exact: true }).click();

  const check = page.locator('input[type="checkbox"].myinput').nth(3);
  await expect(check).toBeVisible();
  await check.check();
  await page.getByText('Mostrar resultados', { exact: true }).click();

  await expect(page.locator('span.category-chip', { hasText: 'Nutrición' })).toBeVisible();
});

/** Recetas Fitness */
test('Filtro responsive: Recetas Fitness', async ({ page }) => {
    await context.grantPermissions(['geolocation']);
  await page.goto('https://front-qa.vida-fit.com/recursos/');
  await page.getByText('Filtros', { exact: true }).click();

  const check = page.locator('input[type="checkbox"].myinput').nth(5);
  await expect(check).toBeVisible();
  await check.check();
  await page.getByText('Mostrar resultados', { exact: true }).click();

  await expect(page.locator('span.category-chip', { hasText: 'Recetas Fitness' })).toBeVisible();
});

/** Vive Fit */
test('Filtro responsive: Vive Fit', async ({ page }) => {
    await context.grantPermissions(['geolocation']);
  await page.goto('https://front-qa.vida-fit.com/recursos/');
  await page.getByText('Filtros', { exact: true }).click();

  const check = page.locator('input[type="checkbox"].myinput').nth(8);
  await expect(check).toBeVisible();
  await check.check();
  await page.getByText('Mostrar resultados', { exact: true }).click();

  await expect(page.locator('span.category-chip', { hasText: 'Vive Fit' })).toBeVisible();
});

/** Rutinas de Ejercicios */
test('Filtro responsive: Rutinas de Ejercicios', async ({ page }) => {
    await context.grantPermissions(['geolocation']);
  await page.goto('https://front-qa.vida-fit.com/recursos/');

  // CORREGIDO: Busca el botón Filtros por texto, no por clase
  await page.getByText('Filtros', { exact: true }).click();

  // Selecciona el checkbox (ajusta el índice según corresponda)
  const check = page.locator('input[type="checkbox"].myinput').nth(12);
  await expect(check).toBeVisible();
  await check.check();

  // Click en "Mostrar resultados"
  await page.getByText('Mostrar resultados', { exact: true }).click();

  // Valida el chip en resultados
  await expect(page.locator('span.category-chip', { hasText: 'Rutinas de Ejercicios' })).toBeVisible();
});
