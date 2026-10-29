# AutoCar — front-end

Pantallas de AutoCar en HTML, CSS y JavaScript nativo, sin frameworks ni librerías de terceros. Las pantallas siguen los wireframes de Figma y [wireframes.md](../Entrega_2/wireframes.md).

- **Sitio publicado (Vercel):** https://autocar-zeta.vercel.app/front/index.html

## Cómo se conecta con el back

El back es una API JSON en PHP ([AutoCarBackend](https://github.com/MateoPonti/AutoCarBackend)). El front pide los datos con `fetch` y arma las pantallas en el navegador.

- **Dirección de la API** (`js/api/config.js`): si el front se abre en `localhost` o `127.0.0.1` usa `http://localhost:8000`; en cualquier otro dominio usa `https://autocarbackend-1.onrender.com`.
- **Sesión:** `POST /api/login` devuelve un token JWT. Se guarda en `sessionStorage` y va en cada pedido como `Authorization: Bearer <token>`. Salir es descartar el token. No hay cookies ni CSRF.
- **CORS:** el back sólo acepta los orígenes de su variable `FRONT_URL`. Hay que agregar ahí la dirección desde donde se abre el front: `http://localhost:5500` en local y la URL del front desplegado en Vercel (`https://autocar-zeta.vercel.app`).
- **Errores:** la API responde `{"error", "mensaje", "errores": {campo: mensaje}}`. Los errores por campo (422) se muestran al lado de cada campo, igual que la validación del cliente.

### Pantallas conectadas a la API

| Página | Ruta de la API | Pantalla |
|---|---|---|
| `home.html` | `GET /api/vehiculos`, `GET /api/marcas` | Publicaciones con filtros (marca, precio, combustible) y paginación |
| `buscar.html` | `GET /api/vehiculos`, `GET /api/marcas` | Búsqueda por texto y filtros |
| `vehiculo.html?id=N` | `GET /api/vehiculos/{id}` | Detalle de vehículo |
| `login.html` | `POST /api/login` | Ingresar. Con `?volver=pagina.html` vuelve ahí después |
| `registro.html` | `POST /api/registro` y después `POST /api/login` | Crear cuenta e ingresar |
| `cuenta.html` | `GET /api/me` | Datos del usuario, enlace de administración (sólo admin) y Salir |
| `admin.html` | — | Panel de administración (sólo admin) |
| `admin-vehiculos.html` | `GET /api/admin/vehiculos`, `DELETE /api/admin/vehiculos/{id}` | Listado con vendidos, editar y eliminar |
| `admin-vehiculo.html` | `POST /api/admin/vehiculos` · `?id=N`: `PUT /api/admin/vehiculos/{id}` | Alta y edición de un vehículo |

Las páginas que piden sesión mandan a `login.html` si no hay token. Las de administración, además, mandan a `home.html` si el rol no es admin. Es sólo una comodidad: el back controla el rol en cada pedido.

### Pantallas que siguen siendo maqueta

El resto de las pantallas todavía no tiene ruta en la API, así que muestran datos de ejemplo:

- favoritos, mis publicaciones, publicar, tasación y canje;
- meta-búsqueda, mensajes y plan;
- talleres y verificación;
- reportar, contacto y legales.

Por la misma razón, el detalle de vehículo todavía no tiene las partes de verificación, tasación, ubicación, publicador ni favoritos. Ese maquetado está en la historia de git y en `guia.html`.

| Página | Ruta futura | Pantalla |
|---|---|---|
| `index.html` | `/` | Landing pública |
| `planes.html` | `/planes` | Planes y precios |
| `favoritos.html` | `/cuenta/favoritos` | Favoritos organizados en listas |
| `mis-publicaciones.html` | `/mis-publicaciones` | Publicaciones propias con el cupo del plan |
| `publicar.html` | `/mis-publicaciones/nueva` | Publicar vehículo en 6 pasos |
| `tasacion.html` | `/mis-publicaciones/:id/tasacion` | Tasación con IA |
| `propuestas.html` | `/mis-publicaciones/propuestas` | Propuestas de canje recibidas y enviadas |
| `proponer-canje.html` | `/vehiculo/:id/proponer-canje` | Proponer un canje |
| `mapa.html` | `/mapa` | Mapa de vehículos |
| `meta-busqueda.html` | `/meta-busqueda` | Mis intereses (búsquedas guardadas) |
| `meta-busqueda-nueva.html` | `/meta-busqueda/nueva` | Nueva búsqueda con texto libre e IA |
| `meta-busqueda-resultados.html` | `/meta-busqueda/:id` | Coincidencias y estadísticas de mercado |
| `mensajes.html` | `/mensajes` | Conversaciones |
| `conversacion.html` | `/mensajes/:id` | Conversación |
| `plan.html` | `/cuenta/plan` | Plan activo y cambio de nivel |
| `talleres.html` | `/talleres` | Talleres adheridos (mapa y lista) |
| `verificar-vehiculo.html` | `/mis-publicaciones/:id/verificar` | Código para verificar en el taller |
| `verificacion.html` | `/verificacion/:id` | Informe de verificación |
| `talleres-adherirse.html` | `/talleres/adherirse` | Alta de un taller |
| `taller.html` | `/taller` | Panel del mecánico |
| `taller-verificacion.html` | `/taller/verificacion/:id` | Inspección con el checklist |
| `legales.html` | `/legales` | Términos y privacidad |
| `contacto.html` | `/ayuda/contacto` | Contacto |
| `reportar.html` | `/reportes/nuevo` | Reportar publicación o usuario |
| `guia.html` | — | Guía de componentes e índice de todas las pantallas (sólo de referencia) |

## Cómo levantarlo en local

1. Levantar el back en el puerto 8000. Los pasos están en el README de AutoCarBackend; el `.env` tiene que incluir `FRONT_URL=http://localhost:5500`.
   ```
   php -S localhost:8000 -t public public/index.php
   ```
2. Servir esta carpeta en el puerto 5500, desde la raíz del repositorio:
   ```
   php -S localhost:5500 -t front
   ```
   o, si tenés Python:
   ```
   python3 -m http.server 5500 --directory front
   ```
3. Entrar a `http://localhost:5500`.

No alcanza con abrir los `.html` con doble clic: los módulos de JavaScript y el CORS necesitan que la página venga de un servidor. Para tener un administrador, registrate y seguí "Crear el primer administrador" del README del back.

En Render (plan Free) el back se duerme tras unos minutos sin uso: el primer pedido puede tardar cerca de un minuto. Mientras tanto la pantalla muestra "Cargando…".

Para ver la versión de celular alcanza con achicar la ventana o usar la vista adaptable del navegador (F12). Para ver la de impresión, la vista previa de impresión (Ctrl+P).

## Estructura

```
front/
├── *.html                       una página por pantalla
├── guia.html                    todos los componentes, para copiar el HTML
├── js/
│   ├── api/                     los fetch: una función por ruta de la API
│   │   ├── config.js            URL de la API (local o Render)
│   │   ├── cliente.js           fetch con token, JSON y errores (ErrorApi)
│   │   ├── auth.js              login, registro, me
│   │   ├── vehiculos.js         listado, detalle y marcas (público)
│   │   └── admin.js             alta, modificación y baja de vehículos
│   ├── servicios/               lógica que comparten las páginas
│   │   ├── sesion.js            token y usuario, requerirLogin / requerirAdmin
│   │   ├── formato.js           precios, km y nombres de combustible, transmisión y estado
│   │   ├── vistas.js            fichas, paginación y avisos armados con el DOM
│   │   └── formularios.js       envío por fetch y errores del back al lado de cada campo
│   ├── paginas/                 el script de cada página conectada (catalogo.js sirve a home y buscar)
│   ├── dialogos.js              abre y cierra las ventanas <dialog>
│   ├── validacion.js            validación en el cliente con el error al lado de cada campo
│   └── publicar.js              formulario de publicar en pasos, vista previa de fotos y resumen
└── styles/
    ├── reset.css
    ├── estilos.css              variables (colores, tipografía, espaciado) y estructura
    ├── componentes.css          barra, encabezado, botones, campos, chips, fichas, listas
    ├── pantallas.css            lo propio de cada pantalla
    └── print.css                impresión, enlazada con media="print"
```

Las páginas cargan su script con `<script type="module" src="js/paginas/....js">`. Las páginas nunca llaman a `fetch` directamente: usan `js/api/`. Así, si cambia una ruta del back, se corrige en un solo lugar.

## Decisiones

**Colores provisorios.** Por ahora son los grises de los wireframes: la paleta de la marca todavía no está definida. Todos los colores están como variables en `:root` (`styles/estilos.css`) y ninguna regla usa un color suelto, así que cuando el grupo elija la paleta se cambia en un solo lugar.

**Nombres en castellano.** Las clases y variables siguen el estilo de PAWPrints: bloque y elemento separados por `__` (`ficha-vehiculo__precio`) y variantes por `--` (`boton--secundario`).

**Barra de navegación.** Va primero en el HTML. En celular se fija abajo, como en Figma; desde 1024px pasa a ser una barra superior con la marca. Las páginas con barra llevan `class="con-barra"` en el `body` para dejarle lugar abajo. La sección actual se marca con `aria-current="page"`.

**Filtros en la URL.** Los filtros y la página del listado son formularios GET (`home.html?marca=Toyota&page=2`). Se puede recargar, compartir el enlace o volver atrás sin perder la búsqueda.

**Datos del servidor como texto.** Todo lo que llega de la API se pone con `textContent` o creando elementos (`js/servicios/vistas.js`), nunca con `innerHTML`. Así un dato con HTML no se ejecuta en la página.

**Errores de formulario al lado de cada campo.** Los wireframes lo piden así. El campo lleva `aria-invalid="true"` y `aria-describedby` apuntando al texto del error (`.campo__error`), así el lector de pantalla lo lee al llegar al campo. Se usa lo mismo para los errores de validación del cliente y para los del back.

**Validación en el cliente y en el servidor.** `js/validacion.js` usa las reglas del propio HTML (`required`, `min`, `pattern`…), que copian las del back. Es sólo una ayuda para el usuario: el back vuelve a validar todo.

**Ventanas.** Las ventanas como "Eliminar vehículo" son `<dialog>` que abre `js/dialogos.js`; los menús "⋯" usan `<details>`, que funciona sin JavaScript.

**Estados vacíos y de carga.** Las pantallas conectadas muestran "Cargando…" mientras esperan, un aviso con "Reintentar" si la API falla y un estado vacío si no hay resultados.

**Responsive.** Mobile first: lo base es para celular. Desde 768px el contenido se centra con un ancho máximo y la grilla de vehículos pasa a 3 columnas; desde 1024px la grilla va a 4 columnas.
