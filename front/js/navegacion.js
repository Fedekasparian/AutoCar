// Navegación (script clásico, en todas las páginas, después de barra-admin.js):
// - la barra y la cabecera se achican y toman sombra al bajar (clase "con-scroll" en <html>);
// - en escritorio, una píldora se desliza al link que señala el mouse y vuelve al de la página actual.
// Sólo es visual: sin este script la navegación funciona igual.
(() => {
    const raiz = document.documentElement;

    // 1. Barra compacta al bajar
    let pendiente = false;
    const revisarScroll = () => {
        pendiente = false;
        raiz.classList.toggle('con-scroll', window.scrollY > 8);
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
