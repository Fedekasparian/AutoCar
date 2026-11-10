// Nueva búsqueda (meta-busqueda-nueva.html) con POST /api/meta-busquedas. Marca y modelo de los que hay autos.
import * as api from '../api/metabusqueda.js';
import * as formularios from '../servicios/formularios.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { ruta } from '../servicios/rutas.js';

const form = document.getElementById('form-busqueda');
const marca = form.elements.marca;
const modelo = form.elements.modelo;
let modelosPorMarca = new Map();

function filtrarModelos() {
    modelo.replaceChildren(vistas.el('option', { value: '' }, 'Seleccionar modelo'),
        ...(modelosPorMarca.get(marca.value) || []).map((m) => vistas.el('option', {}, m)));
}
marca.addEventListener('change', filtrarModelos);

async function cargarMarcas() {
    try {
        const { marcas } = await api.marcas();
        modelosPorMarca = new Map(marcas.map((m) => [m.marca, m.modelos]));
        marca.replaceChildren(vistas.el('option', { value: '' }, 'Seleccionar marca'),
            ...marcas.map((m) => vistas.el('option', {}, m.marca)));
    } catch (error) {
        if (error.status === 401) sesion.requerirLogin();
        else formularios.alerta(form, `No pudimos cargar las marcas: ${error.message}`);
    }
}

// Los campos opcionales vacíos no se mandan
formularios.alEnviar(form, async (datos) => {
    const limpios = Object.fromEntries(Object.entries(datos).filter(([, v]) => v !== ''));
    const { busqueda } = await api.crear(limpios);
    window.location.assign(ruta(`meta-busqueda-resultados.html?id=${busqueda.id}`));
});

if (sesion.requerirLogin()) cargarMarcas();
