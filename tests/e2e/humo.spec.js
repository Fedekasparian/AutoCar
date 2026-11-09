// @humo: solo lectura. Es lo único que corre contra producción después de cada deploy a main.
import { test, expect } from '@playwright/test';
import { pagina } from './entorno.js';

test.describe('@humo', () => {
    test('la portada carga', async ({ page }) => {
        const respuesta = await page.goto(pagina('index.html'));
        expect(respuesta.status()).toBe(200);
        await expect(page).toHaveTitle(/AutoCar/i);
    });

    test('el proxy /api llega al back del entorno', async ({ request }) => {
        const respuesta = await request.get('/api/marcas');
        expect(respuesta.status(), 'Si da 503, falta BACKEND_URL en Vercel para este entorno').toBe(200);
        expect(respuesta.headers()['content-type']).toContain('application/json');
    });

    test('el listado de vehículos se muestra', async ({ page }) => {
        await page.goto(pagina('pages/vehiculos/buscar.html'));
        // Con o sin resultados, el total se completa cuando responde la API.
        await expect(page.locator('#resultados-total')).not.toBeEmpty();
    });
});
