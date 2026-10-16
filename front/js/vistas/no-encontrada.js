// 404: la ruta no existe.
import { html } from '../html.js';

export const titulo = () => 'Página no encontrada';

export function dibujar() {
    return html`
        <encabezado-pantalla titulo="Página no encontrada" volver="/"></encabezado-pantalla>
        <section class="pantalla">
            <div class="vacio">
                <p><strong>No encontramos esta página.</strong></p>
                <p>Puede que el enlace esté mal escrito o que la publicación ya no exista.</p>
                <a class="boton" href="#/">Ir al inicio</a>
            </div>
        </section>`;
}
