// Detalle de un vehículo (vehiculo.html?id=N) con GET /api/vehiculos/{id}.
import * as vehiculos from '../api/vehiculos.js';
import * as chat from '../api/chat.js';
import * as favoritos from '../api/favoritos.js';
import * as formato from '../servicios/formato.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';

import { ruta } from '../servicios/rutas.js';

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
    // Datos que puede no tener (una publicación vieja o el auto sin versión): si faltan, no se muestra el renglón
    [['version', v.version], ['condicion', v.condicion && formato.condicion(v.condicion)], ['localidad', v.localidad]]
        .filter(([, valor]) => valor)
        .forEach(([dato, valor]) => {
            $(`dato-${dato}`).textContent = valor;
            $(`dato-${dato}`).hidden = false;
            $(`dato-${dato}-titulo`).hidden = false;
        });

    if (v.vendedor) {
        $('vendedor-nombre').textContent = v.vendedor.nombre;
        $('vendedor-desde').textContent = `En AutoCar desde ${formato.fecha(v.vendedor.desde)}`;
        $('vehiculo-vendedor').hidden = false;
    }

    if (v.descripcion) {
        $('vehiculo-descripcion-texto').textContent = v.descripcion;
        $('vehiculo-descripcion').hidden = false;
    }
    // "Mandale un mecánico": el link de esta publicación ya lleva el id, el back completa los datos del auto
    if (v.estado === 'disponible') {
        const aviso = ruta(`vehiculo.html?id=${v.id}`);
        $('vehiculo-mecanico').href = ruta(`pedir-inspeccion.html?url=${encodeURIComponent(aviso)}`);
        $('vehiculo-mecanico').hidden = false;
        $('vehiculo-mecanico-ayuda').hidden = false;
    }
    if (v.estado === 'disponible') $('vehiculo-consultar').hidden = false;
    if (v.estado === 'disponible') mostrarFavorito();

    $('vehiculo').hidden = false;
    $('vehiculo-info').hidden = false;
}

async function cargar() {
    if (!/^\d+$/.test(id || '')) {
        estado.replaceChildren(vistas.aviso('No encontramos ese vehículo.', null,
            vistas.el('a', { class: 'boton boton--secundario', href: ruta('home.html') }, 'Ver publicaciones')));
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
                vistas.el('a', { class: 'boton boton--secundario', href: ruta('home.html') }, 'Ver publicaciones'))
            : vistas.avisoDeError(error));
    }
}

// "Consultar": abre (o retoma) la conversación con el vendedor. Sin sesión, pasa por el login y vuelve acá.
$('vehiculo-consultar').addEventListener('click', async (evento) => {
    if (!sesion.requerirLogin()) return;
    const boton = evento.currentTarget;
    const aviso = $('vehiculo-consultar-aviso');
    aviso.hidden = true;
    boton.disabled = true;
    try {
        const { conversacion } = await chat.abrir(id);
        window.location.assign(ruta(`conversacion.html?id=${conversacion.id}`));
    } catch (error) {
        // 409: es una publicación propia o no tiene vendedor; el back manda el motivo
        aviso.textContent = error.message;
        aviso.hidden = false;
        boton.disabled = false;
    }
});

// ---------- Favorito: guardar o sacar. Sin sesión, pasa por el login y vuelve acá ----------

const botonFavorito = $('vehiculo-favorito');
const avisoFavorito = $('vehiculo-favorito-aviso');

function pintarFavorito(guardado) {
    botonFavorito.setAttribute('aria-pressed', String(guardado));
    botonFavorito.textContent = guardado ? 'Guardado en favoritos' : 'Guardar en favoritos';
}

async function mostrarFavorito() {
    botonFavorito.hidden = false;
    if (!sesion.iniciada()) return;
    try {
        const { items } = await favoritos.listar();
        pintarFavorito(items.some((f) => String(f.id) === id));
    } catch {
        // Si no se pudo saber, el botón queda en "Guardar": al tocarlo se guarda igual
    }
}

botonFavorito.addEventListener('click', async () => {
    if (!sesion.requerirLogin()) return;
    const guardado = botonFavorito.getAttribute('aria-pressed') === 'true';
    avisoFavorito.hidden = true;
    botonFavorito.disabled = true;
    try {
        if (guardado) await favoritos.sacar(id);
        else await favoritos.agregar(id);
        pintarFavorito(!guardado);
    } catch (error) {
        // 409: es una publicación propia
        avisoFavorito.textContent = error.message;
        avisoFavorito.hidden = false;
    }
    botonFavorito.disabled = false;
});

cargar();
