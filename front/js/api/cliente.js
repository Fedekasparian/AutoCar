// Cliente HTTP de la API: arma la URL, manda la cookie de sesión y el token CSRF, y convierte las respuestas.
// Todos los fetch del front pasan por acá; los archivos de al lado (auth.js, vehiculos.js, admin.js)
// sólo dicen qué ruta llamar.
import { API_URL } from './config.js';
import * as sesion from '../servicios/sesion.js';

// Error con la forma de la API: {"error": "codigo", "mensaje": "...", "errores": {campo: mensaje}}.
// status 0 = no se pudo conectar.
export class ErrorApi extends Error {
    constructor(status, codigo, mensaje, errores = {}) {
        super(mensaje);
        this.status = status;
        this.codigo = codigo;
        this.errores = errores;
    }
}

function armarUrl(ruta, consulta) {
    // Con API_URL vacío (publicado) la ruta queda relativa al dominio del front
    const url = new URL(API_URL + ruta, window.location.origin);
    Object.entries(consulta || {}).forEach(([clave, valor]) => {
        if (valor !== undefined && valor !== null && valor !== '') url.searchParams.set(clave, valor);
    });
    return url;
}

export async function pedir(metodo, ruta, { consulta, cuerpo } = {}) {
    const cabeceras = { Accept: 'application/json' };
    // Lo que cambia datos lleva el token CSRF: otro sitio puede hacer que el navegador mande la cookie,
    // pero no puede conocer este valor.
    const csrf = sesion.csrf();
    if (csrf && metodo !== 'GET') cabeceras['X-CSRF-Token'] = csrf;
    if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';

    let respuesta;
    try {
        respuesta = await fetch(armarUrl(ruta, consulta), {
            method: metodo,
            headers: cabeceras,
            credentials: 'include', // manda y recibe la cookie de sesión (en local la API está en otro puerto)
            body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
        });
    } catch {
        throw new ErrorApi(0, 'sin_conexion',
            'No se pudo conectar con el servidor. Probá de nuevo en un minuto.');
    }

    if (respuesta.status === 204) return null;

    let datos = null;
    try {
        datos = await respuesta.json();
    } catch {
        // Respuesta sin JSON (por ejemplo un error del proxy): se informa con el mensaje genérico de abajo.
    }

    if (!respuesta.ok) {
        // Cookie vencida o usuario borrado: los datos guardados de la sesión ya no sirven.
        if (respuesta.status === 401 && sesion.iniciada()) sesion.cerrar();
        throw new ErrorApi(
            respuesta.status,
            datos?.error || 'error',
            datos?.mensaje || 'Ocurrió un error inesperado. Probá de nuevo en unos minutos.',
            datos?.errores || {},
        );
    }
    return datos;
}

export const get = (ruta, consulta) => pedir('GET', ruta, { consulta });
export const post = (ruta, cuerpo) => pedir('POST', ruta, { cuerpo });
export const put = (ruta, cuerpo) => pedir('PUT', ruta, { cuerpo });
export const del = (ruta) => pedir('DELETE', ruta);
