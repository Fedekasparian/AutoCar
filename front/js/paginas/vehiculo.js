// Detalle de un vehículo (vehiculo.html?id=N) con GET /api/vehiculos/{id}.
import * as vehiculos from '../api/vehiculos.js';
import * as formato from '../servicios/formato.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';

const id = new URLSearchParams(window.location.search).get('id');
const estado = document.getElementById('estado');
const $ = (idElemento) => document.getElementById(idElemento);

function mostrar(v) {
    const titulo = formato.titulo(v);
    document.title = `${titulo} - AutoCar`;

    $('vehiculo-foto').append(vistas.imagenVehiculo(v, 'galeria__imagen'));
    $('vehiculo-foto-texto').textContent = `Foto del ${titulo}`;

    $('vehiculo-titulo').textContent = titulo;
    $('vehiculo-precio').textContent = formato.precio(v.precio);
    $('vehiculo-resumen').textContent = `${formato.km(v.kilometraje)} · ${formato.combustible(v.combustible)}`;
    $('vehiculo-vendido').hidden = v.estado !== 'vendido';

    $('dato-marca').textContent = v.marca;
    $('dato-modelo').textContent = v.modelo;
    $('dato-anio').textContent = v.anio;
    $('dato-kilometraje').textContent = formato.km(v.kilometraje);
    $('dato-combustible').textContent = formato.combustible(v.combustible);
    $('dato-transmision').textContent = formato.transmision(v.transmision);
    $('dato-estado').textContent = formato.estado(v.estado);

    if (v.descripcion) {
        $('vehiculo-descripcion-texto').textContent = v.descripcion;
        $('vehiculo-descripcion').hidden = false;
    }
    if (sesion.esAdmin()) {
        $('vehiculo-editar').href = `admin-vehiculo.html?id=${v.id}`;
        $('vehiculo-editar').hidden = false;
    }

    $('vehiculo').hidden = false;
    $('vehiculo-info').hidden = false;
}

async function cargar() {
    if (!/^\d+$/.test(id || '')) {
        estado.replaceChildren(vistas.aviso('No encontramos ese vehículo.', null,
            vistas.el('a', { class: 'boton boton--secundario', href: 'home.html' }, 'Ver publicaciones')));
        return;
    }
    estado.replaceChildren(vistas.cargando());
    try {
        const { vehiculo } = await vehiculos.detalle(id);
        estado.replaceChildren();
        mostrar(vehiculo);
    } catch (error) {
        estado.replaceChildren(error.status === 404
            ? vistas.aviso('No encontramos ese vehículo.', 'Puede que se haya dado de baja.',
                vistas.el('a', { class: 'boton boton--secundario', href: 'home.html' }, 'Ver publicaciones'))
            : vistas.avisoDeError(error));
    }
}

cargar();
