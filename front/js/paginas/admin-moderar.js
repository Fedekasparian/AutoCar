// Moderación de publicaciones (permiso vehiculos.moderar): la cola de pendientes, con fotos y quién publicó,
// y las decisiones: aprobar, rechazar con motivo (lo ve el dueño), revertir un rechazo o dar de baja una aprobada.
import * as admin from '../api/admin.js';
import { API_URL } from '../api/config.js';
import * as formato from '../servicios/formato.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { ruta } from '../servicios/rutas.js';

const { el } = vistas;
const params = new URLSearchParams(window.location.search);
const ESTADOS_COLA = ['pendiente', 'rechazado', 'disponible'];
const filtroEstado = ESTADOS_COLA.includes(params.get('estado')) ? params.get('estado') : 'pendiente';
const filtros = { estado: filtroEstado, page: params.get('page') || '' };

const cola = document.getElementById('cola');
const estado = document.getElementById('estado');
const total = document.getElementById('resultados-total');
const aviso = document.getElementById('aviso');

const VACIO = {
    pendiente: 'No hay publicaciones esperando revisión.',
    rechazado: 'No hay publicaciones rechazadas.',
    disponible: 'No hay publicaciones aprobadas.',
};

function avisar(texto) {
    aviso.textContent = texto;
    aviso.hidden = !texto;
}

// Las fotos vienen como /api/fotos/ID: publicado, el proxy de Vercel las atiende; en local va el API_URL adelante.
const urlFoto = (rutaFoto) => API_URL + rutaFoto;

async function decidir(v, nuevoEstado, motivo, error) {
    error.textContent = '';
    try {
        await admin.moderar(v.id, nuevoEstado, motivo);
        const textos = { disponible: 'Se aprobó', rechazado: 'Se rechazó' };
        avisar(`${textos[nuevoEstado]} ${formato.titulo(v)}.`);
        await cargar();
    } catch (e) {
        error.textContent = Object.values(e.errores || {})[0] || e.message;
    }
}

function tarjeta(v, detalle) {
    const error = el('p', { class: 'formulario__alerta', role: 'alert' });
    const idMotivo = `motivo-${v.id}`;
    const motivo = el('input', {
        class: 'campo__input', id: idMotivo, name: 'motivo', maxlength: '300',
        placeholder: v.estado === 'disponible' ? 'Motivo de la baja (lo ve el dueño)' : 'Motivo si se rechaza (lo ve el dueño)',
    });
    const botones = [];
    if (v.estado !== 'disponible') {
        const aprobar = el('button', { class: 'boton boton--chico', type: 'button' },
            v.estado === 'rechazado' ? 'Aprobar (revertir rechazo)' : 'Aprobar');
        aprobar.addEventListener('click', () => decidir(v, 'disponible', null, error));
        botones.push(aprobar);
    }
    if (v.estado !== 'rechazado') {
        const rechazar = el('button', { class: 'boton boton--secundario boton--chico', type: 'button' },
            v.estado === 'disponible' ? 'Dar de baja' : 'Rechazar');
        rechazar.addEventListener('click', () => {
            if (motivo.value.trim().length < 5) {
                error.textContent = 'Escribí el motivo (al menos 5 caracteres): el dueño lo va a ver.';
                motivo.focus();
                return;
            }
            decidir(v, 'rechazado', motivo.value.trim(), error);
        });
        botones.push(rechazar);
    }

    const fotos = (detalle?.fotos || []).map((f) =>
        el('img', { class: 'moderar__foto', src: urlFoto(f), alt: `Foto de ${formato.titulo(v)}`, loading: 'lazy' }));
    const publicador = detalle?.publicador;

    return el('li', { class: 'propuesta pila' },
        el('p', {},
            // El moderador no edita el catálogo: el enlace a editar sólo aparece si tiene ese permiso
            sesion.puede('vehiculos.gestionar')
                ? el('a', { href: ruta(`admin-vehiculo.html?id=${v.id}`) }, el('strong', {}, formato.titulo(v)))
                : el('strong', {}, formato.titulo(v)),
            ' · ', formato.precio(v.precio), el('br'),
            el('span', { class: 'fila__meta' },
                `${formato.km(v.kilometraje)} · ${formato.combustible(v.combustible)} · ${formato.transmision(v.transmision)}`
                + (v.localidad ? ` · ${v.localidad}` : ''))),
        el('p', { class: 'fila__meta' }, publicador
            ? `Publicó ${publicador.nombre} (${publicador.email})`
            : 'Cargado por el admin (sin dueño)'),
        v.descripcion ? el('p', {}, v.descripcion) : null,
        v.motivo_rechazo ? el('p', { class: 'campo__ayuda' }, `Motivo del rechazo: ${v.motivo_rechazo}`) : null,
        fotos.length ? el('div', { class: 'moderar__fotos' }, ...fotos) : el('p', { class: 'suave' }, 'Sin fotos.'),
        v.estado !== 'rechazado'
            ? el('div', { class: 'campo' }, el('label', { class: 'solo-lector', for: idMotivo }, 'Motivo'), motivo)
            : null,
        error,
        el('div', { class: 'hoja__acciones' }, ...botones));
}

async function cargar() {
    estado.replaceChildren(vistas.cargando());
    try {
        const r = await admin.listar(filtros);
        // El detalle trae las fotos y quién publicó; se piden todos juntos
        const detalles = await Promise.all(r.items.map((v) => admin.detalle(v.id).then((d) => d.vehiculo).catch(() => null)));
        total.textContent = r.total === 1 ? '1 publicación' : `${r.total} publicaciones`;
        cola.replaceChildren(...r.items.map((v, i) => tarjeta(v, detalles[i])));
        estado.replaceChildren(r.items.length ? '' : vistas.aviso(VACIO[filtroEstado]));
        document.getElementById('paginacion').replaceWith(
            Object.assign(vistas.paginacion(r.pagina, r.paginas), { id: 'paginacion' }));
    } catch (error) {
        if (error.status === 401) {
            sesion.requerirLogin();
            return;
        }
        estado.replaceChildren(error.status === 403
            ? vistas.aviso('No tenés permiso para moderar.')
            : vistas.avisoDeError(error));
    }
}

if (sesion.requerirPermiso('vehiculos.moderar')) {
    document.querySelectorAll('#filtros-estado [data-estado]').forEach((chip) => {
        if (chip.dataset.estado === filtroEstado) chip.setAttribute('aria-current', 'true');
    });
    cargar();
}
