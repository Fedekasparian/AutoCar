import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ruta } from '../../front/js/servicios/rutas.js';

test('resuelve una página a su carpeta dentro de front/', () => {
    assert.match(ruta('login.html'), /\/front\/pages\/auth\/login\.html$/);
    assert.match(ruta('index.html'), /\/front\/index\.html$/);
});

test('conserva la consulta y el ancla', () => {
    assert.match(ruta('vehiculo.html?id=3'), /\/front\/pages\/vehiculos\/vehiculo\.html\?id=3$/);
    assert.match(ruta('buscar.html?q=ford#resultados'), /\/buscar\.html\?q=ford#resultados$/);
});

test('ignora la carpeta que venga en el destino', () => {
    assert.equal(ruta('../otra/carpeta/home.html'), ruta('home.html'));
});

test('una página que no existe devuelve null', () => {
    assert.equal(ruta('no-existe.html'), null);
    assert.equal(ruta(''), null);
});
