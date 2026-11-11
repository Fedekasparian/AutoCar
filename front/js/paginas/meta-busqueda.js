// Búsquedas guardadas (meta-busqueda.html) con GET /api/meta-busquedas.
import * as api from '../api/metabusqueda.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { criterios } from '../servicios/metabusqueda.js';
import { ruta } from '../servicios/rutas.js';

const { el } = vistas;
const lista = document.getElementById('lista');
const estado = document.getElementById('estado');
const aviso = document.getElementById('aviso');
const dialogo = document.getElementById('dialogo-borrar');
const botonConfirmar = document.getElementById('confirmar-borrar');
let elegida = null; // la búsqueda que se está por borrar: {b, fila}

const VACIO = ['Todavía no guardaste ninguna búsqueda.',
    'Elegí la marca y el modelo que buscás y te mostramos los autos de todos los sitios.'];

// Tachito armado con el DOM (en el proyecto no se usa innerHTML)
function iconoTachito() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    Object.entries({
        width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
        'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true',
    }).forEach(([k, v]) => svg.setAttribute(k, v));
    ['M4 7h16', 'M10 11v6M14 11v6', 'M6 7l1 13h10l1-13', 'M9 7V4h6v3'].forEach((d) => {
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', d);
        svg.append(path);
    });
    return svg;
}

function abrirBorrar(b, fila) {
    elegida = { b, fila };
    document.getElementById('borrar-criterios').textContent = criterios(b);
    document.getElementById('borrar-error').textContent = '';
    dialogo.showModal();
}

function fila(b) {
    const meta = `${b.autos === 1 ? '1 auto' : `${b.autos} autos`} que coinciden`
        + (b.avisos_sin_ver ? ` · ${b.avisos_sin_ver} ${b.avisos_sin_ver === 1 ? 'novedad' : 'novedades'} sin ver` : '');
    const borrar = el('button', { class: 'busqueda-guardada__borrar', type: 'button', title: 'Borrar',
        'aria-label': `Borrar la búsqueda ${criterios(b)}` }, iconoTachito());
    const fila = el('li', { class: 'busqueda-guardada' },
        el('a', { class: 'recuadro fila', href: ruta(`meta-busqueda-resultados.html?id=${b.id}`) },
            el('span', { class: 'fila__cuerpo' },
                el('span', { class: 'fila__titulo' }, criterios(b)), el('br'),
                el('span', { class: 'fila__meta' }, meta)),
            el('span', { 'aria-hidden': 'true' }, '›')),
        borrar);
    borrar.addEventListener('click', () => abrirBorrar(b, fila));
    return fila;
}

botonConfirmar.addEventListener('click', async () => {
    botonConfirmar.disabled = true;
    botonConfirmar.textContent = 'Borrando…';
    try {
        await api.eliminar(elegida.b.id);
        elegida.fila.remove();
        dialogo.close();
        aviso.textContent = `Borramos la búsqueda ${criterios(elegida.b)}.`;
        aviso.hidden = false;
        if (!lista.children.length) estado.replaceChildren(vistas.aviso(...VACIO));
    } catch (error) {
        if (error.status === 401) sesion.requerirLogin();
        document.getElementById('borrar-error').textContent = error.message;
    } finally {
        botonConfirmar.disabled = false;
        botonConfirmar.textContent = 'Borrar';
    }
});

async function cargar() {
    estado.replaceChildren(vistas.cargando());
    try {
        const { busquedas } = await api.listar();
        estado.replaceChildren(busquedas.length ? '' : vistas.aviso(...VACIO));
        lista.replaceChildren(...busquedas.map(fila));
    } catch (error) {
        if (error.status === 401) {
            sesion.requerirLogin();
            return;
        }
        estado.replaceChildren(vistas.avisoDeError(error));
    }
}

if (new URLSearchParams(window.location.search).has('borrada')) {
    aviso.textContent = 'Borramos la búsqueda.';
    aviso.hidden = false;
}
if (sesion.requerirLogin()) cargar();
