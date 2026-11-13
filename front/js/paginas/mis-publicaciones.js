// Mis publicaciones (GET /api/mis-vehiculos): cada una con su estado y lo que se puede hacer.
// Publicar por partes: las que están sin terminar muestran qué les falta y "Continuar" (publicar.html?id=N).
// Arriba, pestañas por estado con la cantidad de cada una (la elegida queda en la URL: #revision, #publicadas…).
import * as api from '../api/publicaciones.js';
import { API_URL } from '../api/config.js';
import * as formato from '../servicios/formato.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { ruta } from '../servicios/rutas.js';
import { confirmacion } from '../servicios/acciones.js';

const { el } = vistas;
const lista = document.getElementById('lista');
const estado = document.getElementById('estado');
const aviso = document.getElementById('aviso');
const pestanas = document.getElementById('pestanas');

let todas = [];

function avisar(texto) {
    aviso.textContent = texto;
    aviso.hidden = !texto;
}

// ---------- Confirmaciones (las ventanas las arma acciones.js) ----------

const resumenDe = (v) => [formato.titulo(v), v.precio === null ? null : formato.precio(v.precio)].filter(Boolean).join(' · ');

const pedirEliminar = confirmacion({
    titulo: '¿Eliminar esta publicación?',
    confirmar: 'Eliminar',
    detalle: (v) => [
        el('p', {}, resumenDe(v)),
        el('p', { class: 'campo__ayuda' }, 'Deja de verse en AutoCar y no la vas a poder recuperar.'),
        // A una publicada se le sugiere "Marcar vendida", que es lo que suele querer el vendedor
        v.estado === 'disponible'
            ? el('p', { class: 'campo__ayuda' }, 'Si ya la vendiste, conviene usar «Marcar vendida» en vez de eliminarla.')
            : null,
    ],
    hacer: async (v) => {
        await api.eliminar(v.id);
        avisar(`Se eliminó ${formato.titulo(v)}.`);
        await cargar();
    },
});

const pedirVendida = confirmacion({
    titulo: '¡Felicitaciones por la venta!',
    confirmar: 'Sí, la vendí',
    volver: 'Todavía no',
    detalle: (v) => [
        el('p', {}, resumenDe(v)),
        el('p', { class: 'campo__ayuda' }, 'La publicación deja de aparecer en Explorar y queda en tus publicaciones como ',
            el('strong', {}, 'Vendida'), '. Las conversaciones con los interesados siguen abiertas.'),
    ],
    hacer: async (v) => {
        await api.marcarVendida(v.id);
        avisar(`${formato.titulo(v)} quedó como vendida. ¡Felicitaciones!`);
        await cargar();
    },
});

// ---------- Estado de cada publicación ----------

// sin-terminar · revision · rechazada · publicada · vendida (también es la clase del color de la tarjeta)
function tipo(v) {
    if (v.estado === 'pendiente') return v.completa ? 'revision' : 'sin-terminar';
    if (v.estado === 'rechazado') return 'rechazada';
    if (v.estado === 'disponible') return 'publicada';
    return 'vendida';
}
const ETIQUETAS = {
    'sin-terminar': 'Sin terminar', revision: 'En revisión', rechazada: 'Rechazada', publicada: 'Publicada', vendida: 'Vendida',
};

// Lo que se pide para que esté completa (vehiculo.faltan sale de esta lista): sirve para la barra de avance
const REQUISITOS = 7; // precio, kilometraje, combustible, transmisión, estado general, localidad y fotos

function foto(v) {
    const titulo = formato.titulo(v);
    if (!v.foto) return el('div', { class: 'publicacion__foto sin-foto', role: 'img', 'aria-label': `${titulo}, sin foto` });
    return el('img', { class: 'publicacion__foto', src: API_URL + v.foto, alt: titulo, loading: 'lazy' });
}

// Lo que dice debajo del título según el estado
function explicacion(v) {
    if (v.estado === 'pendiente' && !v.completa) return `Te falta: ${v.faltan.join(', ')}. Cuando esté completa la revisamos.`;
    if (v.estado === 'pendiente') return 'Está completa: la está revisando un moderador.';
    if (v.estado === 'rechazado') return `Motivo del rechazo: ${(v.motivo_rechazo || 'sin motivo').replace(/\.$/, '')}. Corregila y vuelve a revisión.`;
    return `Publicada el ${formato.fecha(v.creado)}.`;
}

// Barra de cuánto le falta a una sin terminar
function avance(v) {
    const hechos = Math.max(0, REQUISITOS - v.faltan.length);
    const porcentaje = Math.round((hechos / REQUISITOS) * 100);
    const barra = el('span', { class: 'avance__barra' });
    barra.style.setProperty('--avance', `${porcentaje}%`);
    return el('div', { class: 'avance' },
        el('span', { class: 'avance__pista', role: 'img', 'aria-label': `Completa al ${porcentaje} %` }, barra),
        el('span', { class: 'avance__texto', 'aria-hidden': 'true' }, `${porcentaje} %`));
}

function boton(texto, alHacerClic) {
    const b = el('button', { type: 'button' }, texto);
    b.addEventListener('click', () => alHacerClic(b));
    return b;
}

function acciones(v) {
    const items = [];
    // "Continuar" va aparte, como botón (ver fila()); acá solo el resto
    if (v.estado !== 'vendido' && !(v.estado === 'pendiente' && !v.completa)) {
        items.push(el('a', { href: ruta(`publicar.html?id=${v.id}`) }, 'Editar'));
    }
    if (v.estado === 'disponible') {
        items.push(el('a', { href: ruta(`vehiculo.html?id=${v.id}`) }, 'Ver'));
        items.push(boton('Marcar vendida', () => pedirVendida(v)));
    }
    items.push(boton('Eliminar', () => pedirEliminar(v)));
    return el('ul', { class: 'acciones-fila', role: 'list' }, ...items.map((a) => el('li', {}, a)));
}

function fila(v, i) {
    const t = tipo(v);
    const datos = [
        v.precio === null ? null : formato.precio(v.precio),
        v.kilometraje === null ? null : formato.km(v.kilometraje),
        v.acepta_canje ? 'Acepta canje' : null,
    ].filter(Boolean).join(' · ');
    const li = el('li', { class: `publicacion publicacion--${t}` },
        foto(v),
        el('div', { class: 'publicacion__titulo' },
            el('strong', {}, formato.titulo(v)), ' ',
            el('span', { class: `etiqueta etiqueta-estado etiqueta-estado--${t}` }, ETIQUETAS[t])),
        el('div', {},
            datos ? el('p', { class: 'fila__meta' }, datos) : null,
            t === 'sin-terminar' ? avance(v) : null,
            el('p', { class: 'fila__meta' }, explicacion(v)),
            t === 'sin-terminar' ? el('a', { class: 'boton boton--chico', href: ruta(`publicar.html?id=${v.id}`) }, 'Continuar') : null,
            acciones(v)));
    li.style.setProperty('--n', String(i));
    return li;
}

// Primero las que necesitan algo del vendedor (sin terminar y rechazadas), después el resto
const ORDEN = ['sin-terminar', 'rechazada', 'revision', 'publicada', 'vendida'];

// ---------- Pestañas ----------

const PESTANAS = [
    ['todas', 'Todas', () => true],
    ['completar', 'Para completar', (v) => ['sin-terminar', 'rechazada'].includes(tipo(v))],
    ['revision', 'En revisión', (v) => tipo(v) === 'revision'],
    ['publicadas', 'Publicadas', (v) => tipo(v) === 'publicada'],
    ['vendidas', 'Vendidas', (v) => tipo(v) === 'vendida'],
];

const elegida = () => {
    const clave = window.location.hash.slice(1);
    return PESTANAS.some(([c]) => c === clave) ? clave : 'todas';
};

function mostrarPestanas() {
    const actual = elegida();
    pestanas.replaceChildren(...PESTANAS.map(([clave, texto, filtro]) => {
        const cantidad = todas.filter(filtro).length;
        // Las vacías no se muestran (salvo "Todas" y la elegida)
        if (!cantidad && clave !== 'todas' && clave !== actual) return null;
        const b = el('button', { class: 'pestana-estado', type: 'button', 'aria-pressed': String(clave === actual) },
            texto, el('span', { class: 'pestana-estado__cantidad' }, String(cantidad)));
        b.addEventListener('click', () => {
            window.history.replaceState(null, '', clave === 'todas' ? window.location.pathname : `#${clave}`);
            mostrar();
        });
        return b;
    }).filter(Boolean));
    pestanas.hidden = todas.length === 0;
}

function mostrar() {
    mostrarPestanas();
    const [, texto, filtro] = PESTANAS.find(([c]) => c === elegida());
    const visibles = todas.filter(filtro);
    lista.replaceChildren(...visibles.map(fila));
    lista.classList.remove('lista-filas--entra');
    void lista.offsetWidth; // reinicia la animación de entrada al cambiar de pestaña
    lista.classList.add('lista-filas--entra');
    if (!todas.length) {
        estado.replaceChildren(vistas.aviso('Todavía no publicaste nada.', 'Con marca, modelo y año ya la podés empezar.',
            el('a', { class: 'boton', href: ruta('publicar.html') }, 'Publicar vehículo')));
        estado.firstChild.classList.add('vacio--ilustrado', 'vacio--auto');
    } else if (!visibles.length) {
        estado.replaceChildren(vistas.aviso(`No tenés publicaciones en «${texto}».`));
    } else {
        estado.replaceChildren();
    }
}

async function cargar() {
    estado.replaceChildren(vistas.cargando());
    try {
        const { items } = await api.listar();
        todas = items.sort((a, b) => ORDEN.indexOf(tipo(a)) - ORDEN.indexOf(tipo(b)));
        mostrar();
    } catch (error) {
        if (error.status === 401) {
            sesion.requerirLogin();
            return;
        }
        estado.replaceChildren(vistas.avisoDeError(error));
    }
}

if (sesion.requerirLogin()) cargar();
