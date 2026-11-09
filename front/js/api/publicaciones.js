// Publicaciones del usuario logueado (/api/mis-vehiculos). Todas piden sesión; el back sólo deja ver y
// tocar las propias: una ajena o eliminada responde 404, igual que si no existiera.
import { get, post, put, patch, del } from './cliente.js';

const ruta = (id) => `/api/mis-vehiculos/${encodeURIComponent(id)}`;

// Todas las propias menos las eliminadas, con su estado (pendiente, disponible, rechazado, vendido),
// motivo_rechazo si el admin la rechazó, y completa / faltan (publicar por partes). → {items}
export const listar = () => get('/api/mis-vehiculos');

// Una propia con todas sus fotos (para seguir completándola). → {vehiculo} con vehiculo.fotos
export const detalle = (id) => get(ruta(id));

// Publicar por partes: alcanza con marca, modelo y anio; lo demás y las fotos se pueden mandar después.
// formulario: FormData (las fotos van en 'fotos[]': máx. 5, JPG/PNG/WebP, 2 MB c/u).
// Nace 'pendiente'; el moderador recién la puede aprobar cuando está completa (vehiculo.faltan vacío).
// → {vehiculo} (201), con vehiculo.fotos
export const crear = (formulario) => post('/api/mis-vehiculos', formulario);

// Agrega fotos (FormData con 'fotos[]') a las que ya tiene, hasta 5 entre todas. → {vehiculo} (201) con fotos
export const agregarFotos = (id, formulario) => post(`${ruta(id)}/fotos`, formulario);

// Saca una foto (fotoId = el número del final de su ruta /api/fotos/{id}). → {vehiculo} con fotos
export const eliminarFoto = (id, fotoId) => del(`${ruta(id)}/fotos/${encodeURIComponent(fotoId)}`);

// Cambios parciales en JSON, sin fotos: lo que no se manda queda igual. La publicación vuelve a
// 'pendiente' para que el admin la revise de nuevo. Una vendida no se edita (409). → {vehiculo}
export const actualizar = (id, cambios) => put(ruta(id), cambios);

// Única transición que decide el dueño: disponible → vendido (otra da 422). → {vehiculo}
export const marcarVendida = (id) => patch(`${ruta(id)}/estado`, { estado: 'vendido' });

// Baja lógica: pasa a 'eliminado' y deja de verse, pero las conversaciones que la nombran siguen. → null (204)
export const eliminar = (id) => del(ruta(id));
