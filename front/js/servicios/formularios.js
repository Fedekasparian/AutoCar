// Formularios que se envían a la API con fetch en lugar de navegar.
// Valida en el cliente con js/validacion.js (window.Validacion) y, si el back responde 422,
// muestra cada error al lado de su campo, igual que la validación del cliente.

// Los campos del formulario como objeto {name: valor}. Las casillas van como true/false.
export function datosDe(formulario) {
    const datos = {};
    Array.from(formulario.elements).forEach((control) => {
        if (!control.name || control.disabled || control.type === 'submit') return;
        datos[control.name] = control.type === 'checkbox' ? control.checked : control.value.trim();
    });
    return datos;
}

export function alerta(formulario, mensaje) {
    const caja = formulario.querySelector('.formulario__alerta');
    if (!caja) return;
    caja.textContent = mensaje;
    if (mensaje) caja.focus();
}

// Muestra un ErrorApi en el formulario: los errores por campo al lado de cada uno y el mensaje arriba.
export function mostrarError(formulario, error) {
    let primero = null;
    Object.entries(error.errores || {}).forEach(([campo, mensaje]) => {
        const control = formulario.elements[campo];
        if (!control || !control.id) return;
        window.Validacion.mostrar(control, mensaje);
        primero = primero || control;
    });
    alerta(formulario, error.message);
    if (primero) primero.focus();
}

// Conecta el envío: valida, desactiva el botón mientras espera y llama a enviar(datos).
// Si enviar lanza un ErrorApi, se muestra en el formulario.
export function alEnviar(formulario, enviar) {
    const boton = formulario.querySelector('[type="submit"]');
    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        alerta(formulario, '');
        if (!window.Validacion.validar(Array.from(formulario.elements), formulario)) return;

        const textoBoton = boton.textContent;
        boton.disabled = true;
        boton.textContent = 'Enviando…';
        try {
            await enviar(datosDe(formulario));
        } catch (error) {
            mostrarError(formulario, error);
        } finally {
            boton.disabled = false;
            boton.textContent = textoBoton;
        }
    });
}
