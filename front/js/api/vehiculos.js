// Rutas públicas del catálogo.
import { get } from './cliente.js';

// filtros: {q, marca, combustible, precio_max, page} → {items, total, pagina, por_pagina, paginas}
export const listar = (filtros) => get('/api/vehiculos', filtros);

// → {vehiculo}
export const detalle = (id) => get(`/api/vehiculos/${encodeURIComponent(id)}`);

// → {marcas: ['Ford', 'Toyota', ...]}
export const marcas = () => get('/api/marcas');
