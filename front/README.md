# AutoCar — front-end

Front de AutoCar hecho con HTML, CSS y JavaScript nativo (módulos ES y Web Components), sin frameworks ni librerías de terceros, como define la [arquitectura de la entrega 2](../Entrega_2/arquitectura-y-modelo.md). Las pantallas siguen los wireframes de Figma y [wireframes.md](../Entrega_2/wireframes.md).

## Cómo ejecutar

No hay que instalar nada. Desde la raíz del repositorio se levanta un servidor local y se entra a `http://localhost:5500`:

```
python3 -m http.server 5500 --directory front
```

Hace falta un servidor (no alcanza con abrir `index.html` con doble clic) porque los módulos de JavaScript no cargan desde `file://`.

Para ver la versión de celular alcanza con achicar la ventana o usar la vista adaptable del navegador (F12). La guía con todos los componentes está en `http://localhost:5500/#/estilos`.

Mientras no esté el back-end, los datos salen de `js/datos/prueba.js`.

## Estructura

```
front/
├── index.html              una sola página; el contenido lo dibuja el JS según la ruta
├── styles/
│   ├── reset.css
│   ├── estilos.css         variables (colores, tipografía, espaciado) y estructura general
│   ├── componentes.css     encabezado, barra, botones, campos, chips, fichas, listas
│   └── print.css           impresión, enlazada con media="print"
└── js/
    ├── app.js              punto de entrada
    ├── rutas.js            mapa de rutas (sigue el sitemap)
    ├── enrutador.js        router por hash (#/ruta)
    ├── sesion.js           usuario de la sesión actual
    ├── api.js              acceso a datos (hoy datos de prueba, después fetch a la API)
    ├── html.js             plantillas con escape automático
    ├── formato.js          precios, kilómetros y fechas en es-AR
    ├── iconos.js           íconos SVG propios
    ├── componentes/        <barra-navegacion>, <encabezado-pantalla> y la ficha de vehículo
    ├── vistas/             una vista por pantalla
    └── datos/prueba.js     datos de ejemplo
```

## Decisiones

**Una sola página con router por hash.** Las rutas son del tipo `#/vehiculo/3`. Así la app funciona en cualquier hosting estático sin configurar el servidor para que redirija todas las rutas al `index.html`.

**Cada pantalla es un módulo en `js/vistas/`** que exporta `dibujar(ctx)`, que devuelve el HTML, y opcionalmente `titulo(ctx)` y `montar(raiz, ctx)`, que agrega los eventos. `ctx` trae los parámetros de la ruta (`ctx.params.id`) y la query string (`ctx.consulta`). Las vistas se cargan recién cuando se visitan (`import()` dinámico).

**El HTML se arma con la plantilla `html` de `js/html.js`,** que escapa todo lo que se interpola. Un título o un mensaje escrito por un usuario nunca se interpreta como HTML, lo que evita XSS sin tener que acordarse de escapar a mano.

**`api.js` es la única puerta a los datos.** Hoy devuelve datos de prueba; cuando esté la API REST cada función pasa a hacer `fetch` con la misma firma y las vistas no cambian. La sesión de prueba se guarda en `localStorage`; en la versión real es una cookie `httpOnly` que el JavaScript no puede leer.

**Los permisos del front son sólo de interfaz.** El router no muestra una pantalla privada sin sesión, pero quien decide qué puede ver o hacer cada usuario es el servidor.

**Colores y medidas.** Son los de los wireframes: escala de grises, Inter (o la fuente del sistema si no está instalada) y botones oscuros. Todo está en variables en `:root` (`styles/estilos.css`), así cuando se defina la identidad visual se cambia en un solo lugar.

**Responsive.** Mobile first: lo base es para celular. A partir de 768px el contenido se centra con un ancho máximo y la grilla de vehículos pasa a 3 columnas; a partir de 1024px la barra inferior pasa a ser una barra superior con la marca, y la grilla va a 4 columnas.
