# Plan de trabajo: el mecánico que firma

**Actualizado el 08/11/2026.** Este archivo es el plan de todo el grupo hasta la defensa del **30/11**: qué vamos a hacer, qué ya está, qué falta, quién lo hace y en qué orden. El modelo de negocio completo (por qué, quién gana y cómo se sustenta) está en el [README](README.md).

---

## 1. Qué cambió y por qué

El profe respondió la presentación v3 (el 07/11 a la noche):

| Lo que teníamos | Lo que dijo el profe |
|---|---|
| 01 "¿Pago un precio justo?" como eje | MercadoLibre ya muestra **precios de referencia**: no nos diferencia |
| 02 "¿Está bien de verdad?" | Sí, eso va |
| 03 "¿Papeles limpios?" | No le cierra: ¿cómo lo consultamos y cómo lo integramos? |
| Visión "referencia de precio justo" | ¿Es siempre solo para usados? |
| Metabuscador | En la PPT no queda claro |

**Su propuesta, que pasa a ser nuestro punto 1:** aprovechar el **mecánico que firma**. Kavak, CarOne y Flash revisan los autos, pero el que revisa es el mismo que vende o el que te quiere comprar, son inspectores anónimos y nadie responde si se equivocan. Ese es el hueco que no cubre nadie.

**Y que enganchemos el metabuscador con el mecánico:** cada auto, sea del sitio que sea, tiene el botón **"Mandale un mecánico"**. Según él, la búsqueda y las alertas ya las tenemos; falta el botón y conectarlo con la inspección.

También nos dejó pensar los **planes** y la **sustentabilidad**. Están en el README, en "Cómo se sustenta".

## 2. El producto en 30 segundos

> El comprador encuentra un auto en cualquier lado (MercadoLibre, Kavak, Autocosmos o AutoCar), pega el link en AutoCar o toca **"Mandale un mecánico"** en el metabuscador, y elige un mecánico de la zona por su ranking. El vendedor no puede elegirlo. El mecánico lo revisa con un checklist y **firma el informe con su nombre**. Si se le pasó algo que se veía, AutoCar le devuelve la plata al comprador, le paga una compensación y el mecánico baja en el ranking. El comprador paga la inspección: AutoCar se queda una parte y el resto es para el mecánico. Se arranca con 5 talleres de Mercedes y Luján, sin necesitar autos publicados.

**Cómo gana AutoCar:** una parte de cada inspección, desde el primer día. Después, la comisión de los talleres por los arreglos y el plan Plus. Las cuentas están en el README.

## 3. La demo del 30/11 (lo que tiene que funcionar sí o sí)

Todo lo que no sirva para esta demo va después.

1. **Comprador:** entra al metabuscador, ve una búsqueda guardada con autos de **MercadoLibre, Kavak y AutoCar** juntos y un aviso de "bajó de precio".
2. Toca **"Mandale un mecánico"** en un auto de MercadoLibre: se abre el pedido con el link ya cargado.
3. Ve los mecánicos de Mercedes y Luján con su **ranking**, elige uno y ve el desglose: $ 130.000 → $ 100.000 al mecánico y $ 30.000 a AutoCar (con el fondo de garantía). Confirma; el pago es simulado.
4. **Mecánico:** entra con su usuario, ve el pedido, lo acepta, completa el **checklist** y **firma**.
5. **Comprador:** ve el informe firmado, con el nombre del mecánico y la huella. El informe ya no se puede cambiar.
6. El comprador **reclama** ("tenía un golpe en el zócalo y no lo marcó") y el **admin** decide que procede: devolución + compensación, y el mecánico **baja en el ranking** en vivo.
7. Cierre: "Kavak te muestra solo su stock y MercadoLibre solo sus avisos. Nosotros te mostramos todo y además te lo revisa alguien que elegiste vos y que responde".

## 4. Qué ya está hecho

| Pieza | Dónde | Estado |
|---|---|---|
| Usuarios, sesión con cookie + CSRF, roles y permisos, **incluido el rol `mecanico`** con `verificaciones.ver` y `verificaciones.realizar` | back `dev` y `main` | ✅ Funciona. El rol mecánico todavía no tiene endpoints |
| Catálogo, detalle, publicar con fotos, moderación, chat, métricas de admin | back `dev` y `main` | ✅ |
| **Publicar por partes** (lo pidió el profe el 09/11): con marca, modelo y año ya se guarda, se completa después (Guardar y salir / Continuar), y el moderador no puede aprobar una incompleta (front, back con 409 `incompleta` y `CHECK` en la base). `publicar.html` y `mis-publicaciones.html` conectados. Migración `010-publicar-por-partes.sql` | back `dev` y `main`, front `dev` | ✅ (front a `main` en el PR #20) |
| **Adherí tu taller:** el taller pide sumarse con una cuenta aparte (otro email, sin sesión) y un admin lo aprueba (recién ahí puede ingresar y entra al ranking) o lo rechaza con motivo. `talleres-adherirse.html` y `admin-talleres.html`. Migración `009-solicitud-taller.sql` | back `dev` y `main`, front `dev` | ✅ (front a `main` en el PR #20) |
| **Firestore** (Firebase, plan gratis Spark): conectado en Render dev y prod desde el 09/11 | Render | 🟡 Conectado; falta cargar los autos del scraper |
| Pruebas PHPUnit (unitarias + integración) y CI | back `dev` | ✅ |
| **Metabuscador de Taro:** búsquedas guardadas, avisos (nuevo / bajó / subió / reservado / retirado), reporte de mercado y detalle de un auto externo (`/api/meta-busquedas...`, `/api/autos-externos?id=`). **Guarda en Firestore (NoSQL)** desde el 08/11 (PR #3 del back) | back `dev` (viene de la rama `scraper`) | ✅ Back hecho; importa cualquier fuente, probado con ML + Kavak + Autocosmos |
| **Recolectores** de MercadoLibre, Kavak y Autocosmos con curl, en la PC (`recolectores/diario.bat`) | back `dev` | ✅ Probados con datos reales (6.082 autos) |
| **Comparador de precio** (`GET /api/vehiculos/{id}/comparacion`) | back `dev` | ✅ Back hecho. Pasa a ser un **dato** en el informe y el metabuscador |
| **Base de las inspecciones:** tablas `taller`, `inspeccion`, `inspeccion_item` y `reclamo` (`schema.sql` + `006-inspecciones.sql`), permiso `reclamos.resolver`, datos de demo (5 talleres de Mercedes y Luján) y las reglas de negocio como funciones puras (`src/Inspecciones/`: `Fuente`, `Precio`, `Checklist`, `Huella`, `Estados`, `Ranking`) con 20 pruebas unitarias. Explicado en `docs/inspecciones.md` del back | back `dev` | ✅ Base y reglas hechas (B1, B10 y las unitarias de B9). Endpoints B2–B8 en `dev` desde el 08/11 (PR #2 del back) |
| Maquetas: `talleres.html`, `taller.html`, `taller-verificacion.html` (checklist), `verificacion.html`, `verificar-vehiculo.html`, `meta-busqueda*.html` | front `dev` | 🟡 Solo HTML/CSS, sin API. Se reusan |

**El 08/11 se pasaron `feat/inspecciones` y `feat/comparador` (con la rama `scraper` de Taro) a `dev` del back**, con el CI en verde (unitarias + integración) y Render dev ya desplegado. `main` del back todavía no los tiene: va en el próximo `dev` → `main`.

**Migraciones (numeradas desde el 08/11, PR #4 del back):** en `AutoCarBackend/database/` cada archivo lleva el orden en que se corre: `001-e4` … `005-roles`, `006-inspecciones`, `007-demo-inspecciones-solo-dev` (solo en Neon dev), `008-separar-version`, `009-solicitud-taller` y `010-publicar-por-partes`. **Al 09/11 están todas corridas en Neon dev y main** (la 007 solo en dev). La próxima es `011-...`. **`migracion-meta-busqueda.sql` ya no existe:** el metabuscador no usa tablas de Neon.

**Cómo se adaptó la rama `scraper` de Taro:** `feat/comparador` (ya en `dev`) sale de su último commit ("meta buscador"), así que tiene todo lo suyo, y su lógica (comparables, novedades, destacados, reporte) quedó igual. Lo que se sumó encima:
- **Recolectores con curl** de MercadoLibre, Kavak y Autocosmos (`recolectores/`), que corren en la PC con `diario.bat` y escriben todos el mismo formato común. El de Kavak con curl (`kavak/recolectar.php` + `ExtractorHtml.php`) reemplaza en la práctica a su `kavak/scraper.php` con Playwright, que queda como alternativa; los dos usan su `Normalizador.php`.
- **El comparador** (`src/Comparador/`) reusa su `Estadistica` (mediana) y su `Normalizador` de Kavak, y guarda un documento por modelo en Firestore (o en archivos en local).
- **08/11 (PR #3 del back): su metabuscador pasó a NoSQL (decisión D4).** Las 6 tablas (`auto_externo`, `busqueda_guardada`, `coincidencia`...) salieron de Neon; ahora son documentos en Firestore: `mercado/{modelo}` con los autos y su historial, `busquedas/{usuario}` y `avisos/{usuario}`. El `Importador` ya carga MercadoLibre, Kavak y Autocosmos (M1 del lado del back). Cambio para el front: el id de un auto externo es texto y el detalle es `GET /api/autos-externos?id=...`. Detalle en `docs/arquitectura-scraper.md` del back, sección 6.

## 5. Qué falta: las tareas

Prioridades: **P1** = imprescindible para la demo del 30/11. **P2** = si llegamos. **P3** = va en la presentación como fase 2 y no se programa ahora.

### 5.1 Back: inspecciones (ramas desde `dev`)

La base ya está en `dev`: B1, B10 y las pruebas unitarias de B9 (ver la sección 4 y `docs/inspecciones.md` del back). Lo que sigue son los endpoints, que usan esas reglas: se pueden seguir en `feat/inspecciones` o en una rama por tarea (`feat/inspecciones-pedido`, `feat/inspecciones-firma`...), siempre desde `dev` y con PR.

| ID | Tarea | Prioridad | Depende de |
|---|---|---|---|
| B1 | ✅ **Migración** `database/006-inspecciones.sql` (y lo mismo en `schema.sql`): tablas `taller`, `inspeccion`, `inspeccion_item` y `reclamo`, y el permiso nuevo `reclamos.resolver` para el moderador y el admin. Ver la sección 6 | P1 | — |
| B2 | ✅ **Perfil del taller** del mecánico: `GET/PUT /api/mecanico/perfil` (nombre del taller, dirección, localidad, teléfono, precio de la inspección) | P1 | B1 |
| B3 | ✅ **Ranking público:** `GET /api/mecanicos?localidad=` con puntaje, cantidad de inspecciones firmadas y reclamos que procedieron. Lo usa el pedido y `talleres.html` | P1 | B1 |
| B4 | ✅ **Pedir una inspección por link:** `POST /api/inspecciones` con `url`, `mecanico_id` y datos opcionales del auto. Detecta el sitio por la URL (MercadoLibre, Kavak, Autocosmos, AutoCar u otro). Aplica las reglas de la sección 7 y calcula el desglose del precio | P1 | B2 |
| B5 | ✅ **Mis inspecciones (comprador):** `GET /api/mis-inspecciones`, `GET /api/inspecciones/{id}` (solo la ven el comprador, el mecánico asignado y el admin; si no, 404) y `POST /api/inspecciones/{id}/cancelar` (solo antes de que el mecánico la acepte) | P1 | B4 |
| B6 | ✅ **Bandeja del mecánico:** `GET /api/mecanico/inspecciones?estado=` y `PATCH /api/mecanico/inspecciones/{id}` para aceptar (con fecha) o rechazar (con motivo; al comprador se le devuelve todo) | P1 | B4 |
| B7 | ✅ **Informe y firma:** `PUT /api/mecanico/inspecciones/{id}/informe` guarda el checklist (se puede editar hasta firmar). `POST /api/mecanico/inspecciones/{id}/firma` exige todos los ítems completos y una conclusión. Guarda el nombre del mecánico y del taller, la fecha y la **huella SHA-256** del informe. Después de firmar, cualquier cambio da 409 | P1 | B6 |
| B8 | ✅ **Reclamo:** `POST /api/inspecciones/{id}/reclamo` (comprador, hasta 15 días después de la firma, uno por inspección). Admin: `GET /api/admin/reclamos?estado=abierto` y `PATCH /api/admin/reclamos/{id}` para decidir si procede (con la compensación hasta el tope) o no. Si procede, el pago queda "reembolsado" y el ranking se recalcula | P1 | B7 |
| B9 | ✅ **Pruebas:** unitarias (detectar el sitio por la URL, validar el checklist, calcular el desglose, calcular el ranking) y de integración (el flujo completo de la demo, el vendedor no puede pedir la inspección de su propio auto, el informe firmado no se puede cambiar, otro usuario recibe 404) | P1 | B4–B8 |
| B10 | ✅ (el historial de inspecciones firmadas, con `bin/demo-historial.php`: PR #7 del back) **Datos de demo:** script `database/007-demo-inspecciones-solo-dev.sql`, solo para `dev`, con 5 talleres de Mercedes y Luján **marcados como demo** e inspecciones firmadas de ejemplo para que el ranking tenga números | P1 | B1 |
| B11 | ✅ README del back: endpoints nuevos y reglas de negocio | P1 | B4–B8 |

### 5.2 Back: metabuscador con todas las fuentes (ramas desde `dev`)

| ID | Tarea | Prioridad | Depende de |
|---|---|---|---|
| M1 | Hacer que el `Importador` de Taro también cargue la salida de los recolectores de **MercadoLibre y Autocosmos** (usan el mismo formato común; verificarlo con un archivo real) | P1 | — |
| M2 | Que los resultados del metabuscador traigan **los autos de AutoCar primero** y la **URL original** de cada auto, que es lo que necesita el botón | P1 | M1 |
| M3 | Agregar a cada resultado la etiqueta del comparador (Buen precio / En precio / Caro) como **dato** | P2 | M1 |
| M4 | Programar la corrida diaria a las 9:00 en la PC (`diario.bat` → recolectar → importar) | P2 | M1 |
| M5 | ✅ Pasar `feat/comparador` a `dev`. Hecho el 08/11, antes de M1 y M2, para que todos trabajen sobre lo mismo | P1 | — |

### 5.3 Front (rama `feat/inspecciones` en el repo del front)

| ID | Pantalla | Prioridad | Usa |
|---|---|---|---|
| F1 | 🟡 Hecho en `vehiculo.html`; falta en el metabuscador (va con M2). **Botón "Mandale un mecánico"** en `vehiculo.html` (autos de AutoCar) y en cada resultado de `meta-busqueda-resultados.html`. Lleva a `pedir-inspeccion.html?url=...` con los datos del auto | P1 | — |
| F2 | ✅ **`pedir-inspeccion.html`** (nueva): pegar el link (o venir ya cargado), datos del auto, lista de mecánicos por localidad con ranking, desglose del precio y confirmar | P1 | B3, B4 |
| F3 | ✅ **`mis-inspecciones.html`** (nueva): lista con el estado de cada inspección, el informe firmado y el botón **Reclamar** dentro de los 15 días. Se puede rehacer `verificacion.html` | P1 | B5, B8 |
| F4 | ✅ **Panel del mecánico:** perfil del taller, bandeja (aceptar o rechazar) y **checklist + firmar**, reusando la maqueta `taller-verificacion.html` | P1 | B2, B6, B7 |
| F5 | ✅ **`admin-reclamos.html`** (nueva): cola de reclamos con "Procede / No procede", compensación y respuesta | P1 | B8 |
| F6 | ✅ `talleres.html` con el ranking real (sacar los datos de ejemplo y el "plan Oro") | P2 | B3 |
| F7 | Metabuscador conectado: búsquedas guardadas, resultados y avisos de "nuevo / bajó" | P1 | M2 |
| F8 | ✅ Sumar las pantallas nuevas a `rutas.js` y a la barra de navegación según los permisos (`sesion.puede(...)`) | P1 | F2–F5 |
| F9 | ✅ `tests/e2e/inspecciones.spec.js`: pasa en Chromium, Firefox y WebKit. Pruebas E2E con Playwright del flujo de la demo (contra `dev`) | P2 | F1–F5 |

### 5.4 Negocio y presentación

| ID | Tarea | Prioridad |
|---|---|---|
| N1 | PPT v4 y README con el eje nuevo | ✅ Hecho (esta rama) |
| N2 | ⚪ **Opcional (validación para un caso real).** Es un proyecto: los números de D1 y el alcance son supuestos y la demo usa datos de prueba. El guion (`entrevista-talleres.md`) queda como **cómo los validaríamos** con 2 o 3 talleres reales (precio, ~23 % para AutoCar, compensación) y sirve para responder en la defensa de dónde salen los números | P3 |
| N3 | ✅ Escribir el **alcance de la inspección** ("qué se considera que se veía") para mostrarlo antes de pagar. Base: la sección 7 | P1 |
| N4 | 🟡 Guion listo (`guion-demo.md`); falta ensayar. Ensayar la demo de la sección 3 con los datos de demo | P1 |

### 5.5 Fase 2: va en la presentación, no se programa ahora (P3)

Detalle en `AutoCar/ideas-costo-total-y-fallas.txt` (lo que nos dijo el profe antes).

- **Idea B, fallas típicas por modelo:** se juntan de internet, las confirman los mecánicos y las miden las inspecciones. Además, ordenan el checklist del mecánico.
- **Idea A, costo total con 3 presupuestos:** cada arreglo que marca el mecánico se presupuesta en 3 talleres de la red. **El mecánico que revisó no presupuesta lo que encontró.** El taller paga un 6 %.
- Informe para vender: lo paga el vendedor y el mecánico lo asigna AutoCar.
- Plan Plus, Mercado Pago real y más ciudades.

## 6. Modelo de datos propuesto (B1)

```
usuario (rol mecanico) 1──1 taller
usuario (comprador)    1──N inspeccion N──1 usuario (mecánico)
inspeccion             1──N inspeccion_item
inspeccion             1──0..1 reclamo
inspeccion             N──0..1 vehiculo   (solo si el auto es de AutoCar)
```

| Tabla | Columnas principales |
|---|---|
| `taller` | `usuario_id` (PK y FK a usuario, el mecánico), `nombre`, `direccion`, `localidad`, `telefono`, `precio_inspeccion`, `activo`, `demo` |
| `inspeccion` | `id`, `comprador_id`, `mecanico_id`, `vehiculo_id` (NULL si es de otro sitio), `url`, `fuente` (`mercadolibre`, `kavak`, `autocosmos`, `autocar` u `otro`), `titulo`, `anio`, `kilometraje`, `precio_publicado`, `localidad`, `estado` (`pedida`, `aceptada`, `rechazada`, `cancelada` o `firmada`), `fecha_turno`, `motivo_rechazo`, `precio`, `monto_mecanico`, `monto_autocar`, `monto_fondo`, `pago` (`retenido`, `liberado` o `reembolsado`), `conclusion` (`recomendable`, `con_reparos` o `no_recomendable`), `resumen`, `firmado_por`, `taller_firma`, `firmada_at`, `huella`, `created_at` y `updated_at` |
| `inspeccion_item` | `inspeccion_id`, `codigo`, `resultado` (`ok`, `observado` o `falla`), `nota`. PK (`inspeccion_id`, `codigo`) |
| `reclamo` | `id`, `inspeccion_id` (único), `item_codigo`, `descripcion`, `estado` (`abierto`, `procede` o `no_procede`), `compensacion`, `respuesta`, `resuelto_por`, `created_at` y `resuelto_at` |

**Checklist (los mismos códigos en el back y en el front):** `carroceria` (pintura y golpes), `estructura` (chasis y largueros, choques), `motor` (pérdidas y ruidos), `transmision` (caja y embrague), `frenos`, `suspension` (tren delantero y amortiguadores), `neumaticos`, `electricidad` (tablero, luces y testigos), `kilometraje` (desgaste coherente con los km), `identificacion` (motor y chasis coinciden con la cédula).

## 7. Reglas de negocio (las que se programan y se prueban)

| Regla | Dónde se programa |
|---|---|
| El comprador elige al mecánico. Si el link es de un auto de AutoCar y quien pide la inspección es el dueño de la publicación → **409 `vehiculo_propio`** | B4 |
| El mecánico no puede inspeccionar su propio auto ni un auto que publicó él → 409 | B4 |
| Solo se pueden elegir mecánicos activos y con el perfil del taller completo → si no, 422 | B4 |
| Precio: el del taller. Para el mecánico el **77 %** y para AutoCar el **23 %**, de los cuales **un tercio va al fondo de garantía** (con $ 130.000: $ 100.000, $ 30.000 y $ 10.000) | B4 (una función pura, con prueba) |
| Estados: `pedida` → `aceptada` → `firmada`. Desde `pedida` puede pasar a `rechazada` (por el mecánico) o `cancelada` (por el comprador), y en los dos casos el pago queda `reembolsado` | B5, B6 |
| Se firma solo con los 10 ítems completos y una conclusión. Al firmar, el pago pasa a `liberado` | B7 |
| El informe firmado no se puede cambiar (409). La huella es el SHA-256 del informe (ítems, conclusión, resumen, mecánico y fecha) | B7 |
| El comprador puede reclamar hasta **15 días** después de la firma, una sola vez por inspección | B8 |
| Si el reclamo procede: el pago queda `reembolsado` y la **compensación tiene un tope de 3 veces el precio** (si se pide más, 422) | B8 |
| **Ranking:** puntaje = 5 × (1 − 2 × reclamos que procedieron ÷ inspecciones firmadas), con mínimo 0. Con menos de 3 inspecciones firmadas se muestra "Nuevo en la red" en lugar del puntaje. Orden: puntaje y después cantidad de inspecciones. **No depende de ningún pago** | B3 (una función pura, con prueba) |
| Mercado Pago no se integra: el pago es **simulado** y se guarda el desglose. En pantalla se aclara | B4 |

### 7.1 Alcance de la inspección (N3)

Se muestra en `pedir-inspeccion.html` antes de confirmar (con una casilla obligatoria) y en el formulario de reclamo. El texto está en `front/js/servicios/inspecciones.js` (`ALCANCE`).

- **Revisa, sin desarmar el auto:** los 10 ítems del checklist (sección 6).
- **No cubre:** lo que sólo se ve desarmando (interior del motor o de la caja); fallas intermitentes que no aparecen el día de la revisión; lo que se rompa o se desgaste después; los papeles (deudas, multas, prendas, inhibiciones: se le dice al comprador qué trámites pedir); si el precio del aviso es justo.
- **El reclamo procede** si el problema ya estaba el día de la revisión y se podía ver con el checklist. 15 días desde la firma, un reclamo por inspección, devolución + compensación de hasta 3 veces el precio.

Es un supuesto; en un caso real se validaría con talleres (N2, opcional).

## 8. Calendario

| Hasta | Qué tiene que estar |
|---|---|
| **Lun 09/11** | Presentar la v4 y este plan. Repartir las tareas |
| **Mié 11/11** (entrega semanal) | B1–B7 en `dev`, y F2 y F4 funcionando aunque sean básicas: se puede pedir, aceptar y firmar una inspección. M1 hecho |
| **Mié 18/11** | B8, F3, F5 (reclamo y ranking), F1 (botón en el detalle y en el metabuscador), M2 y F7 (metabuscador con ML + Kavak + AutoCar) |
| **Mié 25/11** | B9, B10 y F9 (pruebas y datos de demo), F6, N3–N4, documentación (README, apuntes, seguridad por capa). **`dev` → `main`** y tag `entrega-final` |
| **Lun 30/11** | Defensa. Despertar Render antes de empezar |

## 9. Reparto (propuesta para charlar el lunes)

Cada uno tiene que poder explicar todo en la defensa, pero conviene que cada parte tenga un responsable.

| Parte | Propuesta | Por qué |
|---|---|---|
| Back de inspecciones (B1–B11) | Mateo + Justi | Es lo más grande. Uno hace B1–B5 y el otro B6–B8 |
| Metabuscador con todas las fuentes (M1–M5) | Taro + Mateo | Taro hizo el metabuscador y Mateo los recolectores |
| Front de inspecciones (F1–F5, F8) | Fede + Justi | Fede ya conectó las pantallas de admin |
| Front del metabuscador (F6, F7) | Taro | Va junto con M2 |
| Alcance (N3) y ensayo de la demo (N4) | Todos | Es lo que más pesa en la defensa del modelo. Las entrevistas a talleres (N2) son opcionales |

## 10. Decisiones (cerradas el 08/11)

| # | Decisión | Qué se decidió |
|---|---|---|
| D1 | Precio de la inspección y reparto | $ 130.000 (77 % para el mecánico, 23 % para AutoCar). Supuesto; se validaría con talleres reales (N2, opcional) |
| D2 | Plazo para reclamar | 15 días |
| D3 | Tope de la compensación | 3 veces el precio de la inspección |
| D4 | ¿El metabuscador sigue en **Neon** o todo lo del scraper pasa a **Firestore**? | **Todo a Firestore (NoSQL)**, como sugirió el profe: comparador y metabuscador. Hecho el 08/11 (PR #3 del back). Neon queda para lo nuestro: usuarios, vehículos, chat, sesiones e inspecciones. Falta crear el proyecto de Firebase |
| D5 | ¿Quién resuelve los reclamos? | El moderador y el admin (permiso `reclamos.resolver`) |

## 11. Qué dejamos de lado (y por qué)

- **El comparador como eje:** sigue, pero como dato. MercadoLibre ya muestra precios de referencia.
- **La garantía de 7 días con pago retenido:** la reemplaza la garantía del mecánico, que funciona aunque la venta no pase por AutoCar.
- **Los papeles incluidos en el precio:** no hay una API pública del Registro. El mecánico verifica motor y chasis contra la cédula, y le decimos al comprador qué trámites pedir.
- **La comisión por venta y el destacado por subasta:** no hacen falta para arrancar. Quedan para más adelante.
- **El canje:** queda lo que ya está y no se invierte más tiempo.

## 12. Cuándo una tarea está terminada

- Funciona en `dev` (back en Render dev y front en el Preview de Vercel), no solo en local.
- Tiene pruebas, si es del back.
- Los errores responden JSON con el código correcto.
- Las reglas de la sección 7 que le corresponden tienen su prueba.
- El README del back lista los endpoints nuevos.
- Cumple las convenciones de siempre: castellano, BEM, sin `innerHTML` y sin dependencias de terceros.
