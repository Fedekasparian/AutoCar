// Cola de reclamos (permiso reclamos.resolver): por resolver, procedieron y no procedieron.
// Resolver: procede (con compensación hasta el tope) o no procede, siempre con una respuesta para el comprador.
import * as admin from '../api/admin.js';
import * as formato from '../servicios/formato.js';
import * as formularios from '../servicios/formularios.js';
import * as insp from '../servicios/inspecciones.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { filasDatos } from '../servicios/informe.js';
import { ruta } from '../servicios/rutas.js';
import { campo, formularioEnHoja } from '../servicios/acciones.js';

const { el } = vistas;
const ESTADOS = ['abierto', 'procede', 'no_procede'];
const pedido = new URLSearchParams(window.location.search).get('estado');
const estadoActual = ESTADOS.includes(pedido) ? pedido : 'abierto';

const lista = document.getElementById('lista');
const estado = document.getElementById('estado');
const aviso = document.getElementById('aviso');
// La ventana para resolver la arma el JS (no está en admin-reclamos.html)
const opcion = (valor, id, texto, requerido) => el('label', {},
    el('input', { type: 'radio', name: 'decision', value: valor, id, required: requerido }), el('span', {}, texto));
const resolverAuto = el('p', { class: 'suave' });
const filaCompensacion = campo('Compensación ($)',
    el('input', { id: 'compensacion', name: 'compensacion', type: 'number', min: 0, step: 1000, inputmode: 'numeric' }), '');
const { dialogo, formulario: form } = formularioEnHoja({
    titulo: 'Resolver el reclamo',
    id: 'form-resolver',
    enviar: 'Guardar',
    campos: [
        resolverAuto,
        el('fieldset', { class: 'opciones' },
            el('legend', { class: 'campo__etiqueta' }, 'Decisión'),
            opcion('procede', 'decision-procede', 'Procede', true),
            opcion('no_procede', 'decision-no', 'No procede', false)),
        filaCompensacion,
        campo('Respuesta para el comprador',
            el('textarea', { id: 'respuesta', name: 'respuesta', rows: 3, required: true, minlength: 3, maxlength: 1000 })),
    ],
});
const campoCompensacion = form.elements.compensacion;
let elegido = null;

function avisar(texto) {
    aviso.textContent = texto;
    aviso.hidden = !texto;
}

function tarjeta(r) {
    const i = r.inspeccion;
    const yo = sesion.usuario()?.id;
    const propio = i.mecanico.id === yo || i.comprador.id === yo;
    const acciones = [
        el('a', { class: 'boton boton--secundario boton--chico', href: ruta(`verificacion.html?id=${i.id}`) }, 'Ver el informe'),
        el('a', { class: 'boton-link', href: i.url, target: '_blank', rel: 'noopener noreferrer' }, `Aviso en ${insp.fuente(i.fuente)}`),
    ];
    if (r.estado === 'abierto' && !propio) {
        const resolver = el('button', { class: 'boton boton--chico', type: 'button' }, 'Resolver');
        resolver.addEventListener('click', () => abrir(r));
        acciones.unshift(resolver);
    }
    return el('article', { class: 'recuadro pila' },
        el('h2', { class: 'titulo-seccion' }, insp.tituloAuto(i)),
        el('dl', { class: 'datos' }, ...filasDatos([
            ['Reclamo', `${formato.fecha(r.created_at)} · ${r.item_codigo ? insp.nombreItem(r.item_codigo) : 'General'}`],
            ['Qué pasó', r.descripcion],
            ['Comprador', i.comprador.nombre],
            ['Mecánico', `${i.mecanico.nombre} · ${i.mecanico.taller}`],
            ['Informe', `${insp.conclusion(i.conclusion)}, firmado el ${formato.fecha(i.firmada_at)}`],
            ['Inspección', `${formato.precio(i.precio)} (compensación hasta ${formato.precio(r.tope)})`],
            r.estado !== 'abierto' ? ['Resolución', `${insp.estadoReclamo(r.estado)} · ${r.resuelto_por || ''} · ${formato.fecha(r.resuelto_at)}`] : null,
            r.estado === 'procede' ? ['Compensación', formato.precio(r.compensacion || 0)] : null,
            r.respuesta ? ['Respuesta', r.respuesta] : null,
        ])),
        propio && r.estado === 'abierto'
            ? el('p', { class: 'campo__ayuda' }, 'Es sobre una inspección tuya: lo tiene que resolver otra persona.')
            : null,
        el('ul', { class: 'acciones-fila', role: 'list' }, ...acciones.map((a) => el('li', {}, a))));
}

const VACIO = {
    abierto: 'No hay reclamos por resolver.',
    procede: 'Ningún reclamo procedió todavía.',
    no_procede: 'No hay reclamos rechazados.',
};

function marcarPestanas() {
    document.querySelectorAll('#pestanas [data-estado]').forEach((a) => {
        if (a.dataset.estado === estadoActual) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
    });
}

async function cargar() {
    estado.replaceChildren(vistas.cargando());
    try {
        const { items } = await admin.reclamos(estadoActual);
        lista.replaceChildren(...items.map(tarjeta));
        estado.replaceChildren(items.length ? '' : vistas.aviso(VACIO[estadoActual]));
    } catch (error) {
        if (error.status === 401) {
            sesion.requerirLogin();
            return;
        }
        estado.replaceChildren(error.status === 403
            ? vistas.aviso('No tenés permiso para ver los reclamos.')
            : vistas.avisoDeError(error));
    }
}

// ---------- Resolver ----------

function alternarCompensacion() {
    const procede = form.elements.decision.value === 'procede';
    filaCompensacion.hidden = !procede;
    campoCompensacion.required = procede;
    campoCompensacion.disabled = !procede;
}

function abrir(r) {
    elegido = r;
    form.reset();
    resolverAuto.textContent = `${insp.tituloAuto(r.inspeccion)} · ${r.descripcion}`;
    campoCompensacion.max = r.tope;
    document.getElementById('compensacion-ayuda').textContent =
        `Además se le devuelven ${formato.precio(r.inspeccion.precio)}. Compensación máxima: ${formato.precio(r.tope)} (3 veces el precio).`;
    alternarCompensacion();
    formularios.alerta(form, '');
    dialogo.showModal();
}

form.addEventListener('change', (evento) => {
    if (evento.target.name === 'decision') alternarCompensacion();
});

formularios.alEnviar(form, async ({ compensacion, respuesta }) => {
    const procede = form.elements.decision.value === 'procede';
    await admin.resolverReclamo(elegido.id, procede
        ? { procede: true, compensacion: Number(compensacion), respuesta }
        : { procede: false, respuesta });
    dialogo.close();
    avisar(procede
        ? `El reclamo procede: se le devuelve la inspección al comprador y se le paga ${formato.precio(Number(compensacion))}.`
        : 'Listo: el reclamo no procede. El comprador ve tu respuesta en la inspección.');
    await cargar();
});

if (sesion.requerirPermiso('reclamos.resolver')) {
    marcarPestanas();
    cargar();
}
