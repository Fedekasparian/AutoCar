import { reiniciar, pedidos, respuestas, json } from './entorno.js';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as publicaciones from '../../front/js/api/publicaciones.js';
import * as sesion from '../../front/js/servicios/sesion.js';

beforeEach(() => {
    reiniciar();
    sesion.guardar({ csrf: 'tok', expira_en: 60, usuario: { rol: 'usuario' } });
});

test('listar pide las propias con GET y sin token CSRF', async () => {
    respuestas.push(json({ items: [] }));
    assert.deepEqual(await publicaciones.listar(), { items: [] });
    assert.equal(pedidos[0].method, 'GET');
    assert.equal(pedidos[0].url, 'http://localhost:8000/api/mis-vehiculos');
    assert.equal(pedidos[0].headers['X-CSRF-Token'], undefined);
});

test('crear manda el FormData tal cual, sin Content-Type y con el token CSRF', async () => {
    const formulario = new FormData();
    formulario.append('marca', 'Ford');
    formulario.append('fotos[]', new Blob(['jpg'], { type: 'image/jpeg' }), 'frente.jpg');
    respuestas.push(json({ vehiculo: { id: 7, estado: 'pendiente' } }, 201));

    const respuesta = await publicaciones.crear(formulario);

    assert.equal(respuesta.vehiculo.estado, 'pendiente');
    assert.equal(pedidos[0].method, 'POST');
    assert.equal(pedidos[0].body, formulario); // el mismo objeto: no se pasó por JSON.stringify
    assert.equal(pedidos[0].headers['Content-Type'], undefined); // lo pone el navegador con el boundary
    assert.equal(pedidos[0].headers['X-CSRF-Token'], 'tok');
});

test('actualizar manda sólo los cambios en JSON con PUT', async () => {
    respuestas.push(json({ vehiculo: { id: 7 } }));
    await publicaciones.actualizar(7, { precio: 9500000 });
    assert.equal(pedidos[0].method, 'PUT');
    assert.equal(pedidos[0].url, 'http://localhost:8000/api/mis-vehiculos/7');
    assert.equal(pedidos[0].headers['Content-Type'], 'application/json');
    assert.equal(pedidos[0].body, '{"precio":9500000}');
});

test('marcarVendida hace PATCH al estado con {estado: vendido}', async () => {
    respuestas.push(json({ vehiculo: { id: 7, estado: 'vendido' } }));
    await publicaciones.marcarVendida(7);
    assert.equal(pedidos[0].method, 'PATCH');
    assert.equal(pedidos[0].url, 'http://localhost:8000/api/mis-vehiculos/7/estado');
    assert.equal(pedidos[0].body, '{"estado":"vendido"}');
    assert.equal(pedidos[0].headers['X-CSRF-Token'], 'tok');
});

test('eliminar hace DELETE y devuelve null (204)', async () => {
    respuestas.push(new Response(null, { status: 204 }));
    assert.equal(await publicaciones.eliminar(7), null);
    assert.equal(pedidos[0].method, 'DELETE');
    assert.equal(pedidos[0].url, 'http://localhost:8000/api/mis-vehiculos/7');
});

test('el id se codifica en la URL', async () => {
    respuestas.push(json({ vehiculo: {} }));
    await publicaciones.actualizar('7/../admin', {});
    assert.equal(pedidos[0].url, 'http://localhost:8000/api/mis-vehiculos/7%2F..%2Fadmin');
});
