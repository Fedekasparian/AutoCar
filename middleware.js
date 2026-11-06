// Proxy de la API (Routing Middleware de Vercel). Ver infraestructura.md, decisión D4.
// El front pide /api/... a su propio dominio (así la cookie de sesión es del propio sitio y no de terceros)
// y acá se reenvía al back del entorno que corresponde:
//   Production (rama main) → BACKEND_URL = https://autocarbackend-1.onrender.com
//   Preview    (rama dev)  → BACKEND_URL = https://<servicio dev>.onrender.com
// Reemplaza al "rewrites" fijo de vercel.json, que mandaba también el entorno dev a producción.
import { rewrite } from '@vercel/functions';

export const config = { matcher: '/api/:path*' };

// '/api/vehiculos?q=ford' + 'https://back.onrender.com' → URL del back con la misma ruta y consulta.
// Devuelve null si BACKEND_URL falta o no es una URL http(s): así nunca se cae a otro entorno por defecto.
export function destinoApi(urlPedido, backendUrl) {
    if (!backendUrl) return null;
    let base;
    try {
        base = new URL(backendUrl);
    } catch {
        return null;
    }
    if (base.protocol !== 'https:' && base.protocol !== 'http:') return null;
    const pedido = new URL(urlPedido);
    return new URL(pedido.pathname + pedido.search, base.origin);
}

export default function middleware(request) {
    const destino = destinoApi(request.url, process.env.BACKEND_URL);
    if (!destino) {
        return Response.json(
            { error: 'sin_backend', mensaje: 'El front no tiene configurada la dirección de la API (BACKEND_URL).' },
            { status: 503 },
        );
    }
    return rewrite(destino);
}
