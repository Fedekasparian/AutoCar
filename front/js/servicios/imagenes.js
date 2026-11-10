// Achica una foto en el navegador antes de subirla: una foto de celular (3 a 8 MB) queda en un JPEG de unos
// cientos de KB. Así se puede elegir cualquier foto, el back sigue con su límite de 2 MB y la base no se llena.
// lado: el lado más largo en píxeles. cuadrado: recorta el centro en un cuadrado (foto de perfil).
export async function achicar(archivo, { lado = 1600, cuadrado = false, calidad = 0.85 } = {}) {
    const imagen = await createImageBitmap(archivo);
    let x = 0;
    let y = 0;
    let ancho = imagen.width;
    let alto = imagen.height;
    if (cuadrado) {
        const menor = Math.min(ancho, alto);
        x = (ancho - menor) / 2;
        y = (alto - menor) / 2;
        ancho = menor;
        alto = menor;
    }
    const escala = Math.min(1, lado / Math.max(ancho, alto)); // nunca la agranda
    const lienzo = document.createElement('canvas');
    lienzo.width = Math.round(ancho * escala);
    lienzo.height = Math.round(alto * escala);
    lienzo.getContext('2d').drawImage(imagen, x, y, ancho, alto, 0, 0, lienzo.width, lienzo.height);
    imagen.close();

    const blob = await new Promise((resolver, rechazar) => lienzo.toBlob(
        (b) => (b ? resolver(b) : rechazar(new Error('No se pudo procesar la foto. Probá con otra.'))),
        'image/jpeg', calidad));
    return new File([blob], `${archivo.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' });
}
