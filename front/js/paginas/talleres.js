// Mecánicos de la red: el ranking público (GET /api/mecanicos), sin login. El back ya lo devuelve ordenado
// por puntaje; acá se puede reordenar por precio o por experiencia sin volver a pedir.
// "Pedir inspección" lleva a pedir-inspeccion.html con ese mecánico marcado; ahí sí se pide la sesión.
import * as api from '../api/inspecciones.js';
import * as formato from '../servicios/formato.js';
import * as insp from '../servicios/inspecciones.js';
import * as vistas from '../servicios/vistas.js';
import { ruta } from '../servicios/rutas.js';

const { el } = vistas;
const lista = document.getElementById('ranking');
const estado = document.getElementById('estado-mecanicos');
const filtro = document.getElementById('filtro-localidad');
const orden = document.getElementById('orden-mecanicos');
let mecanicos = [];

// Cinco estrellas con el puntaje pintado (4,5 → cuatro y media). Decorativas: el texto dice el puntaje.
function estrellas(puntaje) {
    const caja = el('span', { class: 'estrellas', 'aria-hidden': 'true' });
    caja.style.setProperty('--puntaje', String(puntaje ?? 0));
    return caja;
}

const iniciales = (texto) => texto.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

function tarjeta(m, i) {
    const nuevo = m.nuevo || m.puntaje === null || m.puntaje === undefined;
    const li = el('li', { class: `taller-tarjeta${i === 0 && !nuevo && orden.value === 'puntaje' ? ' taller-tarjeta--primero' : ''}` },
        el('div', { class: 'taller-tarjeta__arriba' },
            el('span', { class: 'taller-tarjeta__avatar', 'aria-hidden': 'true' }, iniciales(m.taller)),
            el('div', {},
                el('h2', { class: 'taller-tarjeta__nombre' }, m.taller),
                el('p', { class: 'taller-tarjeta__mecanico' }, m.mecanico))),
        el('div', { class: 'taller-tarjeta__puntaje' },
            ...(nuevo
                ? [el('span', { class: 'etiqueta taller-tarjeta__nuevo' }, 'Nuevo en la red')]
                : [estrellas(m.puntaje), el('strong', {}, String(m.puntaje).replace('.', ','))]),
            el('span', { class: 'solo-lector' }, insp.puntaje(m))),
        el('ul', { class: 'taller-tarjeta__datos', role: 'list' },
            el('li', {}, el('strong', {}, String(m.firmadas)), m.firmadas === 1 ? ' firmada' : ' firmadas'),
            el('li', { class: m.reclamos_procedentes ? 'taller-tarjeta__reclamos' : '' }, insp.reclamosProcedentes(m)),
            el('li', {}, `${m.direccion}, ${m.localidad}`)),
        el('div', { class: 'taller-tarjeta__pie' },
            el('span', { class: 'taller-tarjeta__precio' }, el('span', {}, 'Inspección'), el('strong', {}, formato.precio(m.precio_inspeccion))),
            el('a', { class: 'boton boton--chico', href: ruta(`pedir-inspeccion.html?mecanico=${m.id}`) }, 'Pedir inspección')));
    li.style.setProperty('--n', String(i));
    return li;
}

const ORDENES = {
    puntaje: () => 0, // el orden del back
    precio: (a, b) => a.precio_inspeccion - b.precio_inspeccion,
    firmadas: (a, b) => b.firmadas - a.firmadas,
};

function mostrar() {
    const ordenados = [...mecanicos].sort(ORDENES[orden.value] || ORDENES.puntaje);
    lista.replaceChildren(...ordenados.map(tarjeta));
    lista.classList.remove('lista-filas--entra');
    void lista.offsetWidth;
    lista.classList.add('lista-filas--entra');
}

async function cargar() {
    estado.replaceChildren(vistas.cargando());
    lista.replaceChildren();
    try {
        const r = await api.mecanicos(filtro.value);
        if (filtro.options.length === 1) {
            filtro.append(...r.localidades.map((l) => el('option', { value: l }, l)));
        }
        mecanicos = r.items;
        mostrar();
        estado.replaceChildren(r.items.length
            ? ''
            : vistas.aviso(filtro.value ? 'No hay mecánicos en esa localidad.' : 'Todavía no hay mecánicos en la red.',
                filtro.value ? 'Probá con "Todas".' : 'Volvé a mirar en unos días.'));
    } catch (error) {
        estado.replaceChildren(vistas.avisoDeError(error));
    }
}

filtro.addEventListener('change', cargar);
orden.addEventListener('change', mostrar);
cargar();
