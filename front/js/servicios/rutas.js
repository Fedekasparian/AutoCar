// Rutas de las páginas, siempre RELATIVAS a este archivo (nunca "/pages/..." desde la raíz del dominio).
// Así el sitio anda igual en la raíz de un dominio, en una subcarpeta (GitHub Pages) o abierto desde Live Server.
// Uso: window.location.assign(ruta('home.html')) o href: ruta('vehiculo.html?id=3').
// Si se agrega una página nueva, anotarla en PAGINAS.
const RAIZ = new URL('../../', import.meta.url);

const PAGINAS = {
    'index.html': 'index.html',
    'admin-vehiculo.html': 'pages/admin/admin-vehiculo.html',
    'admin-vehiculos.html': 'pages/admin/admin-vehiculos.html',
    'admin.html': 'pages/admin/admin.html',
    'buscar.html': 'pages/vehiculos/buscar.html',
    'contacto.html': 'pages/info/contacto.html',
    'conversacion.html': 'pages/operaciones/conversacion.html',
    'cuenta.html': 'pages/auth/cuenta.html',
    'favoritos.html': 'pages/vehiculos/favoritos.html',
    'guia.html': 'pages/info/guia.html',
    'home.html': 'pages/info/home.html',
    'legales.html': 'pages/info/legales.html',
    'login.html': 'pages/auth/login.html',
    'mapa.html': 'pages/info/mapa.html',
    'mensajes.html': 'pages/operaciones/mensajes.html',
    'meta-busqueda-nueva.html': 'pages/operaciones/meta-busqueda-nueva.html',
    'meta-busqueda-resultados.html': 'pages/operaciones/meta-busqueda-resultados.html',
    'meta-busqueda.html': 'pages/operaciones/meta-busqueda.html',
    'mis-publicaciones.html': 'pages/vehiculos/mis-publicaciones.html',
    'plan.html': 'pages/info/plan.html',
    'planes.html': 'pages/info/planes.html',
    'proponer-canje.html': 'pages/operaciones/proponer-canje.html',
    'propuestas.html': 'pages/operaciones/propuestas.html',
    'publicar.html': 'pages/vehiculos/publicar.html',
    'registro.html': 'pages/auth/registro.html',
    'reportar.html': 'pages/info/reportar.html',
    'taller-verificacion.html': 'pages/talleres/taller-verificacion.html',
    'taller.html': 'pages/talleres/taller.html',
    'talleres-adherirse.html': 'pages/talleres/talleres-adherirse.html',
    'talleres.html': 'pages/talleres/talleres.html',
    'tasacion.html': 'pages/vehiculos/tasacion.html',
    'vehiculo.html': 'pages/vehiculos/vehiculo.html',
    'verificacion.html': 'pages/talleres/verificacion.html',
    'verificar-vehiculo.html': 'pages/talleres/verificar-vehiculo.html',
};

// 'archivo.html?x=1#y' → URL completa de esa página; devuelve null si el archivo no existe en PAGINAS.
export function ruta(destino) {
    const [, archivo, resto = ''] = /^([^?#]*)(.*)$/.exec(destino);
    const nombre = archivo.split('/').pop();
    return PAGINAS[nombre] ? new URL(PAGINAS[nombre], RAIZ).href + resto : null;
}
