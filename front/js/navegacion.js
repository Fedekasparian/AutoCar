// Navegación (script clásico, en todas las páginas, después de barra-admin.js):
// - la barra y la cabecera se achican y toman sombra al bajar (clase "con-scroll" en <html>);
// - en escritorio, una píldora se desliza al link que señala el mouse y vuelve al de la página actual.
// Sólo es visual: sin este script la navegación funciona igual.
(() => {
    const raiz = document.documentElement;

    // 0. Con sesión, el logo lleva a Explorar y no a la portada pública (la de "Ingresar" y "Crear cuenta").
    //    Se lee lo mismo que barra-admin.js: los datos públicos de la sesión en sessionStorage.
    let conSesion = false;
    try {
        const guardada = JSON.parse(sessionStorage.getItem('autocar.sesion'));
        conSesion = Boolean(guardada?.usuario) && !(guardada.vence && Date.now() > guardada.vence);
    } catch {
        // Sin almacenamiento: no hay sesión que mirar.
    }
    if (conSesion) {
        const explorar = new URL('../pages/info/home.html', document.currentScript.src).href;
        document.querySelectorAll('a.marca, a.barra__marca').forEach((logo) => {
            if (/\/index\.html$|\/front\/?$/.test(new URL(logo.href).pathname)) {
                logo.href = explorar;
                logo.setAttribute('aria-label', 'AutoCar, explorar vehículos');
            }
        });
    }

    // 1. Barra compacta al bajar.
    //    Con un solo umbral la barra temblaba: al achicarse, la página sube 16 px, el scroll vuelve a cruzar
    //    el umbral y la barra se agranda otra vez, en un ciclo. Con dos umbrales separados (se achica pasando
    //    los 80 px y se agranda recién por debajo de los 16) ese cambio de alto ya no la hace cambiar de estado.
    let pendiente = false;
    const revisarScroll = () => {
        pendiente = false;
        const y = window.scrollY;
        if (y > 80) raiz.classList.add('con-scroll');
        else if (y < 16) raiz.classList.remove('con-scroll');
    };
    window.addEventListener('scroll', () => {
        if (!pendiente) { pendiente = true; requestAnimationFrame(revisarScroll); }
    }, { passive: true });
    revisarScroll();

    // 2. Píldora que se desliza entre los links de la barra (solo escritorio: en celular la barra es de pestañas)
    const lista = document.querySelector('.barra__lista');
    if (!lista) return;
    const escritorio = matchMedia('(min-width: 1100px)');
    const pildora = document.createElement('span');
    pildora.className = 'barra__pildora';
    pildora.setAttribute('aria-hidden', 'true');
    const barra = lista.closest(".barra") ?? lista.parentElement; // fuera de la lista: un <ul> solo lleva <li>
    barra.prepend(pildora);
    barra.classList.add("barra--con-pildora");

    const actual = () => lista.querySelector('.barra__enlace[aria-current="page"]');
    function moverA(enlace, animar = true) {
        if (!enlace || !escritorio.matches) { pildora.style.opacity = '0'; return; }
        const caja = barra.getBoundingClientRect();
        const destino = enlace.getBoundingClientRect();
        pildora.classList.toggle('barra__pildora--quieta', !animar);
        pildora.style.width = `${destino.width}px`;
        pildora.style.height = `${destino.height}px`;
        pildora.style.transform = `translate(${destino.left - caja.left}px, -50%)`; // centrada en alto: sigue bien aunque la barra se achique
        pildora.style.opacity = '1';
        pildora.classList.toggle('barra__pildora--hover', enlace !== actual());
    }

    lista.addEventListener('pointerover', (e) => {
        const enlace = e.target.closest('.barra__enlace');
        if (enlace) moverA(enlace);
    });
    lista.addEventListener('pointerleave', () => moverA(actual()));
    lista.addEventListener('focusin', (e) => {
        const enlace = e.target.closest('.barra__enlace');
        if (enlace) moverA(enlace);
    });
    lista.addEventListener('focusout', () => moverA(actual()));

    // Posición inicial sin animación (la fuente puede cambiar el ancho de los links al cargar)
    const ubicar = () => moverA(actual(), false);
    ubicar();
    document.fonts?.ready.then(ubicar);
    window.addEventListener('resize', ubicar);
    escritorio.addEventListener?.('change', ubicar);
})();
