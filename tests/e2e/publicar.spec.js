// Publicar por partes, como lo pidió el profe: el vendedor carga marca, modelo y año, sale, y después la termina
// desde Mis publicaciones. El moderador no la puede aprobar mientras está incompleta.
// Escribe datos: corre contra dev o local, nunca contra producción.
//
// Variables: E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (alguien con vehiculos.moderar; sin ellas se saltea la moderación)
import { test, expect } from '@playwright/test';
import { pagina, soloFueraDeProduccion, emailNuevo, PASSWORD } from './entorno.js';

soloFueraDeProduccion();

const ADMIN = { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD };
// Un PNG de 1×1 píxel para subir como foto
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

async function ingresar(page, email, password) {
    await page.goto(pagina('pages/auth/login.html'));
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('#form-login button[type="submit"]');
    await expect(page).toHaveURL(/home\.html/);
}

test('publicar de a poco: guardar el paso 1, salir, terminarla después y enviarla a revisión', async ({ browser }) => {
    const vendedor = await (await browser.newContext()).newPage();
    const email = emailNuevo();
    const anio = String(1990 + (Date.now() % 30)); // para reconocerla entre otras

    await test.step('se registra', async () => {
        await vendedor.goto(pagina('pages/auth/registro.html'));
        await vendedor.fill('#nombre', 'Vendedor E2E');
        await vendedor.fill('#email', email);
        await vendedor.fill('#password', PASSWORD);
        await vendedor.fill('#password_confirm', PASSWORD);
        await vendedor.click('#form-registro button[type="submit"]');
        await expect(vendedor).toHaveURL(/home\.html/);
    });

    await test.step('carga solo marca, modelo y año, y sale', async () => {
        await vendedor.goto(pagina('pages/vehiculos/publicar.html'));
        await vendedor.selectOption('#marca', 'Ford');
        await vendedor.selectOption('#modelo', 'Ka');
        await vendedor.fill('#anio', anio);
        await vendedor.click('#guardar-salir');
        await expect(vendedor).toHaveURL(/mis-publicaciones\.html/);
    });

    const fila = vendedor.locator('li.publicacion', { hasText: `Ford Ka ${anio}` });
    let idPublicacion = null; // el año se puede repetir entre corridas: la tarjeta del moderador se busca por id

    await test.step('en Mis publicaciones aparece "Sin terminar" con lo que le falta', async () => {
        await expect(fila).toContainText('Sin terminar');
        await expect(fila).toContainText('Te falta: precio');
    });

    await test.step('la continúa: cada paso se guarda', async () => {
        await fila.getByRole('link', { name: 'Continuar' }).click();
        await expect(vendedor).toHaveURL(/publicar\.html\?id=\d+/);
        idPublicacion = new URL(vendedor.url()).searchParams.get('id');
        // Arranca en el primer paso que tiene algo sin cargar: la ficha técnica
        await expect(vendedor.locator('#pasos-texto')).toContainText('Paso 2');
        await vendedor.fill('#kilometraje', '90000');
        await vendedor.selectOption('#combustible', 'nafta');
        await vendedor.check('#tr-manual', { force: true });
        await vendedor.selectOption('#condicion', 'bueno');
        await vendedor.click('#paso-siguiente');

        await expect(vendedor.locator('#pasos-texto')).toContainText('Fotos');
        await vendedor.setInputFiles('#fotos', [{ name: 'auto.png', mimeType: 'image/png', buffer: PNG }]);
        await vendedor.click('#paso-siguiente');
        await expect(vendedor.locator('#fotos-actuales li')).toHaveCount(1);

        await expect(vendedor.locator('#pasos-texto')).toContainText('Precio');
        await vendedor.fill('#precio', '7500000');
        await vendedor.click('#paso-siguiente');

        await expect(vendedor.locator('#pasos-texto')).toContainText('Ubicación');
        await vendedor.click('#paso-siguiente');

        await expect(vendedor.locator('#completitud')).toContainText('Está completa');
        await expect(vendedor.locator('#terminar')).toHaveText('Enviar a revisión');
        await vendedor.click('#terminar');
        await expect(vendedor.locator('#enviada')).toContainText('la enviaste a revisión');
        await expect(vendedor.locator('#form-publicar')).toBeHidden();
        await vendedor.click('#ir-a-mis-publicaciones');
        await expect(fila).toContainText('En revisión');
    });

    test.skip(!ADMIN.email || !ADMIN.password, 'Faltan E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD para moderarla.');

    await test.step('el moderador la aprueba y se publica', async () => {
        const admin = await (await browser.newContext()).newPage();
        await ingresar(admin, ADMIN.email, ADMIN.password);
        await admin.goto(pagina('pages/admin/admin-moderar.html?estado=pendiente'));
        const tarjeta = admin.locator(`li.propuesta:has(#motivo-${idPublicacion})`);
        await tarjeta.getByRole('button', { name: 'Aprobar' }).click();
        await expect(admin.locator('.aviso-flotante')).toContainText('Se aprobó'); // aviso flotante (vistas.avisoFlotante)

        await vendedor.reload();
        await expect(fila).toContainText('Publicada');
    });
});

test('el moderador no puede aprobar una publicación sin terminar', async ({ browser }) => {
    test.skip(!ADMIN.email || !ADMIN.password, 'Faltan E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD.');
    const vendedor = await (await browser.newContext()).newPage();
    const email = emailNuevo();
    await vendedor.goto(pagina('pages/auth/registro.html'));
    await vendedor.fill('#nombre', 'Vendedor E2E');
    await vendedor.fill('#email', email);
    await vendedor.fill('#password', PASSWORD);
    await vendedor.fill('#password_confirm', PASSWORD);
    await vendedor.click('#form-registro button[type="submit"]');
    await expect(vendedor).toHaveURL(/home\.html/);
    await vendedor.goto(pagina('pages/vehiculos/publicar.html'));
    await vendedor.selectOption('#marca', 'Fiat');
    await vendedor.selectOption('#modelo', 'Cronos');
    await vendedor.fill('#anio', '2021');
    await vendedor.click('#guardar-salir');
    await expect(vendedor).toHaveURL(/mis-publicaciones\.html/);

    const admin = await (await browser.newContext()).newPage();
    await ingresar(admin, ADMIN.email, ADMIN.password);
    // En "Pendientes" no aparece; en "Incompletas" sí, sin botón Aprobar
    await admin.goto(pagina('pages/admin/admin-moderar.html?estado=pendiente'));
    await expect(admin.locator('#estado')).not.toContainText('Cargando');
    await expect(admin.locator('li.propuesta', { hasText: `Vendedor E2E (${email})` })).toHaveCount(0);
    await admin.goto(pagina('pages/admin/admin-moderar.html?estado=incompletas'));
    const tarjeta = admin.locator('li.propuesta', { hasText: `Vendedor E2E (${email})` });
    await expect(tarjeta).toContainText('Incompleta: le falta precio');
    await expect(tarjeta.getByRole('button', { name: 'Aprobar' })).toHaveCount(0);
});
