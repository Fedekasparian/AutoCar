// Nueva búsqueda (meta-busqueda-nueva.html) con POST /api/meta-busquedas. Marca y modelo del catálogo de la base
// (GET /api/marcas-modelos, la misma lista que Publicar): no depende de que el scraper ya haya cargado autos.
import * as api from '../api/metabusqueda.js';
import { marcasModelos } from '../api/vehiculos.js';
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
        const { marcas } = await marcasModelos();
        modelosPorMarca = new Map(marcas.map((m) => [m.marca, m.modelos]));
        marca.replaceChildren(vistas.el('option', { value: '' }, 'Seleccionar marca'),
            ...marcas.map((m) => vistas.el('option', {}, m.marca)));
    } catch (error) {
        if (error.status === 401) sesion.requerirLogin();
        else formularios.alerta(form, `No pudimos cargar las marcas: ${error.message}`);
    }
}

// Atajos para precio y km: tocar uno completa el campo (se puede seguir escribiendo otro valor)
const ATAJOS = {
    precio_max: [8000000, 12000000, 20000000, 30000000].map((v) => [v, `$${v / 1000000} M`]),
    km_max: [50000, 100000, 150000].map((v) => [v, `${v / 1000} mil km`]),
};
Object.entries(ATAJOS).forEach(([campo, valores]) => {
    const control = form.elements[campo];
    const fila = vistas.el('div', { class: 'atajos', role: 'group', 'aria-label': `Valores rápidos para ${control.labels[0].firstChild.textContent.trim()}` },
        ...valores.map(([valor, texto]) => {
            const b = vistas.el('button', { class: 'atajo', type: 'button', 'aria-pressed': 'false' }, texto);
            b.addEventListener('click', () => {
                control.value = control.value === String(valor) ? '' : String(valor);
                control.dispatchEvent(new Event('input', { bubbles: true }));
            });
            b.dataset.valor = String(valor);
            return b;
        }));
    control.closest('.campo').append(fila);
});

// La frase de lo que se va a seguir y los atajos marcados según lo escrito
const resumen = document.getElementById('resumen-busqueda');
const miles = new Intl.NumberFormat('es-AR');
function actualizar() {
    const d = formularios.datosDe(form);
    form.querySelectorAll('.atajo').forEach((b) => {
        const control = b.closest('.campo').querySelector('.campo__input');
        b.setAttribute('aria-pressed', String(control.value === b.dataset.valor));
    });
    if (!d.marca || !d.modelo) { resumen.hidden = true; return; }
    const partes = [];
    if (d.anio_desde && d.anio_hasta) partes.push(`del ${d.anio_desde} al ${d.anio_hasta}`);
    else if (d.anio_desde) partes.push(`del ${d.anio_desde} en adelante`);
    else if (d.anio_hasta) partes.push(`hasta el ${d.anio_hasta}`);
    if (d.precio_max) partes.push(`hasta $${miles.format(d.precio_max)}`);
    if (d.km_max) partes.push(`con menos de ${miles.format(d.km_max)} km`);
    if (d.transmision) partes.push(d.transmision === 'manual' ? 'manual' : 'automático');
    resumen.replaceChildren(
        'Vamos a seguir cada ', vistas.el('strong', {}, `${d.marca} ${d.modelo}`),
        partes.length ? ` ${partes.join(', ')}` : '',
        ' en MercadoLibre, Kavak, Autocosmos y AutoCar, y te avisamos si aparece uno nuevo o baja un precio.');
    resumen.hidden = false;
}
form.addEventListener('input', actualizar);
form.addEventListener('change', actualizar);

// Los campos opcionales vacíos no se mandan
formularios.alEnviar(form, async (datos) => {
    const limpios = Object.fromEntries(Object.entries(datos).filter(([, v]) => v !== ''));
    const { busqueda } = await api.crear(limpios);
    window.location.assign(ruta(`meta-busqueda-resultados.html?id=${busqueda.id}`));
});

if (sesion.requerirLogin()) cargarMarcas();
