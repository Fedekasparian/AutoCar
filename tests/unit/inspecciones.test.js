import { reiniciar, pedidos, respuestas, json } from './entorno.js';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../../front/js/api/inspecciones.js';
import * as insp from '../../front/js/servicios/inspecciones.js';
import * as sesion from '../../front/js/servicios/sesion.js';
import * as admin from '../../front/js/api/admin.js';
import { ruta } from '../../front/js/servicios/rutas.js';

beforeEach(() => {
    reiniciar();
    sesion.guardar({ csrf: 'tok', expira_en: 60, usuario: { rol: 'mecanico', permisos: ['verificaciones.realizar'] } });
});

const todoOk = () => insp.CHECKLIST.map(({ codigo }) => ({ codigo, resultado: 'ok', nota: '' }));

// ---------- Reglas (copia de las del back) ----------

test('el checklist tiene los 10 códigos del back, en el mismo orden', () => {
    assert.deepEqual(insp.CHECKLIST.map((i) => i.codigo), [
        'carroceria', 'estructura', 'motor', 'transmision', 'frenos',
        'suspension', 'neumaticos', 'electricidad', 'kilometraje', 'identificacion',
    ]);
});

test('desglose: con $ 130.000 son 100.000 para el mecánico y 30.000 para AutoCar (10.000 al fondo)', () => {
    assert.deepEqual(insp.desglose(130000),
        { precio: 130000, monto_mecanico: 100000, monto_autocar: 30000, monto_fondo: 10000 });
});

test('desglose: la parte de AutoCar se redondea a miles y los montos suman el precio', () => {
    const d = insp.desglose(95000); // 23 % = 21.850 → 22.000
    assert.equal(d.monto_autocar, 22000);
    assert.equal(d.monto_fondo, 7000);
    assert.equal(d.monto_mecanico + d.monto_autocar, 95000);
});

test('un borrador a medias es válido', () => {
    const items = todoOk().map((i, n) => (n < 3 ? i : { ...i, resultado: '' }));
    assert.equal(insp.validarInforme({ items, conclusion: '' }, false).mensaje, '');
});

test('para firmar hacen falta los 10 resultados y la conclusión', () => {
    const items = todoOk();
    items[4].resultado = '';
    const { errores, mensaje } = insp.validarInforme({ items, conclusion: '' }, true);
    assert.ok(mensaje);
    assert.deepEqual(Object.keys(errores).sort(), ['conclusion', 'resultado-frenos']);
});

test('un ítem que no está OK necesita la nota, también en el borrador', () => {
    const items = todoOk();
    items[0] = { codigo: 'carroceria', resultado: 'observado', nota: '   ' };
    assert.equal(insp.validarInforme({ items }, false).errores['nota-carroceria'], 'Explicá qué encontraste.');
    items[0].nota = 'Golpe en el zócalo derecho';
    assert.equal(insp.validarInforme({ items, conclusion: 'con_reparos' }, true).mensaje, '');
});

test('la nota y el resumen tienen tope de largo', () => {
    const items = todoOk();
    items[2].nota = 'x'.repeat(insp.MAX_NOTA + 1);
    const { errores } = insp.validarInforme({ items, resumen: 'y'.repeat(insp.MAX_RESUMEN + 1) }, false);
    assert.ok(errores['nota-motor']);
    assert.ok(errores.resumen);
});

test('cuerpoInforme manda sólo los ítems con resultado y recorta los textos', () => {
    const items = [
        { codigo: 'motor', resultado: 'falla', nota: '  pierde aceite ' },
        { codigo: 'frenos', resultado: '', nota: '' },
    ];
    assert.deepEqual(insp.cuerpoInforme({ items, conclusion: '', resumen: ' ok ' }), {
        items: [{ codigo: 'motor', resultado: 'falla', nota: 'pierde aceite' }],
        conclusion: null,
        resumen: 'ok',
    });
});

// ---------- Rutas de la API ----------

test('bandeja pide GET /api/mecanico/inspecciones con el estado', async () => {
    respuestas.push(json({ items: [], conteos: {} }));
    await api.bandeja('aceptada');
    assert.equal(pedidos[0].method, 'GET');
    assert.equal(pedidos[0].url, 'http://localhost:8000/api/mecanico/inspecciones?estado=aceptada');
});

test('guardarPerfil hace PUT con el token CSRF', async () => {
    respuestas.push(json({ taller: { nombre: 'Taller' } }));
    await api.guardarPerfil({ nombre: 'Taller', precio_inspeccion: 130000 });
    assert.equal(pedidos[0].method, 'PUT');
    assert.equal(pedidos[0].url, 'http://localhost:8000/api/mecanico/perfil');
    assert.equal(pedidos[0].headers['X-CSRF-Token'], 'tok');
});

test('aceptar y rechazar hacen PATCH con la acción', async () => {
    respuestas.push(json({ inspeccion: {} }), json({ inspeccion: {} }));
    await api.aceptar(5, '2026-11-12T13:00:00.000Z');
    await api.rechazar(6, 'No tengo turno esta semana');
    assert.equal(pedidos[0].method, 'PATCH');
    assert.equal(pedidos[0].url, 'http://localhost:8000/api/mecanico/inspecciones/5');
    assert.deepEqual(JSON.parse(pedidos[0].body), { accion: 'aceptar', fecha_turno: '2026-11-12T13:00:00.000Z' });
    assert.deepEqual(JSON.parse(pedidos[1].body), { accion: 'rechazar', motivo: 'No tengo turno esta semana' });
});

test('guardarInforme hace PUT y firmar hace POST a .../firma', async () => {
    respuestas.push(json({ inspeccion: {} }), json({ inspeccion: { estado: 'firmada' } }));
    await api.guardarInforme(7, { items: [], conclusion: null, resumen: '' });
    const r = await api.firmar(7);
    assert.equal(pedidos[0].method, 'PUT');
    assert.equal(pedidos[0].url, 'http://localhost:8000/api/mecanico/inspecciones/7/informe');
    assert.equal(pedidos[1].method, 'POST');
    assert.equal(pedidos[1].url, 'http://localhost:8000/api/mecanico/inspecciones/7/firma');
    assert.equal(r.inspeccion.estado, 'firmada');
});

test('un informe ya firmado devuelve el 409 del back como ErrorApi', async () => {
    respuestas.push(json({ error: 'firmada', mensaje: 'El informe ya está firmado y no se puede cambiar.' }, 409));
    await assert.rejects(api.guardarInforme(7, { items: [] }), { status: 409, codigo: 'firmada' });
});

// ---------- Lado del comprador y del admin ----------

test('fuenteDeUrl reconoce los sitios igual que el back', () => {
    assert.equal(insp.fuenteDeUrl('https://auto.mercadolibre.com.ar/MLA-1-_JM'), 'mercadolibre');
    assert.equal(insp.fuenteDeUrl('https://www.kavak.com/ar/usado/x'), 'kavak');
    assert.equal(insp.fuenteDeUrl('https://www.autocosmos.com.ar/auto/usado/x'), 'autocosmos');
    assert.equal(insp.fuenteDeUrl('http://localhost:5500/pages/vehiculos/vehiculo.html?id=3', 'localhost'), 'autocar');
    assert.equal(insp.fuenteDeUrl('https://otrositio.com/auto'), 'otro');
    assert.equal(insp.fuenteDeUrl('mercadolibre.com.ar/gol'), null); // sin https://
    assert.equal(insp.fuenteDeUrl('javascript:alert(1)'), null);
});

test('puntaje muestra "Nuevo en la red" con menos de 3 firmadas', () => {
    assert.equal(insp.puntaje({ nuevo: true, puntaje: null, firmadas: 1 }), 'Nuevo en la red · 1 inspección firmada');
    assert.equal(insp.puntaje({ nuevo: false, puntaje: 4.5, firmadas: 12 }), '4,5 de 5 · 12 inspecciones firmadas');
});

test('pedir hace POST /api/inspecciones y mias GET /api/mis-inspecciones', async () => {
    respuestas.push(json({ inspeccion: { id: 3 } }, 201), json({ items: [] }));
    await api.pedir({ url: 'https://www.kavak.com/ar/x', mecanico_id: 2 });
    await api.mias();
    assert.equal(pedidos[0].method, 'POST');
    assert.equal(pedidos[0].url, 'http://localhost:8000/api/inspecciones');
    assert.equal(pedidos[0].headers['X-CSRF-Token'], 'tok');
    assert.equal(pedidos[1].url, 'http://localhost:8000/api/mis-inspecciones');
});

test('mecanicos manda la localidad sólo si hay una', async () => {
    respuestas.push(json({ items: [], localidades: [] }), json({ items: [], localidades: [] }));
    await api.mecanicos('');
    await api.mecanicos('Luján');
    assert.equal(pedidos[0].url, 'http://localhost:8000/api/mecanicos');
    assert.equal(pedidos[1].url, 'http://localhost:8000/api/mecanicos?localidad=Luj%C3%A1n');
});

test('cancelar y reclamar hacen POST a su ruta', async () => {
    respuestas.push(json({ inspeccion: {} }), json({ inspeccion: {} }, 201));
    await api.cancelar(4);
    await api.reclamar(4, { descripcion: 'Golpe en el zócalo', item_codigo: 'carroceria' });
    assert.equal(pedidos[0].url, 'http://localhost:8000/api/inspecciones/4/cancelar');
    assert.equal(pedidos[1].url, 'http://localhost:8000/api/inspecciones/4/reclamo');
    assert.deepEqual(JSON.parse(pedidos[1].body), { descripcion: 'Golpe en el zócalo', item_codigo: 'carroceria' });
});

test('el admin lista y resuelve reclamos', async () => {
    respuestas.push(json({ items: [] }), json({ reclamo: {} }));
    await admin.reclamos('abierto');
    await admin.resolverReclamo(9, { procede: true, compensacion: 390000, respuesta: 'Se veía' });
    assert.equal(pedidos[0].url, 'http://localhost:8000/api/admin/reclamos?estado=abierto');
    assert.equal(pedidos[1].method, 'PATCH');
    assert.equal(pedidos[1].url, 'http://localhost:8000/api/admin/reclamos/9');
});

test('las páginas nuevas están en rutas.js', () => {
    assert.match(ruta('pedir-inspeccion.html?url=x'), /\/front\/pages\/talleres\/pedir-inspeccion\.html\?url=x$/);
    assert.match(ruta('mis-inspecciones.html'), /\/front\/pages\/talleres\/mis-inspecciones\.html$/);
    assert.match(ruta('admin-reclamos.html'), /\/front\/pages\/admin\/admin-reclamos\.html$/);
});
