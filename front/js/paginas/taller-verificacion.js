// Inspección (lado del mecánico): datos del auto, checklist de 10 ítems, conclusión y firma.
// Mientras está "aceptada" se puede guardar a medias (borrador). Firmar exige todo completo y cierra el informe:
// después se muestra sólo para leer, con el firmante y la fecha.
import * as api from '../api/inspecciones.js';
import * as formato from '../servicios/formato.js';
import * as formularios from '../servicios/formularios.js';
import * as informe from '../servicios/informe.js';
import * as insp from '../servicios/inspecciones.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { ruta } from '../servicios/rutas.js';
import { boton, campo, confirmacion, formularioEnHoja } from '../servicios/acciones.js';

const { el } = vistas;
const id = new URLSearchParams(window.location.search).get('id');

const aviso = document.getElementById('aviso');
const estado = document.getElementById('estado');
const form = document.getElementById('informe');
const alertaForm = form.querySelector('.formulario__alerta');
const progreso = document.getElementById('progreso');
const progresoTexto = document.getElementById('progreso-texto');

let inspeccion = null;
let sinGuardar = false;

function avisar(texto) {
    aviso.textContent = texto;
    aviso.hidden = !texto;
}

// ---------- Datos del auto ----------

function mostrarAuto(i) {
    document.getElementById('titulo').textContent = insp.tituloAuto(i);
    document.title = `${insp.tituloAuto(i)} · Inspección - AutoCar`;
    const filas = [
        ['Aviso', el('a', { href: i.url, target: '_blank', rel: 'noopener noreferrer' }, `Ver en ${insp.fuente(i.fuente)}`)],
        i.anio ? ['Año', String(i.anio)] : null,
        i.kilometraje !== null && i.kilometraje !== undefined ? ['Kilometraje', formato.km(i.kilometraje)] : null,
        i.precio_publicado ? ['Precio publicado', formato.precio(i.precio_publicado)] : null,
        i.localidad ? ['Localidad', i.localidad] : null,
        i.fecha_turno ? ['Turno', formato.fechaHora(i.fecha_turno)] : null,
        ['Pedida por', i.comprador?.nombre || '—'],
        ['Estado', insp.estado(i.estado)],
        ['Cobrás', `${formato.precio(i.monto_mecanico)} de ${formato.precio(i.precio)}`],
    ].filter(Boolean);
    document.getElementById('auto-datos').replaceChildren(
        ...filas.flatMap(([dt, dd]) => [el('dt', {}, dt), el('dd', {}, dd)]));
    document.getElementById('auto').hidden = false;
}

// ---------- Checklist ----------

function radios(nombre, opciones, elegido) {
    return Object.entries(opciones).flatMap(([valor, texto]) => {
        const idRadio = `${nombre}-${valor}`;
        return [
            el('input', { type: 'radio', name: nombre, id: idRadio, value: valor, checked: valor === elegido }),
            el('label', { for: idRadio }, texto),
        ];
    });
}

function campoItem(item, guardado) {
    const nombre = `resultado-${item.codigo}`;
    const nota = `nota-${item.codigo}`;
    return el('fieldset', { class: 'pila item-checklist', 'aria-describedby': `${nombre}-error` },
        el('legend', { class: 'campo__etiqueta' },
            el('strong', {}, item.nombre), ' ', el('span', { class: 'campo__ayuda' }, item.detalle)),
        el('div', { class: 'segmentado' }, ...radios(nombre, insp.RESULTADOS, guardado?.resultado)),
        el('span', { class: 'campo__error', id: `${nombre}-error` }),
        el('label', { class: 'solo-lector', for: nota }, `Nota sobre ${item.nombre}`),
        el('input', {
            class: 'campo__input', id: nota, name: nota, maxlength: insp.MAX_NOTA,
            placeholder: 'Qué viste (obligatorio si no está OK)', value: guardado?.nota || '',
            'aria-describedby': `${nota}-error`,
        }),
        el('span', { class: 'campo__error', id: `${nota}-error` }));
}

function mostrarFormulario(i) {
    const porCodigo = Object.fromEntries((i.items || []).map((x) => [x.codigo, x]));
    document.getElementById('items').replaceChildren(...insp.CHECKLIST.map((c) => campoItem(c, porCodigo[c.codigo])));
    document.getElementById('conclusion').replaceChildren(...radios('conclusion', insp.CONCLUSIONES, i.conclusion));
    form.elements.resumen.value = i.resumen || '';
    actualizarProgreso();
    form.hidden = false;
}

function leerInforme() {
    const campos = form.elements;
    return {
        items: insp.CHECKLIST.map(({ codigo }) => ({
            codigo,
            resultado: campos[`resultado-${codigo}`].value,
            nota: campos[`nota-${codigo}`].value,
        })),
        conclusion: campos.conclusion.value,
        resumen: campos.resumen.value,
    };
}

function actualizarProgreso() {
    const hechos = insp.completos(leerInforme().items);
    progreso.value = hechos;
    progresoTexto.textContent = `${hechos} de ${insp.CHECKLIST.length}`;
}

function limpiarErrores() {
    form.querySelectorAll('.campo__error').forEach((caja) => { caja.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach((c) => c.removeAttribute('aria-invalid'));
    alertaForm.textContent = '';
}

// Los errores de un grupo de radios van en su caja; los de un input, al lado del input (como validacion.js).
function mostrarErrores({ errores, mensaje }) {
    let primero = null;
    Object.entries(errores).forEach(([campo, texto]) => {
        const caja = document.getElementById(`${campo}-error`);
        if (caja) caja.textContent = texto;
        // Por name primero: "conclusion" es también el id del contenedor de sus radios.
        const control = form.querySelector(`[name="${campo}"]`) || document.getElementById(campo);
        if (control) {
            control.setAttribute('aria-invalid', 'true');
            primero = primero || control;
        }
    });
    alertaForm.textContent = mensaje;
    (primero || alertaForm).focus();
}

// Valida y guarda. Devuelve false si no se pudo (y ya mostró por qué).
async function guardar(completo) {
    limpiarErrores();
    const cargado = leerInforme();
    const revision = insp.validarInforme(cargado, completo);
    if (revision.mensaje) {
        mostrarErrores(revision);
        return false;
    }
    try {
        inspeccion = (await api.guardarInforme(id, insp.cuerpoInforme(cargado))).inspeccion;
        sinGuardar = false;
        return true;
    } catch (error) {
        if (error.status === 401) sesion.requerirLogin();
        alertaForm.textContent = error.message;
        alertaForm.focus();
        return false;
    }
}

form.addEventListener('change', () => {
    sinGuardar = true;
    actualizarProgreso();
});
form.addEventListener('input', () => { sinGuardar = true; });

// "Guardar borrador", al lado de "Firmar informe" (el submit del formulario)
const botonGuardar = boton('Guardar borrador', async () => {
    botonGuardar.disabled = true;
    if (await guardar(false)) avisar('Se guardó el borrador. Podés seguir después.');
    botonGuardar.disabled = false;
}, 'boton boton--secundario', 'guardar');
form.querySelector('.pasos__botones').prepend(botonGuardar);

// Confirmación de la firma (la ventana la arma acciones.js)
const pedirFirma = confirmacion({
    titulo: 'Firmar el informe',
    confirmar: 'Firmar',
    id: 'confirmar-firma',
    volver: 'Volver',
    detalle: (conclusion) => [
        el('p', {}, `Vas a firmar con tu nombre, ${sesion.usuario()?.nombre || ''}, un informe "${conclusion}" sobre ${insp.tituloAuto(inspeccion)}.`),
        el('p', { class: 'campo__ayuda' }, 'Después de firmar el informe queda cerrado y no se puede cambiar. Si se te pasó algo que se veía, el comprador puede reclamar durante 15 días.'),
    ],
    hacer: async () => {
        // Se guarda lo último que cargó y después se firma eso mismo. Si no se pudo guardar, el motivo
        // queda en el formulario y la ventana se cierra.
        if (!(await guardar(true))) return;
        try {
            inspeccion = (await api.firmar(id)).inspeccion;
        } catch (error) {
            if (error.status === 401) sesion.requerirLogin();
            throw error;
        }
        form.hidden = true;
        mostrarAuto(inspeccion);
        mostrarFirmado(inspeccion);
        avisar('Firmaste el informe. El comprador ya lo puede ver.');
        window.scrollTo({ top: 0 });
    },
});

// "Firmar informe": primero revisa que esté todo y pide confirmación.
form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    limpiarErrores();
    const revision = insp.validarInforme(leerInforme(), true);
    if (revision.mensaje) {
        mostrarErrores(revision);
        return;
    }
    pedirFirma(insp.conclusion(form.elements.conclusion.value));
});

window.addEventListener('beforeunload', (evento) => {
    if (sinGuardar && !form.hidden) evento.preventDefault();
});

// ---------- Informe firmado ----------

function mostrarFirmado(i) {
    document.getElementById('volver').href = ruta('taller.html?estado=firmada');
    document.getElementById('firmado-conclusion').replaceChildren(
        'Conclusión: ', el('strong', {}, insp.conclusion(i.conclusion)));
    const resumen = document.getElementById('firmado-resumen');
    resumen.textContent = i.resumen || '';
    resumen.hidden = !i.resumen;

    document.getElementById('firmado-items').replaceWith(
        Object.assign(informe.listaItems(i), { id: 'firmado-items' }));
    document.getElementById('firmado-datos').replaceChildren(...informe.datosFirma(i));
    document.getElementById('firmado').hidden = false;
}

// ---------- No se pudo hacer ----------

// La ventana y el enlace que la abre (al final del formulario) los arma el JS
const { dialogo: dialogoNoRealizada, formulario: formNoRealizada } = formularioEnHoja({
    titulo: 'No se pudo hacer la inspección',
    id: 'form-no-realizada',
    enviar: 'Confirmar',
    volver: 'Volver',
    campos: [
        campo('Qué pasó', el('textarea', {
            id: 'no-realizada-motivo', name: 'motivo', rows: 3, required: true, minlength: 3, maxlength: 300,
            placeholder: 'El vendedor no dejó revisar el auto.',
        }), 'Lo ve el comprador. Se le devuelve todo lo que pagó y la inspección queda cerrada.'),
    ],
});
form.append(el('p', { class: 'campo__ayuda' },
    '¿Fuiste y no la pudiste hacer, por ejemplo porque el vendedor no dejó revisar el auto? ',
    boton('No pude hacer la inspección', () => dialogoNoRealizada.showModal(), 'boton-link')));

formularios.alEnviar(formNoRealizada, async ({ motivo }) => {
    inspeccion = (await api.noRealizada(id, motivo)).inspeccion;
    dialogoNoRealizada.close();
    sinGuardar = false;
    form.hidden = true;
    mostrarAuto(inspeccion);
    estado.replaceChildren(vistas.aviso(insp.estado(inspeccion.estado), MENSAJES_ESTADO.no_realizada,
        el('a', { class: 'boton boton--secundario', href: ruta('taller.html') }, 'Ir a Mi taller')));
    window.scrollTo({ top: 0 });
});

// ---------- Inicio ----------

const MENSAJES_ESTADO = {
    pedida: 'Todavía no aceptaste este pedido. Aceptalo desde Mi taller, con la fecha del turno, para cargar el checklist.',
    rechazada: 'Rechazaste este pedido. Al comprador se le devolvió lo que pagó.',
    cancelada: 'El comprador canceló este pedido.',
    no_realizada: 'Marcaste que no la pudiste hacer. Al comprador se le devolvió lo que pagó.',
};

async function iniciar() {
    if (!/^\d+$/.test(id || '')) {
        estado.replaceChildren(vistas.aviso('Falta la inspección.', 'Entrá desde Mi taller.'));
        return;
    }
    estado.replaceChildren(vistas.cargando());
    try {
        inspeccion = (await api.detalle(id)).inspeccion;
    } catch (error) {
        if (error.status === 401) {
            sesion.requerirLogin();
            return;
        }
        estado.replaceChildren(error.status === 404
            ? vistas.aviso('No encontramos esa inspección.', 'Puede que no esté asignada a tu taller.')
            : vistas.avisoDeError(error));
        return;
    }
    estado.replaceChildren();
    mostrarAuto(inspeccion);
    if (inspeccion.estado === 'firmada') mostrarFirmado(inspeccion);
    else if (inspeccion.estado === 'aceptada') mostrarFormulario(inspeccion);
    else {
        const volver = el('a', { class: 'boton boton--secundario', href: ruta('taller.html') }, 'Ir a Mi taller');
        estado.replaceChildren(vistas.aviso(insp.estado(inspeccion.estado), MENSAJES_ESTADO[inspeccion.estado], volver));
    }
}

if (sesion.requerirPermiso('verificaciones.realizar')) iniciar();
