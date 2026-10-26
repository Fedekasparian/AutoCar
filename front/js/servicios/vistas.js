// Piezas de HTML que se arman con los datos de la API. Todo se crea con el DOM (textContent),
// así nada de lo que viene del servidor se interpreta como HTML.
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
    if (!v.imagen_url) return el('div', { class: clase, role: 'img', 'aria-label': `${titulo}, sin foto` });
    const img = el('img', { class: clase, src: v.imagen_url, alt: titulo, loading: 'lazy' });
    // Si la URL no carga, queda el fondo gris en lugar de la imagen rota.
    img.addEventListener('error', () => img.replaceWith(
        el('div', { class: clase, role: 'img', 'aria-label': `${titulo}, sin foto` })));
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
                    `${formato.km(v.kilometraje)} · ${formato.combustible(v.combustible)}`))));
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

export const cargando = () => aviso('Cargando…', 'Si el servidor estaba dormido puede tardar hasta un minuto.');

export function avisoDeError(error) {
    const reintentar = el('button', { class: 'boton boton--secundario', type: 'button' }, 'Reintentar');
    reintentar.addEventListener('click', () => window.location.reload());
    return aviso('No se pudo cargar.', error.message, reintentar);
}
