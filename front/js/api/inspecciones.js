// Inspecciones: el ranking público, el lado del comprador y el del mecánico (permiso verificaciones.realizar).
// Cada uno ve sólo sus inspecciones: el back responde 404 si la inspección es de otro.
//
// Una inspección llega así:
// {id, estado: pedida|aceptada|rechazada|cancelada|firmada|no_realizada, fuente, url, vehiculo_id, titulo, anio, kilometraje,
//  precio_publicado, localidad, fecha_turno, motivo_rechazo, precio, monto_mecanico, monto_autocar, monto_fondo,
//  pago: retenido|liberado|reembolsado, conclusion, resumen, firmado_por, taller_firma, firmada_at, huella,
//  created_at, comprador: {id, nombre}, mecanico: {id, nombre, taller, direccion, localidad},
//  reclamo: null | {id, estado: abierto|procede|no_procede, item_codigo, descripcion, compensacion, respuesta, ...},
//  reclamo_hasta, puede_reclamar, items: [{codigo, resultado, nota}]}   (items sólo en el detalle)
import { get, post, put, patch } from './cliente.js';

const id = (n) => encodeURIComponent(n);

// ---------- Público y comprador ----------

// Ranking de la red → {items: [{id, mecanico, taller, direccion, localidad, precio_inspeccion, desglose,
// firmadas, reclamos_procedentes, puntaje, nuevo}], localidades}
export const mecanicos = (localidad) => get('/api/mecanicos', { localidad });

// {url, mecanico_id, titulo?, anio?, kilometraje?, precio_publicado?, localidad?} → {inspeccion} (201)
export const pedir = (pedido) => post('/api/inspecciones', pedido);

// → {items: [inspeccion]}: las que pidió el usuario
export const mias = () => get('/api/mis-inspecciones');

// Sólo antes de que el mecánico la acepte. → {inspeccion}
export const cancelar = (n) => post(`/api/inspecciones/${id(n)}/cancelar`, {});

// Una vez, hasta 15 días después de la firma. {descripcion, item_codigo?} → {inspeccion} (201)
export const reclamar = (n, reclamo) => post(`/api/inspecciones/${id(n)}/reclamo`, reclamo);

// ---------- Mecánico ----------

// → {taller: {nombre, direccion, localidad, telefono, precio_inspeccion, activo} | null}
export const perfil = () => get('/api/mecanico/perfil');

// {nombre, direccion, localidad, telefono, precio_inspeccion} → {taller}
export const guardarPerfil = (datos) => put('/api/mecanico/perfil', datos);

// Bandeja por estado → {items: [inspeccion], conteos: {pedida, aceptada, firmada, ...}}
export const bandeja = (estado) => get('/api/mecanico/inspecciones', { estado });

// Detalle con el checklist. Lo ven el comprador, el mecánico asignado y el admin. → {inspeccion}
export const detalle = (n) => get(`/api/inspecciones/${id(n)}`);

// Sólo desde "pedida". Aceptar pide la fecha del turno (ISO 8601). → {inspeccion}
export const aceptar = (n, fechaTurno) =>
    patch(`/api/mecanico/inspecciones/${id(n)}`, { accion: 'aceptar', fecha_turno: fechaTurno });

// Rechazar pide el motivo; al comprador se le devuelve todo. → {inspeccion}
export const rechazar = (n, motivo) =>
    patch(`/api/mecanico/inspecciones/${id(n)}`, { accion: 'rechazar', motivo });

// Sólo desde "aceptada": fue y no la pudo hacer (por ejemplo, el vendedor no dejó revisar el auto).
// Pide el motivo; al comprador se le devuelve todo. → {inspeccion}
export const noRealizada = (n, motivo) =>
    patch(`/api/mecanico/inspecciones/${id(n)}`, { accion: 'no_realizada', motivo });

// Guarda el checklist (se puede a medias) mientras no esté firmada. {items, conclusion, resumen} → {inspeccion}
export const guardarInforme = (n, informe) => put(`/api/mecanico/inspecciones/${id(n)}/informe`, informe);

// Firma lo guardado: exige los 10 ítems y la conclusión. Después, cualquier cambio da 409. → {inspeccion}
export const firmar = (n) => post(`/api/mecanico/inspecciones/${id(n)}/firma`, {});

// ---------- "Adherí tu taller" ----------
// La solicitud llega así: {usuario_id, responsable, email, rol, taller, cuit, direccion, localidad, telefono, horarios,
//  precio_inspeccion, estado: pendiente|aprobado|rechazado, motivo_rechazo, creada, resuelta, resuelta_por}

// Sin sesión: crea la cuenta del taller (aparte de la personal) y la solicitud pendiente.
// {responsable, email, password, nombre, cuit, direccion, localidad, telefono, horarios, precio_inspeccion,
//  condiciones: true} → {solicitud} (201). Email con cuenta → 422; solicitud pendiente con ese email → 409.
export const enviarSolicitud = (datos) => post('/api/solicitudes-taller', datos);
