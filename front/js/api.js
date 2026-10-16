// Acceso a datos. Por ahora responde con datos de prueba (datos/prueba.js).
// Cuando esté la API REST, cada función pasa a hacer fetch al back-end con la misma firma,
// así las vistas no cambian.
import * as datos from './datos/prueba.js';

// Mientras no hay back-end, la sesión simulada se guarda en el navegador.
// En la versión real la sesión es una cookie httpOnly que el JS no puede leer.
const CLAVE_SESION = 'autocar.sesion-prueba';

const esperar = (ms = 150) => new Promise((resolver) => setTimeout(resolver, ms));

export class ErrorApi extends Error {
    constructor(mensaje, campos = {}) {
        super(mensaje);
        this.campos = campos;
    }
}

function sinContrasena(usuario) {
    const { contrasena, ...resto } = usuario;
    return resto;
}

export async function usuarioActual() {
    await esperar(0);
    try {
        const id = Number(localStorage.getItem(CLAVE_SESION));
        const usuario = datos.usuarios.find((u) => u.id === id);
        return usuario ? sinContrasena(usuario) : null;
    } catch {
        return null;
    }
}

export async function cerrarSesion() {
    await esperar();
    try {
        localStorage.removeItem(CLAVE_SESION);
    } catch {
        // Sin almacenamiento disponible: no hay nada que borrar.
    }
}

export function guardarSesionDePrueba(usuario) {
    try {
        localStorage.setItem(CLAVE_SESION, String(usuario.id));
    } catch {
        // Navegación privada: la sesión dura hasta recargar.
    }
}

export async function listarPublicaciones() {
    await esperar();
    return datos.publicaciones;
}
