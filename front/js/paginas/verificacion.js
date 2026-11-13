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
import { boton, confirmacion } from '../servicios/acciones.js';

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
    $('resumen-linea').replaceChildren(informe.lineaDeTiempo(i));
    $('resumen-datos').replaceChildren(...informe.filasDatos([
        ['Aviso', el('a', { href: i.url, target: '_blank', rel: 'noopener noreferrer' }, `Ver en ${insp.fuente(i.fuente)}`)],
        ['Mecánico', `${i.mecanico.nombre} · ${i.mecanico.taller || ''}`],
        i.mecanico.direccion ? ['Taller', `${i.mecanico.direccion}, ${i.mecanico.localidad}`] : null,
        i.fecha_turno ? ['Turno', formato.fechaHora(i.fecha_turno)] : null,
        ['Inspección', formato.precio(i.precio)],
        ['Pago', PAGOS[i.pago] || i.pago],
        ['Pedida el', formato.fecha(i.created_at)],
    ]));
    // Sólo el comprador cancela, y mientras el mecánico no la aceptó
    if (i.estado === 'pedida' && soyComprador()) $('resumen').append(botonCancelar);
    else botonCancelar.remove();
    $('resumen').hidden = false;
}

// ---------- Informe ----------

function mostrarInforme(i) {
    const firmada = i.estado === 'firmada';
    $('informe').hidden = !firmada;
    $('tramites').hidden = !firmada;
    if (!firmada) return;
    $('informe-conclusion').replaceChildren('Conclusión del mecánico ', informe.conclusionDestacada(i));
    $('informe-resumen').textContent = i.resumen || '';
    $('informe-resumen').hidden = !i.resumen;
    $('informe-conteo').replaceChildren(informe.resumenItems(i));
    $('informe-items').replaceChildren(informe.listaItems(i));
    $('informe-sello').replaceChildren(informe.sello(i));
    $('informe').classList.add('informe-documento');
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
        $('reclamo-alcance').replaceChildren(informe.bloqueAlcance());
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

const pedirCancelar = confirmacion({
    titulo: 'Cancelar la inspección',
    confirmar: 'Cancelar inspección',
    volver: 'Volver',
    detalle: () => [el('p', {}, 'El mecánico todavía no la aceptó. Si la cancelás, te devolvemos todo lo que pagaste.')],
    hacer: async () => {
        inspeccion = (await api.cancelar(id)).inspeccion;
        mostrarTodo(inspeccion);
        avisar('Cancelaste la inspección. Te devolvemos lo que pagaste.');
    },
});

// Se agrega al final del recuadro "Estado" en mostrarResumen
const botonCancelar = boton('Cancelar la inspección', () => pedirCancelar(), 'boton boton--secundario');

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
