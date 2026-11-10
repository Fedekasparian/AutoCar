// Publicar vehículo por partes, en 6 pasos. Con el paso 1 (marca, modelo y año) ya se crea la publicación
// (POST /api/mis-vehiculos) y "Siguiente" guarda el paso en el que está (PUT, o POST .../fotos) sólo si cambió algo.
// El vendedor puede salir cuando quiera ("Terminar después") y seguir desde Mis publicaciones (publicar.html?id=N).
// La publicación queda pendiente y el moderador recién la puede aprobar cuando está completa (vehiculo.faltan vacío).
// En el último paso, si está completa, "Enviar a revisión" cierra el formulario y le confirma que quedó en revisión.
import * as api from '../api/publicaciones.js';
import * as catalogo from '../api/vehiculos.js';
import { achicar } from '../servicios/imagenes.js';
import { API_URL } from '../api/config.js';
import * as formato from '../servicios/formato.js';
import * as formularios from '../servicios/formularios.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { ruta } from '../servicios/rutas.js';

const { el } = vistas;
const form = document.getElementById('form-publicar');
const pasos = Array.from(form.querySelectorAll('.paso'));
const anterior = document.getElementById('paso-anterior');
const siguiente = document.getElementById('paso-siguiente');
const guardarSalir = document.getElementById('guardar-salir');
const terminar = document.getElementById('terminar');
const aviso = document.getElementById('aviso');
const faltanTexto = document.getElementById('faltan');
const fotos = document.getElementById('fotos');
const fotosPrevia = document.getElementById('fotos-previa');
const fotosActuales = document.getElementById('fotos-actuales');
const estado = document.getElementById('estado');
const pasosBarra = document.getElementById('pasos');

// Qué campos guarda cada paso (el 3 son las fotos y el 6 es la revisión: no guardan campos)
const CAMPOS_DE_PASO = [
    ['marca', 'modelo', 'anio', 'version'],
    ['kilometraje', 'combustible', 'transmision', 'condicion', 'descripcion'],
    [],
    ['precio', 'acepta_canje', 'busca_canje'],
    ['localidad'],
    [],
];
// En qué paso se carga cada cosa que puede faltar (para que "Continuar" lleve a donde falta algo)
const PASO_DE = {
    precio: 3, kilometraje: 1, combustible: 1, transmisión: 1, 'estado general': 1, localidad: 4, fotos: 2,
};
const PASO_FOTOS = 2;
const PASO_REVISION = 5;
const MAX_FOTOS = Number(fotos.dataset.max);

let actual = 0;
let vehiculo = null; // lo que devolvió la API la última vez (null hasta que se guarda el paso 1)
const guardado = []; // lo último que se guardó de cada paso, para no volver a guardar si no cambió nada

const urlFoto = (rutaFoto) => API_URL + rutaFoto; // en local la API está en otro puerto
const idDeFoto = (rutaFoto) => rutaFoto.split('/').pop();

function avisar(texto) {
    aviso.textContent = texto;
    aviso.hidden = !texto;
}

// ---------- Pasos ----------

function mostrarPaso(indice) {
    actual = indice;
    const ultimo = pasos.length - 1;
    pasos.forEach((paso, i) => {
        paso.hidden = i !== indice;
    });
    anterior.hidden = indice === 0;
    siguiente.hidden = indice === ultimo;
    guardarSalir.hidden = indice === ultimo;
    terminar.hidden = indice !== ultimo;
    terminar.textContent = textoDeTerminar();
    document.getElementById('pasos-texto').textContent = `Paso ${indice + 1} de ${pasos.length} · ${pasos[indice].dataset.paso}`;
    document.getElementById('pasos-numero').textContent = `${indice + 1}/${pasos.length}`;
    document.getElementById('pasos-progreso').value = indice + 1;
    if (indice === PASO_REVISION) completarResumen();
    window.scrollTo(0, 0);
}

// Completa y pendiente: la manda a revisión. Ya publicada sin cambios: "Listo". Si no, la sigue después.
const paraEnviar = () => vehiculo?.completa && vehiculo.estado === 'pendiente';
function textoDeTerminar() {
    if (paraEnviar()) return 'Enviar a revisión';
    return vehiculo?.estado === 'disponible' ? 'Listo' : 'Terminar después';
}

function controlesDe(paso) {
    return Array.from(paso.querySelectorAll('input, select, textarea'));
}

// Lo que le falta para que el moderador la pueda aprobar, arriba de los pasos
function mostrarFaltan() {
    if (!vehiculo) {
        faltanTexto.hidden = true;
        return;
    }
    faltanTexto.hidden = false;
    faltanTexto.textContent = vehiculo.completa
        ? 'Tu publicación está completa: la va a revisar un moderador.'
        : `Guardada. Para que la revisemos te falta: ${vehiculo.faltan.join(', ')}.`;
}

// ---------- Guardar el paso actual ----------

function datosDelPaso(indice) {
    const todos = formularios.datosDe(form);
    const datos = {};
    CAMPOS_DE_PASO[indice].forEach((campo) => {
        datos[campo] = todos[campo] ?? '';
    });
    return datos;
}

async function crear(datos) {
    const formData = new FormData();
    Object.entries(datos).forEach(([campo, valor]) => formData.append(campo, valor));
    const respuesta = await api.crear(formData);
    // La URL pasa a tener el id: si recarga o vuelve, sigue con la misma publicación
    window.history.replaceState(null, '', `?id=${respuesta.vehiculo.id}`);
    avisar('Listo, ya quedó guardada. Podés seguir ahora o tocar "Terminar después" y seguirla desde Mis publicaciones.');
    return respuesta.vehiculo;
}

async function subirFotos() {
    if (!fotos.files.length) return vehiculo;
    const formData = new FormData();
    // Se achican antes de subir (lado mayor 1600 px): se puede elegir una foto de cualquier tamaño
    const achicadas = await Promise.all(Array.from(fotos.files).map((archivo) => achicar(archivo)));
    achicadas.forEach((archivo) => formData.append('fotos[]', archivo));
    const respuesta = await api.agregarFotos(vehiculo.id, formData);
    fotos.value = '';
    fotosPrevia.replaceChildren();
    return respuesta.vehiculo;
}

// Anota lo que tiene cada paso ahora como "lo último guardado"
function recordarGuardado(indice) {
    guardado[indice] = JSON.stringify(datosDelPaso(indice));
}

function cambioElPaso(indice) {
    return JSON.stringify(datosDelPaso(indice)) !== guardado[indice];
}

// Guarda el paso actual sólo si hay algo nuevo: si no tocó nada, no le pega a la API
async function guardarPaso() {
    if (actual === PASO_REVISION) return;
    if (actual === PASO_FOTOS) {
        if (!fotos.files.length) return;
        vehiculo = await subirFotos();
    } else if (!vehiculo) {
        vehiculo = await crear(datosDelPaso(actual));
    } else if (cambioElPaso(actual)) {
        vehiculo = (await api.actualizar(vehiculo.id, datosDelPaso(actual))).vehiculo;
    } else {
        return;
    }
    recordarGuardado(actual);
    if (vehiculo.fotos) mostrarFotosActuales(vehiculo.fotos);
    mostrarFaltan();
}

// "Siguiente" es el submit: valida el paso, lo guarda si cambió y pasa al siguiente.
formularios.alEnviar(form, async () => {
    if (!window.Validacion.validar(controlesDe(pasos[actual]), form)) return;
    await guardarPaso();
    mostrarPaso(actual + 1);
});

guardarSalir.addEventListener('click', async () => {
    formularios.alerta(form, '');
    if (!window.Validacion.validar(controlesDe(pasos[actual]), form)) return;
    guardarSalir.disabled = true;
    try {
        await guardarPaso();
        window.location.assign(ruta('mis-publicaciones.html'));
    } catch (error) {
        formularios.mostrarError(form, error);
        guardarSalir.disabled = false;
    }
});

anterior.addEventListener('click', () => mostrarPaso(actual - 1));

// Último paso: si está completa la "envía" (ya quedó pendiente para el moderador) y se lo confirma;
// si no, vuelve a Mis publicaciones.
terminar.addEventListener('click', () => {
    if (!paraEnviar()) {
        window.location.assign(ruta('mis-publicaciones.html'));
        return;
    }
    [form, aviso, faltanTexto, document.getElementById('intro'), pasosBarra]
        .forEach((elemento) => { elemento.hidden = true; });
    const enviada = document.getElementById('enviada');
    enviada.hidden = false;
    enviada.focus();
    window.scrollTo(0, 0);
});

// ---------- Marca y modelo: la lista sale de la base (GET /api/marcas-modelos) ----------

const marca = form.elements.marca;
const modelo = form.elements.modelo;
let modelosPorMarca = new Map();

async function cargarMarcas() {
    const { marcas } = await catalogo.marcasModelos();
    modelosPorMarca = new Map(marcas.map((m) => [m.marca, m.modelos]));
    marca.replaceChildren(vistas.el('option', { value: '' }, 'Seleccionar marca'),
        ...marcas.map((m) => vistas.el('option', {}, m.marca)));
}

// Sólo los modelos de la marca elegida
function filtrarModelos() {
    const modelos = modelosPorMarca.get(marca.value) || [];
    modelo.replaceChildren(vistas.el('option', { value: '' }, 'Seleccionar modelo'),
        ...modelos.map((nombre) => vistas.el('option', {}, nombre)));
}
marca.addEventListener('change', filtrarModelos);

// ---------- Canje: el campo "qué te interesa" sólo si acepta canje ----------

const aceptaCanje = document.getElementById('acepta-canje');
const campoBusca = document.getElementById('campo-busca');
function mostrarBusca() {
    campoBusca.hidden = !aceptaCanje.checked;
}
aceptaCanje.addEventListener('change', mostrarBusca);

// ---------- Fotos ----------

function mostrarFotosActuales(rutas) {
    fotosActuales.replaceChildren(...rutas.map((rutaFoto, i) => {
        const sacar = el('button', { class: 'boton-link', type: 'button' }, 'Sacar');
        sacar.addEventListener('click', async () => {
            sacar.disabled = true;
            try {
                vehiculo = (await api.eliminarFoto(vehiculo.id, idDeFoto(rutaFoto))).vehiculo;
                mostrarFotosActuales(vehiculo.fotos);
                mostrarFaltan();
            } catch (error) {
                formularios.mostrarError(form, error);
                sacar.disabled = false;
            }
        });
        return el('li', {}, el('img', { src: urlFoto(rutaFoto), alt: `Foto ${i + 1} guardada` }), sacar);
    }));
}

// Controla cantidad (entre las guardadas y las nuevas), tipo y tamaño, y muestra la vista previa
const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
let urlsPrevia = [];
fotos.addEventListener('change', () => {
    const archivos = Array.from(fotos.files);
    const guardadas = vehiculo?.fotos?.length || 0;
    let error = '';
    if (guardadas + archivos.length > MAX_FOTOS) {
        error = `Podés tener hasta ${MAX_FOTOS} fotos en total (ya hay ${guardadas}).`;
    } else if (archivos.some((a) => !TIPOS.includes(a.type))) {
        error = 'Sólo se aceptan fotos JPG, PNG o WebP.';
    }
    fotos.setCustomValidity(error);
    if (error) window.Validacion.mostrar(fotos, error);
    else window.Validacion.limpiar(fotos);

    urlsPrevia.forEach((url) => URL.revokeObjectURL(url));
    urlsPrevia = error ? [] : archivos.map((a) => URL.createObjectURL(a));
    fotosPrevia.replaceChildren(...urlsPrevia.map((url, i) =>
        el('li', {}, el('img', { src: url, alt: `Foto nueva ${i + 1}` }))));
});

// ---------- Revisión ----------

function valorLegible(nombre) {
    const control = form.elements[nombre];
    if (nombre === 'fotos') {
        const cantidad = vehiculo?.fotos?.length || 0;
        return cantidad ? `${cantidad} fotos` : '';
    }
    if (!control) return '';
    if (control instanceof RadioNodeList) return control.value ? formato.transmision(control.value) : '';
    if (control.type === 'checkbox') return control.checked ? 'Sí' : 'No';
    if (!control.value) return '';
    if (nombre === 'precio') return formato.precio(control.value);
    if (nombre === 'kilometraje') return formato.km(control.value);
    if (control.tagName === 'SELECT') return control.selectedOptions[0].textContent;
    return control.value;
}

function completarResumen() {
    form.querySelectorAll('[data-resumen]').forEach((dato) => {
        const contenido = dato.dataset.resumen.split(' ').map(valorLegible).filter(Boolean).join(' · ');
        dato.textContent = contenido || '—';
    });
    const completitud = document.getElementById('completitud');
    if (!vehiculo) {
        completitud.textContent = 'Todavía no se guardó nada: completá al menos el paso 1.';
    } else if (vehiculo.completa) {
        completitud.textContent = 'Está completa. Un moderador la va a revisar y, si está todo bien, se publica.';
    } else {
        completitud.textContent = `Ya está guardada, pero para que la revisemos te falta: ${vehiculo.faltan.join(', ')}. `
            + 'Podés completarlo ahora (volviendo a los pasos) o después desde Mis publicaciones.';
    }
}

// ---------- Seguir una publicación que ya existe (publicar.html?id=N) ----------

function cargarEnElFormulario(v) {
    form.elements.marca.value = v.marca;
    filtrarModelos();
    form.elements.modelo.value = v.modelo;
    form.elements.anio.value = v.anio;
    form.elements.version.value = v.version || '';
    form.elements.kilometraje.value = v.kilometraje ?? '';
    form.elements.combustible.value = v.combustible || '';
    form.elements.transmision.value = v.transmision || '';
    form.elements.condicion.value = v.condicion || '';
    form.elements.descripcion.value = v.descripcion || '';
    form.elements.precio.value = v.precio ?? '';
    aceptaCanje.checked = v.acepta_canje;
    form.elements.busca_canje.value = v.busca_canje || '';
    if (v.localidad) form.elements.localidad.value = v.localidad;
    mostrarBusca();
    mostrarFotosActuales(v.fotos || []);
    CAMPOS_DE_PASO.forEach((_, i) => recordarGuardado(i));
    // Si a un paso le falta algo, se guarda igual (ej.: la localidad viene escrita de entrada pero no está guardada)
    v.faltan.forEach((cosa) => { guardado[PASO_DE[cosa]] = null; });
}

// Arranca en el primer paso donde falta algo (si está completa, en el 1)
function primerPasoIncompleto(v) {
    const pasosQueFaltan = v.faltan.map((cosa) => PASO_DE[cosa]).filter((n) => n !== undefined);
    return pasosQueFaltan.length ? Math.min(...pasosQueFaltan) : 0;
}

async function iniciar() {
    form.classList.add('con-js');
    pasos.forEach((paso) => paso.setAttribute('tabindex', '-1'));
    mostrarBusca();

    try {
        await cargarMarcas();
    } catch (error) {
        avisar(`No pudimos cargar las marcas y modelos: ${error.message}`);
        return;
    }

    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) {
        pasosBarra.hidden = false;
        form.hidden = false;
        mostrarPaso(0);
        return;
    }
    // Pasos y formulario quedan ocultos hasta tener la publicación
    estado.replaceChildren(vistas.cargando());
    try {
        vehiculo = (await api.detalle(id)).vehiculo;
    } catch (error) {
        estado.replaceChildren();
        if (error.status === 401) {
            sesion.requerirLogin();
            return;
        }
        avisar(error.status === 404 ? 'Esa publicación no existe o no es tuya.' : error.message);
        return;
    }
    estado.replaceChildren();
    if (vehiculo.estado === 'vendido') {
        avisar('Esta publicación ya está vendida: no se puede editar.');
        return;
    }
    if (vehiculo.estado === 'pendiente' && vehiculo.completa) {
        avisar('Esta publicación ya está en revisión. Podés corregirla: sigue en revisión.');
    }
    if (vehiculo.estado === 'disponible') {
        avisar('Esta publicación ya está publicada. Si guardás un cambio, vuelve a revisión y deja de verse hasta que la aprueben.');
    }
    if (vehiculo.estado === 'rechazado' && vehiculo.motivo_rechazo) {
        avisar(`La rechazaron por: ${vehiculo.motivo_rechazo}. Corregila y guardá: vuelve a revisión.`);
    }
    cargarEnElFormulario(vehiculo);
    mostrarFaltan();
    mostrarPaso(primerPasoIncompleto(vehiculo));
    pasosBarra.hidden = false;
    form.hidden = false;
}

if (sesion.requerirLogin()) iniciar();
