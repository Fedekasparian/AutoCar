# Pendientes de AutoCar

Lista viva de lo que falta. Cuando alguien toma un ítem, pone su nombre; cuando lo termina, lo tacha (`~~así~~`) o lo borra con el PR que lo resuelve.
El plan completo del enfoque del mecánico está en [`modelo-de-negocio/PLAN.md`](modelo-de-negocio/PLAN.md).

Última actualización: 10/11/2026.

## Hecho el 10/11 (en `dev`, falta pasar a `main`)

Todo entró a `dev` por PR (front #40 a #48, back #17 a #20). **Antes del pase `dev` → `main` hay que correr en Neon main, en orden, las migraciones `011` a `019`** (en Neon dev están hasta la `018`; la `019` falta también en dev):

| Migración | Qué hace |
|---|---|
| `011-vehiculo-con-vendedor.sql` | Toda publicación tiene vendedor (`usuario_id NOT NULL`); los autos sin dueño pasan a `vendedor-demo@autocar.test` |
| `012-favoritos.sql` | Tabla `favorito` |
| `013-marcas-y-modelos.sql` | Tablas `marca` y `modelo` (62 marcas, ~1.080 modelos del scraper) y clave foránea `vehiculo (marca, modelo)` |
| `014-foto-de-perfil.sql` | Tabla `usuario_foto` |
| `015-contacto-y-reportes.sql` | Tablas `contacto` y `reporte` |
| `016-roles-del-equipo.sql` | El admin sin los permisos del mecánico |
| `017-modelos-nuevos.sql` | 7 marcas y 46 modelos más para Publicar (solo agrega) |
| `018-inspeccion-no-realizada.sql` | Estado `no_realizada` de una inspección (el mecánico fue y no la pudo hacer) |
| `019-marca-unica.sql` | La base no acepta la misma marca escrita distinto ("DS" y "Ds") |

- [x] **El panel solo modera y da de baja:** se sacan crear y editar vehículos (back `POST`/`PUT /api/admin/vehiculos` → 405; front sin `admin-vehiculo.html`). Si algo está mal, el moderador rechaza con motivo y corrige el dueño.
- [x] **Vendedor obligatorio** en toda publicación (la base lo exige).
- [x] **Marcas y modelos en la base:** `GET /api/marcas-modelos`; Publicar ya no tiene la lista fija; el back responde 422 y la base rechaza una marca o modelo que no está ("Pepita 21021").
- [x] **Favoritos reales:** `GET/PUT/DELETE /api/favoritos`, botón en el detalle y `favoritos.html` con datos reales (una sola lista; sin las listas de ejemplo).
- [x] **Detalle del vehículo:** vendedor (nombre, foto y desde cuándo, sin el email), versión, estado general y ubicación.
- [x] **Editar perfil:** nombre (`PUT /api/me`) y foto de perfil opcional, que se cambia tocándola (`POST`/`DELETE /api/me/foto`). Se ve en Mi cuenta, en el detalle y en el chat.
- [x] **Fotos de cualquier tamaño:** se achican en el navegador antes de subirlas (perfil 512 px, publicaciones 1600 px). El back sigue con 2 MB.
- [x] **Mandale un mecánico solo desde un auto:** sin `?url=` no se puede pedir (el link siempre llega fijo). Se sacó "Mandale un mecánico a otro auto" y "Elegir" del ranking.
- [x] **Mi cuenta con cantidades reales** de favoritos y publicaciones (antes "4 vehículos en 2 listas" y "2 activas" fijos).
- [x] **Metabuscador conectado** a la API, sin datos de ejemplo y sin "Completar con IA".
- [x] **Chat:** solo la foto de la persona (o su inicial), en círculo.
- [x] **Roles:** el equipo (admin, moderador) y los talleres no compran ni venden (back 403 con el guard `usuario`); nadie modera su propia publicación; el admin ya no ve "Mi taller". La barra de arriba cambia según el rol (back #24, front #55).
- [x] **Middleware** (`src/Core/Middleware.php`): los guards de las rutas, antes del controlador (back #22).
- [x] **Fotos en el catálogo:** se mostraban en gris porque se leía el campo viejo `imagen_url` (#55).
- [x] **Ganancias de las inspecciones** en Estadísticas (pago simulado): ganancia de AutoCar, facturado, mecánicos, fondo y retenido (back #28, front #60).
- [ ] **Pantalla de roles y permisos** para el admin (hoy los permisos de cada rol se cambian en la base).
- [x] **Scraper:** `diario.bat` con 1 GB de memoria (la corrida completa de MercadoLibre, ~80.000 autos, se quedaba sin memoria al guardar).
- [ ] **Probar todo junto en dev** (front de dev + `autocarbackend-dev`). Ojo: el servicio de Render dev estaba desplegando `main`; ya se pasó a `dev`.

## Entrega 4

- [x] ~~**Aprobar el PR #20 (`dev` → `main`)**~~: mergeado. Después entraron a producción el #33 (la raíz redirige a `/front/`) y el #37 (chat, formularios de maqueta, botones de Mi taller y huella oculta). Producción verificada: humo 15/15 en Chromium, Firefox y WebKit.
- [x] ~~**Tag `Entrega_4`**~~ en los dos repos, sobre `main` (mismo formato que `Entrega_1` a `Entrega_3`): front `fdc93ed`, back `fa40a54`.
- [x] ~~**Documento de seguridad por capa**~~: [`Entrega_4/seguridad-por-capa.md`](Entrega_4/seguridad-por-capa.md). Quedan sus pendientes (§ 6): rate limiting, usuario de Neon con privilegios mínimos, concurrencia al moderar.
- [x] ~~**Validación W3C y accesibilidad**~~: 41 páginas sin errores y 0 violaciones de WCAG A/AA, en [`Entrega_4/validacion-w3c-y-accesibilidad.md`](Entrega_4/validacion-w3c-y-accesibilidad.md).
- [x] ~~**E2E en Firefox y WebKit**~~: `playwright.config.js` corre los tres navegadores y el workflow los instala. Inspecciones pasó en los tres (local) y humo en los tres (producción).

## Front: pantallas que siguen siendo maqueta

- [x] ~~**Metabuscador**~~: conectado el 10/11 (ver arriba).
- [x] ~~**Portada**~~: muestra los últimos 4 publicados de verdad (#52).
- [x] ~~**Contacto**~~: `POST /api/contacto` y "Reportes y contacto" en el panel (back #21, front #51).
- [x] ~~**Reportar publicación / usuario**~~: `POST /api/reportes`, desde el detalle y desde el chat; los revisa el moderador (back #21, front #51).
- [ ] **Canje** (`proponer-canje.html`, `propuestas.html`): maqueta.
- [x] ~~**Tasación con IA**~~: se sacó (no se va a hacer). En su lugar, el detalle muestra el comparador de precio (#50, #52).
- [x] ~~**Chat**~~ conectado a la API: bandeja con no leídos, conversación con polling cada 5 s y "Consultar" en `vehiculo.html`. Prueba E2E en `tests/e2e/chat.spec.js` (necesita los secretos `E2E_CHAT_*`).
- [ ] **Secretos de E2E en GitHub** (Settings → Secrets → Actions), con cuentas de **dev**: `E2E_ADMIN_EMAIL` y `E2E_ADMIN_PASSWORD`; `E2E_CHAT_VEHICULO_ID`, `E2E_CHAT_VENDEDOR_EMAIL` y `E2E_CHAT_VENDEDOR_PASSWORD` (una publicación disponible en Neon dev y la cuenta de su vendedor).
- [ ] **Planes** (`planes.html`, `plan.html`): maqueta, depende de las suscripciones (abajo).
- [x] ~~**Formularios con `action` a rutas que no existen**~~: ahora llevan `data-proximamente` y `js/proximamente.js` avisa "todavía no está disponible" sin enviar nada (cuenta, contacto, plan, reportar, meta-búsqueda nueva, canje, propuestas, favoritos y verificar-vehículo). Al conectar una pantalla a la API, se le saca el atributo y el script. El chat se conecta aparte.

## Suscripciones y pagos (no hay nada hecho)

Hoy no hay tabla de suscripciones ni cobros: los planes son de muestra y las inspecciones tienen el pago **simulado** (queda `retenido`).

- [ ] **Plan Plus del comprador con Mercado Pago (sandbox)**: $ 5.000 por 30 días, sin renovación automática. Pago con tarjetas de prueba por la API REST (sin SDK) y webhook al back que activa el plan.
- [ ] **Tabla `suscripcion`** en Neon (usuario, plan, desde, hasta, estado, id de pago de MP), como migración numerada nueva y en `schema.sql`.
- [ ] **Beneficio real del Plus**: el plan gratis con 1 búsqueda guardada y el Plus sin límite (hoy el máximo es 20 para todos, `Busqueda::MAXIMO_POR_USUARIO`).
- [ ] **Decidir si las inspecciones se cobran con Mercado Pago** o quedan simuladas para la entrega (repartir la plata al mecánico es más complejo).

## Datos y scraper

- [ ] **Inspección de un auto que juntó el scraper**: hoy el back acepta cualquier link de MercadoLibre, Kavak, Autocosmos o AutoCar (controla el dominio, no que el auto exista). Cuando haya autos en Firestore: si el link coincide con uno scrapeado, marcar el pedido como "auto verificado en nuestro buscador" y completar solos título, año, km y precio; si no coincide, aceptarlo igual sin la marca.

- [x] ~~**Cargar los autos del scraper en Firestore dev**~~ (10/11): corridas completas de MercadoLibre (86.395 autos, 958 modelos), Autocosmos (4.750) y Kavak (1.330); comparador con 1.073 modelos. Probado en dev: comparador y metabuscador con datos reales. Arreglos que salieron con datos de este tamaño: commits de Firestore por tamaño (back #26), autos mal cargados que no arruinan la corrida (back #27), `diario.bat` con 1 GB (back #18), etiquetas del metabuscador (front #58).
- [ ] **Prod (Firestore `autocar-9897d` y Neon main): se carga TODO JUNTO en el pase `dev` → `main`**, no antes. Orden: migraciones `011`–`019` en Neon main → merge `dev` → `main` → cargar Firestore prod con todas las corridas completas desde la del 10/11 → verificar.
- [x] **Marcas con un solo nombre** (10/11 noche): "DS"/"Ds"/"D.S.", "Citroën"/"Citroen", "KIA"/"Kia"... salen como una sola marca en el metabuscador (back #29), "DS3" y "DS 3" son el mismo modelo (back #32, Firestore dev ya corregido) y la base no acepta una marca repetida con otra escritura (back #31, migración 019).
- [x] **Marcas que no están en el catálogo** (back #33): el importador no carga esos autos y lo avisa en la salida; `php bin/importar-autos.php --revisar-marcas archivo.json` los lista con su link para ver si es una marca nueva o un error del que publicó. Lee el catálogo de `MARCAS_URL` (la API del back de cada entorno).
- [x] **Inspección que no se pudo hacer** (back #30, front #63, migración 018): si el vendedor no deja revisar el auto, el mecánico la marca con el motivo y se le devuelve todo al comprador.
- [x] **Resultados del metabuscador en celular** (front #62): los botones de cada auto bajan debajo del texto.
- [ ] **Corrida diaria** del scraper (`diario.bat` en la PC a las 9:00 o GitHub Actions).
- [ ] **Ranking de mecánicos con números en dev**: `php bin/demo-historial.php` contra Neon dev.

## Presentación y defensa

- [ ] **Ensayar la demo** con el guion (N4).
- [ ] **Confirmar la fecha de la entrega final** (16/11 o la semana del 23/11; defensa el 30/11).
