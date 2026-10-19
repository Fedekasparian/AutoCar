// Mi cuenta: datos del usuario (GET /api/me) y salir.
import * as auth from '../api/auth.js';
import * as sesion from '../servicios/sesion.js';

function mostrar(usuario) {
    document.getElementById('usuario-nombre').textContent = usuario.nombre;
    document.getElementById('usuario-email').textContent = usuario.email;
    document.getElementById('enlace-admin').hidden = usuario.rol !== 'admin';
    const nombre = document.getElementById('nombre');
    if (nombre) nombre.value = usuario.nombre;
}

document.getElementById('salir').addEventListener('click', () => {
    sesion.cerrar();
    window.location.assign('index.html');
});

if (sesion.requerirLogin()) {
    // Primero lo guardado (se ve al instante) y después lo actualizado del servidor, por si cambió el rol.
    mostrar(sesion.usuario());
    auth.me()
        .then(({ usuario }) => {
            sesion.actualizarUsuario(usuario);
            mostrar(usuario);
        })
        .catch((error) => {
            if (error.status === 401) sesion.requerirLogin();
        });
}
