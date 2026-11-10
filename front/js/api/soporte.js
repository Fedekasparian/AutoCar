// Mensajes al equipo: contacto (público) y reportes (con sesión), y su lectura en el panel.
import { get, post, patch } from './cliente.js';

const id = (n) => encodeURIComponent(n);

// {email, mensaje} → 201. 429 si ya escribió 3 veces en la última hora.
export const contactar = (datos) => post('/api/contacto', datos);

// {vehiculo_id | usuario_id, motivo, detalle?} → 201
export const reportar = (datos) => post('/api/reportes', datos);

// Panel. → {items}
export const contactos = () => get('/api/admin/contactos');
export const leerContacto = (contactoId) => patch(`/api/admin/contactos/${id(contactoId)}`);
export const reportes = () => get('/api/admin/reportes');
export const resolverReporte = (reporteId) => patch(`/api/admin/reportes/${id(reporteId)}`);
