// Portada (index.html): los últimos 4 publicados de verdad, con GET /api/vehiculos (los más nuevos primero).
import * as vehiculos from '../api/vehiculos.js';
import * as vistas from '../servicios/vistas.js';

const grilla = document.getElementById('ultimos');
try {
    const { items } = await vehiculos.listar({});
    if (items.length) grilla.replaceChildren(...items.slice(0, 4).map(vistas.fichaVehiculo));
    else grilla.closest('section').hidden = true;
} catch {
    grilla.closest('section').hidden = true; // sin API, la portada se ve igual sin esta sección
}
