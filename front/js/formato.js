// Formatos de números y fechas en castellano de Argentina.

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const numero = new Intl.NumberFormat('es-AR');
const fecha = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

// 8500000 → "$ 8.500.000" (sin espacio, como en los wireframes)
export const precio = (valor) => pesos.format(valor).replace(/\s/g, '');

export const kilometros = (valor) => `${numero.format(valor)} km`;

export const fechaCorta = (valor) => fecha.format(new Date(valor));
