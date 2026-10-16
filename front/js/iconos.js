// Íconos SVG dibujados a mano. Son decorativos: el texto o el aria-label del botón dice qué hacen.
import { confiable } from './html.js';

const svg = (trazo, tam = 20) => confiable(
    `<svg width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ` +
    `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${trazo}</svg>`,
);

export const iconos = {
    volver: svg('<path d="M20 12H4M4 12l7-7M4 12l7 7"/>', 22),
    inicio: svg('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>', 16),
    buscar: svg('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>', 16),
    publicar: svg('<path d="M12 5v14M5 12h14"/>', 16),
    mensajes: svg('<path d="M4 5h16v11H9l-5 4z"/>', 16),
    cuenta: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>', 16),
    favorito: svg('<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>'),
    mas: svg('<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'),
    chispa: svg('<path d="M12 3l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"/>', 16),
    llave: svg('<path d="M14.5 5.5a4 4 0 0 0 4.9 4.9L21 12l-9 9-3-3 9-9"/>', 16),
};
