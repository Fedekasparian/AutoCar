// Armado de HTML con plantillas. Todo valor que se interpola se escapa por defecto,
// así un dato cargado por un usuario (título, mensaje, nombre) nunca se interpreta como HTML (XSS).

class HtmlSeguro {
    constructor(valor) {
        this.valor = valor;
    }

    toString() {
        return this.valor;
    }
}

const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapar(valor) {
    return String(valor).replace(/[&<>"']/g, (c) => ENTIDADES[c]);
}

function serializar(valor) {
    if (valor === null || valor === undefined || valor === false) return '';
    if (valor instanceof HtmlSeguro) return valor.valor;
    if (Array.isArray(valor)) return valor.map(serializar).join('');
    return escapar(valor);
}

// Uso: html`<p>${texto}</p>` → el texto queda escapado.
export function html(partes, ...valores) {
    let salida = partes[0];
    valores.forEach((valor, i) => {
        salida += serializar(valor) + partes[i + 1];
    });
    return new HtmlSeguro(salida);
}

// Sólo para HTML fijo que escribe el propio código (íconos SVG), nunca para datos de usuarios.
export function confiable(marcado) {
    return new HtmlSeguro(marcado);
}
