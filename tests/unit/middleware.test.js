import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import middleware, { destinoApi, config } from '../../middleware.js';

const DEV = 'https://autocar-backend-dev.onrender.com';
const original = process.env.BACKEND_URL;
afterEach(() => {
    if (original === undefined) delete process.env.BACKEND_URL;
    else process.env.BACKEND_URL = original;
});

test('solo intercepta /api', () => {
    assert.equal(config.matcher, '/api/:path*');
});

test('conserva la ruta y la consulta, y cambia solo el dominio', () => {
    const destino = destinoApi('https://autocar-git-dev-x.vercel.app/api/vehiculos?q=ford&page=2', DEV);
    assert.equal(destino.href, `${DEV}/api/vehiculos?q=ford&page=2`);
});

test('ignora una barra final o una ruta en BACKEND_URL', () => {
    assert.equal(destinoApi('https://a.vercel.app/api/me', `${DEV}/`).href, `${DEV}/api/me`);
    assert.equal(destinoApi('https://a.vercel.app/api/me', `${DEV}/algo`).href, `${DEV}/api/me`);
});

test('sin BACKEND_URL válida no hay destino (nunca cae a producción)', () => {
    assert.equal(destinoApi('https://a.vercel.app/api/me', undefined), null);
    assert.equal(destinoApi('https://a.vercel.app/api/me', ''), null);
    assert.equal(destinoApi('https://a.vercel.app/api/me', 'no es una url'), null);
    assert.equal(destinoApi('https://a.vercel.app/api/me', 'ftp://x.com'), null);
});

test('sin BACKEND_URL responde 503 en JSON', async () => {
    delete process.env.BACKEND_URL;
    const respuesta = middleware(new Request('https://a.vercel.app/api/me'));
    assert.equal(respuesta.status, 503);
    assert.equal((await respuesta.json()).error, 'sin_backend');
});

test('con BACKEND_URL reescribe hacia el back del entorno', () => {
    process.env.BACKEND_URL = DEV;
    const respuesta = middleware(new Request('https://a.vercel.app/api/vehiculos?q=ford'));
    assert.equal(respuesta.headers.get('x-middleware-rewrite'), `${DEV}/api/vehiculos?q=ford`);
});
