// Rutas públicas del catálogo.
import { get } from './cliente.js';

// filtros: {q, marca, combustible, precio_max, page} → {items, total, pagina, por_pagina, paginas}
export const listar = (filtros) => get('/api/vehiculos', filtros);

// → {vehiculo}
export const detalle = (id) => get(`/api/vehiculos/${encodeURIComponent(id)}`);

// → {marcas: ['Ford', 'Toyota', ...]}: las que tienen autos publicados (para el filtro del catálogo)
export const marcas = () => get('/api/marcas');

// → {marcas: [{marca: 'Ford', modelos: ['Fiesta', 'Focus', ...]}, ...]}: las que se pueden publicar
export const marcasModelos = () => get('/api/marcas-modelos');
