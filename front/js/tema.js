// Comparación local de identidad. No necesita librerías y no cambia datos del usuario.
(() => {
    const temas = ['petroleo', 'mandarina', 'aqua', 'durazno'];
    const solicitado = new URLSearchParams(location.search).get('tema');
    let guardado;
    try { guardado = localStorage.getItem('autocar-tema'); } catch { /* Preferencia opcional. */ }
    const tema = temas.includes(solicitado) ? solicitado : temas.includes(guardado) ? guardado : 'aqua';
    document.documentElement.dataset.tema = tema;
    if (temas.includes(solicitado)) {
        try { localStorage.setItem('autocar-tema', tema); } catch { /* Funciona sin almacenamiento. */ }
    }
})();
