// Pruebas de punta a punta (desde el lado del usuario). Ver infraestructura.md § 5.2.
// BASE_URL = dominio del front a probar, sin barra final:
//   dev:        https://autocar-git-dev-<equipo>.vercel.app   (todas las pruebas)
//   producción: https://autocar-zeta.vercel.app               (solo `npm run test:humo`)
//   local:      http://localhost:5500                          (Live Server en la raíz del repo + back en :8000)
// VERCEL_AUTOMATION_BYPASS_SECRET: si los Preview de Vercel tienen Deployment Protection, deja pasar a Playwright.
import { defineConfig, devices } from '@playwright/test';

const BASE_URL = (process.env.BASE_URL || 'http://localhost:5500').replace(/\/$/, '');
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
    testDir: 'tests/e2e',
    timeout: 60_000, // el servicio gratuito de Render tarda en despertar
    expect: { timeout: 15_000 },
    retries: process.env.CI ? 1 : 0,
    workers: 1, // las pruebas comparten la base de dev: en serie
    reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
    use: {
        baseURL: BASE_URL,
        locale: 'es-AR',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        extraHTTPHeaders: bypass
            ? { 'x-vercel-protection-bypass': bypass, 'x-vercel-set-bypass-cookie': 'samesitenone' }
            : {},
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        // WebKit es el motor de Safari: el que bloquea cookies de terceros (por eso existe el proxy /api).
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    ],
});
