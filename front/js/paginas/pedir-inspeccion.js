// Mandale un mecánico: el comprador pega el link del auto (o llega con ?url=... desde un aviso), elige un
// mecánico del ranking, ve el desglose del precio y confirma. POST /api/inspecciones; el pago es simulado.
import * as api from '../api/inspecciones.js';
import * as formato from '../servicios/formato.js';
import * as formularios from '../servicios/formularios.js';
import * as insp from '../servicios/inspecciones.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { filasDatos } from '../servicios/informe.js';
import { ruta } from '../servicios/rutas.js';

const { el } = vistas;
const params = new URLSearchParams(window.location.search);
const form = document.getElementById('pedido');
const campoUrl = form.elements.url;
const ayudaUrl = document.getElementById('url-ayuda');
const lista = document.getElementById('mecanicos');
const errorMecanico = document.getElementById('mecanico_id-error');
const estadoMecanicos = document.getElementById('estado-mecanicos');
const filtro = document.getElementById('filtro-localidad');
const AYUDA_URL = ayudaUrl.textContent;

let mecanicos = [];

// ---------- El auto ----------

function describirUrl() {
    const fuente = insp.fuenteDeUrl(campoUrl.value, window.location.hostname);
    ayudaUrl.textContent = fuente ? `Aviso de ${insp.fuente(fuente)}.` : AYUDA_URL;
}

// Datos que llegan en la URL desde el botón "Mandale un mecánico"
function precargar() {
    const mapa = { url: 'url', titulo: 'titulo', anio: 'anio', km: 'kilometraje', precio: 'precio_publicado', localidad: 'localidad' };
    let conDatos = false;
    Object.entries(mapa).forEach(([param, campo]) => {
        const valor = params.get(param);
        if (!valor) return;
        form.elements[campo].value = valor;
        if (campo !== 'url') conDatos = true;
    });
    document.getElementById('datos-auto').open = conDatos;
    describirUrl();
}

campoUrl.addEventListener('input', describirUrl);

// ---------- El mecánico ----------

function opcionMecanico(m) {
    const idOpcion = `mecanico-${m.id}`;
    const radio = el('input', { type: 'radio', name: 'mecanico_id', id: idOpcion, value: m.id });
    radio.addEventListener('change', mostrarDesglose);
    return el('label', { for: idOpcion },
        radio,
        el('span', { class: 'fila__cuerpo' },
            el('span', { class: 'fila__titulo' }, m.taller), el('br'),
            el('span', { class: 'fila__meta' }, `${m.mecanico} · ${m.direccion}, ${m.localidad}`), el('br'),
            el('span', { class: 'fila__meta' }, insp.puntaje(m))),
        el('strong', {}, formato.precio(m.precio_inspeccion)));
}

async function cargarMecanicos() {
    estadoMecanicos.replaceChildren(vistas.cargando());
    lista.replaceChildren(el('legend', { class: 'solo-lector' }, 'Elegí un mecánico'));
    document.getElementById('resumen').hidden = true;
    try {
        const r = await api.mecanicos(filtro.value);
        mecanicos = r.items;
        if (filtro.options.length === 1) {
            filtro.append(...r.localidades.map((l) => el('option', { value: l }, l)));
        }
        lista.append(...mecanicos.map(opcionMecanico));
        estadoMecanicos.replaceChildren(mecanicos.length
            ? ''
            : vistas.aviso('No hay mecánicos en esa localidad.', 'Probá con "Todas".'));
    } catch (error) {
        estadoMecanicos.replaceChildren(vistas.avisoDeError(error));
    }
}

filtro.addEventListener('change', cargarMecanicos);

function elegido() {
    const id = Number(form.querySelector('[name="mecanico_id"]:checked')?.value);
    return mecanicos.find((m) => m.id === id) || null;
}

function mostrarDesglose() {
    const m = elegido();
    errorMecanico.textContent = '';
    document.getElementById('resumen').hidden = !m;
    if (!m) return;
    const d = m.desglose;
    document.getElementById('desglose').replaceChildren(...filasDatos([
        ['Mecánico', `${m.mecanico} · ${m.taller}`],
        ['Pagás', el('strong', {}, formato.precio(d.precio))],
        ['Para el mecánico', formato.precio(d.monto_mecanico)],
        ['Para AutoCar', `${formato.precio(d.monto_autocar)} (${formato.precio(d.monto_fondo)} van al fondo de garantía que paga los reclamos)`],
    ]));
}

// ---------- Enviar ----------

const numeroONulo = (texto) => (texto === '' ? null : Number(texto));

form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    formularios.alerta(form, '');
    errorMecanico.textContent = '';
    const textos = Array.from(form.querySelectorAll('input:not([type="radio"])'));
    const okCampos = window.Validacion.validar(textos, form);
    const m = elegido();
    if (!m) {
        errorMecanico.textContent = 'Elegí un mecánico de la lista.';
        if (okCampos) formularios.alerta(form, 'Falta elegir el mecánico.');
    }
    if (!okCampos || !m) return;

    const datos = formularios.datosDe(form);
    const boton = form.querySelector('[type="submit"]');
    boton.disabled = true;
    boton.textContent = 'Enviando…';
    try {
        const { inspeccion } = await api.pedir({
            url: datos.url,
            mecanico_id: m.id,
            titulo: datos.titulo || null,
            anio: numeroONulo(datos.anio),
            kilometraje: numeroONulo(datos.kilometraje),
            precio_publicado: numeroONulo(datos.precio_publicado),
            localidad: datos.localidad || null,
        });
        window.location.assign(ruta(`mis-inspecciones.html?nueva=${inspeccion.id}`));
    } catch (error) {
        if (error.status === 401) {
            sesion.requerirLogin();
            return;
        }
        if (error.errores?.mecanico_id) errorMecanico.textContent = error.errores.mecanico_id;
        formularios.mostrarError(form, error);
        boton.disabled = false;
        boton.textContent = 'Pedir la inspección';
    }
});

if (sesion.requerirLogin()) {
    precargar();
    cargarMecanicos();
}
