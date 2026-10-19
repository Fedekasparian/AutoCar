// Panel de administración: sólo para rol admin (el back controla el rol en cada pedido a /api/admin).
import * as sesion from '../servicios/sesion.js';

sesion.requerirAdmin();
