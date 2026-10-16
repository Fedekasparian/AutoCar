// Usuario de la sesión actual. Se carga al abrir la app y se actualiza al entrar o salir.
import * as api from './api.js';

export const sesion = {
    usuario: null,
};

export async function cargarSesion() {
    sesion.usuario = await api.usuarioActual();
    return sesion.usuario;
}

export function cambiarUsuario(usuario) {
    sesion.usuario = usuario;
    window.dispatchEvent(new CustomEvent('cambiodesesion', { detail: { usuario } }));
}
