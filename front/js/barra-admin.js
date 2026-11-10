// Barra de navegación según el rol. Es un script clásico (como tema.js) para cargarlo igual en todas las páginas.
// Sólo muestra u oculta: el back vuelve a controlar cada permiso en cada pedido.
//   usuario   → la barra del HTML: Explorar · Búsquedas · Publicar · Mensajes · Cuenta
//   moderador → Explorar · Moderar · Reportes · Reclamos · Cuenta
//   admin     → Moderar · Usuarios · Estadísticas · Panel · Cuenta (talleres, reportes, reclamos y contacto, en el Panel)
//   mecanico  → Explorar · Mi taller · Cuenta
// Las cuentas del equipo y las de los talleres no compran ni venden: no ven Búsquedas, Publicar ni Mensajes.
(() => {
    let usuario = null;
    try {
        const guardada = JSON.parse(sessionStorage.getItem('autocar.sesion'));
        if (guardada?.usuario && !(guardada.vence && Date.now() > guardada.vence)) usuario = guardada.usuario;
    } catch {
        // Sin almacenamiento: no hay sesión que mirar.
    }
    const rol = usuario?.rol;
    if (!['admin', 'moderador', 'mecanico'].includes(rol)) return;

    const base = document.currentScript.src;
    const url = (ruta) => new URL(`../pages/${ruta}`, base).href;
    const ITEMS = {
        moderador: [['Explorar', 'info/home.html'], ['Moderar', 'admin/admin-moderar.html'],
            ['Reportes', 'admin/admin-soporte.html'], ['Reclamos', 'admin/admin-reclamos.html']],
        admin: [['Moderar', 'admin/admin-moderar.html'], ['Usuarios', 'admin/admin-usuarios.html'],
            ['Estadísticas', 'admin/admin-metricas.html'], ['Panel', 'admin/admin.html']],
        mecanico: [['Explorar', 'info/home.html'], ['Mi taller', 'talleres/taller.html']],
    }[rol];

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

    function item(texto, href) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'barra__enlace';
        a.href = href;
        if (new URL(href).pathname === window.location.pathname) a.setAttribute('aria-current', 'page');
        const caja = document.createElement('span');
        caja.className = 'barra__icono';
        caja.append(icono());
        const etiqueta = document.createElement('span');
        etiqueta.textContent = texto;
        a.append(caja, etiqueta);
        li.append(a);
        return li;
    }

    document.addEventListener('DOMContentLoaded', () => {
        const lista = document.querySelector('.barra__lista');
        if (lista) {
            // Queda solo "Cuenta" de la barra original; el resto lo pone el rol
            const cuenta = Array.from(lista.children).find((li) => li.querySelector('a[href$="cuenta.html"]'));
            lista.replaceChildren(...ITEMS.map(([texto, ruta]) => item(texto, url(ruta))), ...(cuenta ? [cuenta] : []));
            if (lista.querySelectorAll('[aria-current="page"]').length > 1 && cuenta) {
                cuenta.querySelector('a').removeAttribute('aria-current');
            }
            lista.classList.add('barra__lista--admin');
        }

        // Portada (index.html): el acceso a lo del rol en el menú de arriba, antes de "Ingresar"
        document.querySelectorAll('.marca-nav nav').forEach((nav) => {
            const enlace = document.createElement('a');
            enlace.href = url(rol === 'mecanico' ? 'talleres/taller.html' : 'admin/admin.html');
            enlace.textContent = rol === 'mecanico' ? 'Mi taller' : 'Panel';
            nav.insertBefore(enlace, nav.querySelector('.nav-ingreso'));
        });
    });
})();
