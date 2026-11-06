import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as formato from '../../front/js/servicios/formato.js';

test('precio usa separador de miles de Argentina y sin decimales', () => {
    assert.equal(formato.precio(15000000), '$15.000.000');
    assert.equal(formato.precio(1234.6), '$1.235');
});

test('km agrega la unidad', () => {
    assert.equal(formato.km(60000), '60.000 km');
    assert.equal(formato.km(0), '0 km');
});

test('los códigos de la API se muestran con su nombre', () => {
    assert.equal(formato.combustible('diesel'), 'Diésel');
    assert.equal(formato.transmision('automatica'), 'Automática');
    assert.equal(formato.estado('vendido'), 'Vendido');
    assert.equal(formato.rol('admin'), 'Administrador');
});

test('un código desconocido se muestra tal cual', () => {
    assert.equal(formato.combustible('hidrogeno'), 'hidrogeno');
    assert.equal(formato.rol('soporte'), 'soporte');
});

test('titulo junta marca, modelo y año', () => {
    assert.equal(formato.titulo({ marca: 'Ford', modelo: 'Focus', anio: 2019 }), 'Ford Focus 2019');
});
