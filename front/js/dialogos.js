// Abre y cierra las ventanas <dialog> (por ejemplo "Guardar en favoritos").
// Un botón con data-abrir="id" abre el dialog con ese id; uno con data-cerrar cierra el que lo contiene.
// Escape cierra la ventana (lo hace el navegador) y también se cierra al tocar afuera.

document.querySelectorAll('[data-abrir]').forEach((boton) => {
    const dialogo = document.getElementById(boton.dataset.abrir);
    if (!dialogo) return;
    boton.addEventListener('click', () => dialogo.showModal());
});

document.querySelectorAll('dialog').forEach((dialogo) => {
    dialogo.querySelectorAll('[data-cerrar]').forEach((boton) => {
        boton.addEventListener('click', () => dialogo.close());
    });
    // El clic en el fondo oscuro llega al propio dialog, pero fuera de su rectángulo.
    dialogo.addEventListener('click', (evento) => {
        if (evento.target !== dialogo) return;
        const caja = dialogo.getBoundingClientRect();
        const afuera = evento.clientX < caja.left || evento.clientX > caja.right
            || evento.clientY < caja.top || evento.clientY > caja.bottom;
        if (afuera) dialogo.close();
    });
});
