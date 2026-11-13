// Propuestas de canje (maqueta: todavía no hay rutas de canje en el back).
// Los botones de cada propuesta y la ventana de contraoferta los arma el JS: en propuestas.html está sólo
// la información de cada propuesta. Como no hay back, todos avisan que la función no está disponible.
import * as formularios from '../servicios/formularios.js';
import * as vistas from '../servicios/vistas.js';
import { boton, campo, formularioEnHoja } from '../servicios/acciones.js';

const { el } = vistas;
const NO_DISPONIBLE = 'Esta función todavía no está disponible: no se guardó ni se envió nada.';

const opcion = (valor, texto, elegida) => el('label', {},
    el('input', { type: 'radio', name: 'quien_paga', value: valor, checked: elegida }), el('span', {}, texto));
const { dialogo, formulario } = formularioEnHoja({
    titulo: 'Contraofertar',
    id: 'form-contraoferta',
    enviar: 'Enviar',
    campos: [
        el('fieldset', { class: 'opciones' },
            el('legend', { class: 'campo__etiqueta' }, '¿Quién paga la diferencia?'),
            opcion('yo', 'Pago yo', true),
            opcion('otro', 'Me pagan a mí', false)),
        campo('Monto de la diferencia', el('input', {
            id: 'monto', name: 'diferencia', type: 'number', inputmode: 'numeric', min: 0, step: 1000, value: 500000, required: true,
        })),
    ],
});
formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (window.Validacion.validar(Array.from(formulario.elements), formulario)) formularios.alerta(formulario, NO_DISPONIBLE);
});

document.querySelectorAll('.propuesta__acciones').forEach((acciones) => {
    const avisoNoDisponible = () => vistas.avisoFlotante(NO_DISPONIBLE);
    acciones.append(
        boton('Aceptar', avisoNoDisponible, 'boton boton--chico'),
        boton('Contraofertar', () => {
            formularios.alerta(formulario, '');
            dialogo.showModal();
        }, 'boton boton--secundario boton--chico'),
        boton('Rechazar', avisoNoDisponible, 'boton boton--secundario boton--chico'));
});
