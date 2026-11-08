// Acceso al panel de administración desde cualquier pantalla: si el usuario tiene algún permiso del panel
// (admin o moderador), agrega "Admin" a la barra de navegación y, en el inicio, un acceso directo arriba.
// Es un script clásico (como tema.js) para cargarlo igual en todas las páginas. Sólo muestra u oculta:
// el back vuelve a controlar cada permiso en cada pedido.
(() => {
    const PERMISOS_PANEL = ['usuarios.ver', 'vehiculos.moderar', 'vehiculos.gestionar', 'metricas.ver', 'reclamos.resolver'];
    const panel = new URL('../pages/admin/admin.html', document.currentScript.src).href;

    let usuario = null;
    try {
        const guardada = JSON.parse(sessionStorage.getItem('autocar.sesion'));
        if (guardada?.usuario && !(guardada.vence && Date.now() > guardada.vence)) usuario = guardada.usuario;
    } catch {
        // Sin almacenamiento: no hay sesión que mirar.
    }
    const permisos = usuario?.permisos || [];
    if (!PERMISOS_PANEL.some((p) => permisos.includes(p))) return;

    // Ícono de escudo, armado con el DOM (en el proyecto no se usa innerHTML)
    function icono() {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        Object.entries({
            width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
            'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true',
        }).forEach(([k, v]) => svg.setAttribute(k, v));
        ['M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z', 'm9 12 2 2 4-4'].forEach((d) => {
            const path = document.createElementNS(ns, 'path');
            path.setAttribute('d', d);
            svg.append(path);
        });
        return svg;
    }

    document.addEventListener('DOMContentLoaded', () => {
        const lista = document.querySelector('.barra__lista');
        if (lista) {
            const enAdmin = window.location.pathname.includes('/pages/admin/');
            const item = document.createElement('li');
            const enlace = document.createElement('a');
            enlace.className = 'barra__enlace';
            enlace.href = panel;
            if (enAdmin) enlace.setAttribute('aria-current', 'page');
            const caja = document.createElement('span');
            caja.className = 'barra__icono';
            caja.append(icono());
            const texto = document.createElement('span');
            texto.textContent = 'Admin';
            enlace.append(caja, texto);
            item.append(enlace);
            lista.append(item);
            lista.classList.add('barra__lista--admin');
            // En el panel, "Cuenta" deja de figurar como la sección actual
            if (enAdmin) lista.querySelectorAll('[aria-current="page"]').forEach((a) => a !== enlace && a.removeAttribute('aria-current'));
        }

        // Portada (index.html): enlace en el menú de arriba, antes de "Ingresar"
        document.querySelectorAll('.marca-nav nav').forEach((nav) => {
            const enlace = document.createElement('a');
            enlace.href = panel;
            enlace.textContent = 'Panel admin';
            nav.insertBefore(enlace, nav.querySelector('.nav-ingreso'));
        });

        // Inicio: acceso directo al panel antes del buscador
        const main = document.querySelector('.vista-home main');
        if (main) {
            const acceso = document.createElement('a');
            acceso.className = 'acceso-admin';
            acceso.href = panel;
            const titulo = document.createElement('strong');
            titulo.textContent = 'Panel de administración';
            const meta = document.createElement('span');
            meta.textContent = permisos.includes('usuarios.ver')
                ? 'Usuarios, moderación, catálogo y métricas'
                : 'Moderar publicaciones';
            acceso.append(titulo, meta);
            main.prepend(acceso);
        }
    });
})();
