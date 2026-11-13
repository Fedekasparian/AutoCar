// Galería de fotos del detalle: foto grande con flechas y contador, miniaturas abajo y un visor a pantalla completa
// (un <dialog>: Esc lo cierra y el foco queda adentro). Se cambia de foto con las flechas, el teclado o deslizando.
import { el } from './vistas.js';

const NS = 'http://www.w3.org/2000/svg';
const sinMovimiento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function icono(d) {
    const svg = document.createElementNS(NS, 'svg');
    Object.entries({ width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
        'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' })
        .forEach(([k, v]) => svg.setAttribute(k, v));
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
    return svg;
}
const ANTERIOR = 'M15 5l-7 7 7 7';
const SIGUIENTE = 'M9 5l7 7-7 7';
const AMPLIAR = 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5';
const CERRAR = 'M6 6l12 12M18 6 6 18';

// Deslizar con el dedo (o arrastrar con el mouse): más de 50 px hacia un lado cambia de foto
let ultimoDeslizamiento = 0; // el click que llega después de deslizar no abre el visor
function alDeslizar(nodo, mover) {
    let x0 = null;
    nodo.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
    nodo.addEventListener('pointerup', (e) => {
        if (x0 === null) return;
        const dx = e.clientX - x0;
        x0 = null;
        if (Math.abs(dx) > 50) {
            ultimoDeslizamiento = Date.now();
            mover(dx < 0 ? 1 : -1);
        }
    });
    nodo.addEventListener('pointercancel', () => { x0 = null; });
}

// Cambia la src con un fundido corto
function cambiar(img, src, alt) {
    img.alt = alt;
    if (sinMovimiento()) { img.src = src; return; }
    img.classList.add('galeria__imagen--cambiando');
    setTimeout(() => {
        img.src = src;
        const mostrar = () => img.classList.remove('galeria__imagen--cambiando');
        if (img.complete) mostrar(); else img.addEventListener('load', mostrar, { once: true });
    }, 120);
}

// figura: el <figure class="galeria">; principal: su .galeria__principal (vacío); fotos: URLs ya completas.
export function armar(figura, principal, fotos, titulo) {
    let actual = 0;
    const alt = (i) => `${titulo}, foto ${i + 1} de ${fotos.length}`;
    const img = el('img', { class: 'galeria__imagen', src: fotos[0], alt: alt(0), fetchpriority: 'high', draggable: 'false' });
    const contador = el('span', { class: 'galeria__contador', 'aria-hidden': 'true' });
    const ampliar = el('button', { class: 'galeria__boton galeria__boton--ampliar', type: 'button', 'aria-label': 'Ver las fotos en pantalla completa' }, icono(AMPLIAR));
    principal.append(img, ampliar);

    const miniaturas = fotos.length < 2 ? null : el('ul', { class: 'galeria__miniaturas', role: 'list' },
        ...fotos.map((src, i) => {
            const boton = el('button', { class: 'galeria__miniatura', type: 'button', 'aria-label': `Ver la foto ${i + 1}` },
                el('img', { src, alt: '', loading: 'lazy', draggable: 'false' }));
            boton.addEventListener('click', () => ir(i));
            return el('li', {}, boton);
        }));

    // Visor a pantalla completa
    const imgVisor = el('img', { class: 'visor__imagen', src: fotos[0], alt: alt(0), draggable: 'false' });
    const contadorVisor = el('p', { class: 'visor__contador', 'aria-live': 'polite' });
    const cerrar = el('button', { class: 'visor__boton visor__cerrar', type: 'button', 'aria-label': 'Cerrar' }, icono(CERRAR));
    const visor = el('dialog', { class: 'visor', 'aria-label': `Fotos de ${titulo}` }, imgVisor, contadorVisor, cerrar);
    cerrar.addEventListener('click', () => visor.close());
    visor.addEventListener('click', (e) => { if (e.target === visor) visor.close(); }); // tocar el fondo cierra
    visor.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') ir(actual + 1);
        if (e.key === 'ArrowLeft') ir(actual - 1);
    });
    alDeslizar(imgVisor, (paso) => ir(actual + paso));
    document.body.append(visor);

    const abrir = () => { visor.showModal(); cerrar.focus(); };
    ampliar.addEventListener('click', abrir);
    img.addEventListener('click', () => { if (Date.now() - ultimoDeslizamiento > 300) abrir(); });

    if (fotos.length > 1) {
        const flechas = (clase, contenedor) => [[-1, ANTERIOR, 'Foto anterior'], [1, SIGUIENTE, 'Foto siguiente']].map(([paso, d, texto]) => {
            const b = el('button', { class: `${clase} ${clase}--${paso < 0 ? 'anterior' : 'siguiente'}`, type: 'button', 'aria-label': texto }, icono(d));
            b.addEventListener('click', (e) => { e.stopPropagation(); ir(actual + paso); });
            contenedor.append(b);
            return b;
        });
        flechas('galeria__boton galeria__flecha', principal);
        flechas('visor__boton visor__flecha', visor);
        principal.append(contador);
        alDeslizar(img, (paso) => ir(actual + paso));
        figura.append(miniaturas);
    }

    function ir(i) {
        actual = (i + fotos.length) % fotos.length; // da la vuelta
        cambiar(img, fotos[actual], alt(actual));
        imgVisor.src = fotos[actual];
        imgVisor.alt = alt(actual);
        contador.textContent = `${actual + 1} / ${fotos.length}`;
        contadorVisor.textContent = `${actual + 1} / ${fotos.length}`;
        miniaturas?.querySelectorAll('.galeria__miniatura').forEach((b, n) => {
            if (n === actual) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
        });
        // Solo corre la tira de miniaturas, sin mover la página
        const li = miniaturas?.children[actual];
        if (li) miniaturas.scrollTo({ left: li.offsetLeft - (miniaturas.clientWidth - li.clientWidth) / 2, behavior: sinMovimiento() ? 'auto' : 'smooth' });
    }
    contador.textContent = `1 / ${fotos.length}`;
    contadorVisor.textContent = `1 / ${fotos.length}`;
    miniaturas?.querySelector('.galeria__miniatura')?.setAttribute('aria-current', 'true');
}
