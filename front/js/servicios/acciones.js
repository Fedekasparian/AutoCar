// Botones y ventanas (<dialog class="hoja">) de las acciones de cada página.
// No están en el HTML: el HTML describe la información y lo que se puede hacer con ella lo agrega el JS.
// Así, si mañana cambia una acción (otra forma de confirmar, una función que se saca), el HTML no se toca.
// Cada página busca el nodo donde va la acción, crea el botón y lo inserta.
import { el } from './vistas.js';

// Botón de acción: boton('Guardar en favoritos', guardar, 'boton boton--secundario')
export function boton(texto, alHacerClic, clase = 'boton') {
    const nodo = el('button', { class: clase, type: 'button' }, texto);
    if (alHacerClic) nodo.addEventListener('click', alHacerClic);
    return nodo;
}

// Campo de formulario con su etiqueta, la ayuda (opcional) y el lugar del error "<id>-error" que usa js/validacion.js.
// campo('Motivo', el('textarea', { id: 'motivo', name: 'motivo', required: true }), 'Lo ve el comprador.')
export function campo(etiqueta, control, ayuda) {
    const id = control.id;
    const describe = [ayuda === undefined ? null : `${id}-ayuda`, `${id}-error`].filter(Boolean).join(' ');
    control.classList.add('campo__input');
    control.setAttribute('aria-describedby', describe);
    return el('div', { class: 'campo' },
        el('label', { class: 'campo__etiqueta', for: id }, etiqueta),
        control,
        ayuda === undefined ? null : el('span', { class: 'campo__ayuda', id: `${id}-ayuda` }, ayuda),
        el('span', { class: 'campo__error', id: `${id}-error` }));
}

// Caja para el mensaje de error de una ventana (la misma clase que los formularios)
const cajaDeError = () => el('p', { class: 'formulario__alerta', role: 'alert', tabindex: '-1' });

// Ventana con su título, al final de la página. Escape la cierra (lo hace el navegador) y también tocar afuera.
let ventanas = 0;
function hoja(titulo, contenido) {
    ventanas += 1;
    const idTitulo = `hoja-titulo-${ventanas}`;
    contenido.prepend(el('h2', { id: idTitulo }, titulo));
    const dialogo = el('dialog', { class: 'hoja', 'aria-labelledby': idTitulo }, contenido);
    // El clic en el fondo oscuro llega al propio dialog, pero fuera de su rectángulo
    dialogo.addEventListener('click', (evento) => {
        if (evento.target !== dialogo) return;
        const caja = dialogo.getBoundingClientRect();
        const afuera = evento.clientX < caja.left || evento.clientX > caja.right
            || evento.clientY < caja.top || evento.clientY > caja.bottom;
        if (afuera) dialogo.close();
    });
    document.body.append(dialogo);
    return dialogo;
}

// "¿Seguro que…?": devuelve abrir(elegido). detalle(elegido) da los párrafos que se ven abajo del título;
// hacer(elegido) es la acción. Si hacer falla, el error queda en la ventana; si sale bien, la ventana se cierra.
// const pedirBorrar = confirmacion({ titulo: '¿Borrar esta búsqueda?', confirmar: 'Borrar', detalle, hacer });
export function confirmacion({ titulo, confirmar, volver = 'Cancelar', detalle = () => [], hacer }) {
    const error = cajaDeError();
    const aceptar = boton(confirmar, async () => {
        aceptar.disabled = true;
        aceptar.textContent = 'Un momento…';
        try {
            await hacer(elegido);
            dialogo.close();
        } catch (e) {
            error.textContent = e.message;
            error.focus();
        } finally {
            aceptar.disabled = false;
            aceptar.textContent = confirmar;
        }
    });
    const dialogo = hoja(titulo, el('div', { class: 'pila' },
        error,
        el('div', { class: 'hoja__acciones' },
            boton(volver, () => dialogo.close(), 'boton boton--secundario'),
            aceptar)));

    let elegido = null;
    let parrafos = [];
    return (cual) => {
        elegido = cual;
        error.textContent = '';
        parrafos.forEach((p) => p.remove());
        parrafos = detalle(cual).filter(Boolean);
        error.before(...parrafos);
        dialogo.showModal();
    };
}

// Ventana con un formulario. Devuelve { dialogo, formulario }: la página conecta el envío (alEnviar de
// formularios.js) y abre la ventana con dialogo.showModal(). El botón de enviar es el submit del formulario.
export function formularioEnHoja({ titulo, id, campos, enviar, volver = 'Cancelar' }) {
    const formulario = el('form', { class: 'formulario', id, novalidate: true },
        cajaDeError(),
        ...campos,
        el('div', { class: 'hoja__acciones' },
            boton(volver, () => dialogo.close(), 'boton boton--secundario'),
            el('button', { class: 'boton', type: 'submit' }, enviar)));
    const dialogo = hoja(titulo, formulario);
    return { dialogo, formulario };
}
