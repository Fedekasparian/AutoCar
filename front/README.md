# AutoCar — front-end

Maquetado de las pantallas de AutoCar en HTML y CSS, con JavaScript sólo donde hace falta (validación de formularios en el cliente, por ejemplo). No usa frameworks ni librerías de terceros. Las pantallas siguen los wireframes de Figma y [wireframes.md](../Entrega_2/wireframes.md).

## Cómo se usa con el back

El back de AutoCar está en otro repositorio ([AutoCarBackend](https://github.com/MateoPonti/AutoCarBackend)), en PHP, y arma las páginas en el servidor. Este repositorio es el **molde** de cada pantalla:

1. Acá se maqueta cada pantalla como una página HTML con datos de ejemplo.
2. En el back, cada página se pasa a una vista PHP: se reemplazan los datos de ejemplo por los reales (escapados con `e()`), los enlaces `.html` por las rutas del back y se agrega `Csrf::field()` en los formularios.
3. Las hojas de estilo de `styles/` se copian tal cual a `public/assets/css/` del back.

Login, registro y salir ya están hechos en el back, así que no están acá.

| Página | Ruta en el back | Pantalla |
|---|---|---|
| `index.html` | `/` | Landing pública |
| `planes.html` | `/planes` | Planes y precios |
| `guia.html` | — | Guía de componentes (sólo de referencia) |

## Cómo ver las páginas

No hay que instalar nada: se abre `index.html` en el navegador. También se puede levantar un servidor local desde la raíz del repositorio y entrar a `http://localhost:5500`:

```
python3 -m http.server 5500 --directory front
```

Para ver la versión de celular alcanza con achicar la ventana o usar la vista adaptable del navegador (F12). Para ver la de impresión, la vista previa de impresión (Ctrl+P).

## Estructura

```
front/
├── index.html, planes.html, …   una página por pantalla
├── guia.html                    todos los componentes, para copiar el HTML
└── styles/
    ├── reset.css
    ├── estilos.css              variables (colores, tipografía, espaciado) y estructura
    ├── componentes.css          barra, encabezado, botones, campos, chips, fichas, listas
    ├── pantallas.css            lo propio de cada pantalla
    └── print.css                impresión, enlazada con media="print"
```

## Decisiones

**Colores provisorios.** Por ahora son los grises de los wireframes: la paleta de la marca todavía no está definida. Todos los colores están como variables en `:root` (`styles/estilos.css`) y ninguna regla usa un color suelto, así que cuando el grupo elija la paleta se cambia en un solo lugar.

**Nombres en castellano.** Las clases y variables siguen el estilo de PAWPrints: bloque y elemento separados por `__` (`ficha-vehiculo__precio`) y variantes por `--` (`boton--secundario`).

**Barra de navegación.** Va primero en el HTML. En celular se fija abajo, como en Figma; desde 1024px pasa a ser una barra superior con la marca. Las páginas con barra llevan `class="con-barra"` en el `body` para dejarle lugar abajo. La sección actual se marca con `aria-current="page"`.

**Errores de formulario al lado de cada campo.** Los wireframes lo piden así. El campo lleva `aria-invalid="true"` y `aria-describedby` apuntando al texto del error (`.campo__error`), así el lector de pantalla lo lee al llegar al campo.

**Responsive.** Mobile first: lo base es para celular. Desde 768px el contenido se centra con un ancho máximo y la grilla de vehículos pasa a 3 columnas; desde 1024px la grilla va a 4 columnas.
