// Piezas del informe de una inspección que comparten el mecánico (taller-verificacion.html), el comprador
// (verificacion.html) y el admin. Todo con el DOM, nada con innerHTML.
import * as formato from './formato.js';
import * as insp from './inspecciones.js';
import { el } from './vistas.js';

// Pares [dt, dd] → los hijos de un <dl class="datos">. Los pares null se saltean.
export const filasDatos = (pares) =>
    pares.filter(Boolean).flatMap(([dt, dd]) => [el('dt', {}, dt), el('dd', {}, dd)]);

// Los 10 ítems con su resultado y la nota, en el orden del checklist.
export function listaItems(inspeccion) {
    const porCodigo = Object.fromEntries((inspeccion.items || []).map((x) => [x.codigo, x]));
    return el('ul', { class: 'lista-filas', role: 'list' }, ...insp.CHECKLIST.map((c) => {
        const item = porCodigo[c.codigo] || {};
        return el('li', {},
            el('div', { class: 'fila' },
                el('span', { class: 'fila__cuerpo' },
                    el('span', { class: 'fila__titulo' }, c.nombre),
                    item.nota ? el('br') : null,
                    item.nota ? el('span', { class: 'fila__meta' }, item.nota) : null),
                el('span', { class: item.resultado === 'ok' ? 'etiqueta etiqueta--borde' : 'etiqueta etiqueta--oscura' },
                    insp.resultado(item.resultado || '—'))));
    }));
}

// Quién firmó, cuándo y la huella.
export const datosFirma = (i) => filasDatos([
    ['Firmado por', i.firmado_por],
    ['Taller', i.taller_firma],
    ['Fecha', formato.fechaHora(i.firmada_at)],
    ['Huella', el('code', { class: 'huella' }, i.huella)],
]);

// Para el comprador: qué pasa con la inspección y qué sigue, en una línea.
export function proximoPaso(i) {
    switch (i.estado) {
    case 'pedida': return 'Esperando que el mecánico acepte y te dé un turno.';
    case 'aceptada': return `Turno: ${formato.fechaHora(i.fecha_turno)} en ${i.mecanico.direccion}, ${i.mecanico.localidad}.`;
    case 'rechazada': return `El mecánico no la puede hacer: ${i.motivo_rechazo}. Te devolvimos lo que pagaste.`;
    case 'cancelada': return 'La cancelaste. Te devolvimos lo que pagaste.';
    case 'firmada':
        if (i.reclamo) return `Informe ${insp.conclusion(i.conclusion)}. Reclamo: ${insp.estadoReclamo(i.reclamo.estado)}.`;
        if (i.puede_reclamar) return `Informe ${insp.conclusion(i.conclusion)}. Podés reclamar hasta el ${formato.fecha(i.reclamo_hasta)}.`;
        return `Informe ${insp.conclusion(i.conclusion)}.`;
    default: return insp.estado(i.estado);
    }
}

// Etiqueta del estado, en oscuro los que terminaron bien o requieren atención.
export function etiquetaEstado(i) {
    const oscura = i.estado === 'firmada' || i.estado === 'aceptada';
    return el('span', { class: oscura ? 'etiqueta etiqueta--oscura' : 'etiqueta etiqueta--borde' }, insp.estado(i.estado));
}
