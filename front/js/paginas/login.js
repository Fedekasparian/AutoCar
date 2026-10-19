// Ingresar con POST /api/login. Guarda el token y vuelve a la página que pidió el login (?volver=).
import * as auth from '../api/auth.js';
import * as sesion from '../servicios/sesion.js';
import { alEnviar } from '../servicios/formularios.js';

const params = new URLSearchParams(window.location.search);
document.getElementById('aviso-registro').hidden = !params.has('registrado');

alEnviar(document.getElementById('form-login'), async ({ email, password }) => {
    const respuesta = await auth.login(email, password);
    sesion.guardar(respuesta);
    window.location.replace(sesion.destinoDespuesDelLogin());
});
