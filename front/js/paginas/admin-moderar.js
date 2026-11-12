// Moderación de publicaciones (permiso vehiculos.moderar): la cola de pendientes, con fotos y quién publicó,
// y las decisiones: aprobar, rechazar con motivo (lo ve el dueño), revertir un rechazo o dar de baja una aprobada.
import * as admin from '../api/admin.js';
import { API_URL } from '../api/config.js';
import * as formato from '../servicios/formato.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';

const { el } = vistas;
const params = new URLSearchParams(window.location.search);
// "incompletas" son pendientes que el vendedor todavía está completando (publicar por partes): no se pueden aprobar.
// "pendiente" muestra solo las completas, que son las que el moderador tiene que revisar.
const ESTADOS_COLA = ['pendiente', 'incompletas', 'rechazado', 'disponible'];
const filtroEstado = ESTADOS_COLA.includes(params.get('estado')) ? params.get('estado') : 'pendiente';
const filtros = { estado: filtroEstado, page: params.get('page') || '' };
if (filtroEstado === 'pendiente') filtros.completa = '1';
if (filtroEstado === 'incompletas') {
    filtros.estado = 'pendiente';
    filtros.completa = '0';
}

const cola = document.getElementById('cola');
const estado = document.getElementById('estado');
const total = document.getElementById('resultados-total');

const VACIO = {
    pendiente: 'No hay publicaciones esperando revisión.',
    incompletas: 'No hay publicaciones a medio cargar.',
    rechazado: 'No hay publicaciones rechazadas.',
    disponible: 'No hay publicaciones aprobadas.',
};

// Las fotos vienen como /api/fotos/ID: publicado, el proxy de Vercel las atiende; en local va el API_URL adelante.
const urlFoto = (rutaFoto) => API_URL + rutaFoto;

// Mientras el servidor responde, la tarjeta queda bloqueada: los botones y el motivo no se pueden tocar y el
// botón elegido dice "Aprobando…" o "Rechazando…". Así no se puede aprobar y rechazar la misma publicación.
async function decidir(v, nuevoEstado, motivo, error, boton) {
    error.textContent = '';
    const tarjeta = boton.closest('.moderar');
    const controles = Array.from(tarjeta.querySelectorAll('button, input'));
    const textoOriginal = boton.textContent;
    controles.forEach((c) => { c.disabled = true; });
    boton.textContent = nuevoEstado === 'disponible' ? 'Aprobando…' : 'Rechazando…';
    tarjeta.classList.add('moderar--procesando');
    tarjeta.setAttribute('aria-busy', 'true');
    try {
        await admin.moderar(v.id, nuevoEstado, motivo);
        const textos = { disponible: 'Se aprobó', rechazado: 'Se rechazó' };
        vistas.avisoFlotante(`${textos[nuevoEstado]} ${formato.titulo(v)}.`);
        // La tarjeta se va de la cola y después se recarga la lista
        tarjeta.classList.add('moderar--resuelta');
        await new Promise((listo) => setTimeout(listo, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 280));
        await cargar();
    } catch (e) {
        error.textContent = Object.values(e.errores || {})[0] || e.message;
        controles.forEach((c) => { c.disabled = false; });
        boton.textContent = textoOriginal;
        tarjeta.classList.remove('moderar--procesando');
        tarjeta.removeAttribute('aria-busy');
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
    // Una incompleta no se aprueba (el back también lo controla): se puede rechazar, por ejemplo si es spam
    if (v.estado !== 'disponible' && v.completa) {
        const aprobar = el('button', { class: 'boton boton--chico', type: 'button' },
            v.estado === 'rechazado' ? 'Aprobar (revertir rechazo)' : 'Aprobar');
        aprobar.addEventListener('click', () => decidir(v, 'disponible', null, error, aprobar));
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
            decidir(v, 'rechazado', motivo.value.trim(), error, rechazar);
        });
        botones.push(rechazar);
    }

    const publicador = detalle?.publicador;

    return el('li', { class: 'propuesta pila moderar' },
        el('div', { class: 'moderar__cuerpo' },
        el('div', { class: 'moderar__datos pila' },
        el('p', {},
            // Nadie del panel edita: si algo está mal, se rechaza con un motivo y lo corrige el dueño
            el('strong', {}, formato.titulo(v)),
            ' · ', v.precio === null ? 'sin precio' : formato.precio(v.precio), el('br'),
            el('span', { class: 'fila__meta' }, [
                v.kilometraje === null ? null : formato.km(v.kilometraje),
                v.combustible ? formato.combustible(v.combustible) : null,
                v.transmision ? formato.transmision(v.transmision) : null,
                v.localidad,
            ].filter(Boolean).join(' · '))),
        v.completa ? null : el('p', { class: 'campo__ayuda' },
            `Incompleta: le falta ${v.faltan.join(', ')}. El vendedor la está completando; recién después se puede aprobar.`),
        el('p', { class: 'fila__meta' }, publicador
            ? `Publicó ${publicador.nombre} (${publicador.email})`
            : 'Cargado por el admin (sin dueño)'),
        v.descripcion ? el('p', {}, v.descripcion) : null,
        v.motivo_rechazo ? el('p', { class: 'campo__ayuda' }, `Motivo del rechazo: ${v.motivo_rechazo}`) : null),
        galeria(v, detalle?.fotos || [])),
        v.estado !== 'rechazado'
            ? el('div', { class: 'campo' }, el('label', { class: 'solo-lector', for: idMotivo }, 'Motivo'), motivo)
            : null,
        error,
        el('div', { class: 'hoja__acciones' }, ...botones));
}

// Fotos grandes a la derecha de los datos: una principal y las miniaturas abajo; tocar una la pasa a principal.
function galeria(v, fotos) {
    if (!fotos.length) return el('div', { class: 'moderar__galeria moderar__galeria--vacia' }, el('p', { class: 'suave' }, 'Sin fotos.'));
    const titulo = formato.titulo(v);
    const principal = el('img', { class: 'moderar__principal', src: urlFoto(fotos[0]), alt: `Foto 1 de ${titulo}`, loading: 'lazy' });
    const miniaturas = fotos.length < 2 ? null : el('div', { class: 'moderar__miniaturas' }, ...fotos.map((f, i) => {
        const boton = el('button', { class: 'moderar__miniatura', type: 'button', 'aria-label': `Ver la foto ${i + 1}`,
            'aria-pressed': String(i === 0) },
        el('img', { src: urlFoto(f), alt: '', loading: 'lazy' }));
        boton.addEventListener('click', () => {
            principal.src = urlFoto(f);
            principal.alt = `Foto ${i + 1} de ${titulo}`;
            miniaturas.querySelectorAll('[aria-pressed]').forEach((b) => b.setAttribute('aria-pressed', String(b === boton)));
        });
        return boton;
    }));
    return el('div', { class: 'moderar__galeria' }, principal, miniaturas,
        el('p', { class: 'moderar__contador' }, fotos.length === 1 ? '1 foto' : `${fotos.length} fotos`));
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
