// Mis inspecciones (comprador): lo que pidió, en qué estado está y qué sigue. GET /api/mis-inspecciones.
import * as api from '../api/inspecciones.js';
import * as formato from '../servicios/formato.js';
import * as insp from '../servicios/inspecciones.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { etiquetaEstado, proximoPaso } from '../servicios/informe.js';
import { ruta } from '../servicios/rutas.js';

const { el } = vistas;
const lista = document.getElementById('lista');
const estado = document.getElementById('estado');

function fila(i) {
    return el('li', {},
        el('a', { class: 'fila', href: ruta(`verificacion.html?id=${i.id}`) },
            el('span', { class: 'fila__cuerpo' },
                el('span', { class: 'fila__titulo' }, insp.tituloAuto(i)), el('br'),
                el('span', { class: 'fila__meta' }, `${i.mecanico.taller || i.mecanico.nombre} · ${formato.precio(i.precio)}`), el('br'),
                el('span', { class: 'fila__meta' }, proximoPaso(i))),
            etiquetaEstado(i)));
}

async function cargar() {
    estado.replaceChildren(vistas.cargando());
    try {
        const { items } = await api.mias();
        lista.replaceChildren(...items.map(fila));
        const explorar = el('a', { class: 'boton boton--secundario', href: ruta('home.html') }, 'Explorar autos');
        estado.replaceChildren(items.length ? '' : vistas.aviso('Todavía no pediste ninguna inspección.',
            'Abrí la publicación de un auto y tocá "Mandale un mecánico".', explorar));
    } catch (error) {
        if (error.status === 401) {
            sesion.requerirLogin();
            return;
        }
        estado.replaceChildren(vistas.avisoDeError(error));
    }
}

if (sesion.requerirLogin()) {
    if (new URLSearchParams(window.location.search).has('nueva')) {
        const aviso = document.getElementById('aviso');
        aviso.textContent = 'Listo, pediste la inspección. Cuando el mecánico la acepte vas a ver acá el turno.';
        aviso.hidden = false;
    }
    cargar();
}
