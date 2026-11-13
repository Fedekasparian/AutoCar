// Listado de vehículos con filtros (home.html y buscar.html).
// Los filtros viajan en la URL (formularios GET), así que se puede recargar, compartir o volver atrás.
// Mientras carga se ven fichas grises (esqueletos); arriba del listado, un chip por filtro aplicado para sacarlo.
import * as vehiculos from '../api/vehiculos.js';
import * as corazones from '../servicios/corazones.js';
import * as formato from '../servicios/formato.js';
import * as vistas from '../servicios/vistas.js';

const FILTROS = ['q', 'marca', 'combustible', 'precio_max', 'page'];

const params = new URLSearchParams(window.location.search);
const filtros = Object.fromEntries(FILTROS.map((f) => [f, params.get(f) || '']));

const grilla = document.getElementById('resultados');
const total = document.getElementById('resultados-total');
const lugarPaginacion = document.getElementById('paginacion');
const { el } = vistas;

// Los formularios muestran los filtros que están aplicados.
function completarFormularios() {
    document.querySelectorAll('form[method="get"]').forEach((formulario) => {
        FILTROS.forEach((f) => {
            const control = formulario.elements[f];
            if (control && filtros[f]) control.value = filtros[f];
        });
    });
}

// Filtros rápidos (home.html): se aplican al elegir, sin tocar "Aplicar" (el botón queda para quien no tiene JS)
function aplicarAlElegir() {
    document.querySelectorAll('.filtros-rapidos').forEach((grupo) => {
        const formulario = grupo.form || grupo.closest('form');
        // Se arma la URL sin los campos vacíos (?combustible=nafta en lugar de ?q=&marca=&combustible=nafta)
        grupo.addEventListener('change', () => {
            const datos = new URLSearchParams();
            new FormData(formulario).forEach((valor, nombre) => { if (valor) datos.set(nombre, valor); });
            const query = datos.toString();
            window.location.assign(formulario.getAttribute('action') + (query ? `?${query}` : ''));
        });
        formulario.querySelector('[type="submit"]')?.setAttribute('hidden', '');
    });
}

// Buscar en escritorio: los filtros quedan abiertos en el panel de la izquierda
function abrirPanelEnEscritorio() {
    const panel = document.querySelector('.vista-buscar details.recuadro');
    if (!panel) return;
    const escritorio = matchMedia('(min-width: 1100px)');
    const ajustar = () => { if (escritorio.matches) panel.open = true; };
    ajustar();
    panel.addEventListener('toggle', ajustar); // en escritorio no se cierra
    escritorio.addEventListener?.('change', ajustar);
}

// Un chip por filtro aplicado; la cruz lleva a la misma búsqueda sin ese filtro
function chipsDeFiltros() {
    const textos = {
        q: (v) => `“${v}”`,
        marca: (v) => v,
        combustible: (v) => formato.combustible(v),
        precio_max: (v) => `Hasta ${formato.precio(Number(v))}`,
    };
    const activos = Object.keys(textos).filter((f) => filtros[f]);
    if (!activos.length) return;
    const sin = (...quitar) => {
        const p = new URLSearchParams(window.location.search);
        [...quitar, 'page'].forEach((f) => p.delete(f));
        const query = p.toString();
        return query ? `?${query}` : window.location.pathname;
    };
    const lista = el('ul', { class: 'filtros-activos', role: 'list', 'aria-label': 'Filtros aplicados' },
        ...activos.map((f) => el('li', {},
            el('a', { class: 'chip-filtro', href: sin(f), 'aria-label': `Sacar el filtro ${textos[f](filtros[f])}` },
                el('span', {}, textos[f](filtros[f])), el('span', { class: 'chip-filtro__cruz', 'aria-hidden': 'true' }, '×')))),
        activos.length > 1
            ? el('li', {}, el('a', { class: 'chip-filtro chip-filtro--limpiar', href: sin(...activos) }, 'Limpiar todo'))
            : null);
    total.closest('.resultados__barra').after(lista);
}

async function cargarMarcas() {
    const selects = document.querySelectorAll('select[name="marca"]');
    if (!selects.length) return;
    try {
        const { marcas } = await vehiculos.marcas();
        selects.forEach((select) => {
            select.append(...marcas.map((m) => el('option', { value: m }, m)));
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

// "Cargando…" solo para lectores de pantalla (los esqueletos ya lo muestran); si a los 5 segundos sigue,
// se hace visible con la aclaración del servidor dormido.
function estadoDeCarga() {
    const nodo = vistas.cargando();
    nodo.classList.add('solo-lector');
    setTimeout(() => nodo.classList.remove('solo-lector'), 5000);
    return nodo;
}

async function cargarListado() {
    grilla.setAttribute('aria-busy', 'true');
    grilla.replaceChildren(...vistas.esqueletoFichas(8));
    const estado = estadoDeCarga();
    grilla.after(estado);
    try {
        const r = await vehiculos.listar(filtros);
        estado.remove();
        grilla.removeAttribute('aria-busy');
        total.textContent = textoTotal(r.total);
        if (!r.items.length) {
            grilla.replaceChildren();
            grilla.after(vistas.aviso('No hay publicaciones con estos filtros.',
                'Probá con menos filtros o buscá por marca y modelo.'));
            return;
        }
        // Entran escalonadas: --n es el orden de cada ficha (el CSS calcula la demora)
        const fichas = r.items.map(vistas.fichaVehiculo);
        fichas.forEach((li, i) => li.style.setProperty('--n', String(i)));
        grilla.replaceChildren(...fichas);
        grilla.classList.add('grilla-vehiculos--entra');
        lugarPaginacion.replaceWith(Object.assign(vistas.paginacion(r.pagina, r.paginas), { id: 'paginacion' }));
        corazones.poner(grilla, r.items);
    } catch (error) {
        grilla.replaceChildren();
        grilla.removeAttribute('aria-busy');
        estado.replaceWith(vistas.avisoDeError(error));
        total.textContent = '';
    }
}

completarFormularios();
aplicarAlElegir();
abrirPanelEnEscritorio();
chipsDeFiltros();
cargarMarcas();
cargarListado();
