# AutoCar — front-end

Pantallas de AutoCar en HTML, CSS y JavaScript nativo, sin frameworks ni librerías de terceros. Las pantallas siguen los wireframes de Figma y [wireframes.md](../Entrega_2/wireframes.md).

La consigna del [TP integrador](../TP%20Integrador%20-%20PAW%202026%20Mercedes.pdf), página 1, establece JavaScript para el contenido dinámico y exige consultar al equipo docente antes de usar librerías de terceros. El diseño debe ser responsivo, multipantalla y crossbrowser, con validación de estándares W3C. No exige resolver las interacciones únicamente con CSS.

El rediseño conserva CSS propio, HTML semántico y JavaScript nativo. No incorpora frameworks, bibliotecas de componentes, fuentes externas ni dependencias de ejecución. El comparador, los datos del preview y las herramientas para capturas y documentos están fuera del frontend que se entrega; no son librerías del producto. Las comprobaciones locales de estructura y responsive no sustituyen una validación formal W3C ni pruebas en todos los navegadores.

- **Sitio publicado (Vercel):** https://autocar-zeta.vercel.app/front/index.html

## Cómo se conecta con el back

El back es una API JSON en PHP ([AutoCarBackend](https://github.com/MateoPonti/AutoCarBackend)). El front pide los datos con `fetch` y arma las pantallas en el navegador.

- **Dirección de la API** (`js/api/config.js`): si el front se abre en `localhost` o `127.0.0.1` usa `http://localhost:8000`. Publicado, pide `/api/...` a su **propio dominio** y Vercel reenvía esos pedidos a `https://autocarbackend-1.onrender.com` (proxy en `middleware.js`, en la raíz del repo, con la variable `BACKEND_URL` de cada entorno; `vercel.json` solo redirige `/` a `/front/`). Así la cookie de sesión es del propio sitio y no una cookie de terceros, que Safari y otros navegadores bloquean.
- **Sesión con cookie:** `POST /api/login` deja el id de la sesión (`$_SESSION` en el back) en una cookie `HttpOnly`, `Secure` y `SameSite=Strict` que pone el back: JavaScript no la puede leer ni borrar. Todos los `fetch` van con `credentials: 'include'`. En `sessionStorage` sólo se guardan el usuario (nombre y rol, para mostrar) y el token CSRF (`js/servicios/sesion.js`). Salir llama a `POST /api/logout`, que destruye la sesión en el servidor y borra la cookie.
- **CSRF:** los pedidos `POST`, `PUT` y `DELETE` llevan el header `X-CSRF-Token` con el valor que devolvió el login (`js/api/cliente.js`). Sin él, el back responde 403.
- **CORS (sólo en local):** el back sólo acepta los orígenes de su variable `FRONT_URL`; en local tiene que incluir `http://localhost:5500`. Publicado no hace falta porque, gracias al proxy, front y API están en el mismo dominio.
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
| `pedir-inspeccion.html` | `GET /api/mecanicos`, `POST /api/inspecciones` | "Mandale un mecánico": link del aviso (llega con `?url=` desde el detalle), ranking de mecánicos por localidad, desglose del precio y confirmar (pago simulado) |
| `mis-inspecciones.html` | `GET /api/mis-inspecciones` | Inspecciones pedidas, con el estado y el paso siguiente |
| `verificacion.html?id=N` | `GET /api/inspecciones/{id}`, `POST .../cancelar`, `POST .../reclamo` | Detalle para el comprador: turno, cancelar mientras está pedida, informe firmado, trámites para pedir antes de pagar y reclamo dentro de los 15 días |
| `admin-reclamos.html` | `GET /api/admin/reclamos`, `PATCH /api/admin/reclamos/{id}` | Cola de reclamos (permiso `reclamos.resolver`): procede con compensación hasta el tope, o no procede |
| `taller.html` | `GET/PUT /api/mecanico/perfil`, `GET /api/mecanico/inspecciones?estado=`, `PATCH /api/mecanico/inspecciones/{id}` | Panel del mecánico (permiso `verificaciones.realizar`): perfil del taller con el desglose del precio y bandeja de pedidos, por revisar y firmadas. Aceptar con fecha de turno o rechazar con motivo |
| `taller-verificacion.html?id=N` | `GET /api/inspecciones/{id}`, `PUT /api/mecanico/inspecciones/{id}/informe`, `POST /api/mecanico/inspecciones/{id}/firma` | Checklist de 10 ítems (`js/servicios/inspecciones.js`, los mismos códigos que el back), borrador, conclusión y firma. Firmada, se ve sólo para leer con el firmante y la huella |

Las páginas que piden sesión mandan a `login.html` si no hay sesión iniciada. Las de administración, además, mandan a `home.html` si el rol no es admin. Es sólo una comodidad: el back controla el rol en cada pedido.

### Pantallas que siguen siendo maqueta

El resto de las pantallas todavía no tiene ruta en la API, así que muestran datos de ejemplo:

- favoritos, mis publicaciones, publicar, tasación y canje;
- meta-búsqueda, mensajes y plan;
- talleres y verificación del lado del comprador (el panel del mecánico ya está conectado);
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
| `talleres.html` | `/talleres` | Mecánicos de la red: ranking público (`GET /api/mecanicos`), filtro por localidad y "Elegir" → pedir inspección |
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
3. Entrar a `http://localhost:5500` (con `localhost`, no `127.0.0.1`: la cookie de sesión es de `localhost`, igual que la API).

No alcanza con abrir los `.html` con doble clic: los módulos de JavaScript y el CORS necesitan que la página venga de un servidor. Para tener un administrador, registrate y seguí "Crear el primer administrador" del README del back.

En Render (plan Free) el back se duerme tras unos minutos sin uso: el primer pedido puede tardar cerca de un minuto. Mientras tanto la pantalla muestra "Cargando…".

Para ver la versión de celular alcanza con achicar la ventana o usar la vista adaptable del navegador (F12). Para ver la de impresión, la vista previa de impresión (Ctrl+P).

## Entorno de prueba

Versiones con las que se desarrolló y probó (lo pide la guía de entrega):

| | Versión |
|---|---|
| Sistema operativo | Windows 11 Pro (build 26200) |
| Navegadores | Chrome 156 y Edge 156 (escritorio y vista adaptable de celular con F12) |
| Servidor local para el front | `php -S` (PHP 8.4.10) o `python -m http.server` (Python 3.14.4) |
| Publicado en | Vercel (sitio estático, sin build) |

El front no necesita instalar nada: es HTML, CSS y JavaScript nativo.

## Estructura

```
front/
├── *.html                       una página por pantalla
├── guia.html                    todos los componentes, para copiar el HTML
├── js/
│   ├── api/                     los fetch: una función por ruta de la API
│   │   ├── config.js            URL de la API (local, o el mismo dominio con el proxy de Vercel)
│   │   ├── cliente.js           fetch con la cookie de sesión, token CSRF, JSON y errores (ErrorApi)
│   │   ├── auth.js              login, logout, registro, me
│   │   ├── vehiculos.js         listado, detalle y marcas (público)
│   │   └── admin.js             alta, modificación y baja de vehículos
│   ├── servicios/               lógica que comparten las páginas
│   │   ├── sesion.js            usuario y token CSRF, requerirLogin / requerirAdmin
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

**Identidad visual.** La paleta elegida es tinta y aqua: tinta `#131B2D`, acento `#69E6D8` y fondo `#F3F7F7`. Los colores semánticos están en `styles/identidad.css`; `styles/interiores.css` adapta las vistas de cuenta y `styles/portada.css` resuelve el banner y el menú público. El logo elegido es `assets/identidad/logo-perfil.svg`. `js/tema.js` permite comparar cuatro paletas mediante `?tema=aqua`, `petroleo`, `mandarina` o `durazno`, y recuerda la preferencia local.

**Pantallas internas.** La identidad se aplica a las 34 páginas HTML, incluida la guía. Navegación inferior hasta 1099 px; chat separado de la bandeja debajo de 768 px. `js/paginas/mensajes.js` permite explorar tres conversaciones de ejemplo y filtrarlas, sin implementar persistencia de mensajes. Las fotografías y el mapa esquemático son ilustrativos. Las limitaciones de API descritas arriba siguen vigentes.

**Nombres en castellano.** Las clases y variables siguen el estilo de PAWPrints: bloque y elemento separados por `__` (`ficha-vehiculo__precio`) y variantes por `--` (`boton--secundario`).

**Barra de navegación.** Va primero en el HTML. Hasta 1099 px se fija abajo; desde 1100 px pasa a ser una barra superior con la marca. Las páginas con barra llevan `class="con-barra"` en el `body` para dejarle lugar abajo. La sección actual se marca con `aria-current="page"`.

**Filtros en la URL.** Los filtros y la página del listado son formularios GET (`home.html?marca=Toyota&page=2`). Se puede recargar, compartir el enlace o volver atrás sin perder la búsqueda.

**Datos del servidor como texto.** Todo lo que llega de la API se pone con `textContent` o creando elementos (`js/servicios/vistas.js`), nunca con `innerHTML`. Así un dato con HTML no se ejecuta en la página.

**Texto del chat.** `js/paginas/mensajes.js` asigna cada mensaje con `textContent` y después agrega la hora como un nodo separado. Al conectar la API, se debe conservar este tratamiento: el backend guarda el texto literal, que puede contener etiquetas. No usar `innerHTML`, `insertAdjacentHTML` ni interpretar el contenido como marcado.

**Errores de formulario al lado de cada campo.** Los wireframes lo piden así. El campo lleva `aria-invalid="true"` y `aria-describedby` apuntando al texto del error (`.campo__error`), así el lector de pantalla lo lee al llegar al campo. Se usa lo mismo para los errores de validación del cliente y para los del back.

**Validación en el cliente y en el servidor.** `js/validacion.js` usa las reglas del propio HTML (`required`, `min`, `pattern`…), que copian las del back. Es sólo una ayuda para el usuario: el back vuelve a validar todo.

**Ventanas.** Las ventanas como "Eliminar vehículo" son `<dialog>` que abre `js/dialogos.js`; los menús "⋯" usan `<details>`, que funciona sin JavaScript.

**Estados vacíos y de carga.** Las pantallas conectadas muestran "Cargando…" mientras esperan, un aviso con "Reintentar" si la API falla y un estado vacío si no hay resultados.

**Responsive.** La base original es mobile first y las hojas de identidad añaden ajustes para cada ancho. La grilla de vehículos muestra 2 columnas debajo de 768 px, 3 desde 768 px y 4 desde 1024 px. Los formularios y paneles reorganizan sus columnas sin ocultar contenido para forzar una altura fija.

## Prueba del render de mensajes

La prueba [tests/mensajes-xss.html](../tests/mensajes-xss.html) carga el script del chat y reemplaza únicamente los datos de ejemplo por cinco casos: texto normal, etiquetas con eventos, una etiqueta de script y caracteres especiales. Comprueba que el mensaje conserve el texto literal, que sólo se agregue el nodo de la hora y que no se ejecute código del mensaje. No agrega dependencias al frontend ni envía mensajes al backend.

Desde la raíz del repositorio, ejecutar `python3 -m http.server 5501 --bind 127.0.0.1` y abrir `http://127.0.0.1:5501/tests/mensajes-xss.html`. El resultado esperado es «5 de 5 casos correctos».
