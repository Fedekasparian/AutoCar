// Planes (plan.html y planes.html). Los planes siguen siendo de muestra, pero no aplican para el admin:
// tiene siempre el mejor (Ambas · Platino) incluido y sin cobro, así que se le muestra eso y no se le ofrece cambiar.
import * as sesion from '../servicios/sesion.js';

const plan = sesion.planIncluido();

if (plan) {
    const texto = `${plan.nombre} · ${plan.nivel}`;
    // plan.html: el recuadro del plan actual y el formulario para cambiar de nivel
    const actual = document.getElementById('actual-titulo');
    if (actual) {
        actual.textContent = texto;
        const recuadro = actual.closest('section');
        recuadro.querySelectorAll('.cupo__texto, progress').forEach((n) => n.remove());
        recuadro.querySelector('.campo__ayuda').textContent =
            `Incluido por ser administrador: anuncios ${plan.anuncios.toLowerCase()}, comparador de precios, canjes, `
            + `meta-búsqueda y ${plan.descuento} de descuento en talleres. No se cobra.`;
        document.querySelector('form[action="/cuenta/plan"]')?.remove();
    }
    // planes.html: aviso arriba y se marca "Ambas" como el plan que ya tiene
    const intro = document.querySelector('.pagina-intro');
    if (intro && !actual) {
        const aviso = document.createElement('p');
        aviso.className = 'recuadro';
        aviso.setAttribute('role', 'status');
        aviso.textContent = `Como administrador ya tenés el plan ${texto} incluido: los planes no aplican para tu cuenta.`;
        intro.after(aviso);
        document.querySelectorAll('.plan a.boton').forEach((boton) => { boton.hidden = true; });
        document.getElementById('plan-ambas')?.closest('.plan')?.classList.add('plan--destacado');
    }
}
