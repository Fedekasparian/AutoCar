// Favoritos (favoritos.html) con GET /api/favoritos: las mismas fichas que el catálogo, el último guardado primero.
import * as favoritos from '../api/favoritos.js';
import * as corazones from '../servicios/corazones.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { ruta } from '../servicios/rutas.js';

const estado = document.getElementById('estado');
const grilla = document.getElementById('favoritos');

function vacio() {
    estado.replaceChildren(vistas.aviso('Todavía no guardaste vehículos.',
        'Tocá el corazón de una publicación para guardarla acá.',
        vistas.el('a', { class: 'boton boton--secundario', href: ruta('home.html') }, 'Explorar autos')));
}

// Al sacar un favorito desde acá, la ficha se va de la lista
function sacarFicha(li) {
    li.classList.add('ficha--saliendo');
    const quitar = () => {
        li.remove();
        if (!grilla.children.length) vacio();
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) quitar();
    else li.addEventListener('animationend', quitar, { once: true });
}

async function cargar() {
    estado.replaceChildren(vistas.cargando());
    try {
        const { items } = await favoritos.listar();
        estado.replaceChildren();
        if (!items.length) {
            vacio();
            return;
        }
        grilla.replaceChildren(...items.map(vistas.fichaVehiculo));
        corazones.poner(grilla, items, { guardados: new Set(items.map((v) => String(v.id))), alSacar: sacarFicha });
    } catch (error) {
        if (error.status === 401) {
            sesion.requerirLogin();
            return;
        }
        estado.replaceChildren(vistas.avisoDeError(error));
    }
}

if (sesion.requerirLogin()) cargar();
