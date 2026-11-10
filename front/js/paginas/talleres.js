// Mecánicos de la red: el ranking público (GET /api/mecanicos), sin login. El back ya lo devuelve ordenado.
// "Elegir" lleva a pedir la inspección con ese mecánico marcado; ahí sí se pide la sesión.
import * as api from '../api/inspecciones.js';
import * as formato from '../servicios/formato.js';
import * as insp from '../servicios/inspecciones.js';
import * as vistas from '../servicios/vistas.js';

const { el } = vistas;
const lista = document.getElementById('ranking');
const estado = document.getElementById('estado-mecanicos');
const filtro = document.getElementById('filtro-localidad');

function filaMecanico(m) {
    return el('li', { class: 'fila fila--mecanico' },
        el('span', { class: 'fila__cuerpo' },
            el('span', { class: 'fila__titulo' }, m.taller), el('br'),
            el('span', { class: 'fila__meta' }, `${m.mecanico} · ${m.direccion}, ${m.localidad}`), el('br'),
            el('span', { class: 'fila__meta' }, insp.puntaje(m)), el('br'),
            el('span', { class: 'fila__meta' }, insp.reclamosProcedentes(m))),
        el('span', { class: 'fila__acciones' },
            el('strong', {}, formato.precio(m.precio_inspeccion))));
}

async function cargar() {
    estado.replaceChildren(vistas.cargando());
    lista.replaceChildren();
    try {
        const r = await api.mecanicos(filtro.value);
        if (filtro.options.length === 1) {
            filtro.append(...r.localidades.map((l) => el('option', { value: l }, l)));
        }
        lista.append(...r.items.map(filaMecanico));
        estado.replaceChildren(r.items.length
            ? ''
            : vistas.aviso(filtro.value ? 'No hay mecánicos en esa localidad.' : 'Todavía no hay mecánicos en la red.',
                filtro.value ? 'Probá con "Todas".' : 'Volvé a mirar en unos días.'));
    } catch (error) {
        estado.replaceChildren(vistas.avisoDeError(error));
    }
}

filtro.addEventListener('change', cargar);
cargar();
