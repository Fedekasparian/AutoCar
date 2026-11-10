// Reportar (reportar.html?vehiculo=N o ?usuario=N) con POST /api/reportes. Pide sesión.
import * as soporte from '../api/soporte.js';
import * as formularios from '../servicios/formularios.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { ruta } from '../servicios/rutas.js';

const { el } = vistas;
const params = new URLSearchParams(window.location.search);
const vehiculo = params.get('vehiculo');
const usuario = params.get('usuario');
const form = document.getElementById('form-reporte');

const MOTIVOS = vehiculo
    ? { fraude: 'Parece una estafa', datos: 'Los datos no coinciden con el vehículo', vendido: 'Ya está vendido', otro: 'Otro motivo' }
    : { fraude: 'Intentó estafarme', trato: 'Me trató mal o me insultó', spam: 'Manda publicidad o spam', otro: 'Otro motivo' };

function armar() {
    document.getElementById('motivos-titulo').textContent = vehiculo ? '¿Qué pasa con esta publicación?' : '¿Qué pasó con este usuario?';
    document.getElementById('motivos').append(...Object.entries(MOTIVOS).map(([valor, texto], i) =>
        el('label', {}, el('input', { type: 'radio', name: 'motivo', value: valor, required: true, checked: i === 0 }), el('span', {}, texto))));
    form.hidden = false;
}

formularios.alEnviar(form, async (datos) => {
    await soporte.reportar({ ...datos, ...(vehiculo ? { vehiculo_id: Number(vehiculo) } : { usuario_id: Number(usuario) }) });
    form.hidden = true;
    document.getElementById('enviado').hidden = false;
});

if (sesion.requerirLogin()) {
    if (/^\d+$/.test(vehiculo || '') || /^\d+$/.test(usuario || '')) armar();
    else {
        document.getElementById('estado').replaceChildren(vistas.aviso('¿Qué querés reportar?',
            'Entrá desde la publicación ("Reportar publicación") o desde el chat ("Reportar usuario").',
            el('a', { class: 'boton boton--secundario', href: ruta('home.html') }, 'Explorar autos')));
    }
}
