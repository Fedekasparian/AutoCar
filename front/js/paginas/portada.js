// Portada (index.html):
// - los últimos 4 publicados de verdad, con GET /api/vehiculos (los más nuevos primero);
// - las cifras reales (publicaciones, mecánicos de la red e inspecciones firmadas) con un contador animado;
// - las secciones que aparecen al bajar y los íconos de "Cómo funciona" que se dibujan.
import * as vehiculos from '../api/vehiculos.js';
import * as inspecciones from '../api/inspecciones.js';
import * as corazones from '../servicios/corazones.js';
import * as vistas from '../servicios/vistas.js';

const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Animaciones al bajar: solo con IntersectionObserver; sin él (o sin JS) todo queda visible
if ('IntersectionObserver' in window && !sinMovimiento) {
    document.documentElement.classList.add('js-anima');
    const observador = new IntersectionObserver((entradas) => {
        for (const entrada of entradas) {
            if (!entrada.isIntersecting) continue;
            entrada.target.classList.add('visible');
            observador.unobserve(entrada.target);
        }
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('[data-revelar]').forEach((el) => observador.observe(el));
}

const numero = new Intl.NumberFormat('es-AR');

// Cuenta de 0 al valor final en ~1,2 s, desacelerando al final
function contar(el, valor) {
    if (sinMovimiento || valor === 0) { el.textContent = numero.format(valor); return; }
    const inicio = performance.now();
    const duracion = 1200;
    const paso = (ahora) => {
        const t = Math.min(1, (ahora - inicio) / duracion);
        el.textContent = numero.format(Math.round(valor * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
}

async function mostrarUltimos() {
    const grilla = document.getElementById('ultimos');
    try {
        const { items, total } = await vehiculos.listar({});
        if (items.length) {
            grilla.replaceChildren(...items.slice(0, 4).map(vistas.fichaVehiculo));
            corazones.poner(grilla, items.slice(0, 4));
        }
        else grilla.closest('section').hidden = true;
        return total ?? items.length;
    } catch {
        grilla.closest('section').hidden = true; // sin API, la portada se ve igual sin esta sección
        return null;
    }
}

async function mostrarCifras(publicaciones) {
    const seccion = document.getElementById('cifras');
    let mecanicos;
    try {
        ({ items: mecanicos } = await inspecciones.mecanicos());
    } catch {
        return; // sin datos no se muestra la franja
    }
    if (publicaciones === null || !mecanicos) return;
    const valores = {
        publicaciones,
        mecanicos: mecanicos.length,
        firmadas: mecanicos.reduce((suma, m) => suma + (m.firmadas ?? 0), 0),
    };
    seccion.hidden = false;
    seccion.querySelectorAll('[data-cifra]').forEach((el) => contar(el, valores[el.dataset.cifra] ?? 0));
}

mostrarCifras(await mostrarUltimos());
