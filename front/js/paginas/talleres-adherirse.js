// "Adherí tu taller": un mecánico pide sumar su taller a la red. POST /api/mi-solicitud-taller (hace falta sesión).
// Sin cuenta, el mismo formulario la crea primero (registro + ingreso, como registro.js) y después manda la solicitud.
// La solicitud queda pendiente hasta que la aprueba un admin (admin-talleres.html): recién ahí el usuario pasa
// a mecánico y su taller aparece en el ranking.
import * as api from '../api/inspecciones.js';
import * as auth from '../api/auth.js';
import * as formato from '../servicios/formato.js';
import * as formularios from '../servicios/formularios.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { ruta } from '../servicios/rutas.js';

const { el } = vistas;
const form = document.getElementById('form-adhesion');
const datosCuenta = document.getElementById('datos-cuenta');
const cuentaActual = document.getElementById('cuenta-actual');
const estadoSolicitud = document.getElementById('estado-solicitud');

// Campos del taller que se mandan a la API (el resto son de la cuenta)
const CAMPOS_TALLER = ['nombre', 'cuit', 'direccion', 'localidad', 'telefono', 'horarios', 'precio_inspeccion'];

// Con sesión, los datos de la cuenta no hacen falta: se desactivan (así no se validan ni se mandan).
function modoConSesion() {
    const usuario = sesion.usuario();
    datosCuenta.disabled = true;
    datosCuenta.hidden = true;
    cuentaActual.textContent = `Vas a pedir la adhesión con tu cuenta: ${usuario.nombre} (${usuario.email}).`;
    cuentaActual.hidden = false;
}

function mostrarEstado(...contenido) {
    estadoSolicitud.replaceChildren(...contenido);
    estadoSolicitud.hidden = contenido.length === 0;
}

function enlace(texto, pagina) {
    return el('a', { class: 'boton', href: ruta(pagina) }, texto);
}

// Vuelve a cargar los datos de la sesión: si el admin la aprobó, el rol y los permisos cambiaron.
async function actualizarSesion() {
    try {
        sesion.actualizar(await auth.me());
    } catch {
        // Si falla, al volver a ingresar se cargan bien.
    }
}

// Lo que se ve según cómo esté la solicitud. Devuelve true si el formulario tiene que quedar visible.
async function mostrarSolicitud(solicitud) {
    if (solicitud === null) return true;

    if (solicitud.estado === 'pendiente') {
        mostrarEstado(vistas.aviso('Tu solicitud está pendiente.',
            `Mandaste los datos de ${solicitud.taller} el ${formato.fecha(solicitud.creada)}. Te avisamos acá cuando un administrador la revise.`));
        return false;
    }

    if (solicitud.estado === 'aprobado') {
        await actualizarSesion();
        mostrarEstado(vistas.aviso('Tu taller está aprobado.',
            `${solicitud.taller} ya está en la red de AutoCar y aparece en el ranking.`,
            enlace('Ir a mi taller', 'taller.html')));
        return false;
    }

    // Rechazada: se muestra el motivo y el formulario con los datos de antes, para corregirlos y volver a mandarla
    mostrarEstado(el('div', { class: 'recuadro pila', role: 'status' },
        el('p', {}, el('strong', {}, 'Tu solicitud anterior fue rechazada.')),
        el('p', {}, `Motivo: ${solicitud.motivo_rechazo}`),
        el('p', { class: 'suave' }, 'Corregí los datos y volvé a mandarla.')));
    form.elements.nombre.value = solicitud.taller;
    form.elements.cuit.value = solicitud.cuit || '';
    form.elements.direccion.value = solicitud.direccion;
    form.elements.localidad.value = solicitud.localidad;
    form.elements.telefono.value = solicitud.telefono;
    form.elements.horarios.value = solicitud.horarios || '';
    form.elements.precio_inspeccion.value = solicitud.precio_inspeccion;
    return true;
}

async function iniciar() {
    if (!sesion.iniciada()) return; // sin sesión: formulario completo, con los datos de la cuenta

    modoConSesion();
    const rol = sesion.usuario().rol;
    if (rol === 'mecanico') {
        form.hidden = true;
        mostrarEstado(vistas.aviso('Ya sos parte de la red.', 'Tu cuenta es de mecánico.', enlace('Ir a mi taller', 'taller.html')));
        return;
    }
    if (rol !== 'usuario') {
        form.hidden = true;
        mostrarEstado(vistas.aviso(`Tu cuenta es de ${formato.rol(rol).toLowerCase()}.`,
            'Para sumar un taller, ingresá con la cuenta del mecánico o creá una nueva.'));
        return;
    }

    form.hidden = true;
    mostrarEstado(vistas.cargando());
    try {
        const { solicitud } = await api.miSolicitud();
        form.hidden = !(await mostrarSolicitud(solicitud));
        if (solicitud === null) mostrarEstado();
    } catch (error) {
        if (error.status === 401) {
            // La sesión venció: se vuelve al formulario completo
            window.location.reload();
            return;
        }
        mostrarEstado(vistas.avisoDeError(error));
    }
}

// Sin sesión: crea la cuenta e ingresa. Los errores del registro se muestran en los campos de la cuenta.
async function crearCuentaEIngresar(datos) {
    try {
        await auth.registro({
            nombre: datos.responsable, email: datos.email, password: datos.password, password_confirm: datos.password,
        });
    } catch (error) {
        // El back llama "nombre" al nombre de la persona: acá ese campo es "responsable"
        if (error.errores && error.errores.nombre) {
            error.errores.responsable = error.errores.nombre;
            delete error.errores.nombre;
        }
        throw error;
    }
    sesion.guardar(await auth.login(datos.email, datos.password));
    modoConSesion();
}

formularios.alEnviar(form, async (datos) => {
    if (!sesion.iniciada()) await crearCuentaEIngresar(datos);

    const solicitud = { condiciones: datos.condiciones };
    CAMPOS_TALLER.forEach((campo) => {
        solicitud[campo] = datos[campo];
    });
    solicitud.precio_inspeccion = Number(datos.precio_inspeccion);

    const respuesta = await api.enviarSolicitud(solicitud);
    form.hidden = true;
    await mostrarSolicitud(respuesta.solicitud);
    estadoSolicitud.scrollIntoView();
});

iniciar();
