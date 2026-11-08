// Administración: alta (sin ?id) o edición (?id=N) de un vehículo.
import * as admin from '../api/admin.js';
import * as formato from '../servicios/formato.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { alEnviar } from '../servicios/formularios.js';

import { ruta } from '../servicios/rutas.js';

const id = new URLSearchParams(window.location.search).get('id');
const formulario = document.getElementById('form-vehiculo');
const estado = document.getElementById('estado');

// El back acepta hasta el año que viene.
formulario.elements.anio.max = new Date().getFullYear() + 1;

const marca = formulario.elements.marca;
const modelo = formulario.elements.modelo;

// Modelo: sólo los de la marca elegida (igual que en publicar.html).
function mostrarModelosDeLaMarca() {
    for (const grupo of modelo.querySelectorAll('optgroup')) {
        const esDeOtraMarca = marca.value !== '' && grupo.label !== marca.value;
        grupo.hidden = esDeOtraMarca;
        grupo.disabled = esDeOtraMarca;
    }
    const elegido = modelo.selectedOptions[0];
    if (elegido && elegido.parentElement.disabled) modelo.value = '';
}
marca.addEventListener('change', mostrarModelosDeLaMarca);

// Si el vehículo tiene una marca o un modelo que no está en la lista (cargado antes de que existiera),
// se agrega como opción para no perderlo al guardar.
function agregarSiFalta(select, valor) {
    if (valor === '' || valor === null) return;
    const existe = Array.from(select.options).some((opcion) => opcion.value === valor);
    if (!existe) select.append(new Option(valor, valor));
}

// Para editar se usa el detalle de admin: el público da 404 con los pendientes, rechazados y eliminados.
async function cargarVehiculo() {
    formulario.hidden = true;
    estado.replaceChildren(vistas.cargando());
    try {
        const { vehiculo } = await admin.detalle(id);
        document.getElementById('titulo').textContent = `Editar ${formato.titulo(vehiculo)}`;
        agregarSiFalta(marca, vehiculo.marca);
        agregarSiFalta(modelo, vehiculo.modelo);
        Array.from(formulario.elements).forEach((control) => {
            if (control.name && control.name in vehiculo) control.value = vehiculo[control.name] ?? '';
        });
        mostrarModelosDeLaMarca();
        estado.replaceChildren();
        formulario.hidden = false;
    } catch (error) {
        estado.replaceChildren(error.status === 404
            ? vistas.aviso('Ese vehículo no existe.', null,
                vistas.el('a', { class: 'boton boton--secundario', href: ruta('admin-vehiculos.html') }, 'Volver al listado'))
            : vistas.avisoDeError(error));
    }
}

alEnviar(formulario, async (datos) => {
    try {
        if (id) await admin.actualizar(id, datos);
        else await admin.crear(datos);
    } catch (error) {
        if (error.status === 401) sesion.requerirLogin();
        throw error;
    }
    window.location.assign(ruta('admin-vehiculos.html?guardado=1'));
});

if (sesion.requerirPermiso('vehiculos.gestionar') && id) cargarVehiculo();
