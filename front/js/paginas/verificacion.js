// Una inspección del lado del comprador (verificacion.html?id=N): estado y qué sigue, cancelar mientras está
// pedida, informe firmado, trámites para pedir antes de pagar y reclamo dentro de los 15 días.
// También la ven el mecánico asignado y quien resuelve reclamos, pero sólo el comprador cancela y reclama.
import * as api from '../api/inspecciones.js';
import * as formato from '../servicios/formato.js';
import * as formularios from '../servicios/formularios.js';
import * as informe from '../servicios/informe.js';
import * as insp from '../servicios/inspecciones.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { ruta } from '../servicios/rutas.js';

const { proximoPaso } = informe;

const { el } = vistas;
const id = new URLSearchParams(window.location.search).get('id');
const $ = (nombre) => document.getElementById(nombre);
const PAGOS = {
    retenido: 'Retenido hasta que el mecánico firme',
    liberado: 'Pagado al mecánico',
    reembolsado: 'Te lo devolvimos',
};

let inspeccion = null;

function avisar(texto) {
    $('aviso').textContent = texto;
    $('aviso').hidden = !texto;
}

const soyComprador = () => inspeccion.comprador.id === sesion.usuario()?.id;

// ---------- Estado ----------

function mostrarResumen(i) {
    $('titulo').textContent = insp.tituloAuto(i);
    document.title = `${insp.tituloAuto(i)} · Inspección - AutoCar`;
    $('resumen-estado').replaceChildren(informe.etiquetaEstado(i), ' ', proximoPaso(i));
    $('resumen-datos').replaceChildren(...informe.filasDatos([
        ['Aviso', el('a', { href: i.url, target: '_blank', rel: 'noopener noreferrer' }, `Ver en ${insp.fuente(i.fuente)}`)],
        ['Mecánico', `${i.mecanico.nombre} · ${i.mecanico.taller || ''}`],
        i.mecanico.direccion ? ['Taller', `${i.mecanico.direccion}, ${i.mecanico.localidad}`] : null,
        i.fecha_turno ? ['Turno', formato.fechaHora(i.fecha_turno)] : null,
        ['Inspección', formato.precio(i.precio)],
        ['Pago', PAGOS[i.pago] || i.pago],
        ['Pedida el', formato.fecha(i.created_at)],
    ]));
    $('cancelar').hidden = !(i.estado === 'pedida' && soyComprador());
    $('resumen').hidden = false;
}

// ---------- Informe ----------

function mostrarInforme(i) {
    const firmada = i.estado === 'firmada';
    $('informe').hidden = !firmada;
    $('tramites').hidden = !firmada;
    if (!firmada) return;
    $('informe-conclusion').replaceChildren('Conclusión: ', el('strong', {}, insp.conclusion(i.conclusion)));
    $('informe-resumen').textContent = i.resumen || '';
    $('informe-resumen').hidden = !i.resumen;
    $('informe-items').replaceChildren(informe.listaItems(i));
    $('informe-firma').replaceChildren(...informe.datosFirma(i));
    $('tramites-lista').replaceChildren(...insp.TRAMITES.map((t) => el('li', {},
        el('a', { class: 'fila', href: t.url, target: '_blank', rel: 'noopener noreferrer' },
            el('span', { class: 'fila__cuerpo' },
                el('span', { class: 'fila__titulo' }, t.nombre), el('br'),
                el('span', { class: 'fila__meta' }, t.detalle)),
            el('span', { 'aria-hidden': 'true' }, '›')))));
}

// ---------- Reclamo ----------

function mostrarReclamo(i) {
    const r = i.reclamo;
    const puedeReclamar = i.puede_reclamar && soyComprador();
    $('reclamo').hidden = !r && !puedeReclamar;
    $('reclamo-datos').hidden = !r;
    $('form-reclamo').hidden = Boolean(r) || !puedeReclamar;
    if (r) {
        $('reclamo-datos').replaceChildren(...informe.filasDatos([
            ['Estado', el('strong', {}, insp.estadoReclamo(r.estado))],
            r.item_codigo ? ['Ítem', insp.nombreItem(r.item_codigo)] : null,
            ['Qué pasó', r.descripcion],
            ['Enviado el', formato.fecha(r.created_at)],
            r.respuesta ? ['Respuesta', r.respuesta] : null,
            r.estado === 'procede' ? ['Te devolvemos', formato.precio(i.precio)] : null,
            r.estado === 'procede' ? ['Compensación', formato.precio(r.compensacion || 0)] : null,
        ]));
        return;
    }
    if (puedeReclamar) {
        $('reclamo-plazo').textContent = `Si el mecánico pasó por alto algo que se veía, podés reclamar una vez hasta el ${formato.fecha(i.reclamo_hasta)}.`;
    }
}

const select = $('item_codigo');
select.append(...insp.CHECKLIST.map((c) => el('option', { value: c.codigo }, c.nombre)));

formularios.alEnviar($('form-reclamo'), async ({ descripcion, item_codigo: item }) => {
    inspeccion = (await api.reclamar(id, { descripcion, item_codigo: item || null })).inspeccion;
    mostrarTodo(inspeccion);
    avisar('Enviamos tu reclamo. AutoCar lo revisa y te responde acá.');
});

// ---------- Cancelar ----------

$('cancelar').addEventListener('click', () => {
    $('cancelar-error').textContent = '';
    $('dialogo-cancelar').showModal();
});

$('confirmar-cancelar').addEventListener('click', async () => {
    const boton = $('confirmar-cancelar');
    boton.disabled = true;
    try {
        inspeccion = (await api.cancelar(id)).inspeccion;
        $('dialogo-cancelar').close();
        mostrarTodo(inspeccion);
        avisar('Cancelaste la inspección. Te devolvemos lo que pagaste.');
    } catch (error) {
        $('cancelar-error').textContent = error.message;
        $('cancelar-error').focus();
    } finally {
        boton.disabled = false;
    }
});

// ---------- Inicio ----------

function mostrarTodo(i) {
    // El mecánico vuelve a su panel; el admin, a la cola de reclamos
    if (!soyComprador()) {
        $('volver').href = ruta(i.mecanico.id === sesion.usuario()?.id ? 'taller.html' : 'admin-reclamos.html');
    }
    mostrarResumen(i);
    mostrarInforme(i);
    mostrarReclamo(i);
}

async function iniciar() {
    if (!/^\d+$/.test(id || '')) {
        $('estado').replaceChildren(vistas.aviso('Falta la inspección.', 'Entrá desde Mis inspecciones.'));
        return;
    }
    $('estado').replaceChildren(vistas.cargando());
    try {
        inspeccion = (await api.detalle(id)).inspeccion;
        $('estado').replaceChildren();
        mostrarTodo(inspeccion);
    } catch (error) {
        if (error.status === 401) {
            sesion.requerirLogin();
            return;
        }
        $('estado').replaceChildren(error.status === 404
            ? vistas.aviso('No encontramos esa inspección.')
            : vistas.avisoDeError(error));
    }
}

if (sesion.requerirLogin()) iniciar();
