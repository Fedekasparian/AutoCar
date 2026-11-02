// Mi cuenta: datos del usuario (GET /api/me) y salir.
import * as auth from '../api/auth.js';
import * as sesion from '../servicios/sesion.js';
import { ruta } from '../servicios/rutas.js';

function mostrar(usuario) {
    document.getElementById('usuario-nombre').textContent = usuario.nombre;
    document.getElementById('usuario-email').textContent = usuario.email;
    // El panel lo ven el admin y el moderador (cada sección según sus permisos)
    document.getElementById('enlace-admin').hidden = !sesion.vePanel();
    // Los planes no aplican para el admin: tiene siempre el mejor incluido
    const plan = sesion.planIncluido();
    if (plan) {
        document.getElementById('plan-nombre').textContent = `Plan ${plan.nombre} · ${plan.nivel}`;
        document.getElementById('plan-meta').textContent = 'Incluido por ser administrador';
    }
    const nombre = document.getElementById('nombre');
    if (nombre) nombre.value = usuario.nombre;
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
