// Crear cuenta con POST /api/registro. El back no inicia sesión al registrar: se ingresa en seguida
// con los mismos datos para no pedirlos dos veces.
import * as auth from '../api/auth.js';
import * as sesion from '../servicios/sesion.js';
import { alEnviar } from '../servicios/formularios.js';
import { ruta } from '../servicios/rutas.js';

const formulario = document.getElementById('form-registro');
const password = formulario.elements.password;
const confirmacion = formulario.elements.password_confirm;

// Las contraseñas tienen que coincidir (el back también lo controla).
function controlarConfirmacion() {
    confirmacion.setCustomValidity(
        confirmacion.value && confirmacion.value !== password.value ? 'Las contraseñas no coinciden.' : '');
}
password.addEventListener('input', controlarConfirmacion);
confirmacion.addEventListener('input', controlarConfirmacion);

alEnviar(formulario, async (datos) => {
    await auth.registro(datos);
    try {
        sesion.guardar(await auth.login(datos.email, datos.password));
        window.location.replace(sesion.destinoDespuesDelLogin());
    } catch {
        // La cuenta se creó igual: que ingrese a mano.
        window.location.replace(ruta('login.html?registrado=1'));
    }
});
