// Dirección de la API (AutoCarBackend). Abriendo el front en localhost o 127.0.0.1 se usa el back local;
// en cualquier otro lado (Vercel, Render), el desplegado. Sin barra al final.
const LOCAL = 'http://localhost:8000';
const PRODUCCION = 'https://autocarbackend-1.onrender.com';

const enLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);

export const API_URL = enLocal ? LOCAL : PRODUCCION;
