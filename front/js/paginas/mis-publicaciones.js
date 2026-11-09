// Mis publicaciones (GET /api/mis-vehiculos): cada una con su estado y lo que se puede hacer.
// Publicar por partes: las que están sin terminar muestran qué les falta y "Continuar" (publicar.html?id=N).
import * as api from '../api/publicaciones.js';
import { API_URL } from '../api/config.js';
import * as formato from '../servicios/formato.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { ruta } from '../servicios/rutas.js';

const { el } = vistas;
const lista = document.getElementById('lista');
const estado = document.getElementById('estado');
const aviso = document.getElementById('aviso');

// Ventana de confirmación para eliminar (el <dialog> está en mis-publicaciones.html)
const dialogo = document.getElementById('confirmar-eliminar');
const botonEliminar = document.getElementById('eliminar-confirmar');
const errorEliminar = document.getElementById('eliminar-error');
let aEliminar = null;

function avisar(texto) {
    aviso.textContent = texto;
    aviso.hidden = !texto;
}

function pedirConfirmacion(v) {
    aEliminar = v;
    const datos = [formato.titulo(v), v.precio === null ? null : formato.precio(v.precio)].filter(Boolean);
    document.getElementById('eliminar-vehiculo').textContent = datos.join(' · ');
    // A una publicada se le sugiere "Marcar vendida", que es lo que suele querer el vendedor
    document.getElementById('eliminar-vendida').hidden = v.estado !== 'disponible';
    errorEliminar.textContent = '';
    dialogo.showModal();
}

botonEliminar.addEventListener('click', async () => {
    if (!aEliminar) return;
    botonEliminar.disabled = true;
    try {
        await api.eliminar(aEliminar.id);
        dialogo.close();
        avisar(`Se eliminó ${formato.titulo(aEliminar)}.`);
        await cargar();
    } catch (error) {
        errorEliminar.textContent = error.message;
        errorEliminar.focus();
    } finally {
        botonEliminar.disabled = false;
    }
});

const sinTerminar = (v) => v.estado === 'pendiente' && !v.completa;

// La etiqueta que ve el vendedor: "Sin terminar" es una pendiente incompleta (todavía no la revisa nadie)
function etiqueta(v) {
    if (v.estado === 'pendiente' && !v.completa) return ['Sin terminar', 'etiqueta etiqueta--borde'];
    if (v.estado === 'pendiente') return ['En revisión', 'etiqueta etiqueta--borde'];
    if (v.estado === 'disponible') return ['Publicada', 'etiqueta etiqueta--oscura'];
    if (v.estado === 'rechazado') return ['Rechazada', 'etiqueta etiqueta--borde'];
    return [formato.estado(v.estado), 'etiqueta etiqueta--oscura'];
}

function foto(v) {
    const titulo = formato.titulo(v);
    if (!v.foto) return el('div', { class: 'publicacion__foto sin-foto', role: 'img', 'aria-label': `${titulo}, sin foto` });
    return el('img', { class: 'publicacion__foto', src: API_URL + v.foto, alt: titulo, loading: 'lazy' });
}

// Lo que dice debajo del título según el estado
function explicacion(v) {
    if (v.estado === 'pendiente' && !v.completa) return `Te falta: ${v.faltan.join(', ')}. Cuando esté completa la revisamos.`;
    if (v.estado === 'pendiente') return 'Está completa: la está revisando un moderador.';
    if (v.estado === 'rechazado') return `Motivo del rechazo: ${v.motivo_rechazo || 'sin motivo'}. Corregila y vuelve a revisión.`;
    return `Publicada el ${formato.fecha(v.creado)}.`;
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
        items.push(boton('Marcar vendida', async (b) => {
            b.disabled = true;
            try {
                await api.marcarVendida(v.id);
                avisar(`${formato.titulo(v)} quedó como vendida.`);
                await cargar();
            } catch (error) {
                avisar(error.message);
                b.disabled = false;
            }
        }));
    }
    items.push(boton('Eliminar', () => pedirConfirmacion(v)));
    return el('ul', { class: 'acciones-fila', role: 'list' }, ...items.map((a) => el('li', {}, a)));
}

function fila(v) {
    const [textoEtiqueta, claseEtiqueta] = etiqueta(v);
    const datos = [
        v.precio === null ? null : formato.precio(v.precio),
        v.kilometraje === null ? null : formato.km(v.kilometraje),
        v.acepta_canje ? 'Acepta canje' : null,
    ].filter(Boolean).join(' · ');
    return el('li', { class: 'publicacion' },
        foto(v),
        el('div', { class: 'publicacion__titulo' },
            el('strong', {}, formato.titulo(v)), ' ',
            el('span', { class: claseEtiqueta }, textoEtiqueta)),
        el('div', {},
            datos ? el('p', { class: 'fila__meta' }, datos) : null,
            el('p', { class: 'fila__meta' }, explicacion(v)),
            sinTerminar(v) ? el('a', { class: 'boton boton--chico', href: ruta(`publicar.html?id=${v.id}`) }, 'Continuar') : null,
            acciones(v)));
}

// Primero las que necesitan algo del vendedor (sin terminar y rechazadas), después el resto
function orden(v) {
    if (v.estado === 'pendiente' && !v.completa) return 0;
    if (v.estado === 'rechazado') return 1;
    if (v.estado === 'pendiente') return 2;
    if (v.estado === 'disponible') return 3;
    return 4;
}

async function cargar() {
    estado.replaceChildren(vistas.cargando());
    try {
        const { items } = await api.listar();
        items.sort((a, b) => orden(a) - orden(b));
        lista.replaceChildren(...items.map(fila));
        const vacio = vistas.aviso('Todavía no publicaste nada.', 'Con marca, modelo y año ya la podés empezar.',
            el('a', { class: 'boton', href: ruta('publicar.html') }, 'Publicar vehículo'));
        estado.replaceChildren(items.length ? '' : vacio);
    } catch (error) {
        if (error.status === 401) {
            sesion.requerirLogin();
            return;
        }
        estado.replaceChildren(vistas.avisoDeError(error));
    }
}

if (sesion.requerirLogin()) cargar();
