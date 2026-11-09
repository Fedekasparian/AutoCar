// "Adherí tu taller" de punta a punta: un mecánico sin cuenta completa el formulario (se crea la cuenta y queda
// la solicitud pendiente), el admin la aprueba y el taller aparece en el ranking.
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
    const mecanico = await (await browser.newContext()).newPage();

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
        await mecanico.fill('#email', emailNuevo());
        await mecanico.fill('#password', PASSWORD);
        await mecanico.check('#condiciones');
        await mecanico.click('#form-adhesion button[type="submit"]');
        await expect(mecanico.locator('#estado-solicitud')).toContainText('pendiente');
        await expect(mecanico.locator('#form-adhesion')).toBeHidden();
    });

    await test.step('mientras está pendiente no aparece en el ranking', async () => {
        await mecanico.goto(pagina('pages/talleres/talleres.html'));
        await expect(mecanico.getByText(taller)).toHaveCount(0);
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

    await test.step('el mecánico ve su taller aprobado y entra a su panel', async () => {
        await mecanico.goto(pagina('pages/talleres/talleres-adherirse.html'));
        await expect(mecanico.locator('#estado-solicitud')).toContainText('aprobado');
        await mecanico.getByRole('link', { name: 'Ir a mi taller' }).click();
        await expect(mecanico).toHaveURL(/taller\.html/);
    });

    await test.step('ya aparece en el ranking', async () => {
        await mecanico.goto(pagina('pages/talleres/talleres.html'));
        await expect(mecanico.getByText(taller).first()).toBeVisible();
    });
});
