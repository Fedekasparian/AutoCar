# Entrega 2 — Wireframes

**Proyecto:** AutoCar
**Entrega 2 · 14/09/2026** · Bernal Justino · Marino Lautaro · Kasparian Federico
Programación en Ambiente Web · UNLu Mercedes · 2026

Los wireframes se armaron en Figma a partir de este documento y del [sitemap de la entrega 1](../entrega-1/sitemap.pdf). Acá se detalla qué contiene cada pantalla, para que el archivo de Figma sea trazable a las rutas ya definidas.

**Archivo de Figma:** [AutoCar en Figma](https://www.figma.com/proto/ahUkGGttt6V3BRDMfA5peX/AutoCar?node-id=9-309&t=0rICU3U2b3H2ccLl-1)

---

## 0. Convenciones usadas en todas las pantallas

- *Mobile-first*: cada pantalla se diseña primero a 375px de ancho y después se adapta a escritorio (~1024px+).
- Navegación: barra inferior de 5 ítems en mobile (Home, Mapa, Meta-búsqueda o Mis publicaciones según el plan, Mensajes, Cuenta) y barra superior en escritorio, tal como define el sitemap. El rol mecánico tiene su propia barra: Panel, Verificar, Historial, Mensajes, Cuenta.
- Escala de grises y bloques placeholder — sin definición de marca ni tipografía final; eso corresponde al sistema de diseño (módulo B.3), no al wireframe.
- Todo formulario muestra su estado de error inline (no sólo en un resumen arriba).

---

## 1. Homepage — `/` (pública)

- Barra superior: logo, enlaces a Planes, Ayuda, Ingresar / Registrarme.
- Hero: propuesta de valor de una línea + CTA a registro.
- Widget **"Asociate como mecánico"** junto al hero: tarjeta dirigida a talleres, con una línea sobre el beneficio (recibir clientes de la app que necesitan verificar su vehículo) y CTA a `/talleres/adherirse`.
- Franja de planes destacados (resumen de precios, link a `/planes`).
- Grilla de vehículos de ejemplo (sin filtros, sólo para dar contexto — el visitante no navega el catálogo real).
- Footer: legales, contacto.

## 2. Pantallas por sección

### 2.1 Feed / Home autenticado — `/home`
- Barra superior/inferior de navegación.
- Barra de filtros rápidos (marca, precio, tipo de operación).
- Grilla paginada de publicaciones (foto, precio, ubicación aproximada, ícono si acepta canje).
- Estado vacío: mensaje + CTA a `/buscar`.

### 2.2 Detalle de vehículo — `/vehiculo/:id`
- Galería de fotos.
- Ficha técnica (marca, modelo, año, km, estado).
- Si tiene una verificación vigente: badge **"Verificado · 86/100"** con el taller y la fecha, y link al informe público (`/verificacion/:id`). Si el kilometraje leído no coincide con el declarado, alerta visible.
- Rango de tasación de referencia.
- Mapa pequeño con ubicación ofuscada.
- Datos del publicador + reputación.
- Acciones: Consultar por chat, Proponer canje (sólo si el aviso lo acepta), Guardar en favoritos (abre un selector para elegir la lista, opcional), Reportar.

### 2.3 Búsqueda — `/buscar`
- Buscador de texto arriba.
- Panel de filtros (marca, modelo, año, km, precio, combustible, tipo de operación, localidad, sólo verificados).
- Resultados en grilla, igual que el feed.

### 2.4 Mapa — `/mapa`
- Mapa a pantalla completa con marcadores agrupados (clustering).
- Mismos filtros que la búsqueda, colapsables en mobile.
- Popup al tocar un marcador: tarjeta resumen + link al detalle.
- Selector de capa: Vehículos / Talleres. La capa Talleres muestra los talleres adheridos (ver § 2.10).
- Botón para alternar a `/mapa/lista` (fallback sin mapa).

### 2.5 Meta-búsqueda — `/meta-busqueda` (planes Meta-searching / Ambas)
- Listado de búsquedas guardadas: criterio, fecha del último reporte, botón "ver resultados".
- Botón "Nueva búsqueda" → `/meta-busqueda/nueva`: formulario de criterios (marca, modelo, año, precio máximo).
  - Arriba del formulario, un campo de **texto libre** ("Describí el auto que buscás", p. ej. *"Corolla automático del 2015 en adelante, hasta 9 millones"*) con el botón **"Completar con IA"**.
  - El texto va al back-end, que lo manda al LLM y recibe los criterios estructurados. El formulario se precarga con ellos y el usuario los revisa y corrige antes de "Guardar y buscar"; nada se guarda sin esa confirmación.
  - Los campos que el LLM no pudo inferir quedan vacíos y se marcan para que el usuario los complete.
- `/meta-busqueda/:id`: lista de coincidencias con indicador de fuente (portal propio / externa) y link al origen.

### 2.6 Mis publicaciones — `/mis-publicaciones` (planes Uso Portal / Ambas)
- Listado por estado (activas, pausadas, cerradas) con indicador de cupo del plan ("3 de 5 anuncios usados").
- Botón "Publicar vehículo" → formulario multi-paso en `/mis-publicaciones/nueva`:
  1. Marca / modelo / año
  2. Ficha técnica y estado
  3. Fotos (cantidad según plan)
  4. Precio y si acepta canje
  5. Ubicación
  6. Revisión y publicación
- `/mis-publicaciones/:id/tasacion`: rango estimado, comparables usados, disclaimer de estimación no vinculante.
- `/mis-publicaciones/:id/verificar`: pedir la verificación del vehículo en un taller adherido.
  1. Elegir taller (mapa o lista, igual que `/talleres`), con el descuento del plan a la vista.
  2. Confirmación: código de verificación grande (`K7Q2-9MXA`) para mostrar en el taller, taller elegido, descuento, vencimiento del código (30 días) y botón "Cancelar solicitud".
- En el listado, cada publicación muestra el estado de su verificación (sin verificar, solicitada, verificada, vencida).
- `/mis-publicaciones/propuestas`: bandeja de propuestas de canje recibidas / enviadas, con su estado.

### 2.7 Mensajes — `/mensajes`
- Listado de conversaciones: contraparte, vehículo asociado, último mensaje, no leídos.
- `/mensajes/:id`: hilo de mensajes + tarjeta contextual del vehículo + acceso rápido a proponer canje.

### 2.8 Mi cuenta — `/cuenta`
- Formulario de datos personales (nombre, teléfono, localidad, ubicación base).
- `/cuenta/plan`: plan activo, cupo usado, botones para subir/bajar de nivel o cancelar.
- `/cuenta/seguridad`: cambio de contraseña, cierre de sesión.
- `/cuenta/favoritos`: favoritos organizados en **listas** creadas por el usuario (p. ej. "Para canje", "Opciones familiares").
  - Chips con las listas arriba de la grilla ("Todos" + una por lista) y botón "Nueva lista".
  - La grilla muestra los vehículos de la lista seleccionada; tocar uno abre su publicación.
  - Por lista: renombrar y eliminar. Eliminar una lista no borra sus favoritos: siguen visibles en "Todos".

### 2.9 Planes y precios — `/planes` (pública)
- Tabla comparativa: Free, Meta-searching, Uso Portal (4 niveles), Ambas funcionalidades.
- Fila "Descuento en talleres adheridos" (Bronce 10 %, Plata 15 %, Oro 25 %, Platino 35 %; sólo Uso Portal y Ambas).
- CTA a registro / alta de plan en cada columna.

### 2.10 Talleres adheridos — `/talleres` (usuario)
Reglas del módulo en [talleres-adheridos.md](talleres-adheridos.md).
- `/talleres`: mapa con los talleres adheridos (ubicación exacta, porque son comercios) y lista debajo, ordenada por distancia. Cada taller: nombre, distancia, calificación, horario y **el descuento que corresponde al plan del usuario** ("Tu plan Oro: −25 %"). Filtros: distancia y calificación.
- `/talleres/:id`: perfil del taller con dirección, horarios, teléfono, calificación, cantidad de verificaciones realizadas y botón "Verificar mi vehículo acá" (sólo planes Uso Portal / Ambas).
- `/verificacion/:id` (pública): informe de la verificación.
  - Encabezado: vehículo, taller, fecha, vigencia y resultado (Muy bueno / Bueno / Regular / Fallas críticas) con el puntaje.
  - Kilometraje leído contra declarado.
  - Las 8 categorías del checklist con el estado de cada ítem, comentarios y fotos.
  - Botón "Reportar informe" (va a la cola de reportes).

### 2.11 Adhesión de talleres — `/talleres/adherirse` (público)
- Formulario: nombre del taller, CUIT, dirección (con mapa para ajustar el punto), teléfono, horarios, nombre y email del responsable, contraseña.
- Checkbox de aceptación de las condiciones de adhesión (descuentos por plan y uso del checklist).
- Al enviar: pantalla "Solicitud recibida", con el aviso de que la cuenta queda pendiente hasta la aprobación del administrador.

### 2.12 Panel del taller — `/taller` (rol mecánico)
- `/taller`: encabezado con el nombre del taller.
  - Recuadro "Ingresar código de verificación" (campo + botón "Validar").
  - **Vehículos asignados**, en pestañas: Pendientes / En inspección / Aprobaciones. Cada fila: foto, vehículo, patente parcial y km, fecha de solicitud, plan y descuento, estado.
  - Últimas aprobaciones con su puntaje y resultado.
  - Resumen: verificaciones del mes, calificación del taller, porcentaje aprobado.
- Al validar un código: confirmación de la patente y del vehículo antes de empezar la inspección.
- `/taller/verificacion/:id`: inspección en 8 pasos, uno por categoría del checklist.
  - Paso inicial: kilometraje leído (contra el declarado) y fotos obligatorias (odómetro, motor, número de chasis).
  - Por ítem: OK / Observado / Falla, comentario (obligatorio si no es OK) y foto opcional. Los ítems críticos llevan la etiqueta "Crítico".
  - Barra de progreso, puntaje parcial calculado por el sistema y botones Anterior / Siguiente.
  - Último paso: resumen y botón "Emitir informe" (con confirmación, porque el informe no se edita después).
- `/taller/historial`: verificaciones emitidas, con buscador por patente parcial o vehículo.
- `/taller/perfil`: datos, horarios y mecánicos del taller.

---

## 3. Formularios de administración — rol admin

### 3.1 Tablero — `/admin`
- Métricas: usuarios por plan, publicaciones activas, reportes pendientes, talleres pendientes de aprobación y verificaciones del mes.

### 3.2 Moderación de publicaciones — `/admin/publicaciones`
- Cola de revisión con vista previa de cada aviso.
- Formulario de acción: Aprobar / Dar de baja + motivo (si se da de baja).

### 3.3 Gestión de usuarios — `/admin/usuarios`
- Buscador de usuarios.
- Formulario por usuario: suspender / restituir cuenta, asignar rol.

### 3.4 Gestión de suscripciones — `/admin/suscripciones`
- Buscador de usuarios.
- Formulario: cambiar plan y nivel manualmente (suscripción simulada, sin pasarela real).

### 3.5 Reportes — `/admin/reportes`
- Cola de denuncias (publicación o usuario) con motivo.
- Formulario de resolución: marcar como resuelto + acción tomada.

### 3.6 ABM de catálogo — `/admin/catalogo`
- Listado de marcas / modelos / versiones.
- Formulario de alta / edición: marca, modelo, versión.
- Confirmación antes de dar de baja un ítem del catálogo.

### 3.7 Gestión de talleres — `/admin/talleres`
- Pestañas: Pendientes / Activos / Suspendidos.
- Por taller: datos del formulario de adhesión, ubicación en el mapa, calificación y reportes recibidos.
- Formulario de acción: Aprobar / Rechazar / Suspender / Restituir + motivo.

### 3.8 ABM del checklist — `/admin/checklist`
- Listado de ítems agrupados por categoría, con peso de la categoría y marca de crítico.
- Formulario de alta / edición: categoría, descripción, crítico (sí/no).
- Guardar cambios crea una **nueva versión** del checklist; las verificaciones ya emitidas conservan la versión con la que se hicieron.

---

## 4. Cumplimiento de la consigna (entrega 2)

| Requisito | Estado |
|---|---|
| Homepage | § 1 |
| Una página por sección de la aplicación | § 2 |
| Formularios de administración del sitio | § 3 |
| Arquitectura y modelo de objetos | [arquitectura-y-modelo.md](arquitectura-y-modelo.md) |

---

## 5. Cambios posteriores a la entrega

Mejoras que surgieron de la devolución del equipo docente y de la revisión del grupo sobre el archivo de Figma, incorporadas después del 14/09. Las pantallas nuevas están exportadas como SVG en [mejoras-figma/](mejoras-figma/) para importarlas en Figma.

| Pantalla | Cambio | Sección |
|---|---|---|
| Homepage | Widget "Asociate como mecánico" | § 1 |
| Nueva búsqueda | Texto libre interpretado por LLM que precarga el formulario | § 2.5 |
| Favoritos | Organización en listas y selector de lista al guardar | § 2.2, § 2.8 |
| Detalle, búsqueda, mapa | Badge "Verificado", filtro "Sólo verificados" y capa de talleres | § 2.2, § 2.3, § 2.4 |
| Mis publicaciones | Pedido de verificación con código | § 2.6 |
| Planes | Descuento en talleres por nivel | § 2.9 |
| Talleres adheridos (nueva) | Mapa de talleres, perfil e informe público | § 2.10 |
| Adhesión de talleres (nueva) | Formulario de alta de talleres | § 2.11 |
| Panel del taller (nueva) | Vista del mecánico: vehículos asignados, inspección con checklist y aprobaciones | § 2.12 |
| Administración | Gestión de talleres y ABM del checklist | § 3.7, § 3.8 |
