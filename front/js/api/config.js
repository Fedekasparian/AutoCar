// RUTAS: todo el front (HTML, CSS y JS) usa rutas RELATIVAS; las páginas internas se resuelven con js/servicios/rutas.js.
// Dirección de la API (AutoCarBackend). Sin barra al final.
// - En local (localhost o 127.0.0.1) se usa el back local. Tiene que estar en FRONT_URL del back (CORS).
// - Publicado, la API se pide al MISMO dominio del front (/api/...) y Vercel la reenvía a Render
//   (ver vercel.json). Así la cookie de sesión es del propio sitio y no una cookie de terceros,
//   que Safari y otros navegadores bloquean.
const LOCAL = 'http://localhost:8000';
const PRODUCCION = '';

const enLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);

export const API_URL = enLocal ? LOCAL : PRODUCCION;
