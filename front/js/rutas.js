// Mapa de rutas de la app, según el sitemap y los wireframes (Entrega_2/wireframes.md).
// Las pantallas que todavía no están hechas usan la vista "pendiente".
import { ruta } from './enrutador.js';

const pendiente = () => import('./vistas/pendiente.js');

// Acceso (público)
ruta('/', pendiente, { titulo: 'Inicio', barra: false });
ruta('/login', pendiente, { titulo: 'Ingresar', barra: false, soloInvitado: true });
ruta('/registro', pendiente, { titulo: 'Crear cuenta', barra: false, soloInvitado: true });
ruta('/planes', pendiente, { titulo: 'Planes', barra: false });

// Explorar
ruta('/home', pendiente, { titulo: 'Home', privada: true });
ruta('/buscar', pendiente, { titulo: 'Buscar', privada: true });
ruta('/vehiculo/:id', pendiente, { titulo: 'Detalle', privada: true });
ruta('/mapa', pendiente, { titulo: 'Mapa', privada: true });

// Meta-búsqueda
ruta('/meta-busqueda', pendiente, { titulo: 'Mis intereses', privada: true });
ruta('/meta-busqueda/nueva', pendiente, { titulo: 'Nueva búsqueda', privada: true });
ruta('/meta-busqueda/:id', pendiente, { titulo: 'Resultados', privada: true });

// Mis publicaciones
ruta('/mis-publicaciones', pendiente, { titulo: 'Mis publicaciones', privada: true });
ruta('/mis-publicaciones/nueva', pendiente, { titulo: 'Publicar vehículo', privada: true });
ruta('/mis-publicaciones/propuestas', pendiente, { titulo: 'Propuestas de canje', privada: true });
ruta('/mis-publicaciones/:id/verificar', pendiente, { titulo: 'Verificar vehículo', privada: true });

// Mensajes
ruta('/mensajes', pendiente, { titulo: 'Mensajes', privada: true });
ruta('/mensajes/:id', pendiente, { titulo: 'Conversación', privada: true });

// Cuenta
ruta('/cuenta', pendiente, { titulo: 'Mi cuenta', privada: true });
ruta('/cuenta/favoritos', pendiente, { titulo: 'Favoritos', privada: true });
ruta('/cuenta/plan', pendiente, { titulo: 'Mi plan', privada: true });
ruta('/cuenta/seguridad', pendiente, { titulo: 'Seguridad', privada: true });

// Talleres adheridos
ruta('/talleres', pendiente, { titulo: 'Talleres adheridos', privada: true });
ruta('/talleres/adherirse', pendiente, { titulo: 'Adherir mi taller', barra: false });
ruta('/talleres/:id', pendiente, { titulo: 'Taller' });
ruta('/verificacion/:id', pendiente, { titulo: 'Informe de verificación' });

// Panel del taller (rol mecánico) y administración
ruta('/taller', pendiente, { titulo: 'Mi taller', privada: true, rol: 'mecanico' });
ruta('/taller/verificacion/:id', pendiente, { titulo: 'Verificación', privada: true, rol: 'mecanico' });
ruta('/admin', pendiente, { titulo: 'Administración', privada: true, rol: 'admin' });

// Guía de componentes y 404
ruta('/estilos', () => import('./vistas/estilos.js'), { titulo: 'Guía de componentes' });
ruta('/404', () => import('./vistas/no-encontrada.js'), { titulo: 'Página no encontrada', barra: false });
