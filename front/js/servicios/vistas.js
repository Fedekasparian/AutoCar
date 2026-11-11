// Piezas de HTML que se arman con los datos de la API. Todo se crea con el DOM (textContent),
// así nada de lo que viene del servidor se interpreta como HTML.
import { API_URL } from '../api/config.js';
import * as formato from './formato.js';

import { ruta } from './rutas.js';

// Crea un elemento: el('span', {class: 'x'}, 'texto', otroNodo)
export function el(etiqueta, atributos = {}, ...hijos) {
    const nodo = document.createElement(etiqueta);
    Object.entries(atributos).forEach(([nombre, valor]) => {
        if (valor === false || valor === null || valor === undefined) return;
        nodo.setAttribute(nombre, valor === true ? '' : valor);
    });
    nodo.append(...hijos.filter((h) => h !== null && h !== undefined && h !== false));
    return nodo;
}

// Foto del vehículo o el recuadro gris de "sin foto" del maquetado.
export function imagenVehiculo(v, clase) {
    const titulo = formato.titulo(v);
    // La foto subida (v.foto, ruta de la API); imagen_url queda para datos viejos que la tengan
    const src = v.foto ? API_URL + v.foto : v.imagen_url;
    if (!src) return el('div', { class: clase, role: 'img', 'aria-label': `${titulo}, sin foto` });
    const img = el('img', { class: clase, src, alt: titulo, loading: 'lazy' });
    // Si la URL no carga, queda el fondo gris en lugar de la imagen rota.
    img.addEventListener('error', () => img.replaceWith(
        el('div', { class: clase, role: 'img', 'aria-label': `${titulo}, sin foto` })));
    return img;
}

// Foto de perfil de una persona ({nombre, foto}); sin foto (o si no carga), un círculo con su inicial.
export function avatar(persona, clase = '') {
    const inicial = () => el('span', { class: `avatar ${clase}`, 'aria-hidden': 'true' },
        (persona.nombre || '?').trim().charAt(0).toUpperCase());
    if (!persona.foto) return inicial();
    const img = el('img', { class: `avatar ${clase}`, src: API_URL + persona.foto, alt: `Foto de ${persona.nombre}` });
    img.addEventListener('error', () => img.replaceWith(inicial()));
    return img;
}

// Ficha de la grilla de publicaciones (home y buscar). Mismo HTML que el maquetado.
export function fichaVehiculo(v) {
    return el('li', {},
        el('a', { class: 'ficha-vehiculo', href: ruta(`vehiculo.html?id=${v.id}`) },
            imagenVehiculo(v, 'ficha-vehiculo__imagen'),
            v.estado === 'vendido'
                ? el('span', { class: 'etiqueta etiqueta--oscura ficha-vehiculo__etiqueta' }, 'Vendido')
                : null,
            el('div', { class: 'ficha-vehiculo__cuerpo' },
                el('span', { class: 'ficha-vehiculo__precio' }, formato.precio(v.precio)),
                el('span', { class: 'ficha-vehiculo__titulo' }, formato.titulo(v)),
                el('span', { class: 'ficha-vehiculo__lugar' },
                    `${formato.km(v.kilometraje)} · ${formato.combustible(v.combustible)}`),
                v.localidad || v.transmision
                    ? el('span', { class: 'ficha-vehiculo__pie' },
                        el('span', {}, v.localidad || ''),
                        el('span', {}, v.transmision ? formato.transmision(v.transmision) : ''))
                    : null)));
}

// Fichas grises con brillo mientras carga el listado: ocupan el mismo lugar que las de verdad, así la página
// no salta cuando llegan. Son decorativas (aria-hidden); el "Cargando…" para lectores de pantalla va aparte.
export function esqueletoFichas(cantidad = 6) {
    return Array.from({ length: cantidad }, () => el('li', { class: 'ficha-esqueleto', 'aria-hidden': 'true' },
        el('span', { class: 'ficha-esqueleto__imagen' }),
        el('span', { class: 'ficha-esqueleto__linea ficha-esqueleto__linea--precio' }),
        el('span', { class: 'ficha-esqueleto__linea' }),
        el('span', { class: 'ficha-esqueleto__linea ficha-esqueleto__linea--corta' })));
}

// Paginación con enlaces ?page=N que conservan los demás filtros de la URL.
export function paginacion(pagina, paginas) {
    const nav = el('nav', { class: 'paginacion', 'aria-label': 'Páginas de resultados' });
    if (paginas <= 1) return nav;

    const enlace = (n, texto, actual) => {
        const params = new URLSearchParams(window.location.search);
        params.set('page', n);
        return el('a', { href: `?${params}`, 'aria-current': actual ? 'page' : null }, texto);
    };
    const deshabilitado = (texto) => el('span', { 'aria-disabled': 'true' }, texto);

    // Hasta 5 números alrededor de la página actual.
    const desde = Math.max(1, Math.min(pagina - 2, paginas - 4));
    const hasta = Math.min(paginas, desde + 4);
    const items = [pagina > 1 ? enlace(pagina - 1, 'Anterior') : deshabilitado('Anterior')];
    for (let n = desde; n <= hasta; n += 1) items.push(enlace(n, String(n), n === pagina));
    items.push(pagina < paginas ? enlace(pagina + 1, 'Siguiente') : deshabilitado('Siguiente'));

    nav.append(el('ul', {}, ...items.map((item) => el('li', {}, item))));
    return nav;
}

// Mensaje de estado en lugar de un listado: cargando, vacío o error.
export function aviso(titulo, texto, accion) {
    return el('div', { class: 'vacio', role: 'status' },
        el('p', {}, el('strong', {}, titulo)),
        texto ? el('p', {}, texto) : null,
        accion || null);
}

// "Cargando…" y, solo si a los 5 segundos sigue en pantalla, la aclaración del servidor dormido (Render Free se
// duerme sin uso y tarda en despertar). Así una carga normal no muestra un aviso que no corresponde.
const ESPERA_DORMIDO = 5000;
export function cargando() {
    const nodo = aviso('Cargando…');
    setTimeout(() => {
        if (nodo.isConnected) nodo.append(el('p', {}, 'El servidor estaba dormido: puede tardar hasta un minuto en despertar.'));
    }, ESPERA_DORMIDO);
    return nodo;
}

// Aviso flotante abajo de la pantalla ("Guardado en favoritos", "Se aprobó…"). Uno solo por página.
let avisoFlotanteNodo;
let avisoFlotanteTiempo;
export function avisoFlotante(texto) {
    if (!avisoFlotanteNodo) {
        avisoFlotanteNodo = el('p', { class: 'aviso-flotante', role: 'status' });
        document.body.append(avisoFlotanteNodo);
    }
    avisoFlotanteNodo.textContent = texto;
    avisoFlotanteNodo.classList.remove('aviso-flotante--visible');
    void avisoFlotanteNodo.offsetWidth; // reinicia la animación si llega otro aviso seguido
    avisoFlotanteNodo.classList.add('aviso-flotante--visible');
    clearTimeout(avisoFlotanteTiempo);
    avisoFlotanteTiempo = setTimeout(() => avisoFlotanteNodo.classList.remove('aviso-flotante--visible'), 3200);
}

// Cuenta de 0 al valor en ~1 s (desacelerando). formatear convierte el número en el texto a mostrar.
export function contarHasta(nodo, valor, formatear = String) {
    const final = formatear(valor);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !valor) { nodo.textContent = final; return; }
    const inicio = performance.now();
    const paso = (ahora) => {
        const t = Math.min(1, (ahora - inicio) / 1000);
        nodo.textContent = t < 1 ? formatear(Math.round(valor * (1 - (1 - t) ** 3))) : final;
        if (t < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
}

export function avisoDeError(error) {
    const reintentar = el('button', { class: 'boton boton--secundario', type: 'button' }, 'Reintentar');
    reintentar.addEventListener('click', () => window.location.reload());
    return aviso('No se pudo cargar.', error.message, reintentar);
}
