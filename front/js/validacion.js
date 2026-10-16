// Validación en el cliente con el mensaje al lado de cada campo, como piden los wireframes.
// Usa las reglas del propio HTML (required, min, max, pattern, maxlength). El back vuelve a validar todo:
// esto sólo evita mandar un formulario que ya sabemos que está mal.
//
// Cada campo necesita un id y un elemento con id "<id>-error" para el mensaje.
// Un formulario con el atributo data-validar se valida completo al enviarlo.
(function () {
    const MENSAJES = {
        valueMissing: 'Completá este dato.',
        typeMismatch: 'El formato no es válido.',
        patternMismatch: 'El formato no es válido.',
        badInput: 'Ingresá un número.',
        stepMismatch: 'Ingresá un número redondo.',
        rangeUnderflow: (control) => `Tiene que ser ${control.min} o más.`,
        rangeOverflow: (control) => `Tiene que ser ${control.max} o menos.`,
        tooShort: (control) => `Tiene que tener al menos ${control.minLength} caracteres.`,
        tooLong: (control) => `Puede tener hasta ${control.maxLength} caracteres.`,
    };

    function mensajePara(control) {
        const v = control.validity;
        if (v.customError) return control.validationMessage;
        if (v.patternMismatch && control.dataset.errorFormato) return control.dataset.errorFormato;
        if (v.valueMissing && control.type === 'checkbox') return 'Tenés que marcar esta casilla.';
        if (v.valueMissing && control.type === 'file') return 'Agregá al menos una foto.';
        for (const clave of Object.keys(MENSAJES)) {
            if (v[clave]) {
                const mensaje = MENSAJES[clave];
                return typeof mensaje === 'function' ? mensaje(control) : mensaje;
            }
        }
        return '';
    }

    function cajaDeError(control) {
        return control.id ? document.getElementById(`${control.id}-error`) : null;
    }

    function mostrar(control, mensaje) {
        control.setAttribute('aria-invalid', 'true');
        const caja = cajaDeError(control);
        if (caja) caja.textContent = mensaje;
    }

    function limpiar(control) {
        control.removeAttribute('aria-invalid');
        const caja = cajaDeError(control);
        if (caja) caja.textContent = '';
    }

    // Valida los controles dados. Muestra cada error al lado del campo, el resumen arriba
    // del formulario y lleva el foco al primer campo con error. Devuelve true si está todo bien.
    function validar(controles, formulario) {
        let primero = null;
        controles.forEach((control) => {
            if (!control.willValidate || !control.id) return;
            if (control.checkValidity()) {
                limpiar(control);
            } else {
                mostrar(control, mensajePara(control));
                primero = primero || control;
            }
        });
        const alerta = formulario && formulario.querySelector('.formulario__alerta');
        if (alerta) alerta.textContent = primero ? 'Revisá los datos marcados.' : '';
        if (primero) primero.focus();
        return !primero;
    }

    // Cuando el usuario corrige un campo marcado, el error se borra apenas el dato queda bien.
    document.addEventListener('input', (evento) => {
        const control = evento.target;
        if (control.getAttribute('aria-invalid') === 'true' && control.checkValidity()) limpiar(control);
    });
    document.addEventListener('change', (evento) => {
        const control = evento.target;
        if (control.getAttribute('aria-invalid') === 'true' && control.checkValidity()) limpiar(control);
    });

    document.querySelectorAll('form[data-validar]').forEach((formulario) => {
        formulario.addEventListener('submit', (evento) => {
            if (!validar(Array.from(formulario.elements), formulario)) evento.preventDefault();
        });
    });

    window.Validacion = { validar, mostrar, limpiar };
}());
