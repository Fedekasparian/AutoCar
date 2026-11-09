// "Adherí tu taller": un taller pide sumarse a la red. POST /api/solicitudes-taller (no hace falta sesión).
// La cuenta del taller es aparte de la cuenta personal: el formulario la crea con otro email (un email es una sola
// cuenta). La solicitud queda pendiente hasta que la aprueba un admin (admin-talleres.html): recién ahí la cuenta
// del taller puede ingresar (con el login de siempre) y el taller aparece en el ranking.
// Si la rechazaron, se vuelve a mandar desde acá con el mismo email y la misma contraseña.
import * as api from '../api/inspecciones.js';
import * as formato from '../servicios/formato.js';
import * as formularios from '../servicios/formularios.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { ruta } from '../servicios/rutas.js';

const { el } = vistas;
const form = document.getElementById('form-adhesion');
const cuentaActual = document.getElementById('cuenta-actual');
const estadoSolicitud = document.getElementById('estado-solicitud');

function mostrarEstado(...contenido) {
    estadoSolicitud.replaceChildren(...contenido);
    estadoSolicitud.hidden = contenido.length === 0;
}

function enlace(texto, pagina) {
    return el('a', { class: 'boton', href: ruta(pagina) }, texto);
}

function iniciar() {
    if (!sesion.iniciada()) return;

    const usuario = sesion.usuario();
    if (usuario.rol === 'mecanico') {
        form.hidden = true;
        mostrarEstado(vistas.aviso('Ya sos parte de la red.', 'Estás con la cuenta de tu taller.', enlace('Ir a mi taller', 'taller.html')));
        return;
    }
    // Con la sesión personal abierta igual se puede mandar: se crea otra cuenta, la del taller
    cuentaActual.textContent = `Estás con tu cuenta personal (${usuario.email}). La cuenta del taller es otra: usá un email distinto.`;
    cuentaActual.hidden = false;
}

formularios.alEnviar(form, async (datos) => {
    const solicitud = { ...datos, precio_inspeccion: Number(datos.precio_inspeccion) };
    const respuesta = await api.enviarSolicitud(solicitud);
    form.hidden = true;
    mostrarEstado(vistas.aviso('Tu solicitud está pendiente.',
        `Recibimos los datos de ${respuesta.solicitud.taller} el ${formato.fecha(respuesta.solicitud.creada)}. `
        + `Cuando un administrador la apruebe, vas a poder ingresar con ${respuesta.solicitud.email} y la contraseña que elegiste.`));
    estadoSolicitud.scrollIntoView();
});

iniciar();
