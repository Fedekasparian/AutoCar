// Métricas de la app (permiso metricas.ver): GET /api/admin/metricas, todo sacado de la base.
import * as admin from '../api/admin.js';
import * as formato from '../servicios/formato.js';
import * as sesion from '../servicios/sesion.js';
import * as vistas from '../servicios/vistas.js';

const { el } = vistas;
const numero = new Intl.NumberFormat('es-AR');
const n = (valor) => numero.format(valor);

const tarjeta = (valor, texto) => el('li', { class: 'recuadro' }, el('strong', {}, valor), el('span', {}, texto));
const filaTabla = (a, b) => el('tr', {}, el('td', {}, a), el('td', {}, b));

function llenar(id, ...hijos) {
    document.getElementById(id).replaceChildren(...hijos);
}

function horas(h) {
    if (h === null) return '—';
    return h < 24 ? `${h} h` : `${Math.floor(h / 24)} días`;
}

function mostrar(m) {
    const u = m.usuarios;
    llenar('tarjetas-usuarios',
        tarjeta(n(u.total), 'Usuarios registrados'),
        tarjeta(n(u.activos), 'Cuentas activas'),
        tarjeta(n(u.con_actividad_30d), 'Con actividad (30 días)'),
        tarjeta(n(u.nuevos_30d), 'Nuevos (30 días)'),
        tarjeta(n(u.bajas), 'Dados de baja'));
    llenar('tabla-roles', ...Object.entries(u.por_rol).map(([rol, cantidad]) => filaTabla(formato.rol(rol), n(cantidad))));

    const p = m.publicaciones;
    llenar('tarjetas-publicaciones',
        tarjeta(n(p.total), 'Publicaciones'),
        tarjeta(n(p.nuevas_30d), 'Nuevas (30 días)'),
        tarjeta(n(p.de_usuarios), 'Publicadas por usuarios'),
        tarjeta(formato.precio(p.precio_promedio), 'Precio promedio (en venta)'),
        tarjeta(formato.precio(p.valor_en_venta), 'Valor en venta'),
        tarjeta(formato.precio(p.valor_vendido), 'Valor vendido'));
    llenar('tabla-estados', ...Object.entries(p.por_estado).map(([estado, cantidad]) => filaTabla(formato.estado(estado), n(cantidad))));
    llenar('tabla-marcas', ...(p.top_marcas.length
        ? p.top_marcas.map((x) => filaTabla(x.marca, n(x.cantidad)))
        : [filaTabla('Todavía no hay publicaciones', '—')]));

    const mod = m.moderacion;
    llenar('tarjetas-moderacion',
        tarjeta(n(mod.pendientes), 'Esperando revisión'),
        tarjeta(horas(mod.espera_maxima_h), 'Espera de la más antigua'),
        tarjeta(n(mod.rechazadas), 'Rechazadas'));

    const c = m.chat;
    llenar('tarjetas-chat',
        tarjeta(n(c.conversaciones), 'Conversaciones'),
        tarjeta(n(c.conversaciones_30d), 'Nuevas (30 días)'),
        tarjeta(n(c.mensajes_30d), 'Mensajes (30 días)'));

    // Lo que dejan las inspecciones (23 % para AutoCar, un tercio de eso al fondo de garantía). Pago simulado.
    const g = m.ganancias;
    const firmadas = g.inspecciones?.firmada || 0;
    llenar('tarjetas-ganancias',
        tarjeta(formato.precio(g.autocar), 'Ganancia de AutoCar'),
        tarjeta(formato.precio(g.autocar_30d), 'Ganancia (30 días)'),
        tarjeta(formato.precio(g.facturado), `Facturado (${n(firmadas)} firmadas)`),
        tarjeta(formato.precio(g.mecanicos), 'Pagado a mecánicos'),
        tarjeta(formato.precio(g.fondo.disponible), `Fondo de garantía (usado ${formato.precio(g.fondo.usado)})`),
        tarjeta(formato.precio(g.retenido), 'Retenido (en curso)'));
    document.getElementById('ganancias').textContent = g.aclaracion;
    document.getElementById('generado').textContent =
        `Datos al ${new Date(m.generado).toLocaleString('es-AR')}.`;
}

async function cargar() {
    const estado = document.getElementById('estado');
    estado.replaceChildren(vistas.cargando());
    try {
        mostrar(await admin.metricas());
        estado.replaceChildren();
        document.getElementById('metricas').hidden = false;
    } catch (error) {
        if (error.status === 401) {
            sesion.requerirLogin();
            return;
        }
        estado.replaceChildren(error.status === 403
            ? vistas.aviso('No tenés permiso para ver las métricas.')
            : vistas.avisoDeError(error));
    }
}

if (sesion.requerirPermiso('metricas.ver')) cargar();
