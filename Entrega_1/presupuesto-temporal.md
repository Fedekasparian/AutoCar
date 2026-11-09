# Presupuesto temporal

**Proyecto:** Permutá · **Entrega 1 · 31/08/2026**
Bernal Justino · Marino Lautaro · Kasparian Federico

---

## 1. Marco temporal

| Parámetro | Valor |
|---|---|
| Inicio del proyecto | Lunes 24/08/2026 |
| Cierre estimado (exposición final) | Semana del 23/11/2026 |
| Duración | **13 semanas** |
| Integrantes | 3 |
| Capacidad planificada | 10 h/semana por persona → **30 h/semana de equipo** |
| Capacidad total del proyecto | **390 h** |
| Esfuerzo comprometido | **365 h** (94 % de la capacidad) |

Las cuatro fechas de entrega de la consigna caen **todas en lunes**, así que el cronograma se organiza en semanas cerradas de lunes a domingo, con la entrega el lunes que abre la semana siguiente.

> La capacidad de 10 h/semana por persona es un promedio. Las semanas previas a una entrega van a rondar las 13–14 h y las posteriores 6–7 h. Planificar con el promedio y no con el pico es lo que evita que el pico se vuelva la norma.

---

## 2. Hitos

| Hito | Entrega | Fecha | Semanas | Capacidad | Esfuerzo | Holgura |
|---|---|---|---|---:|---:|---:|
| **H1** | 1ra entrega | 31/08/2026 | S1 | 30 h | 20 h | 10 h |
| **H2** | 2da entrega | 14/09/2026 | S2–S3 | 60 h | 56 h | 4 h |
| **H3** | 3ra entrega | 19/10/2026 | S4–S8 | 150 h | 148 h | **2 h** |
| **H4** | 4ta entrega | 09/11/2026 | S9–S11 | 90 h | 85 h | 5 h |
| **H5** | Entrega final | semana del 23/11 | S12–S13 | 60 h | 56 h | 4 h |
| | | | **13** | **390 h** | **365 h** | **25 h** |

**H3 es el hito crítico:** 148 h sobre 150 disponibles, sin margen. Es el único que exige un despliegue funcional end-to-end desde cero, y cualquier atraso se propaga a H4. Las palancas de recorte están identificadas en la sección 5.

---

## 3. Cronograma semanal

```
              ago            septiembre           octubre            noviembre
        S1 │ S2  S3 │ S4  S5  S6  S7  S8 │ S9  S10 S11 │ S12 S13
        24 │ 31  07 │ 14  21  28  05  12 │ 19  26  02  │ 09  16
───────────┼────────┼───────────────────┼─────────────┼──────────
A Diseño   ████ ███ ██
B Infra     ██      ███ █
C Auth                  ███ █
D Publicac.                 ███ ███ ██        █
E Búsqueda                          ███ ██
F Mapa                                        ███ █
G Canje                                 ██ ██ ██
H Chat                                            ███ ██
I Tasación                                                ███ ██
K Ayuda                                            █
L Admin                                                     ██
M Calidad   ▒    ▒         ▒   ▒   ▒   ▒    ▒   ▒   ▒    ▒   ▒
N Exposic.                                                   ███
───────────┼────────┼───────────────────┼─────────────┼──────────
HITOS      ▲E1     ▲E2                 ▲E3           ▲E4     ▲FINAL
           31/8    14/9                19/10         9/11    ~23/11
```

### S1 · 24–30 ago → **Entrega 1 (31/8)** — 20 h

| Tarea | h |
|---|---:|
| A.1 Propuesta general, presupuesto funcional y temporal, sitemap | 14 |
| B.1 Repositorio público, ramas, convención de commits, tag `entrega-1` | 4 |
| M.4 Informe de consideraciones de seguridad — entrega 1 | 2 |

Las 10 h de holgura se adelantan al armado de wireframes.

### S2–S3 · 31 ago – 13 sep → **Entrega 2 (14/9)** — 56 h

| Tarea | h |
|---|---:|
| A.2 Wireframes: home, cada sección y formularios de administración | 20 |
| A.3 Arquitectura de la aplicación y justificación del stack | 10 |
| A.4 Modelo de objetos y modelo de datos | 14 |
| B.2 Esqueleto front-end (adelanto de implementación) | 10 |
| M.4 Informe de seguridad — entrega 2 | 2 |

### S4–S8 · 14 sep – 18 oct → **Entrega 3 (19/10)** — 148 h

Objetivo: **un recorrido completo end-to-end desplegado y accesible por internet** — registrarse, publicar un vehículo, encontrarlo en la búsqueda, abrir su detalle y enviar una propuesta de canje.

| Tarea | h |
|---|---:|
| B.3 Sistema de diseño responsivo | 12 |
| B.4 Back-end, base de datos y estructura REST | 10 |
| B.5 Entorno de despliegue | 6 |
| C.1 Registro | 6 |
| C.2 Login y sesión | 8 |
| C.5 Perfil de usuario | 6 |
| C.6 Roles y autorización | 4 |
| D.1 Modelo de vehículo y catálogo | 8 |
| D.2 Alta de publicación | 12 |
| D.3 Carga de imágenes | 10 |
| D.4 Edición, pausa y baja | 5 |
| D.5 Detalle público de vehículo | 7 |
| E.1 Home / feed con paginación | 8 |
| E.2 Búsqueda y filtros | 12 |
| G.1 Modelo de propuesta de canje | 8 |
| G.2 Flujo de canje: enviar, aceptar, rechazar | 10 |
| M.1 Validación W3C (primera pasada) | 3 |
| M.3 Hardening (primera pasada) | 6 |
| M.4 Informe de seguridad — entrega 3 | 2 |
| M.5 README con requisitos y pasos de deployment | 5 |

### S9–S11 · 19 oct – 8 nov → **Entrega 4 (9/11)** — 85 h

Objetivo: **mapa y comunicación entre usuarios**.

| Tarea | h |
|---|---:|
| F.1 Geocodificación con ofuscación de la ubicación | 8 |
| F.2 Mapa con marcadores y agrupamiento | 12 |
| F.4 Vista lista como *fallback* | 4 |
| G.2 Flujo de canje: contraoferta | 6 |
| G.3 Bandeja de propuestas y notificaciones | 8 |
| H.1 Modelo de conversaciones | 6 |
| H.2 Bandeja y vista de conversación | 8 |
| H.3 Mensajería en tiempo real | 12 |
| D.6 Estados de publicación e historial | 4 |
| K.1 FAQ por categorías | 5 |
| M.2 Pruebas crossbrowser y multipantalla | 4 |
| M.3 Hardening (segunda pasada) | 6 |
| M.4 Informe de seguridad — entrega 4 | 2 |

### S12–S13 · 9–22 nov → **Entrega final (~23/11)** — 56 h

Objetivo: **tasación con IA, moderación y preparación de la exposición**.

| Tarea | h |
|---|---:|
| I.1 Variables de tasación y base de comparables | 6 |
| I.2 Servicio de tasación con caché | 12 |
| I.3 Interfaz de tasación | 6 |
| L.1 Panel de moderación y cola de reportes | 8 |
| M.1 Validación W3C (pasada final) | 2 |
| M.2 Pruebas crossbrowser (pasada final) | 4 |
| N.1 Datos de demostración y guion de la demo | 6 |
| N.2 Presentación audiovisual y ensayo | 12 |

---

## 4. Alcance condicional — 89 h

No comprometido en el cronograma. Se negocia con los docentes en cada entrega, en el orden en que está listado:

| ID | Funcionalidad | h |
|---|---|---:|
| J.1–J.3 | Matching y recomendaciones con IA | 26 |
| K.2 | Asistente LLM de ayuda | 12 |
| C.3, C.4 | Verificación de email y recuperación de contraseña | 10 |
| L.2, L.3 | Gestión de usuarios y ABM de catálogo | 12 |
| F.3 | Filtro por radio y distancia | 6 |
| G.4 | Cierre de operación e historial | 6 |
| H.4 | No leídos, bloqueo y reporte de usuario | 6 |
| E.3 | Ordenamiento, favoritos y búsquedas guardadas | 6 |
| K.3 | Formulario de contacto y reporte | 5 |

---

## 5. Riesgos y palancas de recorte

| Riesgo | Impacto | Mitigación |
|---|---|---|
| La consigna limita las librerías de front-end de terceros y exige consultarlas | Bloquea el mapa (F) y cualquier framework | **Consultar en la primera clase después del 31/8.** Plan A: librería de mapas liviana con tiles de OpenStreetMap. Plan B: mapa propio en SVG/Canvas sobre tiles, con F.4 (vista lista) como salida garantizada |
| El uso de una API de LLM puede no ser aceptado | Cae I, J y K.2 — el corazón diferencial del proyecto | Consultarlo junto con lo anterior. Plan B para la tasación: modelo propio de comparables (media ponderada por año, kilometraje y estado sobre la base cargada), que además es defendible académicamente |
| H3 tiene 2 h de holgura sobre 150 | Un atraso se propaga a H4 | Palancas de recorte, en este orden: reducir filtros de E.2 a marca/modelo/precio; C.5 perfil sólo lectura + edición mínima; D.3 sin optimización de imágenes (sólo validación y límite de tamaño) |
| La mensajería en tiempo real (H.3) puede no funcionar en el hosting elegido | Cae el objetivo de chat | Diseñar la capa de transporte desacoplada y usar *polling* cada pocos segundos como implementación de respaldo |
| No existe un dataset de precios de referencia | La tasación no tiene con qué comparar | Cargar manualmente una base de comparables acotada (5–8 modelos populares, varios años). No hacer scraping: la consigna exige autoría propia y hay implicancias legales |
| La nota es individual pero el trabajo es grupal | Uno explica y otro no | Ver sección 6 |

---

## 6. Organización del equipo

La consigna es explícita: *"si bien se acepta la división de tareas, todos los miembros deben ser capaces de explicar y modificar cualquier parte de la aplicación"*. Eso descarta la especialización rígida. El esquema propuesto:

- **Sin dueños de módulo.** Cada hito se reparte por *recorte vertical* (una funcionalidad completa de la interfaz a la base de datos), no por capa. Nadie es "el del front" ni "el del back".
- **Rol de integrador rotativo.** En cada hito una persona distinta es responsable de revisar y mergear los *pull requests*, mantener el despliegue en pie y redactar el informe de la entrega. En H1 y H4 le toca a uno, en H2 y H5 a otro, en H3 al tercero.
- **Revisión cruzada obligatoria.** Ningún PR se mergea sin la aprobación de otro integrante. Es el mecanismo concreto por el que los tres terminan conociendo todo el código.
- **Reunión semanal de 30 minutos** para repartir el trabajo de la semana y revisar la holgura restante del hito.

---

## 7. Consideraciones de seguridad por capa

La consigna pide explicarlas en cada entrega y en cada capa. Definición inicial (lo implementado al 09/11 está en [`Entrega_4/seguridad-por-capa.md`](../Entrega_4/seguridad-por-capa.md)):

| Capa | Consideraciones |
|---|---|
| **Red** | HTTPS obligatorio con redirección desde HTTP, HSTS, CORS restringido al origen propio, *rate limiting* por IP en login, registro y endpoints de IA |
| **Sistema operativo** | El proceso de la aplicación corre con un usuario sin privilegios, el directorio de subidas sin permiso de ejecución, host y dependencias actualizadas |
| **DBMS** | Usuario de aplicación con privilegios mínimos (sin DDL), **consultas siempre parametrizadas**, contraseñas con hash y salt (bcrypt o argon2), backups periódicos |
| **Aplicación** | Validación en el servidor de todo dato (la del cliente es sólo UX), escape de salida contra XSS, tokens CSRF en todo formulario, cookies `httpOnly` + `Secure` + `SameSite`, autorización verificada por recurso para prevenir IDOR, validación de tipo y tamaño real de las imágenes, límite de uso de la API de IA por usuario, y **nunca publicar la ubicación exacta de un vehículo** |
