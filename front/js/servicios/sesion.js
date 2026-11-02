// Sesión del usuario. El id de sesión (la sesión vive en el back, en $_SESSION) va en una cookie HttpOnly que pone el back:
// JavaScript no la puede leer ni borrar (salir es POST /api/logout). Acá sólo se guardan, en sessionStorage,
// los datos públicos del usuario (para mostrar nombre y rol) y el token CSRF que el back pide en cada cambio.
import { ruta } from './rutas.js';
const CLAVE = 'autocar.sesion';

function leer() {
    try {
        const guardada = JSON.parse(sessionStorage.getItem(CLAVE));
        if (!guardada?.usuario) return null;
        if (guardada.vence && Date.now() > guardada.vence) {
            sessionStorage.removeItem(CLAVE);
            return null;
        }
        return guardada;
    } catch {
        return null;
    }
}

// respuestaLogin: {csrf, expira_en, usuario}
export function guardar({ csrf, expira_en: expiraEn, usuario }) {
    const vence = expiraEn ? Date.now() + expiraEn * 1000 : null;
    try {
        sessionStorage.setItem(CLAVE, JSON.stringify({ csrf, vence, usuario }));
    } catch {
        // Sin almacenamiento disponible (navegación privada estricta): la sesión no persiste.
    }
}

// Con lo que devuelve GET /api/me: el usuario puede haber cambiado (rol) y el csrf se renueva.
export function actualizar({ usuario, csrf }) {
    const actual = leer();
    if (!actual) return;
    try {
        sessionStorage.setItem(CLAVE, JSON.stringify({ ...actual, usuario, csrf: csrf || actual.csrf }));
    } catch {
        // Sin almacenamiento disponible.
    }
}

// Sólo borra lo guardado en el navegador; la cookie la borra el back con POST /api/logout.
export function cerrar() {
    try {
        sessionStorage.removeItem(CLAVE);
    } catch {
        // Nada que borrar.
    }
}

export const csrf = () => leer()?.csrf || null;
export const usuario = () => leer()?.usuario || null;
export const iniciada = () => leer() !== null;
export const esAdmin = () => usuario()?.rol === 'admin';
// Permisos del rol (vienen en el usuario del login y de /api/me), p. ej. puede('vehiculos.moderar').
// Sólo sirve para mostrar u ocultar cosas: el back vuelve a controlar el permiso en cada pedido.
export const puede = (permiso) => (usuario()?.permisos || []).includes(permiso);

// Página actual (sin el dominio), para volver a ella después del login.
function aqui() {
    return window.location.pathname.split('/').pop() + window.location.search;
}

// Si no hay sesión, manda a login.html y después vuelve a esta página. Devuelve false si redirigió.
export function requerirLogin() {
    if (iniciada()) return true;
    window.location.replace(ruta(`login.html?volver=${encodeURIComponent(aqui())}`));
    return false;
}

// Para las pantallas de administración. El back vuelve a controlar el rol en cada pedido.
export function requerirAdmin() {
    if (!requerirLogin()) return false;
    if (esAdmin()) return true;
    window.location.replace(ruta('home.html'));
    return false;
}

// Destino seguro del parámetro ?volver= (sólo páginas de este mismo sitio).
export function destinoDespuesDelLogin() {
    const volver = new URLSearchParams(window.location.search).get('volver') || '';
    return (/^[\w-]+\.html(\?[^#]*)?$/.test(volver) && ruta(volver)) || ruta('home.html');
}
