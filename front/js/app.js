// Punto de entrada: registra los componentes y las rutas, carga la sesión y arranca el enrutador.
import './componentes/barra-navegacion.js';
import './componentes/encabezado-pantalla.js';
import './rutas.js';
import { cargarSesion } from './sesion.js';
import { iniciar } from './enrutador.js';

await cargarSesion();
iniciar();
