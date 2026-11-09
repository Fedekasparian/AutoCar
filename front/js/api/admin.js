// Rutas de administración. Cada una pide un permiso en el back (ver routes.php): vehiculos.moderar,
// vehiculos.gestionar, usuarios.ver, usuarios.editar o metricas.ver.
import { get, post, put, patch, del } from './cliente.js';

// Igual que el listado público, pero incluye los vendidos y trae 15 por página.
export const listar = (filtros) => get('/api/admin/vehiculos', filtros);

// → {vehiculo} (201)
export const crear = (vehiculo) => post('/api/admin/vehiculos', vehiculo);

// Se manda el objeto completo. → {vehiculo}
export const actualizar = (id, vehiculo) => put(`/api/admin/vehiculos/${encodeURIComponent(id)}`, vehiculo);

// → null (204). Baja lógica: pasa a 'eliminado'.
export const eliminar = (id) => del(`/api/admin/vehiculos/${encodeURIComponent(id)}`);

// Detalle con todas las fotos y quién lo publicó (sirve también para los pendientes y rechazados). → {vehiculo}
export const detalle = (id) => get(`/api/admin/vehiculos/${encodeURIComponent(id)}`);

// Moderación: {estado: 'disponible'} aprueba; {estado: 'rechazado', motivo} rechaza. → {vehiculo}
export const moderar = (id, estado, motivo) =>
    patch(`/api/admin/vehiculos/${encodeURIComponent(id)}/estado`, motivo ? { estado, motivo } : { estado });

// Usuarios: filtros {q, rol, activo: '1'|'0', page} → {items, total, pagina, por_pagina, paginas}
export const usuarios = (filtros) => get('/api/admin/usuarios', filtros);

// Cambios parciales {nombre?, rol?, activo?} → {usuario}
export const actualizarUsuario = (id, cambios) => patch(`/api/admin/usuarios/${encodeURIComponent(id)}`, cambios);

// Baja lógica → null (204)
export const bajaUsuario = (id) => del(`/api/admin/usuarios/${encodeURIComponent(id)}`);

// → {items: [{nombre, descripcion, permisos}]}
export const roles = () => get('/api/admin/roles');

// Reclamos de inspecciones (permiso reclamos.resolver). estado: abierto | procede | no_procede
// → {items: [{id, estado, item_codigo, descripcion, compensacion, tope, respuesta, created_at, resuelto_at,
//    resuelto_por, inspeccion: {id, titulo, url, fuente, precio, conclusion, firmada_at, mecanico, comprador}}]}
export const reclamos = (estado) => get('/api/admin/reclamos', { estado });

// {procede: true, compensacion, respuesta} o {procede: false, respuesta} → {reclamo}
export const resolverReclamo = (id, resolucion) => patch(`/api/admin/reclamos/${encodeURIComponent(id)}`, resolucion);

// → {usuarios, publicaciones, moderacion, chat, ganancias}
// Solicitudes de "Adherí tu taller" (permiso usuarios.editar). estado: pendiente | aprobado | rechazado
// → {items: [solicitud]} (la forma está en api/inspecciones.js)
export const solicitudesTaller = (estado) => get('/api/admin/solicitudes-taller', { estado });

// {aprobar: true} (el usuario pasa a mecánico y el taller entra al ranking) o {aprobar: false, motivo} → {solicitud}.
// id = el del usuario que la pidió.
export const resolverSolicitudTaller = (id, resolucion) =>
    patch(`/api/admin/solicitudes-taller/${encodeURIComponent(id)}`, resolucion);

export const metricas = () => get('/api/admin/metricas');
