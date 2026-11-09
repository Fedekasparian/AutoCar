// Chat entre el interesado y el vendedor de una publicación de AutoCar. Todas las rutas piden sesión.
// Una conversación de la que el usuario no participa responde 404, igual que si no existiera.
//
// Conversación: {id, rol: interesado|vendedor, vehiculo: {id, titulo, estado, foto}, con: {id, nombre},
//                ultimo_mensaje, no_leidos, abierta, actualizada}
// Mensaje:      {id, texto, propio, leido, fecha}
import { get, post } from './cliente.js';

const id = (n) => encodeURIComponent(n);

// Abre (o recupera) la conversación con el vendedor. → {conversacion: {id}} (201 si es nueva)
// 409 vehiculo_propio si es una publicación propia; 409 sin_vendedor si el auto no tiene vendedor.
export const abrir = (vehiculoId) => post(`/api/vehiculos/${id(vehiculoId)}/conversacion`, {});

// → {items: [conversacion]}, la de actividad más reciente primero
export const bandeja = () => get('/api/conversaciones');

// Mensajes con id mayor a desde (0 = desde el principio). Lo que llega queda marcado como leído.
// → {items: [mensaje], ultimo_id, abierta}
export const mensajes = (n, desde = 0) => get(`/api/conversaciones/${id(n)}/mensajes`, { desde });

// {texto} (1 a 1000 caracteres) → {mensaje} (201). 409 conversacion_cerrada si la publicación se eliminó.
export const enviar = (n, texto) => post(`/api/conversaciones/${id(n)}/mensajes`, { texto });

export const MAX_LARGO = 1000;
