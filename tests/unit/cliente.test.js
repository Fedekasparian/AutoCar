import { reiniciar, pedidos, respuestas, json } from './entorno.js';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { get, post, del, ErrorApi } from '../../front/js/api/cliente.js';
import * as sesion from '../../front/js/servicios/sesion.js';

beforeEach(reiniciar);

test('en local pide al back de localhost:8000 y manda la cookie', async () => {
    respuestas.push(json({ datos: [] }));
    await get('/api/vehiculos');
    assert.equal(pedidos[0].url, 'http://localhost:8000/api/vehiculos');
    assert.equal(pedidos[0].credentials, 'include');
    assert.equal(pedidos[0].method, 'GET');
});

test('la consulta omite los filtros vacíos', async () => {
    respuestas.push(json({}));
    await get('/api/vehiculos', { q: 'ford', marca: '', combustible: null, page: 2 });
    const url = new URL(pedidos[0].url);
    assert.equal(url.searchParams.get('q'), 'ford');
    assert.equal(url.searchParams.get('page'), '2');
    assert.equal(url.searchParams.has('marca'), false);
    assert.equal(url.searchParams.has('combustible'), false);
});

test('POST manda JSON y el token CSRF; GET no manda el token', async () => {
    sesion.guardar({ csrf: 'tok', expira_en: 60, usuario: { rol: 'usuario' } });
    respuestas.push(json({}), json({ id: 1 }, 201));
    await get('/api/me');
    await post('/api/admin/vehiculos', { marca: 'Ford' });
    assert.equal(pedidos[0].headers['X-CSRF-Token'], undefined);
    assert.equal(pedidos[1].headers['X-CSRF-Token'], 'tok');
    assert.equal(pedidos[1].headers['Content-Type'], 'application/json');
    assert.equal(pedidos[1].body, '{"marca":"Ford"}');
});

test('204 devuelve null', async () => {
    respuestas.push(new Response(null, { status: 204 }));
    assert.equal(await del('/api/admin/vehiculos/3'), null);
});

test('un error de la API se convierte en ErrorApi con sus campos', async () => {
    respuestas.push(json({ error: 'validacion', mensaje: 'Revisá los datos', errores: { anio: 'Inválido' } }, 422));
    await assert.rejects(post('/api/admin/vehiculos', {}), (error) => {
        assert.ok(error instanceof ErrorApi);
        assert.equal(error.status, 422);
        assert.equal(error.codigo, 'validacion');
        assert.equal(error.message, 'Revisá los datos');
        assert.deepEqual(error.errores, { anio: 'Inválido' });
        return true;
    });
});

test('una respuesta sin JSON da el mensaje genérico', async () => {
    respuestas.push(new Response('Bad Gateway', { status: 502 }));
    await assert.rejects(get('/api/vehiculos'), { status: 502, codigo: 'error' });
});

test('401 con sesión guardada la cierra', async () => {
    sesion.guardar({ csrf: 'x', expira_en: 60, usuario: { rol: 'usuario' } });
    respuestas.push(json({ error: 'no_autenticado', mensaje: 'Iniciá sesión' }, 401));
    await assert.rejects(get('/api/me'), { status: 401 });
    assert.equal(sesion.iniciada(), false);
});

test('sin conexión da status 0', async () => {
    respuestas.push(new TypeError('fetch failed'));
    await assert.rejects(get('/api/vehiculos'), { status: 0, codigo: 'sin_conexion' });
});
