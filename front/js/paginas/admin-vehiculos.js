// Administración: listado de vehículos con editar y eliminar.
import * as admin from '../api/admin.js';
import * as formato from '../servicios/formato.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';

const { el } = vistas;
const params = new URLSearchParams(window.location.search);
const filtros = { q: params.get('q') || '', page: params.get('page') || '' };

const cuerpo = document.getElementById('resultados');
const estado = document.getElementById('estado');
const total = document.getElementById('resultados-total');
const aviso = document.getElementById('aviso');

const dialogo = document.getElementById('confirmar-baja');
const botonBaja = document.getElementById('baja-confirmar');
const errorBaja = document.getElementById('baja-error');
let aEliminar = null;

// Mensaje que deja el formulario al guardar (admin-vehiculo.html → ?guardado=1) o la baja.
function avisar(texto) {
    aviso.textContent = texto;
    aviso.hidden = !texto;
}

function fila(v) {
    const eliminar = el('button', { class: 'boton-link', type: 'button' }, 'Eliminar');
    eliminar.addEventListener('click', () => {
        aEliminar = v;
        document.getElementById('baja-vehiculo').textContent = `${formato.titulo(v)} · ${formato.precio(v.precio)}`;
        errorBaja.textContent = '';
        dialogo.showModal();
    });
    return el('tr', {},
        el('td', {}, el('a', { href: `vehiculo.html?id=${v.id}` }, formato.titulo(v))),
        el('td', {}, formato.precio(v.precio)),
        el('td', {}, formato.km(v.kilometraje)),
        el('td', {}, formato.estado(v.estado)),
        el('td', {},
            el('ul', { class: 'acciones-fila', role: 'list' },
                el('li', {}, el('a', { href: `admin-vehiculo.html?id=${v.id}` }, 'Editar')),
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

botonBaja.addEventListener('click', async () => {
    if (!aEliminar) return;
    botonBaja.disabled = true;
    try {
        await admin.eliminar(aEliminar.id);
        dialogo.close();
        avisar(`Se eliminó ${formato.titulo(aEliminar)}.`);
        await cargar();
    } catch (error) {
        errorBaja.textContent = error.message;
    } finally {
        botonBaja.disabled = false;
    }
});

if (sesion.requerirAdmin()) {
    document.getElementById('q').value = filtros.q;
    if (params.has('guardado')) avisar('Los cambios se guardaron.');
    cargar();
}
