// Administración de usuarios: listado con filtros, edición de nombre y rol, y baja lógica o reactivación.
// Ver hace falta usuarios.ver; cambiar, usuarios.editar (los dos son del rol admin).
import * as admin from '../api/admin.js';
import * as formato from '../servicios/formato.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';
import { campo, formularioEnHoja } from '../servicios/acciones.js';

const { el } = vistas;
const params = new URLSearchParams(window.location.search);
const filtros = {
    q: params.get('q') || '',
    rol: params.get('rol') || '',
    activo: params.get('activo') || '',
    page: params.get('page') || '',
};
const puedeEditar = sesion.puede('usuarios.editar');

const cuerpo = document.getElementById('resultados');
const estado = document.getElementById('estado');
const total = document.getElementById('resultados-total');
const aviso = document.getElementById('aviso');

// La ventana de edición la arma el JS (no está en admin-usuarios.html)
const campoNombre = el('input', { id: 'editar-nombre', name: 'nombre', required: true, minlength: 2, maxlength: 80 });
const campoRol = el('select', { id: 'editar-rol', name: 'rol' });
const campoActivo = el('input', { type: 'checkbox', id: 'editar-activo', name: 'activo' });
const editarEmail = el('p', { class: 'suave' });
const { dialogo, formulario: formEditar } = formularioEnHoja({
    titulo: 'Editar usuario',
    id: 'form-usuario',
    enviar: 'Guardar',
    campos: [
        editarEmail,
        campo('Nombre', campoNombre),
        campo('Rol', campoRol, ''),
        el('label', { class: 'opcion' }, campoActivo, ' ',
            el('span', {}, 'Cuenta activa (si se desmarca, es una baja lógica: no puede ingresar)')),
    ],
});
const ayudaRol = document.getElementById('editar-rol-ayuda');
const errorEditar = formEditar.querySelector('.formulario__alerta');
const botonGuardar = formEditar.querySelector('[type="submit"]');
let roles = [];
let editando = null;

function avisar(texto) {
    aviso.textContent = texto;
    aviso.hidden = !texto;
}

function opcionesDeRol(select, primera) {
    select.replaceChildren(...(primera ? [el('option', { value: '' }, primera)] : []),
        ...roles.map((r) => el('option', { value: r.nombre }, formato.rol(r.nombre))));
}

function describirRol() {
    const r = roles.find((x) => x.nombre === campoRol.value);
    ayudaRol.textContent = r ? `${r.descripcion}.` : '';
}

function abrirEdicion(u) {
    editando = u;
    editarEmail.textContent = u.email;
    campoNombre.value = u.nombre;
    campoRol.value = u.rol;
    campoActivo.checked = u.activo;
    // No se puede cambiar el propio rol ni darse de baja (el back responde 409)
    const soyYo = u.id === sesion.usuario()?.id;
    campoRol.disabled = soyYo;
    campoActivo.disabled = soyYo;
    describirRol();
    errorEditar.textContent = soyYo ? 'Es tu cuenta: podés cambiar el nombre, pero no tu rol ni darte de baja.' : '';
    dialogo.showModal();
}

async function cambiarEstado(u, activo) {
    try {
        if (activo) await admin.actualizarUsuario(u.id, { activo: true });
        else await admin.bajaUsuario(u.id);
        avisar(activo ? `Se reactivó la cuenta de ${u.nombre}.` : `Se dio de baja a ${u.nombre}.`);
        await cargar();
    } catch (error) {
        avisar(error.message);
    }
}

function fila(u) {
    const acciones = [];
    if (puedeEditar) {
        const editar = el('button', { class: 'boton-link', type: 'button' }, 'Editar');
        editar.addEventListener('click', () => abrirEdicion(u));
        acciones.push(editar);
        if (u.id !== sesion.usuario()?.id) {
            const alta = el('button', { class: 'boton-link', type: 'button' }, u.activo ? 'Dar de baja' : 'Reactivar');
            alta.addEventListener('click', () => cambiarEstado(u, !u.activo));
            acciones.push(alta);
        }
    }
    return el('tr', {},
        el('td', {}, el('strong', {}, u.nombre), el('br'), el('span', { class: 'fila__meta' }, u.email)),
        el('td', {}, formato.rol(u.rol)),
        el('td', {}, el('span', { class: u.activo ? 'etiqueta etiqueta--borde' : 'etiqueta etiqueta--oscura' },
            u.activo ? 'Activa' : 'Dada de baja')),
        el('td', {}, String(u.publicaciones ?? 0)),
        el('td', {}, el('ul', { class: 'acciones-fila', role: 'list' }, ...acciones.map((a) => el('li', {}, a)))));
}

async function cargar() {
    estado.replaceChildren(vistas.cargando());
    try {
        const r = await admin.usuarios(filtros);
        total.textContent = r.total === 1 ? '1 usuario' : `${r.total} usuarios`;
        cuerpo.replaceChildren(...r.items.map(fila));
        if (r.items.length) estado.replaceChildren();
        else estado.replaceChildren(vistas.aviso('No hay usuarios con esos filtros.'));
        document.getElementById('paginacion').replaceWith(
            Object.assign(vistas.paginacion(r.pagina, r.paginas), { id: 'paginacion' }));
    } catch (error) {
        if (error.status === 401) {
            sesion.requerirLogin();
            return;
        }
        estado.replaceChildren(error.status === 403
            ? vistas.aviso('No tenés permiso para ver los usuarios.')
            : vistas.avisoDeError(error));
    }
}

campoRol.addEventListener('change', describirRol);

formEditar.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!editando) return;
    const cambios = {};
    const nombre = campoNombre.value.trim();
    if (nombre !== editando.nombre) cambios.nombre = nombre;
    if (!campoRol.disabled && campoRol.value !== editando.rol) cambios.rol = campoRol.value;
    if (!campoActivo.disabled && campoActivo.checked !== editando.activo) cambios.activo = campoActivo.checked;
    if (!Object.keys(cambios).length) {
        dialogo.close();
        return;
    }
    botonGuardar.disabled = true;
    try {
        await admin.actualizarUsuario(editando.id, cambios);
        dialogo.close();
        avisar(`Se guardaron los cambios de ${nombre}.`);
        await cargar();
    } catch (error) {
        errorEditar.textContent = Object.values(error.errores || {})[0] || error.message;
        errorEditar.focus();
    } finally {
        botonGuardar.disabled = false;
    }
});

async function iniciar() {
    document.getElementById('q').value = filtros.q;
    document.getElementById('filtro-activo').value = filtros.activo;
    try {
        roles = (await admin.roles()).items;
        opcionesDeRol(document.getElementById('filtro-rol'), 'Todos los roles');
        opcionesDeRol(campoRol);
        document.getElementById('filtro-rol').value = filtros.rol;
    } catch {
        // Sin la lista de roles igual se puede ver el listado; el filtro queda en "Todos".
    }
    await cargar();
}

if (sesion.requerirPermiso('usuarios.ver')) iniciar();
