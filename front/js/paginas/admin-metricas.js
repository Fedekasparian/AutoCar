// Métricas de la app (permiso metricas.ver): GET /api/admin/metricas, todo sacado de la base.
import * as admin from '../api/admin.js';
import * as formato from '../servicios/formato.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';

const { el } = vistas;
const numero = new Intl.NumberFormat('es-AR');
const n = (valor) => numero.format(valor);

// Tarjeta de un indicador. Con un número (no un texto ya armado) cuenta hasta el valor al aparecer.
function tarjeta(valor, texto, formatear = n) {
    const numeroNodo = el('strong', {}, typeof valor === 'number' ? formatear(0) : (valor ?? '—'));
    if (typeof valor === 'number') vistas.contarHasta(numeroNodo, valor, formatear);
    // Los montos en pesos son más largos: van un poco más chicos para que entren en la tarjeta
    return el('li', { class: formatear === n ? 'recuadro' : 'recuadro resumen-admin__dinero' }, numeroNodo, el('span', {}, texto));
}

// Barras horizontales de una sola serie: el largo es la cantidad y el número va escrito al lado
// (cada barra es un <li> con su texto, así se lee igual sin ver el gráfico)
function barras(pares, vacio = 'Todavía no hay datos') {
    if (!pares.length) return [el('li', { class: 'barras__vacio' }, vacio)];
    const maximo = Math.max(...pares.map(([, v]) => v), 1);
    return pares.map(([nombre, valor], i) => {
        const barra = el('span', { class: 'barras__barra', 'aria-hidden': 'true' });
        barra.style.setProperty('--largo', `${(valor / maximo) * 100}%`);
        barra.style.setProperty('--n', String(i));
        return el('li', { class: 'barras__fila', title: `${nombre}: ${n(valor)}` },
            el('span', { class: 'barras__nombre' }, nombre), barra, el('span', { class: 'barras__valor' }, n(valor)));
    });
}

// Lo facturado en una barra apilada de tres partes (mecánicos, AutoCar y fondo), con leyenda y montos
function reparto(g) {
    const partes = [
        ['mecanicos', 'Mecánicos', g.mecanicos],
        ['autocar', 'AutoCar', g.autocar],
        ['fondo', 'Fondo de garantía', g.fondo.acumulado],
    ];
    const total = partes.reduce((s, [, , v]) => s + v, 0);
    if (!total) return null;
    const porcentaje = (v) => `${Math.round((v / total) * 100)} %`;
    const barra = el('div', { class: 'reparto__barra', 'aria-hidden': 'true' }, ...partes.filter(([, , v]) => v > 0).map(([clave, nombre, v]) => {
        const tramo = el('span', { class: `reparto__tramo reparto--${clave}`, title: `${nombre}: ${formato.precio(v)} (${porcentaje(v)})` });
        tramo.style.flexGrow = String(v);
        return tramo;
    }));
    return [barra, el('ul', { class: 'reparto__leyenda', role: 'list' }, ...partes.map(([clave, nombre, v]) =>
        el('li', {}, el('span', { class: `reparto__muestra reparto--${clave}`, 'aria-hidden': 'true' }),
            el('span', {}, nombre), el('strong', {}, formato.precio(v)), el('span', { class: 'reparto__porcentaje' }, porcentaje(v)))))];
}

function llenar(id, ...hijos) {
    document.getElementById(id).replaceChildren(...hijos);
}

function horas(h) {
    if (h === null) return '—';
    if (h < 24) return `${h} h`;
    const dias = Math.floor(h / 24);
    return dias === 1 ? '1 día' : `${dias} días`;
}

function mostrar(m) {
    const u = m.usuarios;
    llenar('tarjetas-usuarios',
        tarjeta(u.total, 'Usuarios registrados'),
        tarjeta(u.activos, 'Cuentas activas'),
        tarjeta(u.con_actividad_30d, 'Con actividad (30 días)'),
        tarjeta(u.nuevos_30d, 'Nuevos (30 días)'),
        tarjeta(u.bajas, 'Dados de baja'));
    llenar('barras-roles', ...barras(Object.entries(u.por_rol).map(([rol, cantidad]) => [formato.rol(rol), cantidad])));

    const p = m.publicaciones;
    const pesos = (v) => formato.precio(v);
    llenar('tarjetas-publicaciones',
        tarjeta(p.total, 'Publicaciones'),
        tarjeta(p.nuevas_30d, 'Nuevas (30 días)'),
        tarjeta(p.de_usuarios, 'Publicadas por usuarios'),
        tarjeta(p.precio_promedio, 'Precio promedio (en venta)', pesos),
        tarjeta(p.valor_en_venta, 'Valor en venta', pesos),
        tarjeta(p.valor_vendido, 'Valor vendido', pesos));
    llenar('barras-estados', ...barras(Object.entries(p.por_estado).map(([estado, cantidad]) => [formato.estado(estado), cantidad])));
    llenar('barras-marcas', ...barras(p.top_marcas.map((x) => [x.marca, x.cantidad]), 'Todavía no hay publicaciones'));

    const mod = m.moderacion;
    llenar('tarjetas-moderacion',
        tarjeta(mod.pendientes, 'Esperando revisión'),
        tarjeta(horas(mod.espera_maxima_h), 'Espera de la más antigua'),
        tarjeta(mod.rechazadas, 'Rechazadas'));

    const c = m.chat;
    llenar('tarjetas-chat',
        tarjeta(c.conversaciones, 'Conversaciones'),
        tarjeta(c.conversaciones_30d, 'Nuevas (30 días)'),
        tarjeta(c.mensajes_30d, 'Mensajes (30 días)'));

    // Lo que dejan las inspecciones (23 % para AutoCar, un tercio de eso al fondo de garantía). Pago simulado.
    const g = m.ganancias;
    const firmadas = g.inspecciones?.firmada || 0;
    llenar('tarjetas-ganancias',
        tarjeta(g.autocar, 'Ganancia de AutoCar', pesos),
        tarjeta(g.autocar_30d, 'Ganancia (30 días)', pesos),
        tarjeta(g.facturado, `Facturado (${n(firmadas)} firmadas)`, pesos),
        tarjeta(g.mecanicos, 'Pagado a mecánicos', pesos),
        tarjeta(g.fondo.disponible, `Fondo de garantía (usado ${formato.precio(g.fondo.usado)})`, pesos),
        tarjeta(g.retenido, 'Retenido (en curso)', pesos));
    const grafico = reparto(g);
    document.getElementById('reparto-figura').hidden = !grafico;
    if (grafico) llenar('reparto', ...grafico);
    document.getElementById('ganancias').textContent = g.aclaracion;
    document.getElementById('generado').textContent =
        `Datos al ${new Date(m.generado).toLocaleString('es-AR')}.`;
}

async function cargar() {
    const estado = document.getElementById('estado');
    estado.replaceChildren(vistas.cargando());
    try {
        mostrar(await admin.metricas());
        estado.replaceChildren();
        document.getElementById('metricas').hidden = false;
    } catch (error) {
        if (error.status === 401) {
            sesion.requerirLogin();
            return;
        }
        estado.replaceChildren(error.status === 403
            ? vistas.aviso('No tenés permiso para ver las métricas.')
            : vistas.avisoDeError(error));
    }
}

if (sesion.requerirPermiso('metricas.ver')) cargar();
