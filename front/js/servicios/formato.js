// Cómo se muestran los datos que llegan de la API.
const numero = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

export const precio = (valor) => `$${numero.format(valor)}`;
export const km = (valor) => `${numero.format(valor)} km`;

export const COMBUSTIBLES = {
    nafta: 'Nafta',
    diesel: 'Diésel',
    gnc: 'GNC',
    hibrido: 'Híbrido',
    electrico: 'Eléctrico',
};
export const TRANSMISIONES = { manual: 'Manual', automatica: 'Automática' };
export const ESTADOS = { disponible: 'Disponible', vendido: 'Vendido' };

export const combustible = (valor) => COMBUSTIBLES[valor] || valor;
export const transmision = (valor) => TRANSMISIONES[valor] || valor;
export const estado = (valor) => ESTADOS[valor] || valor;

export const titulo = (v) => `${v.marca} ${v.modelo} ${v.anio}`;
