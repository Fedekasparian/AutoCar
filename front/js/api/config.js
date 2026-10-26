// RUTAS: todo el front (HTML, CSS y JS) usa rutas RELATIVAS; las páginas internas se resuelven con js/servicios/rutas.js.
// Las únicas URLs absolutas son las de la API (abajo). Si el front se publica en una subcarpeta, sigue andando.
// CORS: la dirección donde se abre el front tiene que estar en FRONT_URL del back, si no el navegador bloquea los pedidos.
// Dirección de la API (AutoCarBackend). Abriendo el front en localhost o 127.0.0.1 se usa el back local;
// en cualquier otro lado (Vercel, Render), el desplegado. Sin barra al final.
const LOCAL = 'http://localhost:8000';
const PRODUCCION = 'https://autocarbackend-1.onrender.com';

const enLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);

export const API_URL = enLocal ? LOCAL : PRODUCCION;
