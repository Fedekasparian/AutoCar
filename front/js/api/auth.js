// Rutas de autenticación de la API.
import { get, post } from './cliente.js';

// → {token, tipo, expira_en, usuario}
export const login = (email, password) => post('/api/login', { email, password });

// → {usuario} (201). No inicia sesión: después hay que hacer login.
export const registro = (datos) => post('/api/registro', datos);

// → {usuario} del token actual
export const me = () => get('/api/me');
