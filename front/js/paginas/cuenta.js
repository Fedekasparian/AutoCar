// Mi cuenta: datos del usuario (GET /api/me) y salir.
import * as auth from '../api/auth.js';
import * as favoritos from '../api/favoritos.js';
import * as publicaciones from '../api/publicaciones.js';
import * as sesion from '../servicios/sesion.js';
import { ruta } from '../servicios/rutas.js';

function mostrar(usuario) {
    document.getElementById('usuario-nombre').textContent = usuario.nombre;
    document.getElementById('usuario-email').textContent = usuario.email;
    // El panel lo ven el admin y el moderador (cada sección según sus permisos)
    document.getElementById('enlace-admin').hidden = !sesion.vePanel();
    // Los mecánicos de la red (rol mecanico) entran a su panel desde acá
    document.getElementById('enlace-taller').hidden = !sesion.puede('verificaciones.realizar');
    // Los planes no aplican para el admin: tiene siempre el mejor incluido
    const plan = sesion.planIncluido();
    if (plan) {
        document.getElementById('plan-nombre').textContent = `Plan ${plan.nombre} · ${plan.nivel}`;
        document.getElementById('plan-meta').textContent = 'Incluido por ser administrador';
    }
    const nombre = document.getElementById('nombre');
    if (nombre) nombre.value = usuario.nombre;
}

// Cantidades reales de favoritos y publicaciones; si no responde, queda el texto genérico
async function contar() {
    const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
    try {
        const { items } = await favoritos.listar();
        document.getElementById('cuenta-favoritos').textContent = plural(items.length, 'vehículo guardado', 'vehículos guardados');
    } catch { /* queda el texto genérico */ }
    try {
        const { items } = await publicaciones.listar();
        const activas = items.filter((v) => v.estado === 'disponible').length;
        document.getElementById('cuenta-publicaciones').textContent =
            `${plural(items.length, 'publicación', 'publicaciones')} · ${plural(activas, 'activa', 'activas')}`;
    } catch { /* queda el texto genérico */ }
}

// La cookie la borra el back; si no responde, igual se sale en este navegador (la cookie vence sola).
document.getElementById('salir').addEventListener('click', async () => {
    try {
        await auth.logout();
    } catch {
        // Sin conexión: se borra lo local igual.
    }
    sesion.cerrar();
    window.location.assign(ruta('index.html'));
});

if (sesion.requerirLogin()) {
    contar();
    // Primero lo guardado (se ve al instante) y después lo actualizado del servidor, por si cambió el rol.
    mostrar(sesion.usuario());
    auth.me()
        .then((respuesta) => {
            sesion.actualizar(respuesta);
            mostrar(respuesta.usuario);
        })
        .catch((error) => {
            if (error.status === 401) sesion.requerirLogin();
        });
}
