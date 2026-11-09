// Solicitudes de "Adherí tu taller" (permiso usuarios.editar): pendientes, aprobadas y rechazadas.
// Aprobar: el usuario pasa a mecánico y su taller entra al ranking. Rechazar: con un motivo que ve el que la pidió.
import * as admin from '../api/admin.js';
import * as formato from '../servicios/formato.js';
import * as formularios from '../servicios/formularios.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { filasDatos } from '../servicios/informe.js';

const { el } = vistas;
const ESTADOS = ['pendiente', 'aprobado', 'rechazado'];
const pedido = new URLSearchParams(window.location.search).get('estado');
const estadoActual = ESTADOS.includes(pedido) ? pedido : 'pendiente';

const lista = document.getElementById('lista');
const estado = document.getElementById('estado');
const aviso = document.getElementById('aviso');
const dialogo = document.getElementById('dialogo-rechazar');
const form = document.getElementById('form-rechazar');
let elegida = null;

function avisar(texto) {
    aviso.textContent = texto;
    aviso.hidden = !texto;
}

async function aprobar(s, boton) {
    boton.disabled = true;
    try {
        await admin.resolverSolicitudTaller(s.usuario_id, { aprobar: true });
        avisar(`Listo: ${s.taller} ya está en la red y ${s.responsable} pasó a mecánico.`);
        await cargar();
    } catch (error) {
        boton.disabled = false;
        avisar(error.message);
    }
}

function abrirRechazo(s) {
    elegida = s;
    form.reset();
    document.getElementById('rechazar-taller').textContent = `${s.taller} · ${s.responsable}`;
    formularios.alerta(form, '');
    dialogo.showModal();
}

function tarjeta(s) {
    const acciones = [];
    if (s.estado === 'pendiente') {
        const botonAprobar = el('button', { class: 'boton boton--chico', type: 'button' }, 'Aprobar');
        botonAprobar.addEventListener('click', () => aprobar(s, botonAprobar));
        const botonRechazar = el('button', { class: 'boton boton--secundario boton--chico', type: 'button' }, 'Rechazar');
        botonRechazar.addEventListener('click', () => abrirRechazo(s));
        acciones.push(botonAprobar, botonRechazar);
    }

    let resolucion = null;
    if (s.estado !== 'pendiente') {
        // Los talleres cargados antes de las solicitudes (los de demo) no tienen quién ni cuándo
        const partes = [s.estado === 'aprobado' ? 'Aprobada' : 'Rechazada'];
        if (s.resuelta_por) partes.push(s.resuelta_por);
        if (s.resuelta) partes.push(formato.fecha(s.resuelta));
        resolucion = ['Resolución', partes.join(' · ')];
    }
    let motivo = null;
    if (s.motivo_rechazo) motivo = ['Motivo', s.motivo_rechazo];

    return el('article', { class: 'recuadro pila' },
        el('h2', { class: 'titulo-seccion' }, s.taller),
        el('dl', { class: 'datos' }, ...filasDatos([
            ['Pedida', formato.fecha(s.creada)],
            ['Responsable', `${s.responsable} · ${s.email} (${formato.rol(s.rol)})`],
            ['CUIT', s.cuit || '—'],
            ['Dirección', `${s.direccion}, ${s.localidad}`],
            ['Teléfono', s.telefono],
            ['Horarios', s.horarios || '—'],
            ['Precio de la inspección', formato.precio(s.precio_inspeccion)],
            resolucion,
            motivo,
        ])),
        acciones.length ? el('ul', { class: 'acciones-fila', role: 'list' }, ...acciones.map((a) => el('li', {}, a))) : null);
}

const VACIO = {
    pendiente: 'No hay solicitudes por revisar.',
    aprobado: 'Todavía no se aprobó ninguna solicitud.',
    rechazado: 'No hay solicitudes rechazadas.',
};

function marcarPestanas() {
    document.querySelectorAll('#pestanas [data-estado]').forEach((a) => {
        if (a.dataset.estado === estadoActual) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
    });
}

async function cargar() {
    estado.replaceChildren(vistas.cargando());
    try {
        const { items } = await admin.solicitudesTaller(estadoActual);
        lista.replaceChildren(...items.map(tarjeta));
        estado.replaceChildren(items.length ? '' : vistas.aviso(VACIO[estadoActual]));
    } catch (error) {
        if (error.status === 401) {
            sesion.requerirLogin();
            return;
        }
        estado.replaceChildren(error.status === 403
            ? vistas.aviso('No tenés permiso para ver las solicitudes de talleres.')
            : vistas.avisoDeError(error));
    }
}

formularios.alEnviar(form, async ({ motivo }) => {
    await admin.resolverSolicitudTaller(elegida.usuario_id, { aprobar: false, motivo });
    dialogo.close();
    avisar(`Se rechazó la solicitud de ${elegida.taller}. ${elegida.responsable} ve el motivo y puede volver a mandarla.`);
    await cargar();
});

if (sesion.requerirPermiso('usuarios.editar')) {
    marcarPestanas();
    cargar();
}
