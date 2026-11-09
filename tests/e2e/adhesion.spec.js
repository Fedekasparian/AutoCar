// "Adherí tu taller" de punta a punta: el taller completa el formulario sin sesión (se crea la cuenta del taller,
// aparte de la personal, y queda la solicitud pendiente), no puede ingresar hasta que el admin la aprueba, y
// después entra a su panel y aparece en el ranking.
// Escribe datos: corre contra dev o local, nunca contra producción.
//
// Variables: E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (alguien con usuarios.editar; sin ellas se saltea la aprobación)
import { test, expect } from '@playwright/test';
import { pagina, soloFueraDeProduccion, emailNuevo, PASSWORD } from './entorno.js';

soloFueraDeProduccion();

const ADMIN = { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD };

test('un mecánico pide sumarse, el admin lo aprueba y aparece en el ranking', async ({ browser }) => {
    const sufijo = Date.now();
    const taller = `Taller E2E ${sufijo}`;
    const localidad = `Pueblo E2E ${sufijo}`; // propia, para encontrarlo solo en el ranking
    const email = emailNuevo();
    const mecanico = await (await browser.newContext()).newPage();

    async function ingresarComoTaller() {
        await mecanico.goto(pagina('pages/auth/login.html'));
        await mecanico.fill('#email', email);
        await mecanico.fill('#password', PASSWORD);
        await mecanico.click('#form-login button[type="submit"]');
    }

    await test.step('sin cuenta: completa el taller y la cuenta, y queda pendiente', async () => {
        await mecanico.goto(pagina('pages/talleres/talleres-adherirse.html'));
        await mecanico.fill('#nombre', taller);
        await mecanico.fill('#cuit', '30-12345678-9');
        await mecanico.fill('#direccion', 'Calle 1 123');
        await mecanico.fill('#localidad', localidad);
        await mecanico.fill('#telefono', '02324 123456');
        await mecanico.fill('#horarios', 'Lun a vie 8 a 18');
        await mecanico.fill('#precio_inspeccion', '120000');
        await mecanico.fill('#responsable', 'Mecánico E2E');
        await mecanico.fill('#email', email);
        await mecanico.fill('#password', PASSWORD);
        await mecanico.check('#condiciones');
        await mecanico.click('#form-adhesion button[type="submit"]');
        await expect(mecanico.locator('#estado-solicitud')).toContainText('pendiente');
        await expect(mecanico.locator('#form-adhesion')).toBeHidden();
    });

    await test.step('mientras está pendiente no aparece en el ranking ni puede ingresar', async () => {
        await mecanico.goto(pagina('pages/talleres/talleres.html'));
        await expect(mecanico.getByText(taller)).toHaveCount(0);
        await ingresarComoTaller();
        await expect(mecanico.locator('#form-login .formulario__alerta')).toContainText('en revisión');
    });

    test.skip(!ADMIN.email || !ADMIN.password, 'Faltan E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD para aprobarla.');

    await test.step('el admin la aprueba', async () => {
        const admin = await (await browser.newContext()).newPage();
        await admin.goto(pagina('pages/auth/login.html'));
        await admin.fill('#email', ADMIN.email);
        await admin.fill('#password', ADMIN.password);
        await admin.click('#form-login button[type="submit"]');
        await expect(admin).toHaveURL(/home\.html/);
        await admin.goto(pagina('pages/admin/admin-talleres.html'));
        const tarjeta = admin.locator('article', { hasText: taller });
        await tarjeta.getByRole('button', { name: 'Aprobar' }).click();
        await expect(admin.locator('#aviso')).toContainText(taller);
        await expect(admin.locator('article', { hasText: taller })).toHaveCount(0);
    });

    await test.step('aprobado, ingresa con la cuenta del taller y entra a su panel', async () => {
        await ingresarComoTaller();
        await expect(mecanico).not.toHaveURL(/login\.html/);
        await mecanico.goto(pagina('pages/talleres/talleres-adherirse.html'));
        await mecanico.getByRole('link', { name: 'Ir a mi taller' }).click();
        await expect(mecanico).toHaveURL(/taller\.html/);
    });

    await test.step('ya aparece en el ranking', async () => {
        await mecanico.goto(pagina('pages/talleres/talleres.html'));
        await expect(mecanico.getByText(taller).first()).toBeVisible();
    });
});

test('logueado no se ve el formulario; después de salir, el email de esa cuenta no sirve para el taller', async ({ page }) => {
    const email = emailNuevo();
    await page.goto(pagina('pages/auth/registro.html'));
    await page.fill('#nombre', 'Persona E2E');
    await page.fill('#email', email);
    await page.fill('#password', PASSWORD);
    await page.fill('#password_confirm', PASSWORD);
    await page.click('#form-registro button[type="submit"]');
    await expect(page).not.toHaveURL(/registro\.html/);

    // Con la sesión personal abierta: el formulario no aparece, solo el aviso y el botón para salir
    await page.goto(pagina('pages/talleres/talleres-adherirse.html'));
    await expect(page.locator('#form-adhesion')).toBeHidden();
    await expect(page.locator('#estado-solicitud')).toContainText('aparte de tu cuenta personal');
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page.locator('#form-adhesion')).toBeVisible();

    await page.fill('#nombre', 'Taller repetido');
    await page.fill('#cuit', '30-12345678-9');
    await page.fill('#direccion', 'Calle 1 123');
    await page.fill('#localidad', 'Mercedes');
    await page.fill('#telefono', '02324 123456');
    await page.fill('#horarios', 'Lun a vie 8 a 18');
    await page.fill('#precio_inspeccion', '120000');
    await page.fill('#responsable', 'Persona E2E');
    await page.fill('#email', email);
    await page.fill('#password', PASSWORD);
    await page.check('#condiciones');
    await page.click('#form-adhesion button[type="submit"]');
    await expect(page.locator('#email-error')).toContainText('ya tiene una cuenta');
});
