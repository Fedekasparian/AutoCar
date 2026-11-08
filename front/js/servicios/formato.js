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
export const ESTADOS = {
    pendiente: 'Pendiente', disponible: 'Disponible', rechazado: 'Rechazado', vendido: 'Vendido', eliminado: 'Eliminado',
};
export const ROLES = { usuario: 'Usuario', moderador: 'Moderador', admin: 'Administrador', mecanico: 'Mecánico' };
export const rol = (valor) => ROLES[valor] || valor;

export const combustible = (valor) => COMBUSTIBLES[valor] || valor;
export const transmision = (valor) => TRANSMISIONES[valor] || valor;
export const estado = (valor) => ESTADOS[valor] || valor;

export const titulo = (v) => `${v.marca} ${v.modelo} ${v.anio}`;

// Fechas ISO de la API ('2026-11-12T10:00:00-03:00') en hora de Argentina: 12/11/2026 y 12/11/2026, 10:00
const DIA = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeZone: 'America/Argentina/Buenos_Aires' });
const DIA_HORA = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Argentina/Buenos_Aires',
});
const aFecha = (iso) => (iso ? new Date(iso) : null);
export const fecha = (iso) => (aFecha(iso) && !Number.isNaN(aFecha(iso).getTime()) ? DIA.format(aFecha(iso)) : '');
export const fechaHora = (iso) =>
    (aFecha(iso) && !Number.isNaN(aFecha(iso).getTime()) ? DIA_HORA.format(aFecha(iso)) : '');
