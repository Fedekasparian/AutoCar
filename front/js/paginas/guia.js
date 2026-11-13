// Guía de componentes: los ejemplos de botones. Se arman acá porque un botón es funcionalidad y no va en el HTML
// (ver "Botones y ventanas" en el README). Se ven como en el resto del sitio, pero no hacen nada.
import { el } from '../servicios/vistas.js';
import { boton } from '../servicios/acciones.js';

const estrella = () => {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    Object.entries({ width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
        'stroke-width': 2, 'stroke-linejoin': 'round', 'aria-hidden': 'true' }).forEach(([k, v]) => svg.setAttribute(k, v));
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', 'M12 3l2 7 7 2-7 2-2 7-2-7-7-2 7-2z');
    svg.append(path);
    return svg;
};

const buscar = boton(' Buscar', null, 'boton boton--secundario boton--bloque');
buscar.prepend(estrella());
const deshabilitado = boton('Deshabilitado', null, 'boton boton--chico');
deshabilitado.disabled = true;

document.querySelector('[aria-labelledby="g-botones"]').append(
    boton('Guardar y buscar', null, 'boton boton--bloque'),
    buscar,
    el('p', {},
        boton('Aprobar', null, 'boton boton--chico'), ' ',
        boton('Rechazar', null, 'boton boton--secundario boton--chico'), ' ',
        deshabilitado),
    boton('+ Nueva lista', null, 'boton-link'));
