// Administración: listado de vehículos con eliminar. El panel no crea ni edita: cada publicación la corrige su dueño.
import * as admin from '../api/admin.js';
import * as formato from '../servicios/formato.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { confirmacion } from '../servicios/acciones.js';

import { ruta } from '../servicios/rutas.js';

const { el } = vistas;
const params = new URLSearchParams(window.location.search);
const filtros = { q: params.get('q') || '', page: params.get('page') || '' };

const cuerpo = document.getElementById('resultados');
const estado = document.getElementById('estado');
const total = document.getElementById('resultados-total');
const aviso = document.getElementById('aviso');

// Mensaje después de una baja.
function avisar(texto) {
    aviso.textContent = texto;
    aviso.hidden = !texto;
}

function fila(v) {
    const eliminar = el('button', { class: 'boton-link', type: 'button' }, 'Eliminar');
    eliminar.addEventListener('click', () => pedirBaja(v));
    return el('tr', {},
        el('td', {}, el('a', { href: ruta(`vehiculo.html?id=${v.id}`) }, formato.titulo(v))),
        el('td', {}, formato.precio(v.precio)),
        el('td', {}, formato.km(v.kilometraje)),
        el('td', {}, formato.estado(v.estado)),
        el('td', {},
            el('ul', { class: 'acciones-fila', role: 'list' },
                el('li', {}, eliminar))));
}

async function cargar() {
    estado.replaceChildren(vistas.cargando());
    try {
        const r = await admin.listar(filtros);
        total.textContent = r.total === 1 ? '1 vehículo' : `${r.total} vehículos`;
        cuerpo.replaceChildren(...r.items.map(fila));
        if (r.items.length) estado.replaceChildren();
        else estado.replaceChildren(vistas.aviso('No hay vehículos para mostrar.'));
        document.getElementById('paginacion').replaceWith(
            Object.assign(vistas.paginacion(r.pagina, r.paginas), { id: 'paginacion' }));
    } catch (error) {
        if (error.status === 401) {
            sesion.requerirLogin();
            return;
        }
        estado.replaceChildren(error.status === 403
            ? vistas.aviso('No tenés permisos de administración.')
            : vistas.avisoDeError(error));
    }
}

// Confirmación de la baja (la ventana la arma acciones.js)
const pedirBaja = confirmacion({
    titulo: '¿Eliminar este vehículo?',
    confirmar: 'Eliminar',
    detalle: (v) => [
        el('p', {}, `${formato.titulo(v)} · ${formato.precio(v.precio)}`),
        el('p', { class: 'campo__ayuda' }, 'Es una baja lógica: deja de verse en el sitio pero queda guardado (lo referencian los chats). Si sólo se vendió, lo marca su dueño desde Mis publicaciones.'),
    ],
    hacer: async (v) => {
        await admin.eliminar(v.id);
        avisar(`Se eliminó ${formato.titulo(v)}.`);
        await cargar();
    },
});

if (sesion.requerirPermiso('vehiculos.gestionar')) {
    document.getElementById('q').value = filtros.q;
    cargar();
}
