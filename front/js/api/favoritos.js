// Favoritos del usuario logueado. Todas las rutas piden sesión.
import { get, put, del } from './cliente.js';

const id = (n) => encodeURIComponent(n);

// → {items}: las mismas fichas que el catálogo, el último guardado primero
export const listar = () => get('/api/favoritos');

// → null (204). Guardarlo dos veces no da error. 409 vehiculo_propio si es una publicación propia.
export const agregar = (vehiculoId) => put(`/api/favoritos/${id(vehiculoId)}`);

// → null (204)
export const sacar = (vehiculoId) => del(`/api/favoritos/${id(vehiculoId)}`);
