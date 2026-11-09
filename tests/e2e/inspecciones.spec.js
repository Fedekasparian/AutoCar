// F9: el recorrido de la demo de inspecciones, de punta a punta y con tres navegadores a la vez
// (comprador, mecánico y admin), como se muestra el 30/11:
//   ranking → pedir → aceptar → checklist y firma → informe → reclamo → resolución.
// Escribe datos: corre contra dev o local, nunca contra producción.
//
// Necesita los datos de demo del back (database/demo-inspecciones.sql). Usa al mecánico 5 (Luján) para no
// tocar al mecánico 1, que es el de la demo en vivo. El reclamo se resuelve "no procede" para no bajarlo en el
// ranking; el tope de la compensación se prueba antes, sin guardar.
//
// Variables:
//   E2E_MECANICO_EMAIL / E2E_MECANICO_PASSWORD / E2E_MECANICO_TALLER  (por defecto, el mecánico 5 de la demo)
//   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD  (alguien con reclamos.resolver; sin ellas se saltea la resolución)
import { test, expect } from '@playwright/test';
import { pagina, soloFueraDeProduccion, emailNuevo, PASSWORD } from './entorno.js';

soloFueraDeProduccion();

const MECANICO = {
    email: process.env.E2E_MECANICO_EMAIL || 'mecanico5@demo.autocar.com.ar',
    password: process.env.E2E_MECANICO_PASSWORD || 'mecanico-demo', // la del seed de demo-inspecciones.sql
    taller: process.env.E2E_MECANICO_TALLER || 'Medina Mecánica (demo)',
};
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD };

const CODIGOS = ['carroceria', 'estructura', 'motor', 'transmision', 'frenos',
    'suspension', 'neumaticos', 'electricidad', 'kilometraje', 'identificacion'];

async function registrar(page, nombre) {
    await page.goto(pagina('pages/auth/registro.html'));
    await page.fill('#nombre', nombre);
    await page.fill('#email', emailNuevo());
    await page.fill('#password', PASSWORD);
    await page.fill('#password_confirm', PASSWORD);
    await page.click('#form-registro button[type="submit"]');
    await expect(page).toHaveURL(/home\.html/);
}

async function ingresar(page, { email, password }) {
    await page.goto(pagina('pages/auth/login.html'));
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('#form-login button[type="submit"]');
    await expect(page).toHaveURL(/home\.html/);
}

// Mañana a las 10, en el formato de <input type="datetime-local">.
function turnoDeManana() {
    const d = new Date(Date.now() + 24 * 3600 * 1000);
    const dosCifras = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${dosCifras(d.getMonth() + 1)}-${dosCifras(d.getDate())}T10:00`;
}

test('recorrido de la demo: pedir, aceptar, firmar, reclamar y resolver', async ({ browser }) => {
    test.setTimeout(360_000); // tres sesiones (en WebKit local tarda ~3 min) y, en dev, Render puede estar dormido
    const titulo = `E2E Volkswagen Gol ${Date.now()}`;
    const comprador = await (await browser.newContext()).newPage();
    const mecanico = await (await browser.newContext()).newPage();
    let id;

    await test.step('el comprador elige al mecánico en el ranking y pide la inspección', async () => {
        await registrar(comprador, 'Comprador E2E');
        await comprador.goto(pagina('pages/talleres/talleres.html'));
        const fila = comprador.locator('.fila--mecanico', { hasText: MECANICO.taller });
        await expect(fila).toBeVisible();
        await fila.getByRole('link', { name: /^Elegir/ }).click();

        await expect(comprador).toHaveURL(/pedir-inspeccion\.html\?mecanico=\d+/);
        await expect(comprador.locator('#mecanicos label', { hasText: MECANICO.taller })
            .locator('input[type="radio"]')).toBeChecked();
        await expect(comprador.locator('#resumen')).toBeVisible();

        // Un link de un sitio cualquiera no se acepta
        await comprador.fill('#url', 'https://www.otrositio.com/auto/1');
        await expect(comprador.locator('#url-error')).toContainText('Por ahora solo inspeccionamos');
        await comprador.fill('#url', `https://auto.mercadolibre.com.ar/MLA-${Date.now()}-gol-trend-_JM`);
        await expect(comprador.locator('#url-ayuda')).toContainText('MercadoLibre');
        await comprador.locator('#datos-auto summary').click();
        await comprador.fill('#titulo', titulo);
        await comprador.fill('#localidad', 'Luján');

        // Sin aceptar el alcance no se puede pedir
        await comprador.click('#pedido button[type="submit"]');
        await expect(comprador.locator('#acepto_alcance-error')).not.toBeEmpty();
        await expect(comprador).toHaveURL(/pedir-inspeccion\.html/);

        await comprador.check('#acepto_alcance');
        await comprador.click('#pedido button[type="submit"]');
        await expect(comprador).toHaveURL(/mis-inspecciones\.html\?nueva=\d+/);
        id = Number(new URL(comprador.url()).searchParams.get('nueva'));
        await expect(comprador.locator('#lista')).toContainText(titulo);
    });

    await test.step('el mecánico acepta el pedido con un turno', async () => {
        await ingresar(mecanico, MECANICO);
        await mecanico.goto(pagina('pages/talleres/taller.html'));
        const fila = mecanico.locator('.fila--inspeccion', { hasText: titulo });
        await fila.getByRole('button', { name: 'Aceptar' }).click();
        await mecanico.fill('#aceptar-fecha', turnoDeManana());
        await mecanico.click('#form-aceptar button[type="submit"]');
        await expect(mecanico.locator('#aviso')).toBeVisible();
        await expect(mecanico.locator('#aviso a', { hasText: 'Revisar y firmar' })).toHaveAttribute('href', new RegExp(`id=${id}$`));
    });

    await test.step('el mecánico completa el checklist y firma', async () => {
        await mecanico.goto(pagina(`pages/talleres/taller-verificacion.html?id=${id}`));
        await expect(mecanico.locator('#informe')).toBeVisible();
        for (const codigo of CODIGOS) {
            const valor = codigo === 'carroceria' ? 'observado' : 'ok';
            await mecanico.click(`label[for="resultado-${codigo}-${valor}"]`);
        }
        await mecanico.fill('#nota-carroceria', 'Rayón en la puerta trasera izquierda');
        await mecanico.click('label[for="conclusion-con_reparos"]');
        await mecanico.fill('#resumen', 'Auto en buen estado general. Revisar el rayón antes de cerrar el precio.');
        await expect(mecanico.locator('#progreso-texto')).toHaveText('10 de 10');

        await mecanico.click('#informe button[type="submit"]');
        await mecanico.click('#confirmar-firma');
        await expect(mecanico.locator('#firmado')).toBeVisible();
        await expect(mecanico.locator('#firmado-datos')).toContainText(/[0-9a-f]{64}/);
        await expect(mecanico.locator('#informe')).toBeHidden(); // firmado ya no se edita
    });

    await test.step('el comprador ve el informe firmado y reclama', async () => {
        await comprador.goto(pagina(`pages/talleres/verificacion.html?id=${id}`));
        await expect(comprador.locator('#informe')).toBeVisible();
        await expect(comprador.locator('#informe-conclusion')).toContainText('reparos');
        await expect(comprador.locator('#informe-firma')).toContainText(/[0-9a-f]{64}/);
        await expect(comprador.locator('#tramites')).toBeVisible();

        await expect(comprador.locator('#form-reclamo')).toBeVisible();
        await expect(comprador.locator('#reclamo-alcance details')).toBeAttached();
        await comprador.selectOption('#item_codigo', 'estructura');
        await comprador.fill('#descripcion', 'Tenía un golpe en el zócalo derecho y el informe no lo marca.');
        await comprador.click('#form-reclamo button[type="submit"]');
        await expect(comprador.locator('#reclamo-datos')).toBeVisible();
        await expect(comprador.locator('#reclamo-datos')).toContainText('En revisión');
        await expect(comprador.locator('#form-reclamo')).toBeHidden(); // un solo reclamo
    });

    await test.step('otro usuario no puede ver la inspección', async () => {
        const intruso = await (await browser.newContext()).newPage();
        await registrar(intruso, 'Intruso E2E');
        await intruso.goto(pagina(`pages/talleres/verificacion.html?id=${id}`));
        await expect(intruso.locator('#estado')).not.toBeEmpty();
        await expect(intruso.locator('#resumen')).toBeHidden();
        await expect(intruso.locator('#informe')).toBeHidden();
        await intruso.context().close();
    });

    await test.step('el admin resuelve el reclamo', async () => {
        if (!ADMIN.email || !ADMIN.password) {
            test.info().annotations.push({ type: 'salteado', description: 'Sin E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD no se prueba la resolución.' });
            return;
        }
        const admin = await (await browser.newContext()).newPage();
        await ingresar(admin, ADMIN);
        await admin.goto(pagina('pages/admin/admin-reclamos.html'));
        const tarjeta = admin.locator('article', { hasText: titulo });
        await tarjeta.getByRole('button', { name: 'Resolver' }).click();

        // La compensación no puede pasar el tope (3 veces el precio): no se guarda
        await admin.check('#decision-procede');
        const tope = Number(await admin.locator('#compensacion').getAttribute('max'));
        expect(tope).toBeGreaterThan(0);
        await admin.fill('#compensacion', String(tope + 1000));
        await admin.fill('#respuesta', 'Prueba del tope');
        await admin.click('#form-resolver button[type="submit"]');
        await expect(admin.locator('#compensacion-error')).not.toBeEmpty();

        await admin.check('#decision-no');
        await admin.fill('#respuesta', 'El golpe no se veía sin levantar el auto: queda fuera del alcance.');
        await admin.click('#form-resolver button[type="submit"]');
        await expect(tarjeta).toBeHidden();

        await comprador.reload();
        await expect(comprador.locator('#reclamo-datos')).toContainText('No procede');
        await expect(comprador.locator('#reclamo-datos')).toContainText('fuera del alcance');
        await admin.context().close();
    });

    await comprador.context().close();
    await mecanico.context().close();
});

test('desde un aviso, el link del auto viene fijo y no se puede cambiar', async ({ page }) => {
    const aviso = `https://auto.mercadolibre.com.ar/MLA-${Date.now()}-gol-trend-_JM`;
    await registrar(page, 'Comprador E2E');
    await page.goto(pagina(`pages/talleres/pedir-inspeccion.html?url=${encodeURIComponent(aviso)}`));
    const campo = page.locator('#url');
    await expect(campo).toHaveValue(aviso);
    await expect(campo).toHaveAttribute('readonly', '');
    await expect(page.locator('#url-ayuda')).toContainText('que estabas mirando');

    // Sin ?url (botón "Mandale un mecánico a otro auto") se sigue pegando a mano
    await page.goto(pagina('pages/talleres/pedir-inspeccion.html'));
    await expect(page.locator('#url')).toBeEditable();
});
