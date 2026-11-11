// Reporte de una búsqueda guardada (meta-busqueda-resultados.html?id=N) con GET /api/meta-busquedas/{id}:
// precio de referencia, novedades y los autos de todas las fuentes, cada uno con "Mandale un mecánico".
import * as api from '../api/metabusqueda.js';
import * as formato from '../servicios/formato.js';
import * as insp from '../servicios/inspecciones.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { criterios } from '../servicios/metabusqueda.js';
import { ruta } from '../servicios/rutas.js';

const { el } = vistas;
const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const $ = (idElemento) => document.getElementById(idElemento);

// Valores de Comparables::etiqueta() del back (distintos de los del comparador de una publicación)
const ETIQUETAS = { barato: 'Buen precio', normal: 'En precio', caro: 'Caro' };
const dolares = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

function precio(a) {
    if (a.precio === null) return 'Sin precio';
    return a.moneda === 'USD' ? `US$ ${dolares.format(a.precio)}` : formato.precio(a.precio);
}

// "Mandale un mecánico" con el link del aviso fijo; los de AutoCar se abren en su publicación
function acciones(a) {
    if (a.fuente === 'autocar') {
        return [el('a', { class: 'boton boton--chico', href: ruta(`vehiculo.html?id=${a.id}`) }, 'Ver publicación')];
    }
    const pedido = new URLSearchParams({ url: a.url, titulo: `${a.marca} ${a.modelo}${a.version ? ` ${a.version}` : ''}` });
    if (a.anio) pedido.set('anio', a.anio);
    if (a.km !== null) pedido.set('km', a.km);
    if (a.precio !== null && a.moneda === 'ARS') pedido.set('precio', a.precio);
    if (a.ubicacion) pedido.set('localidad', a.ubicacion);
    return [
        el('a', { class: 'boton-link', href: a.url, target: '_blank', rel: 'noopener noreferrer' }, `Ver en ${insp.fuente(a.fuente)}`),
        el('a', { class: 'boton boton--chico', href: ruta(`pedir-inspeccion.html?${pedido}`) }, 'Mandale un mecánico'),
    ];
}

function fila(a) {
    const etiqueta = ETIQUETAS[a.etiqueta?.valor];
    const datos = [a.km !== null ? formato.km(a.km) : null, a.ubicacion, insp.fuente(a.fuente)].filter(Boolean).join(' · ');
    return el('li', { class: 'fila' },
        el('span', { class: 'fila__cuerpo' },
            el('span', { class: 'fila__titulo' }, `${a.marca} ${a.modelo} ${a.anio ?? ''}`.trim(),
                a.version ? el('span', { class: 'suave' }, ` · ${a.version}`) : null), el('br'),
            el('span', { class: 'fila__meta' }, datos), el('br'),
            el('strong', {}, precio(a)), ' ',
            etiqueta ? el('span', { class: 'etiqueta', title: a.etiqueta.explicacion || '' }, etiqueta) : null, ' ',
            a.reservado ? el('span', { class: 'etiqueta etiqueta--oscura' }, 'Reservado') : null),
        el('span', { class: 'fila__acciones' }, ...acciones(a)));
}

function mostrar(r) {
    const b = r.busqueda;
    $('titulo').textContent = criterios(b);
    document.title = `${b.marca} ${b.modelo} - AutoCar`;

    // La referencia en pesos del sitio con más autos (cada sitio trae la suya)
    const ref = r.referencia.filter((g) => g.moneda === 'ARS' && g.suficiente)
        .sort((a, b) => b.cantidad - a.cantidad)[0];
    $('referencia').textContent = ref
        ? `Precio típico en ${insp.fuente(ref.fuente)}: ${formato.precio(ref.mediana)} (la mitad de ${ref.cantidad} autos está entre ${formato.precio(ref.p25)} y ${formato.precio(ref.p75)}).`
        : 'Todavía no hay suficientes autos para calcular un precio típico.';
    const n = r.novedades;
    $('novedades').textContent = n && n.disponible
        ? `Desde la corrida anterior: ${n.nuevos} nuevos, ${n.bajaron} bajaron de precio y ${n.retirados} ya no están.`
        : 'Las novedades (autos nuevos y bajas de precio) aparecen a partir de la segunda corrida diaria.';
    $('aclaracion').textContent = r.aclaracion;
    $('resumen').hidden = false;

    const res = r.resultados;
    $('resultados').replaceChildren(...res.items.map(fila));
    $('estado').replaceChildren(res.items.length ? '' : vistas.aviso('No hay autos con estos filtros.',
        'Probá con otro sitio o sacá algún criterio. La búsqueda queda guardada: si aparece un auto, te avisamos.'));
    $('paginacion').replaceWith(Object.assign(vistas.paginacion(res.pagina, res.paginas), { id: 'paginacion' }));
    $('filtros').hidden = false;
    $('borrar').hidden = false;
}

function noEncontrada() {
    return vistas.aviso('No encontramos esa búsqueda.', null,
        el('a', { class: 'boton boton--secundario', href: ruta('meta-busqueda.html') }, 'Mis búsquedas'));
}

async function cargar() {
    if (!/^\d+$/.test(id || '')) {
        $('estado').replaceChildren(noEncontrada());
        return;
    }
    $('estado').replaceChildren(vistas.cargando());
    try {
        const filtros = Object.fromEntries(['orden', 'fuente', 'page'].filter((k) => params.get(k)).map((k) => [k, params.get(k)]));
        mostrar(await api.reporte(id, filtros));
        api.marcarVistos(id).catch(() => {}); // al abrirla, sus avisos quedan vistos
    } catch (error) {
        if (error.status === 401) {
            sesion.requerirLogin();
            return;
        }
        $('estado').replaceChildren(error.status === 404 ? noEncontrada() : vistas.avisoDeError(error));
    }
}

// Orden y sitio van en la URL (así la paginación los conserva) y se vuelve a la página 1
const filtros = $('filtros');
['orden', 'fuente'].forEach((campo) => {
    filtros.elements[campo].value = params.get(campo) || (campo === 'orden' ? 'precio' : '');
    filtros.elements[campo].addEventListener('change', () => {
        const nuevos = new URLSearchParams({ id });
        ['orden', 'fuente'].forEach((k) => {
            if (filtros.elements[k].value) nuevos.set(k, filtros.elements[k].value);
        });
        window.location.search = nuevos.toString();
    });
});

// "Borrar esta búsqueda" abre #dialogo-borrar (data-abrir); acá se confirma
$('confirmar-borrar').addEventListener('click', async (evento) => {
    const boton = evento.currentTarget;
    boton.disabled = true;
    boton.textContent = 'Borrando…';
    $('borrar-error').textContent = '';
    try {
        await api.eliminar(id);
        window.location.assign(ruta('meta-busqueda.html?borrada=1'));
    } catch (error) {
        $('borrar-error').textContent = error.message;
        boton.disabled = false;
        boton.textContent = 'Borrar';
    }
});

if (sesion.requerirLogin()) cargar();
