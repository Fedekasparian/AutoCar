// Piezas del informe de una inspección que comparten el mecánico (taller-verificacion.html), el comprador
// (verificacion.html) y el admin. Todo con el DOM, nada con innerHTML.
import * as formato from './formato.js';
import * as insp from './inspecciones.js';
import { el } from './vistas.js';

// Pares [dt, dd] → los hijos de un <dl class="datos">. Los pares null se saltean.
export const filasDatos = (pares) =>
    pares.filter(Boolean).flatMap(([dt, dd]) => [el('dt', {}, dt), el('dd', {}, dd)]);

// Los 10 ítems con su resultado y la nota, en el orden del checklist. Cada uno con su color:
// verde OK, ámbar Observado y rojo Falla (también con un ícono, para no depender solo del color).
const ICONO_RESULTADO = { ok: '✓', observado: '!', falla: '✕' };
export function listaItems(inspeccion) {
    const porCodigo = Object.fromEntries((inspeccion.items || []).map((x) => [x.codigo, x]));
    return el('ul', { class: 'lista-filas items-informe', role: 'list' }, ...insp.CHECKLIST.map((c) => {
        const item = porCodigo[c.codigo] || {};
        const r = insp.RESULTADOS[item.resultado] ? item.resultado : 'sin';
        return el('li', { class: `item-informe item-informe--${r}` },
            el('div', { class: 'fila' },
                el('span', { class: 'item-informe__icono', 'aria-hidden': 'true' }, ICONO_RESULTADO[r] || '–'),
                el('span', { class: 'fila__cuerpo' },
                    el('span', { class: 'fila__titulo' }, c.nombre),
                    el('span', { class: 'fila__meta' }, item.nota || c.detalle)),
                el('span', { class: `etiqueta resultado resultado--${r}` }, insp.resultado(item.resultado || '—'))));
    }));
}

// "8 OK · 1 observado · 1 falla" con una barra de tres colores proporcional
export function resumenItems(inspeccion) {
    const cuenta = { ok: 0, observado: 0, falla: 0 };
    (inspeccion.items || []).forEach((x) => { if (x.resultado in cuenta) cuenta[x.resultado] += 1; });
    const barra = el('span', { class: 'resumen-items__barra', 'aria-hidden': 'true' },
        ...Object.entries(cuenta).filter(([, n]) => n).map(([r, n]) => {
            const tramo = el('span', { class: `resumen-items__tramo resultado--${r}` });
            tramo.style.flexGrow = String(n);
            return tramo;
        }));
    const textos = [[cuenta.ok, 'OK'], [cuenta.observado, cuenta.observado === 1 ? 'observado' : 'observados'],
        [cuenta.falla, cuenta.falla === 1 ? 'falla' : 'fallas']].filter(([n]) => n).map(([n, t]) => `${n} ${t}`);
    return el('div', { class: 'resumen-items' }, barra, el('p', { class: 'resumen-items__texto' }, textos.join(' · ')));
}

// Conclusión del mecánico como una etiqueta grande con color
export const conclusionDestacada = (i) =>
    el('span', { class: `conclusion conclusion--${i.conclusion}` }, insp.conclusion(i.conclusion));

// Sello de "Firmado" con el nombre y la fecha (decorativo: los datos están en el <dl> de la firma)
export const sello = (i) => el('div', { class: 'sello', 'aria-hidden': 'true' },
    el('span', { class: 'sello__titulo' }, 'Firmado'),
    el('span', { class: 'sello__nombre' }, i.firmado_por || ''),
    el('span', { class: 'sello__fecha' }, formato.fecha(i.firmada_at)));

// Por dónde va el pedido: Pedida → Aceptada (turno) → Firmada. Si terminó de otra forma (rechazada,
// cancelada o no se pudo hacer), el último paso va en rojo con ese estado.
export function lineaDeTiempo(i) {
    const orden = ['pedida', 'aceptada', 'firmada'];
    const corte = ['rechazada', 'cancelada', 'no_realizada'].includes(i.estado);
    const hasta = corte ? (i.estado === 'no_realizada' ? 1 : 0) : orden.indexOf(i.estado);
    const pasos = [
        ['Pedida', formato.fecha(i.created_at)],
        ['Aceptada', i.fecha_turno ? `Turno ${formato.fechaHora(i.fecha_turno)}` : ''],
        ['Firmada', i.firmada_at ? formato.fecha(i.firmada_at) : ''],
    ];
    const items = pasos.map(([nombre, detalle], n) => {
        let clase = 'pendiente';
        if (n <= hasta) clase = 'hecho';
        if (!corte && n === hasta && i.estado !== 'firmada') clase = 'actual';
        return el('li', { class: `linea-tiempo__paso linea-tiempo__paso--${clase}` },
            el('span', { class: 'linea-tiempo__punto', 'aria-hidden': 'true' }),
            el('span', { class: 'linea-tiempo__nombre' }, nombre),
            detalle && n <= hasta ? el('span', { class: 'linea-tiempo__detalle' }, detalle) : null);
    });
    if (corte) {
        items.splice(hasta + 1, items.length, el('li', { class: 'linea-tiempo__paso linea-tiempo__paso--corte' },
            el('span', { class: 'linea-tiempo__punto', 'aria-hidden': 'true' }),
            el('span', { class: 'linea-tiempo__nombre' }, insp.estado(i.estado))));
    }
    return el('ol', { class: 'linea-tiempo', 'aria-label': `Estado del pedido: ${insp.estado(i.estado)}` }, ...items);
}

// Quién firmó y cuándo. La huella (SHA-256) la guarda el back para controlar que el informe no cambió,
// pero no se muestra en ninguna pantalla.
export const datosFirma = (i) => filasDatos([
    ['Firmado por', i.firmado_por],
    ['Taller', i.taller_firma],
    ['Fecha', formato.fechaHora(i.firmada_at)],
]);

// Para el comprador: qué pasa con la inspección y qué sigue, en una línea.
export function proximoPaso(i) {
    switch (i.estado) {
    case 'pedida': return 'Esperando que el mecánico acepte y te dé un turno.';
    case 'aceptada': return `Turno: ${formato.fechaHora(i.fecha_turno)} en ${i.mecanico.direccion}, ${i.mecanico.localidad}.`;
    case 'rechazada': return `El mecánico no la puede hacer: ${i.motivo_rechazo}. Te devolvimos lo que pagaste.`;
    case 'cancelada': return 'La cancelaste. Te devolvimos lo que pagaste.';
    case 'no_realizada': return `El mecánico no la pudo hacer: ${i.motivo_rechazo}. Te devolvimos lo que pagaste.`;
    case 'firmada':
        if (i.reclamo) return `Informe ${insp.conclusion(i.conclusion)}. Reclamo: ${insp.estadoReclamo(i.reclamo.estado)}.`;
        if (i.puede_reclamar) return `Informe ${insp.conclusion(i.conclusion)}. Podés reclamar hasta el ${formato.fecha(i.reclamo_hasta)}.`;
        return `Informe ${insp.conclusion(i.conclusion)}.`;
    default: return insp.estado(i.estado);
    }
}

// Etiqueta del estado, en oscuro los que terminaron bien o requieren atención.
export function etiquetaEstado(i) {
    return el('span', { class: `etiqueta etiqueta-insp etiqueta-insp--${i.estado}` }, insp.estado(i.estado));
}

// Qué revisa el mecánico y qué queda afuera (insp.ALCANCE), como <details> plegable.
export function bloqueAlcance(abierto = false) {
    const lista = (items) => el('ul', { class: 'pila' }, ...items.map((t) => el('li', {}, t)));
    return el('details', { class: 'alcance', open: abierto },
        el('summary', {}, 'Qué revisa el mecánico y qué queda afuera'),
        el('h3', { class: 'alcance__titulo' }, 'Revisa, sin desarmar el auto'),
        lista(insp.ALCANCE.cubre()),
        el('h3', { class: 'alcance__titulo' }, 'No cubre'),
        lista(insp.ALCANCE.noCubre),
        el('p', { class: 'campo__ayuda' }, insp.ALCANCE.procede));
}
