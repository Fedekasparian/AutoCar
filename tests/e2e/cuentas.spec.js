// Registro, ingreso y salida desde el navegador. Crea una cuenta nueva en cada corrida: solo dev o local.
import { test, expect } from '@playwright/test';
import { pagina, soloFueraDeProduccion, emailNuevo, PASSWORD } from './entorno.js';

soloFueraDeProduccion();

const sesionGuardada = (page) => page.evaluate(() => JSON.parse(sessionStorage.getItem('autocar.sesion')));

test('registrarse inicia sesión y deja la cookie del propio sitio', async ({ page, context, baseURL }) => {
    const email = emailNuevo();
    await page.goto(pagina('pages/auth/registro.html'));
    await page.fill('#nombre', 'Prueba E2E');
    await page.fill('#email', email);
    await page.fill('#password', PASSWORD);
    await page.fill('#password_confirm', PASSWORD);
    await page.click('#form-registro button[type="submit"]');

    await expect(page).toHaveURL(/home\.html/);
    expect((await sesionGuardada(page)).usuario.email).toBe(email);

    // La cookie de sesión tiene que ser del dominio del front (por el proxy), no de onrender.com.
    const dominio = new URL(baseURL).hostname;
    const cookies = await context.cookies();
    expect(cookies.some((c) => c.httpOnly && dominio.endsWith(c.domain.replace(/^\./, '')))).toBe(true);
});

test('ingresar con una cuenta existente y salir', async ({ page }) => {
    const email = emailNuevo();
    const alta = await page.request.post('/api/registro', {
        data: { nombre: 'Prueba E2E', email, password: PASSWORD, password_confirm: PASSWORD },
    });
    expect(alta.status()).toBe(201);

    await page.goto(pagina('pages/auth/login.html'));
    await page.fill('#email', email);
    await page.fill('#password', PASSWORD);
    await page.click('#form-login button[type="submit"]');
    await expect(page).toHaveURL(/home\.html/);

    await page.goto(pagina('pages/auth/cuenta.html'));
    await expect(page.locator('#usuario-email')).toHaveText(email);
    await page.click('#salir');
    await expect.poll(() => sesionGuardada(page)).toBeNull();
    expect((await page.request.get('/api/me')).status()).toBe(401);
});

test('una contraseña incorrecta muestra el error y no inicia sesión', async ({ page }) => {
    await page.goto(pagina('pages/auth/login.html'));
    await page.fill('#email', emailNuevo());
    await page.fill('#password', 'NoEsLaClave1');
    await page.click('#form-login button[type="submit"]');
    await expect(page).toHaveURL(/login\.html/);
    expect(await sesionGuardada(page)).toBeNull();
});
