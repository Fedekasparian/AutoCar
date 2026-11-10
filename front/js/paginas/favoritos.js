// Favoritos (favoritos.html) con GET /api/favoritos: las mismas fichas que el catálogo, el último guardado primero.
import * as favoritos from '../api/favoritos.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { ruta } from '../servicios/rutas.js';

const estado = document.getElementById('estado');
const grilla = document.getElementById('favoritos');

async function cargar() {
    estado.replaceChildren(vistas.cargando());
    try {
        const { items } = await favoritos.listar();
        estado.replaceChildren();
        if (!items.length) {
            estado.replaceChildren(vistas.aviso('Todavía no guardaste vehículos.',
                'Abrí una publicación y tocá "Guardar en favoritos".',
                vistas.el('a', { class: 'boton boton--secundario', href: ruta('home.html') }, 'Explorar autos')));
            return;
        }
        grilla.replaceChildren(...items.map(vistas.fichaVehiculo));
    } catch (error) {
        if (error.status === 401) {
            sesion.requerirLogin();
            return;
        }
        estado.replaceChildren(vistas.avisoDeError(error));
    }
}

if (sesion.requerirLogin()) cargar();
