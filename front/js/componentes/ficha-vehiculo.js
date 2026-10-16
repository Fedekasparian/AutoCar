// Ficha de vehículo para las grillas (home, favoritos, búsqueda, landing).
import { html } from '../html.js';
import { precio } from '../formato.js';

// opciones.etiqueta: texto opcional arriba de la foto (por ejemplo la lista de favoritos).
// opciones.enlace: false para la landing, donde el visitante no entra al detalle.
export function fichaVehiculo(pub, opciones = {}) {
    const { etiqueta, enlace = true } = opciones;
    const titulo = `${pub.marca} ${pub.modelo} ${pub.anio}`;
    const contenido = html`
        ${pub.foto
            ? html`<img class="ficha-vehiculo__imagen" src="${pub.foto}" alt="${titulo}" loading="lazy">`
            : html`<div class="ficha-vehiculo__imagen" role="img" aria-label="${titulo}, sin foto"></div>`}
        ${etiqueta ? html`<span class="etiqueta etiqueta--borde ficha-vehiculo__etiqueta">${etiqueta}</span>` : ''}
        <div class="ficha-vehiculo__cuerpo">
            <span class="ficha-vehiculo__precio">${precio(pub.precio)}</span>
            <span class="ficha-vehiculo__titulo">${titulo}</span>
            ${pub.localidad ? html`<span class="ficha-vehiculo__lugar">${pub.localidad}</span>` : ''}
        </div>`;

    return enlace
        ? html`<a class="ficha-vehiculo" href="#/vehiculo/${pub.id}">${contenido}</a>`
        : html`<article class="ficha-vehiculo">${contenido}</article>`;
}

export function grillaVehiculos(publicaciones, opciones) {
    return html`
        <ul class="grilla-vehiculos" role="list">
            ${publicaciones.map((pub) => html`<li>${fichaVehiculo(pub, opciones)}</li>`)}
        </ul>`;
}
