// Lo mínimo del navegador que usan los módulos del front, para correrlos con `node --test`.
// Se importa ANTES que el módulo a probar (los imports se evalúan en orden).

class AlmacenEnMemoria {
    #datos = new Map();
    getItem(clave) { return this.#datos.has(clave) ? this.#datos.get(clave) : null; }
    setItem(clave, valor) { this.#datos.set(clave, String(valor)); }
    removeItem(clave) { this.#datos.delete(clave); }
    clear() { this.#datos.clear(); }
}

const definir = (nombre, valor) =>
    Object.defineProperty(globalThis, nombre, { value: valor, configurable: true, writable: true });

definir('sessionStorage', new AlmacenEnMemoria());
definir('window', {
    location: {
        hostname: 'localhost',
        origin: 'http://localhost:5500',
        pathname: '/front/pages/info/home.html',
        search: '',
        hash: '',
        assign() {},
    },
});

// fetch falso: cada prueba pone en `respuestas` lo que tiene que devolver y lee los pedidos en `pedidos`.
export const pedidos = [];
export const respuestas = [];
definir('fetch', async (url, opciones = {}) => {
    pedidos.push({ url: String(url), ...opciones });
    const siguiente = respuestas.shift();
    if (siguiente instanceof Error) throw siguiente;
    return siguiente ?? new Response(null, { status: 204 });
});

export function reiniciar() {
    sessionStorage.clear();
    pedidos.length = 0;
    respuestas.length = 0;
}

export const json = (cuerpo, status = 200) =>
    new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });
