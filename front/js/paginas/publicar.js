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
import { boton } from '../servicios/acciones.js';

const { el } = vistas;
const form = document.getElementById('form-publicar');
const pasos = Array.from(form.querySelectorAll('.paso'));
// En publicar.html está sólo "Siguiente" (el submit del formulario). "Anterior", "Terminar después" y el botón
// del último paso los crea el JS; mostrarPaso() decide cuáles se ven en cada paso.
const siguiente = document.getElementById('paso-siguiente');
const anterior = boton('Anterior', null, 'boton boton--secundario');
const guardarSalir = boton('Terminar después', null, 'boton boton--secundario');
const terminar = boton('Enviar a revisión'); // el texto lo pone mostrarPaso: "Enviar a revisión" o "Terminar después"
anterior.hidden = true;
terminar.hidden = true;
siguiente.before(anterior, guardarSalir);
siguiente.after(terminar);
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

// Los seis puntos de arriba: hechos, el actual y los que faltan
function armarPuntos() {
    document.getElementById('pasos-puntos').replaceChildren(...pasos.map((paso, i) =>
        el('li', { class: 'pasos__punto' }, el('span', { class: 'pasos__marca' }, String(i + 1)),
            el('span', { class: 'pasos__nombre' }, paso.dataset.paso))));
}

function marcarPuntos(indice) {
    document.querySelectorAll('.pasos__punto').forEach((punto, i) => {
        punto.classList.toggle('pasos__punto--hecho', i < indice);
        punto.classList.toggle('pasos__punto--actual', i === indice);
    });
    document.getElementById('pasos-puntos').style.setProperty('--avance', String(indice / (pasos.length - 1)));
}

function mostrarPaso(indice) {
    // El paso nuevo entra desde la derecha si se avanza y desde la izquierda si se vuelve
    const direccion = indice >= actual ? 'adelante' : 'atras';
    pasos[indice].classList.remove('paso--adelante', 'paso--atras');
    void pasos[indice].offsetWidth;
    pasos[indice].classList.add(`paso--${direccion}`);
    marcarPuntos(indice);
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
    const subiendo = document.getElementById('fotos-subiendo');
    const texto = document.getElementById('fotos-subiendo-texto');
    const cantidad = fotos.files.length;
    subiendo.hidden = false;
    try {
        const formData = new FormData();
        // Se achican antes de subir (lado mayor 1600 px): se puede elegir una foto de cualquier tamaño
        texto.textContent = cantidad === 1 ? 'Preparando la foto…' : `Preparando ${cantidad} fotos…`;
        const achicadas = await Promise.all(Array.from(fotos.files).map((archivo) => achicar(archivo)));
        achicadas.forEach((archivo) => formData.append('fotos[]', archivo));
        texto.textContent = cantidad === 1 ? 'Subiendo la foto…' : `Subiendo ${cantidad} fotos…`;
        const respuesta = await api.agregarFotos(vehiculo.id, formData);
        ponerNuevas([]);
        return respuesta.vehiculo;
    } finally {
        subiendo.hidden = true;
    }
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

const portada = () => el('span', { class: 'fotos-previa__portada' }, 'Portada');

function mostrarFotosActuales(rutas) {
    fotosActuales.replaceChildren(...rutas.map((rutaFoto, i) => {
        const sacar = el('button', { class: 'fotos-previa__sacar', type: 'button', 'aria-label': `Sacar la foto ${i + 1}` }, '×');
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
        return el('li', {}, el('img', { src: urlFoto(rutaFoto), alt: `Foto ${i + 1} guardada` }), i === 0 ? portada() : null, sacar);
    }));
    actualizarVistaPrevia();
}

// Fotos nuevas (todavía sin subir). Se pueden sumar en varias tandas, arrastrándolas o eligiéndolas, sacar una
// o pasarla a primera. La lista manda: el <input type="file"> se rearma con ella, así "Siguiente" sube eso.
const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
let nuevas = [];
let urlsPrevia = [];

function ponerNuevas(lista) {
    nuevas = lista;
    try {
        const transferencia = new DataTransfer();
        nuevas.forEach((archivo) => transferencia.items.add(archivo));
        fotos.files = transferencia.files;
    } catch {
        // Navegador sin DataTransfer: queda lo último elegido en el input
    }
    mostrarNuevas();
}

function mover(desde, hasta) {
    const lista = [...nuevas];
    const [archivo] = lista.splice(desde, 1);
    lista.splice(hasta, 0, archivo);
    ponerNuevas(lista);
}

function mostrarNuevas() {
    urlsPrevia.forEach((url) => URL.revokeObjectURL(url));
    urlsPrevia = nuevas.map((a) => URL.createObjectURL(a));
    const sinGuardadas = !(vehiculo?.fotos?.length);
    fotosPrevia.replaceChildren(...urlsPrevia.map((url, i) => {
        const sacar = el('button', { class: 'fotos-previa__sacar', type: 'button', 'aria-label': `Sacar la foto nueva ${i + 1}` }, '×');
        sacar.addEventListener('click', () => ponerNuevas(nuevas.filter((_, n) => n !== i)));
        const primera = i === 0 ? null : el('button', { class: 'fotos-previa__primera', type: 'button',
            'aria-label': `Pasar la foto nueva ${i + 1} a primera` }, 'Primera');
        primera?.addEventListener('click', () => mover(i, 0));
        // Arrastrar una foto sobre otra la pone en ese lugar (con mouse; con teclado o en celular, "Primera")
        const li = el('li', { draggable: 'true', class: 'fotos-previa__nueva' },
            el('img', { src: url, alt: `Foto nueva ${i + 1}`, draggable: 'false' }),
            i === 0 && sinGuardadas ? portada() : null, primera, sacar);
        li.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/x-foto', String(i)); li.classList.add('fotos-previa__nueva--moviendo'); });
        li.addEventListener('dragend', () => li.classList.remove('fotos-previa__nueva--moviendo'));
        li.addEventListener('dragover', (e) => { if (e.dataTransfer.types.includes('text/x-foto')) e.preventDefault(); });
        li.addEventListener('drop', (e) => {
            const desde = e.dataTransfer.getData('text/x-foto');
            if (desde === '') return;
            e.preventDefault();
            e.stopPropagation();
            mover(Number(desde), i);
        });
        return li;
    }));
    actualizarVistaPrevia();
}

// Suma archivos a las nuevas: descarta los que no son fotos y los que pasan del máximo, y avisa por qué
function agregarFotos(archivos) {
    const guardadas = vehiculo?.fotos?.length || 0;
    const lugar = MAX_FOTOS - guardadas - nuevas.length;
    const validos = archivos.filter((a) => TIPOS.includes(a.type));
    const entran = validos.slice(0, Math.max(0, lugar));
    let error = '';
    if (validos.length < archivos.length) error = 'Sólo se aceptan fotos JPG, PNG o WebP.';
    if (entran.length < validos.length) error = `Podés tener hasta ${MAX_FOTOS} fotos en total: agregamos las que entraban.`;
    if (error) window.Validacion.mostrar(fotos, error);
    else window.Validacion.limpiar(fotos);
    fotos.setCustomValidity('');
    ponerNuevas([...nuevas, ...entran]);
}

fotos.addEventListener('change', () => {
    // El input ya trae solo lo recién elegido; se suma a lo que había
    const elegidas = Array.from(fotos.files).filter((a) => !nuevas.includes(a));
    agregarFotos(elegidas);
});

// Arrastrar y soltar sobre el recuadro
const zonaFotos = document.getElementById('zona-fotos');
['dragenter', 'dragover'].forEach((tipo) => zonaFotos.addEventListener(tipo, (e) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    zonaFotos.classList.add('subir-fotos--activa');
}));
['dragleave', 'drop'].forEach((tipo) => zonaFotos.addEventListener(tipo, () => zonaFotos.classList.remove('subir-fotos--activa')));
zonaFotos.addEventListener('drop', (e) => {
    if (!e.dataTransfer.files.length) return;
    e.preventDefault();
    agregarFotos(Array.from(e.dataTransfer.files));
});

// ---------- Validación en el momento: el campo bien cargado se marca en verde ----------

function marcarCampo(control) {
    const campo = control.closest('.campo');
    if (!campo || control.type === 'file' || control.type === 'checkbox' || control.type === 'radio') return;
    campo.classList.toggle('campo--ok', Boolean(control.value) && control.checkValidity());
}
form.addEventListener('input', (e) => { marcarCampo(e.target); actualizarVistaPrevia(); });
form.addEventListener('change', (e) => { marcarCampo(e.target); actualizarVistaPrevia(); });

// ---------- Vista previa: la ficha como se va a ver en Explorar ----------

function fichaPrevia() {
    const d = formularios.datosDe(form);
    const foto = vehiculo?.fotos?.[0] ? urlFoto(vehiculo.fotos[0]) : urlsPrevia[0];
    const titulo = [d.marca, d.modelo, d.anio].filter(Boolean).join(' ') || 'Tu vehículo';
    const detalle = [d.kilometraje ? formato.km(d.kilometraje) : null, d.combustible ? formato.combustible(d.combustible) : null]
        .filter(Boolean).join(' · ');
    return el('div', { class: 'ficha-vehiculo ficha-vehiculo--previa' },
        foto
            ? el('img', { class: 'ficha-vehiculo__imagen', src: foto, alt: '' })
            : el('div', { class: 'ficha-vehiculo__imagen ficha-vehiculo__imagen--vacia' }, 'Sin fotos todavía'),
        el('div', { class: 'ficha-vehiculo__cuerpo' },
            el('span', { class: `ficha-vehiculo__precio${d.precio ? '' : ' ficha-vehiculo__precio--falta'}` },
                d.precio ? formato.precio(d.precio) : 'Precio a definir'),
            el('span', { class: 'ficha-vehiculo__titulo' }, titulo),
            el('span', { class: 'ficha-vehiculo__lugar' }, detalle || 'Kilometraje y combustible'),
            el('span', { class: 'ficha-vehiculo__pie' },
                el('span', {}, d.localidad || ''),
                el('span', {}, d.transmision ? formato.transmision(d.transmision) : ''))));
}

function actualizarVistaPrevia() {
    document.getElementById('vista-previa-ficha').replaceChildren(fichaPrevia());
    if (actual === PASO_REVISION) document.getElementById('resumen-ficha').replaceChildren(fichaPrevia());
}

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
    document.getElementById('resumen-ficha').replaceChildren(fichaPrevia());
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
    armarPuntos();
    mostrarBusca();

    try {
        await cargarMarcas();
    } catch (error) {
        avisar(`No pudimos cargar las marcas y modelos: ${error.message}`);
        return;
    }

    const id = new URLSearchParams(window.location.search).get('id');
    const vistaPrevia = document.getElementById('vista-previa');
    if (!id) {
        pasosBarra.hidden = false;
        form.hidden = false;
        vistaPrevia.hidden = false;
        mostrarPaso(0);
        actualizarVistaPrevia();
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
    vistaPrevia.hidden = false;
    form.querySelectorAll('input, select, textarea').forEach(marcarCampo);
    actualizarVistaPrevia();
}

if (sesion.requerirLogin()) iniciar();
