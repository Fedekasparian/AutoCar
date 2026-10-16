// Enrutador por hash (#/ruta). Funciona en cualquier hosting estático sin configurar el servidor.
// Cada ruta carga una vista de js/vistas/ que exporta dibujar(ctx), y opcionalmente titulo(ctx) y montar(raiz, ctx).
import { sesion } from './sesion.js';

const rutas = [];
let navegaciones = 0;

function compilar(patron) {
    const claves = [];
    const regex = patron.replace(/\/:([^/]+)/g, (_, clave) => {
        claves.push(clave);
        return '/([^/]+)';
    });
    return { claves, regex: new RegExp(`^${regex}/?$`) };
}

// opciones: titulo, privada (pide sesión), soloInvitado (sólo sin sesión), barra (false la oculta), rol
export function ruta(patron, cargar, opciones = {}) {
    rutas.push({ patron, cargar, ...compilar(patron), ...opciones });
}

export function navegar(destino) {
    if (location.hash === `#${destino}`) {
        dibujar();
    } else {
        location.hash = destino;
    }
}

// Vuelve a la pantalla anterior si se navegó dentro de la app; si no, va a la ruta de respaldo.
export function volver(respaldo = '/home') {
    if (navegaciones > 1) {
        history.back();
    } else {
        navegar(respaldo);
    }
}

export function rutaActual() {
    return (location.hash.slice(1) || '/').split('?')[0];
}

function buscar(camino) {
    for (const r of rutas) {
        const m = r.regex.exec(camino);
        if (m) {
            const params = {};
            r.claves.forEach((clave, i) => {
                params[clave] = decodeURIComponent(m[i + 1]);
            });
            return { r, params };
        }
    }
    return null;
}

async function dibujar() {
    const app = document.getElementById('app');
    const completo = location.hash.slice(1) || '/';
    const [camino, consulta = ''] = completo.split('?');
    const { r, params } = buscar(camino) ?? buscar('/404');

    // Los permisos de verdad los valida el servidor; esto sólo evita mostrar pantallas que no corresponden.
    if (r.privada && !sesion.usuario) {
        navegar(`/login?siguiente=${encodeURIComponent(completo)}`);
        return;
    }
    if (r.soloInvitado && sesion.usuario) {
        navegar('/home');
        return;
    }
    if (r.rol && sesion.usuario?.rol !== r.rol) {
        navegar('/home');
        return;
    }

    navegaciones += 1;
    const ctx = { params, consulta: new URLSearchParams(consulta), camino, titulo: r.titulo };
    const vista = await r.cargar();

    document.body.classList.toggle('sin-barra', r.barra === false);
    app.innerHTML = String(await vista.dibujar(ctx));
    const titulo = vista.titulo ? vista.titulo(ctx) : r.titulo;
    document.title = titulo ? `${titulo} · AutoCar` : 'AutoCar';
    vista.montar?.(app, ctx);

    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
    window.dispatchEvent(new CustomEvent('cambioderuta', { detail: { camino } }));
}

export function iniciar() {
    window.addEventListener('hashchange', dibujar);
    dibujar();
}
