// Mi taller (panel del mecánico): perfil del taller y bandeja de inspecciones por estado.
// Pedidos: aceptar con fecha de turno o rechazar con motivo. Por revisar y firmadas: abren el checklist.
// Hace falta el permiso verificaciones.realizar (rol mecanico); el back lo vuelve a controlar en cada pedido.
import * as api from '../api/inspecciones.js';
import * as formato from '../servicios/formato.js';
import * as formularios from '../servicios/formularios.js';
import * as insp from '../servicios/inspecciones.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { ruta } from '../servicios/rutas.js';
import { boton, campo, formularioEnHoja } from '../servicios/acciones.js';

const { el } = vistas;
const PESTANAS = ['pedida', 'aceptada', 'firmada'];
const pedido = new URLSearchParams(window.location.search).get('estado');
const estadoActual = PESTANAS.includes(pedido) ? pedido : 'pedida';

const aviso = document.getElementById('aviso');
const lista = document.getElementById('bandeja');
const estado = document.getElementById('estado');

// Las tres ventanas (perfil, aceptar y rechazar) las arma el JS: no están en taller.html
const { dialogo: dialogoPerfil, formulario: formPerfil } = formularioEnHoja({
    titulo: 'Perfil del taller',
    id: 'form-perfil',
    enviar: 'Guardar',
    campos: [
        campo('Nombre del taller', el('input', { id: 'perfil-nombre', name: 'nombre', required: true, minlength: 2, maxlength: 80 })),
        campo('Dirección', el('input', { id: 'perfil-direccion', name: 'direccion', required: true, maxlength: 120, autocomplete: 'address-line1' })),
        el('div', { class: 'campos-fila' },
            campo('Localidad', el('input', { id: 'perfil-localidad', name: 'localidad', required: true, maxlength: 100, placeholder: 'Mercedes' })),
            campo('Teléfono', el('input', { id: 'perfil-telefono', name: 'telefono', type: 'tel', required: true, maxlength: 30, placeholder: '(02324) 15-123456' }))),
        campo('Precio de la inspección ($)', el('input', {
            id: 'perfil-precio', name: 'precio_inspeccion', type: 'number', required: true,
            min: 1000, max: 10000000, step: 1000, inputmode: 'numeric',
        }), ''),
    ],
});
const ayudaPrecio = document.getElementById('perfil-precio-ayuda');
ayudaPrecio.setAttribute('aria-live', 'polite');

const autoAceptar = el('p', { class: 'suave' });
const { dialogo: dialogoAceptar, formulario: formAceptar } = formularioEnHoja({
    titulo: 'Aceptar la inspección',
    id: 'form-aceptar',
    enviar: 'Aceptar',
    campos: [
        autoAceptar,
        campo('Día y hora del turno', el('input', { id: 'aceptar-fecha', name: 'fecha_turno', type: 'datetime-local', required: true }),
            'El comprador la ve en su pedido. El vendedor no sabe quién sos hasta la cita.'),
    ],
});

const autoRechazar = el('p', { class: 'suave' });
const { dialogo: dialogoRechazar, formulario: formRechazar } = formularioEnHoja({
    titulo: 'Rechazar la inspección',
    id: 'form-rechazar',
    enviar: 'Rechazar',
    campos: [
        autoRechazar,
        campo('Motivo', el('textarea', { id: 'rechazar-motivo', name: 'motivo', rows: 3, required: true, maxlength: 300 }),
            'Lo ve el comprador. Se le devuelve todo lo que pagó.'),
    ],
});

let taller = null;
let elegida = null; // la inspección que se está aceptando o rechazando

// texto y, si hace falta, un enlace al paso siguiente
function avisar(texto, enlace) {
    aviso.replaceChildren(texto, ...(enlace ? [' ', enlace] : []));
    aviso.hidden = !texto;
}

// Qué se hace en cada pestaña y cuál es el paso siguiente
const AYUDA = {
    pedida: 'Aceptá el pedido con la fecha del turno o rechazalo. Los aceptados pasan a "Por revisar", donde cargás el checklist y firmás.',
    aceptada: 'El día del turno tocá "Revisar y firmar": completás el checklist de 10 ítems, elegís la conclusión y firmás el informe.',
    firmada: 'Informes que ya firmaste. Están cerrados y no se pueden cambiar.',
};

// ---------- Perfil ----------

function mostrarPerfil() {
    const datos = document.getElementById('perfil-datos');
    document.getElementById('perfil-falta').hidden = Boolean(taller);
    datos.hidden = !taller;
    botonPerfil.textContent = taller ? 'Editar perfil' : 'Completar perfil';
    document.getElementById('taller-subtitulo').textContent = taller ? `${taller.nombre} · ${taller.localidad}` : '';
    if (!taller) return;

    const { monto_mecanico: paraVos } = insp.desglose(Number(taller.precio_inspeccion));
    const filas = [
        ['Dirección', `${taller.direccion}, ${taller.localidad}`],
        ['Teléfono', taller.telefono],
        ['Inspección', `${formato.precio(taller.precio_inspeccion)} (para vos ${formato.precio(paraVos)})`],
    ];
    datos.replaceChildren(...filas.flatMap(([dt, dd]) => [el('dt', {}, dt), el('dd', {}, dd)]));
}

function describirPrecio() {
    const precio = Number(formPerfil.elements.precio_inspeccion.value);
    if (!precio || precio < 1000) {
        ayudaPrecio.textContent = 'Lo paga el comprador al pedir la inspección.';
        return;
    }
    const d = insp.desglose(precio);
    ayudaPrecio.textContent = `De cada inspección cobrás ${formato.precio(d.monto_mecanico)}. `
        + `AutoCar se queda ${formato.precio(d.monto_autocar)}, de los que ${formato.precio(d.monto_fondo)} `
        + 'van al fondo de garantía que paga los reclamos.';
}

function abrirPerfil() {
    const campos = formPerfil.elements;
    ['nombre', 'direccion', 'localidad', 'telefono'].forEach((c) => { campos[c].value = taller?.[c] || ''; });
    campos.precio_inspeccion.value = taller ? Number(taller.precio_inspeccion) : 130000;
    formularios.alerta(formPerfil, '');
    describirPrecio();
    dialogoPerfil.showModal();
}

formularios.alEnviar(formPerfil, async (datos) => {
    const r = await api.guardarPerfil({ ...datos, precio_inspeccion: Number(datos.precio_inspeccion) });
    taller = r.taller;
    mostrarPerfil();
    dialogoPerfil.close();
    avisar('Se guardó el perfil del taller.');
});

formPerfil.elements.precio_inspeccion.addEventListener('input', describirPrecio);
// "Completar perfil" / "Editar perfil", al final del recuadro del perfil
const botonPerfil = boton('Completar perfil', abrirPerfil, 'boton boton--secundario', 'editar-perfil');
document.getElementById('perfil-datos').after(botonPerfil);

// ---------- Bandeja ----------

function metaDe(i) {
    const partes = [insp.fuente(i.fuente)];
    if (i.anio) partes.push(String(i.anio));
    if (i.kilometraje !== null && i.kilometraje !== undefined) partes.push(formato.km(i.kilometraje));
    if (i.localidad) partes.push(i.localidad);
    if (i.estado === 'pedida') partes.push(`Pedida el ${formato.fecha(i.created_at)} por ${i.comprador?.nombre || 'un comprador'}`);
    if (i.estado === 'aceptada') partes.push(`Turno ${formato.fechaHora(i.fecha_turno)}`);
    if (i.estado === 'firmada') partes.push(`Firmada el ${formato.fecha(i.firmada_at)} · ${insp.conclusion(i.conclusion)}`);
    return partes.join(' · ');
}

function enlaceAviso(i) {
    return el('a', { class: 'boton-link', href: i.url, target: '_blank', rel: 'noopener noreferrer' }, 'Ver el aviso');
}

function filaPedida(i) {
    return el('li', {},
        el('div', { class: 'fila fila--inspeccion' },
            el('span', { class: 'fila__cuerpo' },
                el('span', { class: 'fila__titulo' }, insp.tituloAuto(i)), el('br'),
                el('span', { class: 'fila__meta' }, metaDe(i)), el('br'),
                el('span', { class: 'fila__meta' }, `Cobrás ${formato.precio(i.monto_mecanico)}`)),
            el('ul', { class: 'acciones-fila', role: 'list' },
                el('li', {}, enlaceAviso(i)),
                el('li', {}, boton('Rechazar', () => abrirRechazo(i), 'boton boton--secundario boton--chico')),
                el('li', {}, boton('Aceptar', () => abrirAceptar(i), 'boton boton--chico')))));
}

function filaConInforme(i) {
    const firmada = i.estado === 'firmada';
    return el('li', {},
        el('a', { class: 'fila', href: ruta(`taller-verificacion.html?id=${i.id}`) },
            el('span', { class: 'fila__cuerpo' },
                el('span', { class: 'fila__titulo' }, insp.tituloAuto(i)), el('br'),
                el('span', { class: 'fila__meta' }, metaDe(i))),
            firmada
                ? el('span', { class: 'etiqueta etiqueta--oscura' }, 'Firmada')
                : el('span', { class: 'boton boton--chico' }, 'Revisar y firmar')));
}

const VACIO = {
    pedida: 'No tenés pedidos nuevos.',
    aceptada: 'No tenés inspecciones por revisar.',
    firmada: 'Todavía no firmaste ninguna inspección.',
};

function marcarPestanas(conteos = {}) {
    document.getElementById('ayuda-pestana').textContent = AYUDA[estadoActual];
    document.querySelectorAll('#pestanas [data-estado]').forEach((a) => {
        const e = a.dataset.estado;
        const base = { pedida: 'Pedidos', aceptada: 'Por revisar', firmada: 'Firmadas' }[e];
        a.textContent = conteos[e] !== undefined ? `${base} (${conteos[e]})` : base;
        if (e === estadoActual) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
    });
}

async function cargarBandeja() {
    estado.replaceChildren(vistas.cargando());
    try {
        const r = await api.bandeja(estadoActual);
        marcarPestanas(r.conteos);
        lista.replaceChildren(...r.items.map(estadoActual === 'pedida' ? filaPedida : filaConInforme));
        estado.replaceChildren(r.items.length ? '' : vistas.aviso(VACIO[estadoActual]));
    } catch (error) {
        if (error.status === 401) {
            sesion.requerirLogin();
            return;
        }
        estado.replaceChildren(error.status === 403
            ? vistas.aviso('Esta sección es para los mecánicos de la red.')
            : vistas.avisoDeError(error));
    }
}

// ---------- Aceptar y rechazar ----------

// 'AAAA-MM-DDTHH:MM' en la hora local, el formato de <input type="datetime-local">
function ahoraLocal() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
}

function abrirAceptar(i) {
    elegida = i;
    autoAceptar.textContent = `${insp.tituloAuto(i)} · ${metaDe(i)}`;
    formAceptar.reset();
    formAceptar.elements.fecha_turno.min = ahoraLocal();
    formularios.alerta(formAceptar, '');
    dialogoAceptar.showModal();
}

function abrirRechazo(i) {
    elegida = i;
    autoRechazar.textContent = `${insp.tituloAuto(i)} · ${metaDe(i)}`;
    formRechazar.reset();
    formularios.alerta(formRechazar, '');
    dialogoRechazar.showModal();
}

formularios.alEnviar(formAceptar, async ({ fecha_turno: fechaTurno }) => {
    // El valor del input es hora local sin zona: se manda con la zona para que el back no la adivine.
    await api.aceptar(elegida.id, new Date(fechaTurno).toISOString());
    dialogoAceptar.close();
    avisar(`Aceptaste la inspección de ${insp.tituloAuto(elegida)}.`,
        el('a', { href: ruta(`taller-verificacion.html?id=${elegida.id}`) }, 'Revisar y firmar'));
    await cargarBandeja();
});

formularios.alEnviar(formRechazar, async ({ motivo }) => {
    await api.rechazar(elegida.id, motivo);
    dialogoRechazar.close();
    avisar(`Rechazaste la inspección de ${insp.tituloAuto(elegida)}. Al comprador se le devuelve lo que pagó.`);
    await cargarBandeja();
});

// ---------- Inicio ----------

async function iniciar() {
    marcarPestanas();
    try {
        taller = (await api.perfil()).taller;
        mostrarPerfil();
    } catch (error) {
        if (error.status === 401) {
            sesion.requerirLogin();
            return;
        }
        avisar(error.status === 403 ? 'Esta sección es para los mecánicos de la red.' : error.message);
    }
    await cargarBandeja();
}

if (sesion.requerirPermiso('verificaciones.realizar')) iniciar();
