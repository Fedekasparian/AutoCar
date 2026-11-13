// Mi cuenta: datos del usuario (GET /api/me) y salir.
import * as auth from '../api/auth.js';
import * as favoritos from '../api/favoritos.js';
import * as publicaciones from '../api/publicaciones.js';
import * as formularios from '../servicios/formularios.js';
import * as vistas from '../servicios/vistas.js';
import { achicar } from '../servicios/imagenes.js';
import * as sesion from '../servicios/sesion.js';
import { ruta } from '../servicios/rutas.js';
import { boton } from '../servicios/acciones.js';

const { el } = vistas;

function mostrar(usuario) {
    document.getElementById('usuario-nombre').textContent = usuario.nombre;
    document.getElementById('usuario-email').textContent = usuario.email;
    // El panel lo ven el admin y el moderador (cada sección según sus permisos)
    document.getElementById('enlace-admin').hidden = !sesion.vePanel();
    // Los mecánicos de la red (rol mecanico) entran a su panel desde acá
    document.getElementById('enlace-taller').hidden = usuario.rol !== 'mecanico';
    // El equipo y los talleres no compran ni venden: sin favoritos, publicaciones ni inspecciones pedidas
    const compra = usuario.rol === 'usuario';
    ['favoritos.html', 'mis-publicaciones.html', 'mis-inspecciones.html'].forEach((pagina) => {
        const fila = document.querySelector(`.lista-filas a[href$="${pagina}"]`)?.closest('li');
        if (fila) fila.hidden = !compra;
    });
    // Los planes no aplican para el admin: tiene siempre el mejor incluido
    const plan = sesion.planIncluido();
    if (plan) {
        document.getElementById('plan-nombre').textContent = `Plan ${plan.nombre} · ${plan.nivel}`;
        document.getElementById('plan-meta').textContent = 'Incluido por ser administrador';
    }
    const nombre = document.getElementById('nombre');
    if (nombre && !nombre.matches(':focus')) nombre.value = usuario.nombre;
    // Foto de perfil (o la inicial) y "Quitar foto" solo si tiene una
    document.getElementById('usuario-avatar').replaceChildren(vistas.avatar(usuario, 'avatar--grande'));
    quitarFoto.hidden = !usuario.foto;
}

// Guarda lo que devolvió el back (nombre o foto nuevos) y lo muestra
function actualizarUsuario(usuario, aviso) {
    sesion.actualizar({ usuario });
    mostrar(usuario);
    const recuadro = document.getElementById('perfil-aviso');
    recuadro.textContent = aviso;
    recuadro.hidden = false;
}

formularios.alEnviar(document.getElementById('form-perfil'), async (datos) => {
    const { usuario } = await auth.actualizarPerfil(datos.nombre);
    actualizarUsuario(usuario, 'Guardamos tu nombre.');
});

// Foto de perfil: se toca la foto, se elige una y se sube sola. Se recorta en un cuadrado y se achica a 512 px
// en el navegador, así sirve cualquier foto (aunque pese varios MB).
// En cuenta.html está sólo la foto (#usuario-avatar): el botón que la envuelve, el selector de archivo
// y "Quitar foto" los crea el JS.
const errorFoto = document.getElementById('foto-error');
const entradaFoto = el('input', { id: 'foto', type: 'file', accept: 'image/jpeg,image/png,image/webp', hidden: true });
const cambiarFoto = boton('', () => entradaFoto.click(), 'perfil-foto');
cambiarFoto.setAttribute('aria-label', 'Cambiar foto de perfil');
const quitarFoto = boton('Quitar foto', borrarFoto, 'boton-link');
quitarFoto.hidden = true;
const fotoActual = document.getElementById('usuario-avatar');
fotoActual.replaceWith(cambiarFoto);
cambiarFoto.append(fotoActual, el('span', { class: 'perfil-foto__editar', 'aria-hidden': 'true' }, '✎'));
cambiarFoto.after(entradaFoto, el('p', {}, quitarFoto));

entradaFoto.addEventListener('change', async () => {
    if (!entradaFoto.files.length) return;
    errorFoto.textContent = '';
    const datos = new FormData();
    try {
        datos.append('foto', await achicar(entradaFoto.files[0], { lado: 512, cuadrado: true }));
    } catch {
        errorFoto.textContent = 'No pudimos leer esa imagen. Elegí una foto JPG, PNG o WebP.';
        entradaFoto.value = '';
        return;
    }
    try {
        const { usuario } = await auth.subirFoto(datos);
        actualizarUsuario(usuario, 'Subimos tu foto.');
    } catch (error) {
        errorFoto.textContent = error.errores?.foto || error.message;
    }
    entradaFoto.value = '';
});

async function borrarFoto() {
    quitarFoto.disabled = true;
    errorFoto.textContent = '';
    try {
        await auth.borrarFoto();
        actualizarUsuario({ ...sesion.usuario(), foto: null }, 'Quitamos tu foto.');
    } catch (error) {
        errorFoto.textContent = error.message;
    }
    quitarFoto.disabled = false;
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
// "Salir" va al final de la columna de la izquierda, debajo de los enlaces.
async function salir() {
    try {
        await auth.logout();
    } catch {
        // Sin conexión: se borra lo local igual.
    }
    sesion.cerrar();
    window.location.assign(ruta('index.html'));
}
document.querySelector('.cuenta-resumen').append(boton('Salir', salir, 'boton boton--secundario boton--bloque'));

if (sesion.requerirLogin()) {
    if (sesion.compraYVende()) contar();
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
