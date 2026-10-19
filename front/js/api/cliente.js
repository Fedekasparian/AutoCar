// Cliente HTTP de la API: arma la URL, manda el token y convierte las respuestas.
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
    const url = new URL(API_URL + ruta);
    Object.entries(consulta || {}).forEach(([clave, valor]) => {
        if (valor !== undefined && valor !== null && valor !== '') url.searchParams.set(clave, valor);
    });
    return url;
}

export async function pedir(metodo, ruta, { consulta, cuerpo } = {}) {
    const cabeceras = { Accept: 'application/json' };
    const token = sesion.token();
    if (token) cabeceras.Authorization = `Bearer ${token}`;
    if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';

    let respuesta;
    try {
        respuesta = await fetch(armarUrl(ruta, consulta), {
            method: metodo,
            headers: cabeceras,
            body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
        });
    } catch {
        throw new ErrorApi(0, 'sin_conexion',
            'No se pudo conectar con el servidor. Si recién se despierta (Render), probá de nuevo en un minuto.');
    }

    if (respuesta.status === 204) return null;

    let datos = null;
    try {
        datos = await respuesta.json();
    } catch {
        // Respuesta sin JSON (por ejemplo un error del proxy): se informa con el mensaje genérico de abajo.
    }

    if (!respuesta.ok) {
        // Token vencido o usuario borrado: la sesión guardada ya no sirve.
        if (respuesta.status === 401 && token) sesion.cerrar();
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
