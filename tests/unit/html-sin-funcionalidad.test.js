// Regla de la cátedra: el HTML es semántico y describe el contenido; la funcionalidad la agrega el JS.
// "El 100% de los tags y elementos HTML que necesitamos para darle funcionalidad … los generamos con JavaScript,
// nunca los incluimos en el HTML" (video "Ejemplo Menú PAW", PAW - UNLu).
// Por eso en front/**/*.html no puede haber botones de acción, ventanas <dialog>, atributos que conecten el JS
// (data-abrir, data-cerrar) ni JavaScript escrito en el HTML. Lo único que queda es el botón submit de un
// formulario, que es parte del formulario. Cómo hacerlo bien: "Botones y ventanas" en front/README.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const FRONT = fileURLToPath(new URL('../../front/', import.meta.url));

function paginas(carpeta) {
    return readdirSync(carpeta, { withFileTypes: true }).flatMap((entrada) => {
        const ruta = join(carpeta, entrada.name);
        if (entrada.isDirectory()) return paginas(ruta);
        return entrada.name.endsWith('.html') ? [ruta] : [];
    });
}

// [qué se prohíbe, expresión que lo encuentra]
const REGLAS = [
    ['<button> que no es el submit de un formulario', /<button\b(?![^>]*type="submit")[^>]*>/g],
    ['ventana <dialog>', /<dialog\b[^>]*>/g],
    ['atributo data-abrir / data-cerrar', /\sdata-(abrir|cerrar)\b[^\s>]*/g],
    ['evento escrito en el HTML (onclick=…)', /\son[a-z]+\s*=/g],
    ['enlace javascript:', /href\s*=\s*["']javascript:/g],
    ['<script> con código adentro (tiene que ir en un archivo .js)', /<script\b(?![^>]*\ssrc=)[^>]*>\s*\S/g],
];

for (const archivo of paginas(FRONT)) {
    const nombre = relative(FRONT, archivo).replaceAll('\\', '/');
    test(`${nombre}: sin funcionalidad en el HTML`, () => {
        // Los comentarios no cuentan (pueden mencionar un botón para explicar dónde lo agrega el JS)
        const html = readFileSync(archivo, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
        const problemas = REGLAS.flatMap(([que, expresion]) => {
            const encontrados = html.match(expresion) || [];
            return encontrados.map((texto) => `${que}: ${texto.trim().slice(0, 90)}`);
        });
        assert.deepEqual(problemas, [], `Crealo desde el JS de la página (ver front/README.md, "Botones y ventanas").`);
    });
}
