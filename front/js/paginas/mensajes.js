// Mensajes (mensajes.html) y una conversación (conversacion.html?id=N), con la API del chat.
// Las dos páginas tienen la bandeja y el panel; en el celular, mensajes.html muestra sólo la bandeja y
// conversacion.html sólo el panel (interiores.css).
// Los mensajes nuevos llegan por polling: cada 5 segundos se piden los que tienen id mayor al último visto.
import * as chat from '../api/chat.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { ruta } from '../servicios/rutas.js';

const { el } = vistas;
const $ = (idElemento) => document.getElementById(idElemento);
const CADA_MENSAJES = 5000;
const CADA_BANDEJA = 20000;

const ZONA = 'America/Argentina/Buenos_Aires';
const HORA = new Intl.DateTimeFormat('es-AR', { timeStyle: 'short', timeZone: ZONA });
const DIA = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeZone: ZONA });
const DIA_LARGO = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: ZONA });

const diaDe = (iso) => DIA.format(new Date(iso));
const esHoy = (iso) => diaDe(iso) === DIA.format(new Date());
// En la bandeja: la hora si fue hoy, la fecha si no
const cuando = (iso) => (iso ? (esHoy(iso) ? HORA.format(new Date(iso)) : diaDe(iso)) : '');
const tituloDelDia = (iso) => (esHoy(iso) ? 'Hoy' : DIA_LARGO.format(new Date(iso)));

const estado = {
    conversaciones: [],
    actual: null,      // la conversación abierta en el panel
    ultimoId: 0,       // último mensaje recibido de la actual
    ultimoDia: null,   // para el separador de fecha del historial
    pidiendo: null,    // el polling en curso (para no pedir dos veces a la vez)
};

const conversacionUrl = (c) => ruta(`conversacion.html?id=${c.id}`);

// ---------- Bandeja ----------

function itemBandeja(c) {
    const enlace = el('a', {
        class: 'inbox__item', href: conversacionUrl(c), 'data-conversacion': c.id,
        'aria-current': estado.actual && estado.actual.id === c.id ? 'page' : null,
    },
    // La foto de la persona con la que hablás (o su inicial); el auto va como texto debajo del nombre
    vistas.avatar(c.con, 'avatar--chat'),
    el('div', {},
        el('strong', {}, c.con.nombre,
            c.no_leidos > 0
                ? el('span', { class: 'inbox__no-leidos', 'aria-label': `${c.no_leidos} sin leer` }, String(c.no_leidos))
                : null),
        el('small', {}, `${c.vehiculo.titulo} · ${c.rol === 'vendedor' ? 'tu publicación' : 'vendedor'}`,
            c.actualizada ? ` · ${cuando(c.actualizada)}` : ''),
        el('p', {}, c.ultimo_mensaje || 'Todavía no hay mensajes.')));
    return el('li', {}, enlace);
}

function mostrarBandeja() {
    const lista = $('conversaciones');
    lista.replaceChildren(...estado.conversaciones.map(itemBandeja));
    $('estado-bandeja').replaceChildren(estado.conversaciones.length ? '' : vistas.aviso(
        'Todavía no tenés conversaciones.',
        'Para escribirle a un vendedor, entrá a su publicación y tocá "Consultar".',
        el('a', { class: 'boton boton--secundario', href: ruta('buscar.html') }, 'Ver publicaciones')));
    filtrar();
}

async function cargarBandeja() {
    const { items } = await chat.bandeja();
    estado.conversaciones = items;
    // Lo abierto en el panel ya está leído: no se marca como pendiente
    if (estado.actual) {
        const actual = items.find((c) => c.id === estado.actual.id);
        if (actual) actual.no_leidos = 0;
    }
    mostrarBandeja();
}

const normalizar = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function filtrar() {
    const busqueda = normalizar($('buscar-conversacion').value.trim());
    const items = Array.from($('conversaciones').children);
    items.forEach((li) => { li.hidden = !normalizar(li.textContent).includes(busqueda); });
    $('sin-conversaciones').hidden = !busqueda || items.some((li) => !li.hidden);
}

// ---------- Panel de la conversación ----------

function burbuja(m) {
    return el('li', { class: `chat__mensaje${m.propio ? ' chat__mensaje--mio' : ''}`, 'data-mensaje': m.id },
        m.texto, // textContent: un mensaje con etiquetas HTML se ve como texto
        el('span', { class: 'chat__hora' }, HORA.format(new Date(m.fecha))));
}

function agregarMensajes(items) {
    const historial = $('chat-historial');
    const abajo = historial.scrollHeight - historial.scrollTop - historial.clientHeight < 40;
    items.forEach((m) => {
        if (historial.querySelector(`[data-mensaje="${m.id}"]`)) return;
        const dia = diaDe(m.fecha);
        if (dia !== estado.ultimoDia) {
            historial.append(el('li', { class: 'chat__fecha' }, tituloDelDia(m.fecha)));
            estado.ultimoDia = dia;
        }
        historial.append(burbuja(m));
    });
    $('chat-sin-mensajes').hidden = historial.children.length > 0;
    if (items.length && (abajo || items.some((m) => m.propio))) historial.lastElementChild?.scrollIntoView({ block: 'end' });
}

function marcarCerrada(abierta) {
    $('chat-form').hidden = !abierta;
    $('chat-cerrada').hidden = abierta;
}

// Pide los mensajes nuevos de la conversación abierta. Si ya hay un pedido en curso, espera ese.
function traerNuevos() {
    if (!estado.actual) return Promise.resolve();
    if (estado.pidiendo) return estado.pidiendo;
    const id = estado.actual.id;
    estado.pidiendo = chat.mensajes(id, estado.ultimoId)
        .then((respuesta) => {
            if (!estado.actual || estado.actual.id !== id) return;
            agregarMensajes(respuesta.items);
            estado.ultimoId = respuesta.ultimo_id;
            marcarCerrada(respuesta.abierta);
        })
        .finally(() => { estado.pidiendo = null; });
    return estado.pidiendo;
}

function avisoDelPanel(titulo, texto, conEnlace = true) {
    $('chat').hidden = true;
    $('chat-estado').replaceChildren(vistas.aviso(titulo, texto, conEnlace
        ? el('a', { class: 'boton boton--secundario', href: ruta('mensajes.html') }, 'Ver mis conversaciones')
        : null));
    $('chat-estado').hidden = false;
}

async function abrirConversacion(c) {
    estado.actual = c;
    estado.ultimoId = 0;
    estado.ultimoDia = null;
    document.querySelectorAll('[data-conversacion]').forEach((a) => {
        if (Number(a.dataset.conversacion) === c.id) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
    });

    $('chat-foto').replaceWith(Object.assign(vistas.avatar(c.con, 'avatar--chat'), { id: 'chat-foto' }));
    $('chat-persona').textContent = c.con.nombre;
    $('chat-rol').textContent = c.rol === 'vendedor' ? 'Le interesa tu publicación' : 'Vendedor';
    const vehiculo = $('chat-vehiculo');
    vehiculo.textContent = c.vehiculo.titulo;
    vehiculo.href = ruta(`vehiculo.html?id=${c.vehiculo.id}`);
    $('chat-historial').replaceChildren();
    $('chat-estado').hidden = true;
    $('chat').hidden = false;
    marcarCerrada(c.abierta);

    await traerNuevos();
    c.no_leidos = 0;
    mostrarBandeja();
}

function conectarEnvio() {
    const formulario = $('chat-form');
    const texto = $('texto');
    const boton = formulario.querySelector('[type="submit"]');
    const error = $('texto-error');
    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        const valor = texto.value.trim();
        error.textContent = '';
        if (!valor) {
            error.textContent = 'Escribí un mensaje.';
            texto.focus();
            return;
        }
        boton.disabled = true;
        try {
            await chat.enviar(estado.actual.id, valor);
            texto.value = '';
            // Se trae desde el último visto: así entran en orden también los que llegaron mientras se enviaba
            await traerNuevos();
            cargarBandeja().catch(() => {});
        } catch (e) {
            if (e.codigo === 'conversacion_cerrada') marcarCerrada(false);
            error.textContent = e.errores?.texto || e.message;
        } finally {
            boton.disabled = false;
            texto.focus();
        }
    });
}

// ---------- Inicio ----------

function repetir(cada, accion) {
    setInterval(() => { if (!document.hidden) accion().catch(() => {}); }, cada);
}

async function iniciar() {
    if (!sesion.requerirLogin()) return;
    $('buscar-conversacion').addEventListener('input', filtrar);
    conectarEnvio();

    $('estado-bandeja').replaceChildren(vistas.cargando());
    try {
        await cargarBandeja();
    } catch (e) {
        $('estado-bandeja').replaceChildren(vistas.avisoDeError(e));
        avisoDelPanel('No se pudo cargar.', e.message);
        return;
    }

    const pedida = Number(new URLSearchParams(window.location.search).get('id')) || null;
    // Sin ?id= no se abre ninguna sola: quedaría marcada como leída sin que nadie la viera.
    const elegida = pedida ? estado.conversaciones.find((c) => c.id === pedida) : null;

    if (pedida && !elegida) {
        // Una conversación recién abierta desde "Consultar" no figura en la bandeja del vendedor hasta el primer
        // mensaje, pero sí en la del interesado. Si no está, no es del usuario (el back responde 404).
        avisoDelPanel('No encontramos esa conversación.', 'Puede que no sea tuya o que el link esté mal.');
    } else if (elegida) {
        await abrirConversacion(elegida).catch((e) => avisoDelPanel('No se pudo cargar.', e.message));
    } else {
        avisoDelPanel(estado.conversaciones.length ? 'Elegí una conversación.' : 'Acá vas a ver los mensajes.', null, false);
    }

    repetir(CADA_MENSAJES, traerNuevos);
    repetir(CADA_BANDEJA, cargarBandeja);
}

iniciar();
