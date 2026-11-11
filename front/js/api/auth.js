// Rutas de autenticación de la API.
import { get, post, put, del } from './cliente.js';

// → {csrf, expira_en, usuario}. El id de la sesión queda en una cookie HttpOnly que pone el back.
export const login = (email, password) => post('/api/login', { email, password });

// → 204. Borra la cookie de sesión (JavaScript no puede porque es HttpOnly).
export const logout = () => post('/api/logout');

// → {usuario} (201). No inicia sesión: después hay que hacer login.
export const registro = (datos) => post('/api/registro', datos);

// → {usuario, csrf} de la sesión actual
export const me = () => get('/api/me');

// Mi perfil. → {usuario}
export const actualizarPerfil = (nombre) => put('/api/me', { nombre });

// formulario: FormData con el campo "foto" (JPG, PNG o WebP de hasta 2 MB). → {usuario}
export const subirFoto = (formulario) => post('/api/me/foto', formulario);

// → null (204)
export const borrarFoto = () => del('/api/me/foto');
