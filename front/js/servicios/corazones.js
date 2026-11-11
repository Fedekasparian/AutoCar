// Corazón de favorito sobre cada ficha de una grilla (catálogo, portada y favoritos).
// La ficha es un enlace, y un botón no puede ir adentro de un enlace: el corazón va al lado, en el mismo <li>,
// y el CSS lo ubica arriba a la derecha de la foto.
// Sin sesión, tocarlo lleva al login y vuelve. Las cuentas del equipo y los talleres no guardan favoritos: no se muestra.
import * as favoritos from '../api/favoritos.js';
import * as formato from './formato.js';
import * as sesion from './sesion.js';
import { el } from './vistas.js';

const NS = 'http://www.w3.org/2000/svg';

function icono() {
    const svg = document.createElementNS(NS, 'svg');
    Object.entries({ width: 20, height: 20, viewBox: '0 0 24 24', 'aria-hidden': 'true' })
        .forEach(([k, v]) => svg.setAttribute(k, v));
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', 'M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 4 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.8 1.1-1.7 2.7-2.8 4.7-2.8 3.3 0 5.7 3.1 4.5 6.6-1.7 4.8-9.2 9.4-9.2 9.4z');
    svg.append(path);
    return svg;
}

// Un solo aviso flotante para toda la página (por ejemplo, "es tu publicación")
let aviso;
function avisar(texto) {
    if (!aviso) {
        aviso = el('p', { class: 'aviso-flotante', role: 'status' });
        document.body.append(aviso);
    }
    aviso.textContent = texto;
    aviso.classList.remove('aviso-flotante--visible');
    void aviso.offsetWidth; // reinicia la animación si llega otro aviso seguido
    aviso.classList.add('aviso-flotante--visible');
    clearTimeout(avisar.temporizador);
    avisar.temporizador = setTimeout(() => aviso.classList.remove('aviso-flotante--visible'), 3200);
}

function pintar(boton, v, guardado) {
    boton.setAttribute('aria-pressed', String(guardado));
    boton.setAttribute('aria-label', guardado
        ? `Sacar ${formato.titulo(v)} de favoritos`
        : `Guardar ${formato.titulo(v)} en favoritos`);
}

function corazon(v, guardado, alSacar) {
    const boton = el('button', { class: 'ficha-favorito', type: 'button' }, icono());
    pintar(boton, v, guardado);
    boton.addEventListener('click', async () => {
        if (!sesion.requerirLogin()) return;
        const antes = boton.getAttribute('aria-pressed') === 'true';
        // Se pinta enseguida y se vuelve atrás si el servidor dice que no
        pintar(boton, v, !antes);
        boton.classList.remove('ficha-favorito--late');
        if (!antes) requestAnimationFrame(() => boton.classList.add('ficha-favorito--late'));
        boton.disabled = true;
        try {
            if (antes) await favoritos.sacar(v.id);
            else await favoritos.agregar(v.id);
            avisar(antes ? 'Se sacó de favoritos.' : 'Guardado en favoritos.');
            if (antes) alSacar?.(boton.closest('li'));
        } catch (error) {
            pintar(boton, v, antes); // 409: es una publicación propia
            avisar(error.message);
        }
        boton.disabled = false;
    });
    return boton;
}

// lista: el <ul> ya armado con vistas.fichaVehiculo; items: los vehículos en el mismo orden.
// guardados: los ids ya guardados si se conocen (en favoritos.html, todos); si no, se piden.
export async function poner(lista, items, { guardados, alSacar } = {}) {
    if (!sesion.compraYVende() || !items.length) return;
    let ids = guardados;
    if (!ids) {
        ids = new Set();
        if (sesion.iniciada()) {
            try {
                ids = new Set((await favoritos.listar()).items.map((f) => String(f.id)));
            } catch {
                // Si no se pudo saber, todos quedan vacíos: tocarlo guarda igual
            }
        }
    }
    Array.from(lista.children).forEach((li, i) => {
        if (items[i]) li.append(corazon(items[i], ids.has(String(items[i].id)), alSacar));
    });
}
