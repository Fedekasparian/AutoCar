// Rutas de administración de vehículos (el back exige token de un usuario con rol admin).
import { get, post, put, del } from './cliente.js';

// Igual que el listado público, pero incluye los vendidos y trae 15 por página.
export const listar = (filtros) => get('/api/admin/vehiculos', filtros);

// → {vehiculo} (201)
export const crear = (vehiculo) => post('/api/admin/vehiculos', vehiculo);

// Se manda el objeto completo. → {vehiculo}
export const actualizar = (id, vehiculo) => put(`/api/admin/vehiculos/${encodeURIComponent(id)}`, vehiculo);

// → null (204)
export const eliminar = (id) => del(`/api/admin/vehiculos/${encodeURIComponent(id)}`);
