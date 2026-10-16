// <encabezado-pantalla titulo="..." subtitulo="..." volver="/ruta">: encabezado de cada pantalla.
// Si tiene el atributo volver muestra la flecha; esa ruta es el respaldo cuando no hay historial.
// Un hijo con data-accion (por ejemplo el botón de favorito) se ubica a la derecha.
import { html } from '../html.js';
import { iconos } from '../iconos.js';
import { volver } from '../enrutador.js';

class EncabezadoPantalla extends HTMLElement {
    connectedCallback() {
        if (this.firstElementChild?.classList.contains('encabezado')) return;

        const accion = this.querySelector('[data-accion]');
        const titulo = this.getAttribute('titulo') ?? '';
        const subtitulo = this.getAttribute('subtitulo');
        const respaldo = this.getAttribute('volver');

        this.innerHTML = String(html`
            <header class="encabezado">
                ${respaldo !== null ? html`
                    <button type="button" class="encabezado__volver" aria-label="Volver">${iconos.volver}</button>` : ''}
                <h1>
                    ${titulo}
                    ${subtitulo ? html`<span class="encabezado__subtitulo">${subtitulo}</span>` : ''}
                </h1>
            </header>`);

        if (accion) {
            accion.classList.add('encabezado__accion');
            this.firstElementChild.append(accion);
        }
        this.querySelector('.encabezado__volver')?.addEventListener('click', () => volver(respaldo || '/home'));
    }
}

customElements.define('encabezado-pantalla', EncabezadoPantalla);
