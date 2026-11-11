// Inspecciones (el mecánico que firma): nombres para mostrar y las reglas que el front revisa antes de mandar.
// Son copia de las del back (AutoCarBackend/src/Inspecciones: Checklist, Estados y Precio). El back vuelve a
// validar todo; acá sólo se evita mandar algo que ya sabemos que está mal y se muestra el desglose del precio.

// Los mismos códigos y el mismo orden que Inspecciones\Checklist::ITEMS
export const CHECKLIST = [
    { codigo: 'carroceria', nombre: 'Carrocería', detalle: 'Pintura y golpes' },
    { codigo: 'estructura', nombre: 'Estructura', detalle: 'Chasis, largueros y rastros de choque' },
    { codigo: 'motor', nombre: 'Motor', detalle: 'Pérdidas y ruidos' },
    { codigo: 'transmision', nombre: 'Transmisión', detalle: 'Caja y embrague' },
    { codigo: 'frenos', nombre: 'Frenos', detalle: 'Pastillas, discos, líquido y freno de mano' },
    { codigo: 'suspension', nombre: 'Suspensión', detalle: 'Tren delantero y amortiguadores' },
    { codigo: 'neumaticos', nombre: 'Neumáticos', detalle: 'Desgaste parejo y estado de las cubiertas' },
    { codigo: 'electricidad', nombre: 'Electricidad', detalle: 'Tablero, luces y testigos' },
    { codigo: 'kilometraje', nombre: 'Kilometraje', detalle: 'Desgaste coherente con los km' },
    { codigo: 'identificacion', nombre: 'Identificación', detalle: 'Motor y chasis coinciden con la cédula' },
];

export const RESULTADOS = { ok: 'OK', observado: 'Observado', falla: 'Falla' };
export const CONCLUSIONES = {
    recomendable: 'Recomendable',
    con_reparos: 'Con reparos',
    no_recomendable: 'No recomendable',
};
export const ESTADOS = {
    pedida: 'Pedida',
    aceptada: 'Aceptada',
    rechazada: 'Rechazada',
    cancelada: 'Cancelada',
    firmada: 'Firmada',
    no_realizada: 'No se pudo hacer',
};
export const FUENTES = {
    mercadolibre: 'MercadoLibre',
    kavak: 'Kavak',
    autocosmos: 'Autocosmos',
    autocar: 'AutoCar',
    otro: 'Otro sitio',
};

export const MAX_NOTA = 300;
export const MAX_RESUMEN = 1000;
export const MAX_MOTIVO = 300;

export const nombreItem = (codigo) => CHECKLIST.find((i) => i.codigo === codigo)?.nombre || codigo;
export const resultado = (valor) => RESULTADOS[valor] || valor;
export const conclusion = (valor) => CONCLUSIONES[valor] || valor;
export const estado = (valor) => ESTADOS[valor] || valor;
export const fuente = (valor) => FUENTES[valor] || valor;

export const RECLAMOS = { abierto: 'En revisión', procede: 'Procede', no_procede: 'No procede' };
export const estadoReclamo = (valor) => RECLAMOS[valor] || valor;
export const MIN_DESCRIPCION = 10;
export const MAX_DESCRIPCION = 1000;

// De qué sitio es un link, para mostrarlo mientras el comprador lo pega (el back lo vuelve a decidir con
// Inspecciones\Fuente). Devuelve null si no es un link http(s).
const DOMINIOS = { 'mercadolibre.com.ar': 'mercadolibre', 'kavak.com': 'kavak', 'autocosmos.com.ar': 'autocosmos' };
export function fuenteDeUrl(texto, hostPropio = '') {
    let url;
    try {
        url = new URL(String(texto).trim());
    } catch {
        return null;
    }
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase();
    const dominio = Object.keys(DOMINIOS).find((d) => host === d || host.endsWith(`.${d}`));
    if (dominio) return DOMINIOS[dominio];
    if (hostPropio && host === hostPropio.toLowerCase() && url.pathname.endsWith('vehiculo.html')) return 'autocar';
    return 'otro';
}

// Puntaje del ranking para mostrar: "4,5 de 5 · 12 firmadas" o "Nuevo en la red".
export function puntaje(m) {
    const firmadas = m.firmadas === 1 ? '1 inspección firmada' : `${m.firmadas} inspecciones firmadas`;
    if (m.nuevo || m.puntaje === null || m.puntaje === undefined) return `Nuevo en la red · ${firmadas}`;
    return `${String(m.puntaje).replace('.', ',')} de 5 · ${firmadas}`;
}

// Reclamos que procedieron, siempre a la vista (también para los "Nuevo en la red", que no tienen puntaje).
export function reclamosProcedentes(m) {
    const n = m.reclamos_procedentes || 0;
    if (n === 0) return 'Ningún reclamo procedió';
    return n === 1 ? '1 reclamo procedió' : `${n} reclamos procedieron`;
}

// Qué tiene que pedir el comprador antes de pagar el auto (los papeles no los revisa el mecánico).
// Los links van a la página principal de cada organismo (Provincia de Buenos Aires para patentes y VTV).
export const TRAMITES = [
    { nombre: 'Informe de dominio', detalle: 'Prendas, embargos e inhibiciones', url: 'https://www.dnrpa.gov.ar/' },
    { nombre: 'Libre deuda de patentes', detalle: 'En el organismo de rentas de la provincia', url: 'https://www.arba.gov.ar/' },
    { nombre: 'VTV vigente', detalle: 'Verificación técnica vehicular', url: 'https://www.vtv.gba.gob.ar/' },
    { nombre: 'Formulario 08 firmado', detalle: 'Con la firma del titular certificada', url: 'https://www.argentina.gob.ar/justicia/registro-automotor' },
];

// Título del auto: el que vino con el pedido o, si el comprador no lo cargó, el sitio.
export const tituloAuto = (inspeccion) =>
    inspeccion.titulo || `Auto de ${fuente(inspeccion.fuente)}`;

// Igual que Inspecciones\Precio::desglose: AutoCar se queda el 23 % (redondeado a miles) y un tercio de eso
// va al fondo de garantía. El resto es del mecánico. Con $ 130.000: 100.000 / 30.000 (10.000 al fondo).
const COMISION = 0.23;
const PARTE_FONDO = 1 / 3;
const redondear = (monto) => Math.round(monto / 1000) * 1000;

export function desglose(precio) {
    const autocar = Math.min(precio, redondear(precio * COMISION));
    const fondo = Math.min(autocar, redondear(autocar * PARTE_FONDO));
    return { precio, monto_mecanico: precio - autocar, monto_autocar: autocar, monto_fondo: fondo };
}

// Cuántos ítems del checklist ya tienen resultado.
export const completos = (items) => items.filter((i) => RESULTADOS[i.resultado]).length;

// Revisa el informe como Inspecciones\Checklist. items: [{codigo, resultado, nota}].
// Con completo = true (para firmar) exige los 10 ítems y la conclusión.
// Devuelve {errores: {campo: mensaje}, mensaje}: los campos son los name del formulario
// (resultado-<codigo>, nota-<codigo>, conclusion, resumen). Sin errores, mensaje es ''.
export function validarInforme({ items, conclusion: concl, resumen = '' }, completo) {
    const errores = {};
    items.forEach(({ codigo, resultado: res, nota = '' }) => {
        const texto = nota.trim();
        if (!res) {
            if (completo) errores[`resultado-${codigo}`] = 'Elegí un resultado.';
            return;
        }
        if (texto.length > MAX_NOTA) errores[`nota-${codigo}`] = `Puede tener hasta ${MAX_NOTA} caracteres.`;
        else if (res !== 'ok' && !texto) errores[`nota-${codigo}`] = 'Explicá qué encontraste.';
    });
    if (completo && !CONCLUSIONES[concl]) errores.conclusion = 'Elegí una conclusión.';
    if (resumen.trim().length > MAX_RESUMEN) errores.resumen = `Puede tener hasta ${MAX_RESUMEN} caracteres.`;

    const cantidad = Object.keys(errores).length;
    let mensaje = '';
    if (cantidad) mensaje = completo ? 'Para firmar falta completar o corregir lo marcado.' : 'Revisá los datos marcados.';
    return { errores, mensaje };
}

// Lo que se manda al back: sólo los ítems con resultado (mientras no firma puede guardar a medias).
export function cuerpoInforme({ items, conclusion: concl, resumen = '' }) {
    return {
        items: items
            .filter((i) => i.resultado)
            .map(({ codigo, resultado: res, nota = '' }) => ({ codigo, resultado: res, nota: nota.trim() })),
        conclusion: concl || null,
        resumen: resumen.trim(),
    };
}

// Alcance de la inspección (N3): qué se considera "que se veía". Se muestra antes de pagar y al reclamar.
// "Cubre" sale del checklist; lo demás queda escrito acá y en modelo-de-negocio/PLAN.md (sección 7).
export const ALCANCE = {
    cubre: () => CHECKLIST.map((c) => `${c.nombre}: ${c.detalle.toLowerCase()}`),
    noCubre: [
        'Lo que sólo se ve desarmando: el interior del motor o de la caja.',
        'Fallas intermitentes que no aparecen el día de la revisión.',
        'Lo que se rompa o se desgaste después de la inspección.',
        'Los papeles: deudas de patente, multas, prendas o inhibiciones. Te decimos qué trámites pedir.',
        'Si el precio del aviso es justo.',
    ],
    procede: 'El reclamo procede si el problema ya estaba el día de la revisión y se podía ver con el checklist. '
        + 'Tenés 15 días desde la firma y un solo reclamo. Si procede, te devolvemos lo que pagaste y te '
        + 'compensamos con hasta 3 veces el precio de la inspección.',
};
