// Publicaciones del usuario logueado (/api/mis-vehiculos). Todas piden sesión; el back sólo deja ver y
// tocar las propias: una ajena o eliminada responde 404, igual que si no existiera.
import { get, post, put, patch, del } from './cliente.js';

const ruta = (id) => `/api/mis-vehiculos/${encodeURIComponent(id)}`;

// Todas las propias menos las eliminadas, con su estado (pendiente, disponible, rechazado, vendido)
// y motivo_rechazo si el admin la rechazó. → {items}
export const listar = () => get('/api/mis-vehiculos');

// formulario: FormData con los campos del vehículo y las fotos en 'fotos[]' (máx. 5, JPG/PNG/WebP, 2 MB c/u).
// Nace 'pendiente' hasta que la apruebe el admin. → {vehiculo} (201), con vehiculo.fotos
export const crear = (formulario) => post('/api/mis-vehiculos', formulario);

// Cambios parciales en JSON, sin fotos: lo que no se manda queda igual. La publicación vuelve a
// 'pendiente' para que el admin la revise de nuevo. Una vendida no se edita (409). → {vehiculo}
export const actualizar = (id, cambios) => put(ruta(id), cambios);

// Única transición que decide el dueño: disponible → vendido (otra da 422). → {vehiculo}
export const marcarVendida = (id) => patch(`${ruta(id)}/estado`, { estado: 'vendido' });

// Baja lógica: pasa a 'eliminado' y deja de verse, pero las conversaciones que la nombran siguen. → null (204)
export const eliminar = (id) => del(ruta(id));
