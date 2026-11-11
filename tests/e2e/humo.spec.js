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

    // Solo en Vercel: localmente la raíz la sirve el servidor estático, sin las redirecciones de vercel.json.
    test('la raíz del sitio lleva a la portada', async ({ page }) => {
        test.skip(!/vercel\.app/.test(process.env.BASE_URL || ''), 'La redirección es de vercel.json');
        await page.goto('/');
        await expect(page).toHaveURL(/\/front\/$/);
        await expect(page).toHaveTitle(/AutoCar/i);
    });

    // Un formulario de maqueta no manda nada (no hay ruta en el back): avisa y se queda en la página.
    // (Contacto ya está conectado a la API: se prueba con "Cambiar de nivel" del plan, que sigue siendo maqueta.)
    test('un formulario de maqueta avisa en lugar de dar 404', async ({ page }) => {
        await page.goto(pagina('pages/info/plan.html'));
        const formulario = page.locator('form[data-proximamente]');
        await formulario.locator('[type="submit"]').click();
        await expect(formulario.locator('.formulario__alerta')).toContainText('todavía no está disponible');
        await expect(page).toHaveURL(/plan\.html$/);
    });

    test('el listado de vehículos se muestra', async ({ page }) => {
        await page.goto(pagina('pages/vehiculos/buscar.html'));
        // Con o sin resultados, el total se completa cuando responde la API.
        await expect(page.locator('#resultados-total')).not.toBeEmpty();
    });
});
