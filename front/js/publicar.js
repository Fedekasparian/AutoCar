// Formulario "Publicar vehículo" en pasos. Sin JavaScript se ven todos los pasos seguidos y se envía igual;
// con JavaScript se muestra uno por vez y cada paso se valida antes de avanzar (js/validacion.js).
(function () {
    const formulario = document.getElementById('form-publicar');
    if (!formulario) return;

    const pasos = Array.from(formulario.querySelectorAll('.paso'));
    const anterior = document.getElementById('paso-anterior');
    const siguiente = document.getElementById('paso-siguiente');
    const publicar = document.getElementById('publicar');
    const indicador = document.getElementById('pasos');
    const texto = document.getElementById('pasos-texto');
    const numero = document.getElementById('pasos-numero');
    const progreso = document.getElementById('pasos-progreso');
    const pesos = new Intl.NumberFormat('es-AR');
    let actual = 0;

    formulario.classList.add('con-js');
    indicador.hidden = false;
    pasos.forEach((paso) => paso.setAttribute('tabindex', '-1'));

    function controlesDe(paso) {
        return Array.from(paso.querySelectorAll('input, select, textarea'));
    }

    function mostrarPaso(indice, enfocar) {
        actual = indice;
        const ultimo = pasos.length - 1;
        pasos.forEach((paso, i) => {
            paso.hidden = i !== indice;
        });
        anterior.hidden = indice === 0;
        siguiente.hidden = indice === ultimo;
        publicar.hidden = indice !== ultimo;
        texto.textContent = `Paso ${indice + 1} de ${pasos.length} · ${pasos[indice].dataset.paso}`;
        numero.textContent = `${indice + 1}/${pasos.length}`;
        progreso.value = indice + 1;
        if (indice === ultimo) completarResumen();
        if (enfocar) {
            window.scrollTo(0, 0);
            pasos[indice].focus();
        }
    }

    siguiente.addEventListener('click', () => {
        if (Validacion.validar(controlesDe(pasos[actual]), formulario)) mostrarPaso(actual + 1, true);
    });
    anterior.addEventListener('click', () => mostrarPaso(actual - 1, true));

    // Al enviar se valida todo; si algo falla se vuelve al paso que tiene el error.
    formulario.addEventListener('submit', (evento) => {
        const conError = pasos.findIndex((paso) => controlesDe(paso).some((c) => c.willValidate && !c.checkValidity()));
        if (conError === -1) return;
        evento.preventDefault();
        mostrarPaso(conError, false);
        Validacion.validar(controlesDe(pasos[conError]), formulario);
    });

    // ---------- Modelo: sólo los de la marca elegida ----------
    const marca = formulario.elements.marca;
    const modelo = formulario.elements.modelo;
    marca.addEventListener('change', () => {
        Array.from(modelo.querySelectorAll('optgroup')).forEach((grupo) => {
            const otra = marca.value !== '' && grupo.label !== marca.value;
            grupo.hidden = otra;
            grupo.disabled = otra;
        });
        if (modelo.selectedOptions[0]?.parentElement.disabled) modelo.value = '';
    });

    // ---------- Canje: el campo "qué te interesa" sólo si acepta canje ----------
    const aceptaCanje = document.getElementById('acepta-canje');
    const campoBusca = document.getElementById('campo-busca');
    aceptaCanje.addEventListener('change', () => {
        campoBusca.hidden = !aceptaCanje.checked;
    });

    // ---------- Fotos: cantidad, tipo y tamaño, y vista previa ----------
    const fotos = document.getElementById('fotos');
    const previa = document.getElementById('fotos-previa');
    const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
    let urls = [];

    fotos.addEventListener('change', () => {
        const archivos = Array.from(fotos.files);
        const maximo = Number(fotos.dataset.max);
        const maximoBytes = Number(fotos.dataset.maxMb) * 1024 * 1024;
        let error = '';
        if (archivos.length > maximo) error = `Tu plan permite hasta ${maximo} fotos.`;
        else if (archivos.some((a) => !TIPOS.includes(a.type))) error = 'Sólo se aceptan fotos JPG, PNG o WebP.';
        else if (archivos.some((a) => a.size > maximoBytes)) error = `Cada foto puede pesar hasta ${fotos.dataset.maxMb} MB.`;
        fotos.setCustomValidity(error);
        if (error) Validacion.mostrar(fotos, error);
        else Validacion.limpiar(fotos);

        urls.forEach((url) => URL.revokeObjectURL(url));
        urls = error ? [] : archivos.map((a) => URL.createObjectURL(a));
        previa.replaceChildren(...urls.map((url, i) => {
            const item = document.createElement('li');
            const img = document.createElement('img');
            img.src = url;
            img.alt = `Foto ${i + 1}`;
            item.append(img);
            return item;
        }));
    });

    // ---------- Revisión: resumen de lo cargado ----------
    function valorLegible(nombre) {
        const control = formulario.elements[nombre];
        if (!control) return '';
        if (control instanceof RadioNodeList) return control.value;
        if (control.type === 'checkbox') return control.checked ? 'Sí' : 'No';
        if (control.type === 'file') return control.files.length ? `${control.files.length} fotos` : '';
        if (nombre === 'precio') return control.value ? `$${pesos.format(control.value)}` : '';
        if (nombre === 'km') return control.value ? `${pesos.format(control.value)} km` : '';
        return control.value;
    }

    function completarResumen() {
        formulario.querySelectorAll('[data-resumen]').forEach((dato) => {
            const contenido = dato.dataset.resumen.split(' ').map(valorLegible).filter(Boolean).join(' · ');
            dato.textContent = contenido || '—';
        });
    }

    mostrarPaso(0, false);
}());
