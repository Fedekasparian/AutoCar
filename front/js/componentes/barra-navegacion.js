// <barra-navegacion>: navegación principal. Abajo en celular y arriba en escritorio (ver componentes.css).
import { html } from '../html.js';
import { iconos } from '../iconos.js';
import { rutaActual } from '../enrutador.js';

const ITEMS = [
    { texto: 'Home', destino: '/home', icono: iconos.inicio },
    { texto: 'Meta-S', destino: '/meta-busqueda', icono: iconos.buscar },
    { texto: 'Publicar', destino: '/mis-publicaciones', icono: iconos.publicar },
    { texto: 'Mensajes', destino: '/mensajes', icono: iconos.mensajes },
    { texto: 'Cuenta', destino: '/cuenta', icono: iconos.cuenta },
];

class BarraNavegacion extends HTMLElement {
    connectedCallback() {
        this.innerHTML = String(html`
            <nav class="barra" aria-label="Navegación principal">
                <a class="barra__marca" href="#/home">AutoCar</a>
                <ul class="barra__lista">
                    ${ITEMS.map((item) => html`
                        <li>
                            <a class="barra__enlace" href="#${item.destino}">
                                <span class="barra__icono">${item.icono}</span>
                                ${item.texto}
                            </a>
                        </li>`)}
                </ul>
            </nav>`);
        this.marcarActual();
        this.alCambiar = () => this.marcarActual();
        window.addEventListener('cambioderuta', this.alCambiar);
    }

    disconnectedCallback() {
        window.removeEventListener('cambioderuta', this.alCambiar);
    }

    // Marca con aria-current el ítem de la sección actual (por ejemplo /mensajes/3 marca Mensajes).
    marcarActual() {
        const actual = rutaActual();
        this.querySelectorAll('.barra__enlace').forEach((enlace) => {
            const destino = enlace.getAttribute('href').slice(1);
            const activo = actual === destino || actual.startsWith(`${destino}/`);
            if (activo) {
                enlace.setAttribute('aria-current', 'page');
            } else {
                enlace.removeAttribute('aria-current');
            }
        });
    }
}

customElements.define('barra-navegacion', BarraNavegacion);
