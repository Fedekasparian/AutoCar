// Reporte de una búsqueda guardada (meta-busqueda-resultados.html?id=N) con GET /api/meta-busquedas/{id}:
// precio de referencia, novedades y los autos de todas las fuentes, cada uno con "Mandale un mecánico".
import * as api from '../api/metabusqueda.js';
import * as formato from '../servicios/formato.js';
import * as insp from '../servicios/inspecciones.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { criterios } from '../servicios/metabusqueda.js';
import { ruta } from '../servicios/rutas.js';
import { boton, confirmacion } from '../servicios/acciones.js';

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

// La etiqueta del metabuscador con el mismo color que la del comparador de una publicación
const COLOR_ETIQUETA = { barato: 'buen_precio', normal: 'en_precio', caro: 'caro' };
const etiquetaPrecio = (a) => {
    const texto = ETIQUETAS[a.etiqueta?.valor];
    return texto
        ? el('span', { class: `etiqueta etiqueta--${COLOR_ETIQUETA[a.etiqueta.valor]}`, title: a.etiqueta.explicacion || '' }, texto)
        : null;
};
// El sitio como una pastilla de color (solo el nombre: sin logos de otras marcas)
const sitio = (fuente) => el('span', { class: `sitio sitio--${fuente}` }, insp.fuente(fuente));

function fila(a, i) {
    const datos = [a.km !== null ? formato.km(a.km) : null, a.ubicacion].filter(Boolean).join(' · ');
    const li = el('li', { class: 'fila resultado' },
        el('span', { class: 'fila__cuerpo' },
            el('span', { class: 'resultado__arriba' }, sitio(a.fuente),
                a.reservado ? el('span', { class: 'etiqueta etiqueta--oscura' }, 'Reservado') : null),
            el('span', { class: 'fila__titulo' }, `${a.marca} ${a.modelo} ${a.anio ?? ''}`.trim(),
                a.version ? el('span', { class: 'suave' }, ` · ${a.version}`) : null),
            el('span', { class: 'fila__meta' }, datos),
            el('span', { class: 'resultado__precio' }, el('strong', {}, precio(a)), ' ', etiquetaPrecio(a))),
        el('span', { class: 'fila__acciones' }, ...acciones(a)));
    li.style.setProperty('--n', String(i));
    return li;
}

// Precio típico por sitio, todos en la misma escala: franja del 25 % al 75 % y una marca en la mediana
function mostrarSitios(referencia) {
    const grupos = referencia.filter((g) => g.moneda === 'ARS' && g.suficiente);
    const caja = $('sitios');
    if (grupos.length < 2) { caja.hidden = true; return; }
    const desde = Math.min(...grupos.map((g) => g.p25)) * 0.95;
    const hasta = Math.max(...grupos.map((g) => g.p75)) * 1.05;
    const pos = (v) => `${(((v - desde) / (hasta - desde)) * 100).toFixed(1)}%`;
    caja.replaceChildren(
        el('p', { class: 'sitios__titulo' }, 'Precio típico en cada sitio'),
        ...grupos.sort((a, b) => a.mediana - b.mediana).map((g) => {
            const pista = el('span', { class: 'sitios__pista', 'aria-hidden': 'true' },
                el('span', { class: 'sitios__franja' }), el('span', { class: 'sitios__mediana' }));
            pista.style.setProperty('--desde', pos(g.p25));
            pista.style.setProperty('--hasta', pos(g.p75));
            pista.style.setProperty('--mediana', pos(g.mediana));
            return el('div', { class: `sitios__fila sitio-color--${g.fuente}` },
                sitio(g.fuente), pista,
                el('span', { class: 'sitios__valor' }, formato.precio(g.mediana),
                    el('span', { class: 'solo-lector' }, ` (la mitad de ${g.cantidad} autos entre ${formato.precio(g.p25)} y ${formato.precio(g.p75)})`)));
        }));
    caja.hidden = false;
}

function mostrarNovedades(n) {
    const caja = $('novedades-cifras');
    if (!n?.disponible) { caja.hidden = true; return; }
    caja.replaceChildren(...[['nuevos', n.nuevos, 'nuevos'], ['bajaron', n.bajaron, 'bajaron de precio'], ['retirados', n.retirados, 'ya no están']]
        .map(([clase, valor, texto]) => el('li', { class: `novedades__cifra novedades__cifra--${clase}` },
            el('strong', {}, String(valor)), el('span', {}, texto))));
    caja.hidden = false;
}

const DESTACADOS = [['mejor_relacion', 'Mejor relación precio y km'], ['mas_barato', 'El más barato'], ['menos_usado', 'El menos usado']];
function mostrarDestacados(d) {
    const caja = $('destacados');
    const items = DESTACADOS.filter(([clave]) => d?.[clave]);
    if (!items.length) { caja.hidden = true; return; }
    caja.replaceChildren(...items.map(([clave, titulo]) => {
        const { auto: a, explicacion } = d[clave];
        return el('li', { class: `destacado destacado--${clave}` },
            el('span', { class: 'destacado__titulo' }, titulo),
            el('strong', { class: 'destacado__precio' }, precio(a)),
            el('span', { class: 'destacado__auto' }, `${a.marca} ${a.modelo} ${a.anio ?? ''}`.trim(),
                a.km !== null ? ` · ${formato.km(a.km)}` : ''),
            el('span', { class: 'destacado__explicacion' }, explicacion),
            el('span', { class: 'destacado__pie' }, sitio(a.fuente), acciones(a).at(-1)));
    }));
    caja.hidden = false;
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
    mostrarSitios(r.referencia);
    mostrarNovedades(n);
    mostrarDestacados(r.destacados);
    $('resumen').hidden = false;

    const res = r.resultados;
    $('resultados').replaceChildren(...res.items.map(fila));
    $('resultados').classList.add('lista-filas--entra');
    $('estado').replaceChildren(res.items.length ? '' : vistas.aviso('No hay autos con estos filtros.',
        'Probá con otro sitio o sacá algún criterio. La búsqueda queda guardada: si aparece un auto, te avisamos.'));
    $('paginacion').replaceWith(Object.assign(vistas.paginacion(res.pagina, res.paginas), { id: 'paginacion' }));
    $('filtros').hidden = false;
    // Al final de la página, "Borrar esta búsqueda" (una sola vez, aunque se vuelva a mostrar el reporte)
    if (!$('borrar')) {
        const borrar = boton('Borrar esta búsqueda', () => pedirBorrar(), 'boton boton--secundario');
        borrar.id = 'borrar';
        $('paginacion').after(borrar);
    }
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

// Confirmación de "Borrar esta búsqueda" (la ventana la arma acciones.js)
const pedirBorrar = confirmacion({
    titulo: '¿Borrar esta búsqueda?',
    confirmar: 'Borrar',
    volver: 'Volver',
    detalle: () => [el('p', {}, 'Dejás de recibir avisos de autos nuevos y bajas de precio. Los autos siguen en los sitios: podés volver a buscarlos cuando quieras.')],
    hacer: async () => {
        await api.eliminar(id);
        window.location.assign(ruta('meta-busqueda.html?borrada=1'));
    },
});

if (sesion.requerirLogin()) cargar();
