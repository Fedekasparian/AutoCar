// Metabuscador: búsquedas guardadas y su reporte con autos de MercadoLibre, Kavak, Autocosmos y AutoCar.
// Todas las rutas piden sesión. Los autos de otros sitios salen del scraper diario (Firestore).
import { get, post, del } from './cliente.js';

const id = (n) => encodeURIComponent(n);

// → {busquedas: [{id, marca, modelo, anio_desde, anio_hasta, precio_max, km_max, transmision, autos, avisos_sin_ver}]}
export const listar = () => get('/api/meta-busquedas');

// → {marcas: [{marca, modelos: [...]}]}: las que tienen autos en las fuentes
export const marcas = () => get('/api/meta-busquedas/marcas');

// datos: {marca, modelo, anio_desde?, anio_hasta?, precio_max?, km_max?, transmision?} → {busqueda} (201)
export const crear = (datos) => post('/api/meta-busquedas', datos);

// filtros: {orden, fuente, page} → {busqueda, referencia, novedades, destacados, resultados, aclaracion, ...}
export const reporte = (busquedaId, filtros) => get(`/api/meta-busquedas/${id(busquedaId)}`, filtros);

// → null (204)
export const eliminar = (busquedaId) => del(`/api/meta-busquedas/${id(busquedaId)}`);

// Marca como vistos los avisos de esa búsqueda → null (204)
export const marcarVistos = (busquedaId) => post(`/api/meta-busquedas/${id(busquedaId)}/avisos/vistos`);
