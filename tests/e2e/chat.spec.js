// Chat entre un interesado y el vendedor: "Consultar" en la publicación, mensajes que llegan solos
// (polling) y la bandeja de cada uno. Escribe datos: corre contra dev o local, nunca contra producción.
//
// Necesita una publicación disponible y la cuenta de su vendedor:
//   E2E_CHAT_VEHICULO_ID / E2E_CHAT_VENDEDOR_EMAIL / E2E_CHAT_VENDEDOR_PASSWORD
// Sin ellas se saltea.
import { test, expect } from '@playwright/test';
import { pagina, soloFueraDeProduccion, emailNuevo, PASSWORD } from './entorno.js';

soloFueraDeProduccion();

const VEHICULO = process.env.E2E_CHAT_VEHICULO_ID;
const VENDEDOR = { email: process.env.E2E_CHAT_VENDEDOR_EMAIL, password: process.env.E2E_CHAT_VENDEDOR_PASSWORD };

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

test('consultar al vendedor y chatear', async ({ browser }) => {
    test.skip(!VEHICULO || !VENDEDOR.email || !VENDEDOR.password,
        'Faltan E2E_CHAT_VEHICULO_ID, E2E_CHAT_VENDEDOR_EMAIL y E2E_CHAT_VENDEDOR_PASSWORD.');
    test.setTimeout(120_000);
    const pregunta = `¿Sigue disponible? (E2E ${Date.now()})`;
    const respuesta = `Sí, sigue. <b>Pasá</b> cuando quieras (E2E ${Date.now()})`;
    const interesado = await (await browser.newContext()).newPage();
    const vendedor = await (await browser.newContext()).newPage();

    await test.step('el interesado toca "Consultar" y escribe', async () => {
        await registrar(interesado, 'Interesado E2E');
        await interesado.goto(pagina(`pages/vehiculos/vehiculo.html?id=${VEHICULO}`));
        await interesado.click('#vehiculo-consultar');
        await expect(interesado).toHaveURL(/conversacion\.html\?id=\d+/);
        await expect(interesado.locator('#chat-rol')).toHaveText('Vendedor');
        await expect(interesado.locator('#chat-sin-mensajes')).toBeVisible();

        // Vacío no se manda
        await interesado.click('#chat-form button[type="submit"]');
        await expect(interesado.locator('#texto-error')).not.toBeEmpty();

        await interesado.fill('#texto', pregunta);
        await interesado.click('#chat-form button[type="submit"]');
        await expect(interesado.locator('.chat__mensaje--mio', { hasText: pregunta })).toBeVisible();
        await expect(interesado.locator('#texto')).toHaveValue('');
    });

    await test.step('al vendedor le aparece en la bandeja, sin leer, y responde', async () => {
        await ingresar(vendedor, VENDEDOR);
        await vendedor.goto(pagina('pages/operaciones/mensajes.html'));
        const item = vendedor.locator('.inbox__item', { hasText: pregunta });
        await expect(item).toBeVisible();
        await expect(item).toContainText('tu publicación');
        await expect(item.locator('.inbox__no-leidos')).toHaveText('1');
        await item.click();

        await expect(vendedor.locator('#chat-rol')).toHaveText('Le interesa tu publicación');
        await expect(vendedor.locator('.chat__mensaje:not(.chat__mensaje--mio)', { hasText: pregunta })).toBeVisible();
        await vendedor.fill('#texto', respuesta);
        await vendedor.click('#chat-form button[type="submit"]');
        await expect(vendedor.locator('.chat__mensaje--mio', { hasText: respuesta })).toBeVisible();
    });

    await test.step('al interesado le llega la respuesta sin recargar, como texto', async () => {
        const recibido = interesado.locator('.chat__mensaje:not(.chat__mensaje--mio)', { hasText: respuesta });
        await expect(recibido).toBeVisible({ timeout: 15_000 }); // polling cada 5 s
        await expect(recibido.locator('b')).toHaveCount(0); // las etiquetas no se interpretan
    });

    await test.step('volver a "Consultar" retoma la misma conversación', async () => {
        const url = interesado.url();
        await interesado.goto(pagina(`pages/vehiculos/vehiculo.html?id=${VEHICULO}`));
        await interesado.click('#vehiculo-consultar');
        await expect(interesado).toHaveURL(url);
    });

    await test.step('el vendedor no puede consultarse a sí mismo', async () => {
        await vendedor.goto(pagina(`pages/vehiculos/vehiculo.html?id=${VEHICULO}`));
        await vendedor.click('#vehiculo-consultar');
        await expect(vendedor.locator('#vehiculo-consultar-aviso')).toContainText('propia');
        await expect(vendedor).toHaveURL(/vehiculo\.html/);
    });

    await interesado.context().close();
    await vendedor.context().close();
});
