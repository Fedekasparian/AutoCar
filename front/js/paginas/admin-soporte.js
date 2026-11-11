// Panel: reportes (moderador) y mensajes de contacto (admin), con GET y PATCH /api/admin/reportes y /contactos.
import * as soporte from '../api/soporte.js';
import * as formato from '../servicios/formato.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { ruta } from '../servicios/rutas.js';

const { el } = vistas;
const MOTIVOS = { fraude: 'Estafa', datos: 'Datos que no coinciden', vendido: 'Ya vendido', trato: 'Maltrato', spam: 'Spam', otro: 'Otro' };

// Botón que llama a la API y, si sale bien, deja la fila marcada
function boton(texto, accion, alTerminar) {
    const b = el('button', { class: 'boton boton--chico', type: 'button' }, texto);
    b.addEventListener('click', async () => {
        b.disabled = true;
        try {
            await accion();
            alTerminar();
        } catch (error) {
            b.disabled = false;
            b.textContent = error.message;
        }
    });
    return b;
}

function filaReporte(r) {
    const que = r.vehiculo
        ? el('a', { href: ruta(`vehiculo.html?id=${r.vehiculo.id}`) }, `Publicación: ${r.vehiculo.titulo}`)
        : `Usuario: ${r.usuario.nombre}`;
    const estado = el('span', { class: 'etiqueta' }, r.estado === 'resuelto' ? 'Resuelto' : 'Pendiente');
    const li = el('li', { class: 'fila' },
        el('span', { class: 'fila__cuerpo' },
            el('span', { class: 'fila__titulo' }, que), el('br'),
            el('span', { class: 'fila__meta' }, `${MOTIVOS[r.motivo] || r.motivo} · de ${r.autor} · ${formato.fechaHora(r.fecha)}`),
            r.detalle ? el('p', {}, r.detalle) : null),
        el('span', { class: 'fila__acciones' }, estado));
    if (r.estado !== 'resuelto') {
        li.lastChild.append(boton('Marcar resuelto', () => soporte.resolverReporte(r.id), () => {
            estado.textContent = 'Resuelto';
            li.querySelector('button').remove();
        }));
    }
    return li;
}

function filaContacto(c) {
    const li = el('li', { class: 'fila' },
        el('span', { class: 'fila__cuerpo' },
            el('span', { class: 'fila__titulo' }, el('a', { href: `mailto:${c.email}` }, c.email)), el('br'),
            el('span', { class: 'fila__meta' }, formato.fechaHora(c.fecha)),
            el('p', {}, c.mensaje)),
        el('span', { class: 'fila__acciones' }));
    if (!c.leido) li.lastChild.append(boton('Marcar leído', () => soporte.leerContacto(c.id), () => li.querySelector('button').remove()));
    return li;
}

async function cargar(seccion, pedir, armarFila, vacio) {
    const estado = document.getElementById(`estado-${seccion}`);
    document.getElementById(`seccion-${seccion}`).hidden = false;
    estado.replaceChildren(vistas.cargando());
    try {
        const { items } = await pedir();
        estado.replaceChildren(items.length ? '' : vistas.aviso(vacio));
        document.getElementById(seccion).replaceChildren(...items.map(armarFila));
    } catch (error) {
        estado.replaceChildren(vistas.avisoDeError(error));
    }
}

if (sesion.requerirPermiso('vehiculos.moderar', 'usuarios.ver')) {
    if (sesion.puede('vehiculos.moderar')) cargar('reportes', soporte.reportes, filaReporte, 'No hay reportes.');
    if (sesion.puede('usuarios.ver')) cargar('contactos', soporte.contactos, filaContacto, 'No hay mensajes de contacto.');
}
