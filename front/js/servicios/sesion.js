// Sesión del usuario: el token JWT y los datos públicos del usuario que devuelve el login.
// Se guardan en sessionStorage (se borran al cerrar la pestaña). El back no usa cookies:
// salir es simplemente descartar el token.
import { ruta } from './rutas.js';
const CLAVE = 'autocar.sesion';

function leer() {
    try {
        const guardada = JSON.parse(sessionStorage.getItem(CLAVE));
        if (!guardada?.token) return null;
        if (guardada.vence && Date.now() > guardada.vence) {
            sessionStorage.removeItem(CLAVE);
            return null;
        }
        return guardada;
    } catch {
        return null;
    }
}

// respuestaLogin: {token, expira_en, usuario}
export function guardar({ token, expira_en: expiraEn, usuario }) {
    const vence = expiraEn ? Date.now() + expiraEn * 1000 : null;
    try {
        sessionStorage.setItem(CLAVE, JSON.stringify({ token, vence, usuario }));
    } catch {
        // Sin almacenamiento disponible (navegación privada estricta): la sesión no persiste.
    }
}

export function actualizarUsuario(usuario) {
    const actual = leer();
    if (!actual) return;
    try {
        sessionStorage.setItem(CLAVE, JSON.stringify({ ...actual, usuario }));
    } catch {
        // Sin almacenamiento disponible.
    }
}

export function cerrar() {
    try {
        sessionStorage.removeItem(CLAVE);
    } catch {
        // Nada que borrar.
    }
}

export const token = () => leer()?.token || null;
export const usuario = () => leer()?.usuario || null;
export const iniciada = () => leer() !== null;
export const esAdmin = () => usuario()?.rol === 'admin';

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
