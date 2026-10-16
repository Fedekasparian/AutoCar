// Pantalla provisoria para las rutas que todavía no están hechas.
import { html } from '../html.js';

export function dibujar({ titulo, camino }) {
    return html`
        <encabezado-pantalla titulo="${titulo ?? 'AutoCar'}" volver="/home"></encabezado-pantalla>
        <section class="pantalla">
            <div class="vacio">
                <p><strong>Pantalla en construcción</strong></p>
                <p>La ruta <code>${camino}</code> se arma en una de las próximas partes.</p>
                <a class="boton boton--secundario" href="#/estilos">Ver la guía de componentes</a>
            </div>
        </section>`;
}
