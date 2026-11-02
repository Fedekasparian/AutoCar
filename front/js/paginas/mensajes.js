// Conversaciones de ejemplo del maquetado. El envío conserva su formulario nativo.
const conversaciones = {
    onix: { persona: 'Martín G.', vehiculo: 'Chevrolet Onix 2019', precio: '$4.800.000', id: 4, conversacion: 3, fecha: 'Hoy', mensajes: [
        ['Hola, ¿sigue disponible?', '10:12', false],
        ['Sí, sigue. ¿Querés verlo?', '10:20', true],
        ['¿Lo puedo ver el sábado a la mañana?', '10:31', false]
    ] },
    cronos: { persona: 'Laura P.', vehiculo: 'Fiat Cronos 2021', precio: '$11.900.000', id: 3, conversacion: 2, fecha: 'Ayer', mensajes: [
        ['Hola, me interesa el canje por el Cronos.', '15:05', true],
        ['Te mandé la contraoferta.', '15:18', false]
    ] },
    corolla: { persona: 'Diego R.', vehiculo: 'Toyota Corolla 2018', precio: '$8.500.000', id: 1, conversacion: 1, fecha: 'Lunes', mensajes: [
        ['Podemos coordinar para verlo esta semana.', '11:10', true],
        ['Gracias, lo pienso y te aviso.', '11:23', false]
    ] }
};

const solicitado = new URLSearchParams(location.search).get('chat');
const clave = Object.hasOwn(conversaciones, solicitado) ? solicitado : 'onix';
const conversacion = conversaciones[clave];
const enlaces = Array.from(document.querySelectorAll('[data-chat]'));
enlaces.forEach(enlace => {
    if (enlace.dataset.chat === clave) enlace.setAttribute('aria-current', 'page');
    else enlace.removeAttribute('aria-current');
});
document.querySelector('#chat-persona').textContent = conversacion.persona;
const vehiculo = document.querySelector('#chat-vehiculo');
vehiculo.textContent = conversacion.vehiculo + ' · ' + conversacion.precio;
vehiculo.href = '../vehiculos/vehiculo.html?id=' + conversacion.id;
const foto = document.querySelector('#chat-foto');
foto.src = '../../assets/identidad/' + clave + '.jpg';
foto.alt = 'Imagen ilustrativa de ' + conversacion.vehiculo;
document.querySelector('.chat__enviar').action = '/mensajes/' + conversacion.conversacion;
const historial = document.querySelector('#chat-historial');
const fecha = document.createElement('li');
fecha.className = 'chat__fecha';
fecha.textContent = conversacion.fecha;
historial.replaceChildren(fecha);
conversacion.mensajes.forEach(([texto, hora, propio]) => {
    const mensaje = document.createElement('li');
    mensaje.className = 'chat__mensaje' + (propio ? ' chat__mensaje--mio' : '');
    mensaje.append(document.createTextNode(texto));
    const tiempo = document.createElement('span');
    tiempo.className = 'chat__hora';
    tiempo.textContent = hora;
    mensaje.append(tiempo);
    historial.append(mensaje);
});

const normalizar = texto => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
document.querySelector('#buscar-conversacion').addEventListener('input', event => {
    const busqueda = normalizar(event.target.value.trim());
    enlaces.forEach(enlace => { enlace.parentElement.hidden = !normalizar(enlace.textContent).includes(busqueda); });
    document.querySelector('#sin-conversaciones').hidden = enlaces.some(enlace => !enlace.parentElement.hidden);
});
