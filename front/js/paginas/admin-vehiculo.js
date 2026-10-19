// Administración: alta (sin ?id) o edición (?id=N) de un vehículo.
import * as admin from '../api/admin.js';
import * as vehiculos from '../api/vehiculos.js';
import * as formato from '../servicios/formato.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { alEnviar } from '../servicios/formularios.js';

const id = new URLSearchParams(window.location.search).get('id');
const formulario = document.getElementById('form-vehiculo');
const estado = document.getElementById('estado');

// El back acepta hasta el año que viene.
formulario.elements.anio.max = new Date().getFullYear() + 1;

// Para editar se usa el detalle público, que también devuelve los vendidos.
async function cargarVehiculo() {
    formulario.hidden = true;
    estado.replaceChildren(vistas.cargando());
    try {
        const { vehiculo } = await vehiculos.detalle(id);
        document.getElementById('titulo').textContent = `Editar ${formato.titulo(vehiculo)}`;
        Array.from(formulario.elements).forEach((control) => {
            if (control.name && control.name in vehiculo) control.value = vehiculo[control.name] ?? '';
        });
        estado.replaceChildren();
        formulario.hidden = false;
    } catch (error) {
        estado.replaceChildren(error.status === 404
            ? vistas.aviso('Ese vehículo no existe.', null,
                vistas.el('a', { class: 'boton boton--secundario', href: 'admin-vehiculos.html' }, 'Volver al listado'))
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
    window.location.assign('admin-vehiculos.html?guardado=1');
});

if (sesion.requerirAdmin() && id) cargarVehiculo();
