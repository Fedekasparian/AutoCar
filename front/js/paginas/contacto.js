// Contacto (contacto.html) con POST /api/contacto: público, con el email para poder contestar.
import * as soporte from '../api/soporte.js';
import * as formularios from '../servicios/formularios.js';
import * as sesion from '../servicios/sesion.js';

const form = document.getElementById('form-contacto');
// Si está logueado, el email ya va completo
const usuario = sesion.usuario();
if (usuario) form.elements.email.value = usuario.email;

formularios.alEnviar(form, async (datos) => {
    await soporte.contactar(datos);
    form.hidden = true;
    document.getElementById('enviado').hidden = false;
});
