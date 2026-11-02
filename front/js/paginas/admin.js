// Panel de administración: muestra las secciones según los permisos del usuario (el admin los tiene todos;
// el moderador sólo moderar) y, si puede ver métricas, un resumen. El back controla cada permiso otra vez.
import * as admin from '../api/admin.js';
import * as formato from '../servicios/formato.js';
import * as sesion from '../servicios/sesion.js';

const numero = new Intl.NumberFormat('es-AR');

async function resumen() {
    try {
        const m = await admin.metricas();
        document.getElementById('r-usuarios').textContent = numero.format(m.usuarios.activos);
        document.getElementById('r-publicaciones').textContent = numero.format(m.publicaciones.total);
        document.getElementById('r-pendientes').textContent = numero.format(m.moderacion.pendientes);
        document.getElementById('r-mensajes').textContent = numero.format(m.chat.mensajes_30d);
        document.getElementById('resumen').hidden = false;
        const meta = document.getElementById('meta-pendientes');
        if (meta && m.moderacion.pendientes) {
            meta.textContent = m.moderacion.pendientes === 1
                ? '1 publicación esperando revisión' : `${m.moderacion.pendientes} publicaciones esperando revisión`;
        }
    } catch {
        // Sin el resumen el panel igual sirve: las secciones ya están a la vista.
    }
}

if (sesion.requerirPermiso()) {
    document.querySelectorAll('[data-permiso]').forEach((item) => {
        item.hidden = !sesion.puede(item.dataset.permiso);
    });
    const usuario = sesion.usuario();
    document.getElementById('rol-actual').textContent = `Ingresaste como ${formato.rol(usuario.rol)}.`;
    if (sesion.puede('metricas.ver')) resumen();
}
