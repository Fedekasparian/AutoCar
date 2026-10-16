// Guía de componentes: muestra todas las piezas del sistema de diseño en un solo lugar.
// Sirve para revisarlas contra Figma y para copiar el HTML al armar una pantalla nueva.
import { html } from '../html.js';
import { iconos } from '../iconos.js';
import * as api from '../api.js';
import { grillaVehiculos } from '../componentes/ficha-vehiculo.js';

export const titulo = () => 'Guía de componentes';

export async function dibujar() {
    const publicaciones = await api.listarPublicaciones();

    return html`
        <encabezado-pantalla titulo="Guía de componentes" subtitulo="Sistema de diseño de AutoCar" volver="/">
            <button type="button" data-accion aria-label="Más opciones">${iconos.mas}</button>
        </encabezado-pantalla>

        <div class="pantalla">
            <section class="pila" aria-labelledby="g-botones">
                <h2 id="g-botones">Botones</h2>
                <button type="button" class="boton boton--bloque">Guardar y buscar</button>
                <button type="button" class="boton boton--secundario boton--bloque">${iconos.chispa} Completar con IA</button>
                <p>
                    <button type="button" class="boton boton--chico">Aprobar</button>
                    <button type="button" class="boton boton--secundario boton--chico">Rechazar</button>
                    <button type="button" class="boton boton--chico" disabled>Deshabilitado</button>
                </p>
                <button type="button" class="boton-link">+ Nueva lista</button>
            </section>

            <section aria-labelledby="g-campos">
                <h2 id="g-campos" class="titulo-seccion">Campos</h2>
                <form class="formulario" novalidate>
                    <p class="formulario__alerta" role="alert">Revisá los datos marcados.</p>
                    <div class="campo">
                        <label class="campo__etiqueta" for="g-marca">Marca</label>
                        <select class="campo__input" id="g-marca">
                            <option>Seleccionar marca</option>
                            <option>Toyota</option>
                        </select>
                    </div>
                    <div class="campos-fila">
                        <div class="campo">
                            <label class="campo__etiqueta" for="g-desde">Año desde</label>
                            <input class="campo__input" id="g-desde" inputmode="numeric" placeholder="2015">
                        </div>
                        <div class="campo">
                            <label class="campo__etiqueta" for="g-hasta">Año hasta</label>
                            <input class="campo__input" id="g-hasta" inputmode="numeric" placeholder="2022"
                                aria-invalid="true" aria-describedby="g-hasta-error">
                            <span class="campo__error" id="g-hasta-error">Tiene que ser mayor que el año desde.</span>
                        </div>
                    </div>
                    <div class="campo">
                        <label class="campo__etiqueta" for="g-texto">Describí el auto que buscás</label>
                        <textarea class="campo__input" id="g-texto" placeholder="Busco un Corolla automático, del 2015 en adelante…"></textarea>
                        <span class="campo__ayuda">La IA completa los campos. Revisalos antes de guardar.</span>
                    </div>
                    <label class="casilla">
                        <input type="checkbox">
                        <span>Acepto los términos y condiciones</span>
                    </label>
                </form>
            </section>

            <section class="pila" aria-labelledby="g-chips">
                <h2 id="g-chips">Chips y etiquetas</h2>
                <ul class="chips" role="list">
                    <li><button type="button" class="chip" aria-pressed="true">Todos (4)</button></li>
                    <li><button type="button" class="chip" aria-pressed="false">Para canje (2)</button></li>
                    <li><button type="button" class="chip" aria-pressed="false">Familia (1)</button></li>
                </ul>
                <p>
                    <span class="etiqueta">${iconos.chispa} IA</span>
                    <span class="etiqueta etiqueta--oscura">−25 %</span>
                    <span class="etiqueta etiqueta--borde">Pendiente</span>
                </p>
            </section>

            <section aria-labelledby="g-fichas">
                <h2 id="g-fichas" class="titulo-seccion">Fichas de vehículo <a href="#/home">Ver todas</a></h2>
                ${grillaVehiculos(publicaciones.slice(0, 4))}
            </section>

            <section aria-labelledby="g-filas">
                <h2 id="g-filas" class="titulo-seccion">Filas</h2>
                <ul class="lista-filas" role="list">
                    <li class="fila">
                        <span class="fila__miniatura"></span>
                        <span class="fila__cuerpo">
                            <span class="fila__titulo">Toyota Corolla 2018</span><br>
                            <span class="fila__meta">AB***12 · 85.000 km</span>
                        </span>
                        <span class="etiqueta etiqueta--borde">Pendiente</span>
                    </li>
                </ul>
            </section>

            <section class="pila" aria-labelledby="g-otros">
                <h2 id="g-otros">Pestañas, control segmentado y recuadro</h2>
                <div class="pestanas" role="tablist" aria-label="Ejemplo">
                    <button type="button" class="pestanas__pestana" role="tab" aria-selected="true">Pendientes (2)</button>
                    <button type="button" class="pestanas__pestana" role="tab" aria-selected="false">En inspección (1)</button>
                    <button type="button" class="pestanas__pestana" role="tab" aria-selected="false">Aprobaciones</button>
                </div>
                <fieldset class="segmentado">
                    <legend class="solo-lector">Pastillas y discos</legend>
                    <input type="radio" name="g-seg" id="g-ok" checked><label for="g-ok">OK</label>
                    <input type="radio" name="g-seg" id="g-obs"><label for="g-obs">Observado</label>
                    <input type="radio" name="g-seg" id="g-falla"><label for="g-falla">Falla</label>
                </fieldset>
                <div class="recuadro">Tu plan Oro: −25 % en cualquier taller adherido</div>
            </section>
        </div>`;
}

export function montar(raiz) {
    // Los chips de ejemplo funcionan como un filtro de selección única.
    raiz.querySelectorAll('.chips .chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            raiz.querySelectorAll('.chips .chip').forEach((otro) => otro.setAttribute('aria-pressed', String(otro === chip)));
        });
    });
    raiz.querySelectorAll('[role="tab"]').forEach((tab) => {
        tab.addEventListener('click', () => {
            raiz.querySelectorAll('[role="tab"]').forEach((otro) => otro.setAttribute('aria-selected', String(otro === tab)));
        });
    });
}
