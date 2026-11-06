// Buscar y filtrar vehículos, y abrir un detalle. Solo lee: también es seguro contra producción.
import { test, expect } from '@playwright/test';
import { pagina } from './entorno.js';

test('los filtros viajan en la URL y la API responde con ellos', async ({ page }) => {
    const pedido = page.waitForRequest((r) => r.url().includes('/api/vehiculos') && r.url().includes('combustible=nafta'));
    await page.goto(pagina('pages/vehiculos/buscar.html?combustible=nafta&precio_max=50000000'));
    await pedido;
    await expect(page.locator('#resultados-total')).not.toBeEmpty();
    await expect(page.locator('#combustible')).toHaveValue('nafta');
});

test('desde el listado se abre el detalle del vehículo', async ({ page }) => {
    await page.goto(pagina('pages/vehiculos/buscar.html'));
    const fichas = page.locator('#resultados a.ficha-vehiculo');
    await expect(page.locator('#resultados-total')).not.toBeEmpty();
    test.skip((await fichas.count()) === 0, 'La base del entorno no tiene vehículos publicados.');

    const titulo = (await fichas.first().locator('.ficha-vehiculo__titulo').textContent()).trim();
    await fichas.first().click();
    await expect(page).toHaveURL(/vehiculo\.html\?id=\d+/);
    await expect(page.getByText(titulo).first()).toBeVisible();
});
