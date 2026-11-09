import { reiniciar } from './entorno.js';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as sesion from '../../front/js/servicios/sesion.js';

const admin = { id: 1, nombre: 'Ana', rol: 'admin', permisos: ['vehiculos.moderar', 'usuarios.ver'] };
const comun = { id: 2, nombre: 'Beto', rol: 'usuario', permisos: [] };

beforeEach(reiniciar);

test('sin login no hay sesión ni csrf', () => {
    assert.equal(sesion.iniciada(), false);
    assert.equal(sesion.usuario(), null);
    assert.equal(sesion.csrf(), null);
});

test('guardar deja disponibles usuario y csrf', () => {
    sesion.guardar({ csrf: 'abc', expira_en: 7200, usuario: admin });
    assert.equal(sesion.iniciada(), true);
    assert.equal(sesion.csrf(), 'abc');
    assert.equal(sesion.usuario().nombre, 'Ana');
    assert.equal(sesion.esAdmin(), true);
});

test('una sesión vencida se descarta', () => {
    sesion.guardar({ csrf: 'abc', expira_en: -1, usuario: admin });
    assert.equal(sesion.iniciada(), false);
    assert.equal(sessionStorage.getItem('autocar.sesion'), null);
});

test('permisos: puede y vePanel según lo que manda el back', () => {
    sesion.guardar({ csrf: 'x', expira_en: 60, usuario: admin });
    assert.equal(sesion.puede('vehiculos.moderar'), true);
    assert.equal(sesion.puede('metricas.ver'), false);
    assert.equal(sesion.vePanel(), true);

    sesion.guardar({ csrf: 'y', expira_en: 60, usuario: comun });
    assert.equal(sesion.esAdmin(), false);
    assert.equal(sesion.vePanel(), false);
    assert.equal(sesion.planIncluido(), null);
});

test('actualizar renueva usuario y csrf, y mantiene el csrf si no viene', () => {
    sesion.guardar({ csrf: 'viejo', expira_en: 60, usuario: comun });
    sesion.actualizar({ usuario: { ...comun, rol: 'moderador' }, csrf: 'nuevo' });
    assert.equal(sesion.usuario().rol, 'moderador');
    assert.equal(sesion.csrf(), 'nuevo');
    sesion.actualizar({ usuario: comun });
    assert.equal(sesion.csrf(), 'nuevo');
});

test('cerrar borra lo guardado', () => {
    sesion.guardar({ csrf: 'x', expira_en: 60, usuario: comun });
    sesion.cerrar();
    assert.equal(sesion.iniciada(), false);
});
