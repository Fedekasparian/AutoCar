// Listado de vehículos con filtros (home.html y buscar.html).
// Los filtros viajan en la URL (formularios GET), así que se puede recargar, compartir o volver atrás.
import * as vehiculos from '../api/vehiculos.js';
import * as vistas from '../servicios/vistas.js';

const FILTROS = ['q', 'marca', 'combustible', 'precio_max', 'page'];

const params = new URLSearchParams(window.location.search);
const filtros = Object.fromEntries(FILTROS.map((f) => [f, params.get(f) || '']));

const grilla = document.getElementById('resultados');
const total = document.getElementById('resultados-total');
const lugarPaginacion = document.getElementById('paginacion');

// Los formularios muestran los filtros que están aplicados.
function completarFormularios() {
    document.querySelectorAll('form[method="get"]').forEach((formulario) => {
        FILTROS.forEach((f) => {
            const control = formulario.elements[f];
            if (control && filtros[f]) control.value = filtros[f];
        });
    });
}

async function cargarMarcas() {
    const selects = document.querySelectorAll('select[name="marca"]');
    if (!selects.length) return;
    try {
        const { marcas } = await vehiculos.marcas();
        selects.forEach((select) => {
            select.append(...marcas.map((m) => vistas.el('option', { value: m }, m)));
            select.value = filtros.marca;
        });
    } catch {
        // Sin marcas el filtro queda en "Marca" y el listado funciona igual.
    }
}

function textoTotal(cantidad) {
    const base = cantidad === 1 ? '1 publicación' : `${cantidad} publicaciones`;
    return filtros.q ? `${base} para "${filtros.q}"` : base;
}

async function cargarListado() {
    grilla.replaceChildren();
    grilla.after(vistas.cargando());
    const estado = grilla.nextElementSibling;
    try {
        const r = await vehiculos.listar(filtros);
        estado.remove();
        total.textContent = textoTotal(r.total);
        if (!r.items.length) {
            grilla.after(vistas.aviso('No hay publicaciones con estos filtros.',
                'Probá con menos filtros o buscá por marca y modelo.'));
            return;
        }
        grilla.replaceChildren(...r.items.map(vistas.fichaVehiculo));
        lugarPaginacion.replaceWith(Object.assign(vistas.paginacion(r.pagina, r.paginas), { id: 'paginacion' }));
    } catch (error) {
        estado.replaceWith(vistas.avisoDeError(error));
        total.textContent = '';
    }
}

completarFormularios();
cargarMarcas();
cargarListado();
