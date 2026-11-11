// Cómo se muestran los criterios de una búsqueda guardada (lista y resultados del metabuscador).
import * as formato from './formato.js';

// "Volkswagen Gol Trend · 2015 a 2019 · hasta $12.000.000"
export function criterios(b) {
    const partes = [`${b.marca} ${b.modelo}`];
    if (b.anio_desde || b.anio_hasta) partes.push(`${b.anio_desde || '…'} a ${b.anio_hasta || '…'}`);
    if (b.precio_max) partes.push(`hasta ${formato.precio(b.precio_max)}`);
    if (b.km_max) partes.push(`hasta ${formato.km(b.km_max)}`);
    if (b.transmision) partes.push(formato.transmision(b.transmision));
    return partes.join(' · ');
}
