// Búsquedas guardadas (meta-busqueda.html) con GET /api/meta-busquedas.
import * as api from '../api/metabusqueda.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { criterios } from '../servicios/metabusqueda.js';
import { ruta } from '../servicios/rutas.js';

const { el } = vistas;
const lista = document.getElementById('lista');
const estado = document.getElementById('estado');

function fila(b) {
    const meta = `${b.autos === 1 ? '1 auto' : `${b.autos} autos`} que coinciden`
        + (b.avisos_sin_ver ? ` · ${b.avisos_sin_ver} ${b.avisos_sin_ver === 1 ? 'novedad' : 'novedades'} sin ver` : '');
    return el('li', {},
        el('a', { class: 'recuadro fila', href: ruta(`meta-busqueda-resultados.html?id=${b.id}`) },
            el('span', { class: 'fila__cuerpo' },
                el('span', { class: 'fila__titulo' }, criterios(b)), el('br'),
                el('span', { class: 'fila__meta' }, meta)),
            el('span', { 'aria-hidden': 'true' }, '›')));
}

async function cargar() {
    estado.replaceChildren(vistas.cargando());
    try {
        const { busquedas } = await api.listar();
        estado.replaceChildren(busquedas.length ? '' : vistas.aviso('Todavía no guardaste ninguna búsqueda.',
            'Elegí la marca y el modelo que buscás y te mostramos los autos de todos los sitios.'));
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
    const aviso = document.getElementById('aviso');
    aviso.textContent = 'Borramos la búsqueda.';
    aviso.hidden = false;
}
if (sesion.requerirLogin()) cargar();
