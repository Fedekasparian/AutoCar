// Detalle de un vehículo (vehiculo.html?id=N) con GET /api/vehiculos/{id}.
import * as vehiculos from '../api/vehiculos.js';
import * as chat from '../api/chat.js';
import * as favoritos from '../api/favoritos.js';
import { API_URL } from '../api/config.js';
import * as formato from '../servicios/formato.js';
import * as galeria from '../servicios/galeria.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';

import { ruta } from '../servicios/rutas.js';
import { boton } from '../servicios/acciones.js';

const id = new URLSearchParams(window.location.search).get('id');
const estado = document.getElementById('estado');
const $ = (idElemento) => document.getElementById(idElemento);
const { el } = vistas;

function mostrar(v) {
    const titulo = formato.titulo(v);
    document.title = `${titulo} - AutoCar`;

    // Todas las fotos subidas (la primera es la de portada); sin fotos, el recuadro gris de siempre
    const fotos = (v.fotos?.length ? v.fotos : [v.foto]).filter(Boolean).map((f) => API_URL + f);
    if (fotos.length) galeria.armar($('vehiculo'), $('vehiculo-foto'), fotos, titulo);
    else $('vehiculo-foto').append(vistas.imagenVehiculo(v, 'galeria__imagen'));
    $('vehiculo-foto-texto').textContent = `Foto del ${titulo}`;

    $('vehiculo-titulo').textContent = titulo;
    $('vehiculo-precio').textContent = formato.precio(v.precio);
    $('vehiculo-resumen').textContent = `${formato.km(v.kilometraje)} · ${formato.combustible(v.combustible)}`;
    $('vehiculo-vendido').hidden = v.estado !== 'vendido';

    $('dato-marca').textContent = v.marca;
    $('dato-modelo').textContent = v.modelo;
    $('dato-anio').textContent = v.anio;
    $('dato-kilometraje').textContent = formato.km(v.kilometraje);
    $('dato-combustible').textContent = formato.combustible(v.combustible);
    $('dato-transmision').textContent = formato.transmision(v.transmision);
    $('dato-estado').textContent = formato.estado(v.estado);
    // Datos que puede no tener (una publicación vieja o el auto sin versión): si faltan, no se muestra el renglón
    [['version', v.version], ['condicion', v.condicion && formato.condicion(v.condicion)], ['localidad', v.localidad]]
        .filter(([, valor]) => valor)
        .forEach(([dato, valor]) => {
            $(`dato-${dato}`).textContent = valor;
            $(`dato-${dato}-fila`).hidden = false;
        });

    if (v.vendedor) {
        $('vendedor-foto').replaceWith(vistas.avatar(v.vendedor));
        $('vendedor-nombre').textContent = v.vendedor.nombre;
        $('vendedor-desde').textContent = `En AutoCar desde ${formato.fecha(v.vendedor.desde)}`;
        $('vehiculo-vendedor').hidden = false;
    }

    if (v.descripcion) {
        $('vehiculo-descripcion-texto').textContent = v.descripcion;
        $('vehiculo-descripcion').hidden = false;
    }
    // "Mandale un mecánico": el link de esta publicación ya lleva el id, el back completa los datos del auto
    if (v.estado === 'disponible' && sesion.compraYVende()) {
        const aviso = ruta(`vehiculo.html?id=${v.id}`);
        $('vehiculo-mecanico').href = ruta(`pedir-inspeccion.html?url=${encodeURIComponent(aviso)}`);
        $('vehiculo-mecanico').hidden = false;
        $('vehiculo-mecanico-ayuda').hidden = false;
    }
    if (v.estado === 'disponible' && sesion.compraYVende()) {
        // "Consultar" va primero entre las acciones; abajo, el lugar para el motivo si no se puede
        const acciones = document.querySelector('.detalle__acciones');
        acciones.prepend(botonConsultar);
        acciones.after(avisoConsultar);
        $('vehiculo-canje').hidden = false;
        mostrarFavorito();
        barraDeAccion(v);
    }
    if (v.estado === 'disponible') mostrarComparacion(v.id);

    $('vehiculo-reportar').href = ruta(`reportar.html?vehiculo=${v.id}`);
    $('vehiculo').hidden = false;
    $('vehiculo-info').hidden = false;
}

async function cargar() {
    if (!/^\d+$/.test(id || '')) {
        estado.replaceChildren(vistas.aviso('No encontramos ese vehículo.', null,
            vistas.el('a', { class: 'boton boton--secundario', href: ruta('home.html') }, 'Ver publicaciones')));
        return;
    }
    estado.replaceChildren(vistas.cargando());
    try {
        const { vehiculo } = await vehiculos.detalle(id);
        estado.replaceChildren();
        mostrar(vehiculo);
    } catch (error) {
        estado.replaceChildren(error.status === 404
            ? vistas.aviso('No encontramos ese vehículo.', 'Puede que se haya dado de baja.',
                vistas.el('a', { class: 'boton boton--secundario', href: ruta('home.html') }, 'Ver publicaciones'))
            : vistas.avisoDeError(error));
    }
}

// "Consultar": abre (o retoma) la conversación con el vendedor. Sin sesión, pasa por el login y vuelve acá.
// El botón y su aviso los crea el JS (no están en vehiculo.html); mostrar() los pone en la ficha.
async function consultar() {
    if (!sesion.requerirLogin()) return;
    avisoConsultar.hidden = true;
    botonConsultar.disabled = true;
    try {
        const { conversacion } = await chat.abrir(id);
        window.location.assign(ruta(`conversacion.html?id=${conversacion.id}`));
    } catch (error) {
        // 409: es una publicación propia o no tiene vendedor; el back manda el motivo
        avisoConsultar.textContent = error.message;
        avisoConsultar.hidden = false;
        botonConsultar.disabled = false;
    }
}
const botonConsultar = boton('Consultar', consultar, 'boton', 'vehiculo-consultar');
const avisoConsultar = el('p', { class: 'campo__ayuda', id: 'vehiculo-consultar-aviso', role: 'status', hidden: true });

// ---------- Comparador: si el precio está bien frente a autos parecidos de otros sitios ----------

const ETIQUETAS = { buen_precio: 'Buen precio', en_precio: 'En precio', caro: 'Caro' };
async function mostrarComparacion(vehiculoId) {
    try {
        const { comparacion } = await vehiculos.comparacion(vehiculoId);
        if (!ETIQUETAS[comparacion.etiqueta]) return; // sin_datos: con pocos autos parecidos no se muestra nada
        $('comparacion-etiqueta').textContent = ETIQUETAS[comparacion.etiqueta];
        $('comparacion-texto').textContent = comparacion.texto;
        $('comparacion-etiqueta').classList.add(`etiqueta--${comparacion.etiqueta}`);
        if (comparacion.mercado) rango(comparacion);
        $('vehiculo-comparacion').hidden = false;
    } catch {
        // Si el comparador no responde, la ficha sigue igual
    }
}

// Barra de precios del mercado: de la más barata a la más cara, la franja de los precios típicos
// (del 25 % al 75 %), una marca en el precio típico y otra en el de este auto.
function rango(c) {
    const { minimo, maximo, p25, p75, mediana } = c.mercado;
    const desde = Math.min(minimo, c.precio);
    const hasta = Math.max(maximo, c.precio);
    if (!(hasta > desde)) return;
    const pos = (valor) => `${(((valor - desde) / (hasta - desde)) * 100).toFixed(1)}%`;
    const pista = el('div', { class: 'rango__pista', 'aria-hidden': 'true' },
        el('span', { class: 'rango__franja' }),
        el('span', { class: 'rango__tipico' }),
        el('span', { class: `rango__este rango__este--${c.etiqueta}` }, el('span', { class: 'rango__globo' }, 'Este auto')));
    // Cerca de los bordes, el cartel "Este auto" se alinea hacia adentro para no salirse de la tarjeta
    const lugar = (c.precio - desde) / (hasta - desde);
    if (lugar < 0.12) pista.classList.add('rango__pista--este-inicio');
    if (lugar > 0.88) pista.classList.add('rango__pista--este-fin');
    pista.style.setProperty('--desde', pos(p25));
    pista.style.setProperty('--hasta', pos(p75));
    pista.style.setProperty('--tipico', pos(mediana));
    pista.style.setProperty('--este', pos(c.precio));
    $('comparacion-rango').replaceChildren(
        pista,
        el('p', { class: 'rango__escala' },
            el('span', {}, formato.precio(desde)),
            el('span', {}, `Típico ${formato.precio(mediana)}`),
            el('span', {}, formato.precio(hasta))),
        c.ahorro > 0 ? el('p', { class: 'rango__ahorro' }, `${formato.precio(c.ahorro)} menos que el precio típico`) : null);
    $('comparacion-rango').hidden = false;
}

// Celular: cuando los botones de la ficha quedan fuera de la pantalla, aparece abajo una barra con el precio
// y "Consultar" (toca el mismo botón de la ficha). En escritorio no se muestra: la columna ya está a la vista.
function barraDeAccion(v) {
    if (!('IntersectionObserver' in window)) return;
    const consultarAbajo = boton('Consultar', consultar, 'boton boton--acento');
    consultarAbajo.tabIndex = -1;
    const barra = el('div', { class: 'barra-accion', 'aria-hidden': 'true' },
        el('p', { class: 'barra-accion__texto' }, el('strong', {}, formato.precio(v.precio)), el('span', {}, formato.titulo(v))),
        consultarAbajo);
    document.body.append(barra);
    // Aparece solo cuando los botones de verdad quedaron más abajo (todavía no se llegó a ellos)
    new IntersectionObserver(([entrada]) => {
        const visible = !entrada.isIntersecting && entrada.boundingClientRect.top > 0;
        barra.classList.toggle('barra-accion--visible', visible);
        barra.setAttribute('aria-hidden', String(!visible));
        consultarAbajo.tabIndex = visible ? 0 : -1;
    }).observe(botonConsultar.closest('.detalle__acciones'));
}

// ---------- Favorito: guardar o sacar. Sin sesión, pasa por el login y vuelve acá ----------

// El botón y su aviso los crea el JS (no están en vehiculo.html); mostrarFavorito() los pone debajo del precio.
const botonFavorito = boton('Guardar en favoritos', guardarOSacar, 'boton boton--secundario', 'vehiculo-favorito');
botonFavorito.setAttribute('aria-pressed', 'false');
const avisoFavorito = el('p', { class: 'campo__ayuda', id: 'vehiculo-favorito-aviso', role: 'status', hidden: true });

function pintarFavorito(guardado) {
    botonFavorito.setAttribute('aria-pressed', String(guardado));
    botonFavorito.textContent = guardado ? 'Guardado en favoritos' : 'Guardar en favoritos';
}

async function mostrarFavorito() {
    $('vehiculo-vendido').after(botonFavorito, avisoFavorito);
    if (!sesion.iniciada()) return;
    try {
        const { items } = await favoritos.listar();
        pintarFavorito(items.some((f) => String(f.id) === id));
    } catch {
        // Si no se pudo saber, el botón queda en "Guardar": al tocarlo se guarda igual
    }
}

async function guardarOSacar() {
    if (!sesion.requerirLogin()) return;
    const guardado = botonFavorito.getAttribute('aria-pressed') === 'true';
    avisoFavorito.hidden = true;
    botonFavorito.disabled = true;
    try {
        if (guardado) await favoritos.sacar(id);
        else await favoritos.agregar(id);
        pintarFavorito(!guardado);
    } catch (error) {
        // 409: es una publicación propia
        avisoFavorito.textContent = error.message;
        avisoFavorito.hidden = false;
    }
    botonFavorito.disabled = false;
}

cargar();
