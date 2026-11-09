// Formularios de pantallas que todavía son maqueta (sin ruta en el back): marcados con data-proximamente.
// En lugar de enviarse a una dirección que no existe (404 de Vercel), avisan que la función no está disponible
// y no mandan nada. Si el formulario tiene data-validar, primero se valida como siempre (js/validacion.js,
// que se carga antes y cancela el envío si hay errores).
// Cuando una pantalla se conecta a la API, se le saca data-proximamente y este script.
(function () {
    'use strict';

    const MENSAJE = 'Esta función todavía no está disponible: no se guardó ni se envió nada.';

    function cajaDeAviso(formulario) {
        let caja = formulario.querySelector('.formulario__alerta');
        if (!caja) {
            caja = document.createElement('p');
            caja.className = 'formulario__alerta';
            caja.tabIndex = -1;
            formulario.prepend(caja);
        }
        return caja;
    }

    document.querySelectorAll('form[data-proximamente]').forEach((formulario) => {
        formulario.addEventListener('submit', (evento) => {
            if (evento.defaultPrevented) return; // la validación encontró errores y ya los muestra
            evento.preventDefault();
            const caja = cajaDeAviso(formulario);
            caja.setAttribute('role', 'status');
            caja.classList.add('formulario__alerta--info');
            caja.textContent = MENSAJE;
            caja.focus();
        });
        // Si después se corrige un dato y aparece un error, la caja vuelve a ser de error
        formulario.addEventListener('input', () => {
            const caja = formulario.querySelector('.formulario__alerta--info');
            if (caja) {
                caja.classList.remove('formulario__alerta--info');
                caja.setAttribute('role', 'alert');
                caja.textContent = '';
            }
        });
    });
}());
