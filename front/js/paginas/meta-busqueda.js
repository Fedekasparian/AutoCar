// Búsquedas guardadas (meta-busqueda.html) con GET /api/meta-busquedas.
import * as api from '../api/metabusqueda.js';
import * as formato from '../servicios/formato.js';
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

function vacio() {
    const nodo = vistas.aviso(...VACIO, el('a', { class: 'boton', href: ruta('meta-busqueda-nueva.html') }, 'Crear mi primera búsqueda'));
    nodo.classList.add('vacio--ilustrado', 'vacio--lupa');
    return nodo;
}

function abrirBorrar(b, fila) {
    elegida = { b, fila };
    document.getElementById('borrar-criterios').textContent = criterios(b);
    document.getElementById('borrar-error').textContent = '';
    dialogo.showModal();
}

// Los criterios aparte de marca y modelo, como chips ("2015 a 2019", "hasta $12.000.000"…)
function chips(b) {
    const partes = [];
    if (b.anio_desde || b.anio_hasta) partes.push(`${b.anio_desde || '…'} a ${b.anio_hasta || '…'}`);
    if (b.precio_max) partes.push(`hasta ${formato.precio(b.precio_max)}`);
    if (b.km_max) partes.push(`hasta ${formato.km(b.km_max)}`);
    if (b.transmision) partes.push(formato.transmision(b.transmision));
    if (!partes.length) partes.push('Cualquier año, precio y km');
    return el('span', { class: 'busqueda-guardada__chips' }, ...partes.map((p) => el('span', { class: 'chip-criterio' }, p)));
}

function fila(b, i) {
    const novedades = b.avisos_sin_ver
        ? el('span', { class: 'busqueda-guardada__novedades' },
            `${b.avisos_sin_ver} ${b.avisos_sin_ver === 1 ? 'novedad' : 'novedades'}`)
        : null;
    const borrar = el('button', { class: 'busqueda-guardada__borrar', type: 'button', title: 'Borrar',
        'aria-label': `Borrar la búsqueda ${criterios(b)}` }, iconoTachito());
    const fila = el('li', { class: 'busqueda-guardada' },
        el('a', { class: 'recuadro fila', href: ruta(`meta-busqueda-resultados.html?id=${b.id}`),
            'aria-label': `${criterios(b)}: ${b.autos === 1 ? '1 auto' : `${b.autos} autos`}${b.avisos_sin_ver ? `, ${b.avisos_sin_ver} sin ver` : ''}` },
            el('span', { class: 'fila__cuerpo' },
                el('span', { class: 'fila__titulo' }, `${b.marca} ${b.modelo}`, novedades),
                chips(b)),
            el('span', { class: 'busqueda-guardada__cantidad', 'aria-hidden': 'true' },
                el('strong', {}, String(b.autos)), b.autos === 1 ? 'auto' : 'autos'),
            el('span', { class: 'busqueda-guardada__flecha', 'aria-hidden': 'true' }, '›')),
        borrar);
    fila.style.setProperty('--n', String(i));
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
        if (!lista.children.length) estado.replaceChildren(vacio());
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
        estado.replaceChildren(busquedas.length ? '' : vacio());
        lista.replaceChildren(...busquedas.map(fila));
        lista.classList.add('lista-filas--entra');
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
