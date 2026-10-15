# Talleres adheridos — verificación del estado del vehículo

**Proyecto:** AutoCar
**Incorporado el 15/10/2026**, a partir de la devolución del equipo docente · Bernal Justino · Marino Lautaro · Kasparian Federico
Programación en Ambiente Web · UNLu Mercedes · 2026

Este documento define el módulo de **talleres mecánicos adheridos**: una red de talleres que verifican el estado de los vehículos publicados siguiendo un checklist común, con descuento para los suscriptores. Las pantallas están en [wireframes.md § 2.10 a 2.12 y § 3.7 a 3.8](wireframes.md) y las entidades en [arquitectura-y-modelo.md § 2](arquitectura-y-modelo.md#2-modelo-de-objetos-back-end).

---

## 1. Qué resuelve

Hoy el estado del vehículo lo declara el propio dueño al publicar. La tasación parte de ese dato, y en un canje cada parte sobrevalora lo propio, así que la diferencia en efectivo que propone la app pierde credibilidad justo donde más importa.

La verificación reemplaza ese dato autodeclarado por uno **revisado por un tercero con reglas fijas**:

- El aviso muestra el badge **"Verificado"** con el puntaje y un informe público.
- La tasación usa el resultado de la verificación en lugar del estado declarado.
- En una propuesta de canje, cada parte ve si el vehículo de la otra está verificado.
- La búsqueda y el mapa permiten filtrar sólo vehículos verificados.

## 2. Actores

| Actor | Qué hace en el módulo |
|---|---|
| Publicador (plan Uso Portal / Ambas) | Elige un taller en el mapa, obtiene un código con descuento y lleva el vehículo |
| Mecánico (rol nuevo `mecanico`) | Pertenece a un taller adherido; valida el código, inspecciona con el checklist y emite el informe |
| Interesado / comprador | Ve el badge y el informe público en el aviso |
| Administrador | Aprueba o suspende talleres y mantiene el checklist |

## 3. Flujo de verificación

```
Publicador                        Sistema                        Mecánico
/mis-publicaciones/:id
 "Verificar" → elige taller ───▶  crea Verificación
 en /talleres                     estado = solicitada
                                  genera código K7Q2-9MXA ─────▶ el publicador lo muestra
                                                                  en el taller
                                                                 /taller → ingresa el código
                                  valida patente y km ◀───────── confirma patente y km leído
                                  estado = en inspección
                                                                 completa el checklist
                                                                 (8 pasos) y las fotos
                                  calcula puntaje y resultado ◀─ "Emitir informe"
                                  estado = emitida
 el aviso muestra el badge ◀────  recalcula la tasación
 y califica al taller (1 a 5)
```

**No hay agenda de turnos dentro de la app.** El código es lo único que vincula al publicador con el taller; el horario se arregla por teléfono, como hoy. Esto simplifica el módulo sin perder la trazabilidad.

## 4. Estados de una verificación

| Estado | Cuándo | Siguiente |
|---|---|---|
| Solicitada | El publicador eligió taller y recibió el código | En inspección · Cancelada · Vencida |
| En inspección | El mecánico validó el código y la patente | Emitida |
| Emitida | El mecánico completó el checklist | Vencida (a los 90 días o si cambian los datos del vehículo) |
| Cancelada | El publicador la anuló antes de la inspección | — |
| Vencida | El código no se usó en 30 días, o el informe perdió vigencia | — |

Una publicación tiene como máximo **una verificación activa** (solicitada o en inspección) y **una vigente** (emitida y no vencida).

## 5. Reglas de evaluación

### 5.1 Checklist

El checklist es el mismo para todos los talleres, está versionado y lo mantiene el administrador (`/admin/checklist`). Tiene 8 categorías, que son los 8 pasos del formulario del mecánico:

| # | Categoría | Peso | Ítems (los marcados son **críticos**) |
|---|---|---:|---|
| 1 | Motor | 20 | Arranque y ralentí · Pérdidas de aceite o refrigerante · Humo de escape · Registro de distribución |
| 2 | Transmisión | 10 | Embrague y cambios · Pérdidas · Ruidos |
| 3 | Frenos | 15 | **Pastillas y discos** · Líquido de frenos · **Freno de mano** · ABS y testigos |
| 4 | Suspensión y dirección | 15 | Amortiguadores · **Juego en la dirección** · Tren delantero |
| 5 | Neumáticos | 10 | Profundidad del dibujo · Desgaste parejo · Auxilio |
| 6 | Carrocería y estructura | 15 | **Chasis sin daños estructurales** · Corrosión · Choques reparados |
| 7 | Interior | 5 | Tablero y testigos · Tapizado · Climatización |
| 8 | Electricidad | 10 | Batería · Luces · Levantavidrios y cierre |

### 5.2 Qué marca el mecánico

Por cada ítem, **OK**, **Observado** o **Falla**, con un comentario opcional (obligatorio en Observado y Falla) y una foto opcional. Además, en el paso inicial:

- **Kilometraje leído** del odómetro.
- **Fotos obligatorias:** odómetro, motor y número de chasis.

### 5.3 Cómo se calcula el resultado

El mecánico no pone el puntaje: **lo calcula el servidor** a partir de lo que marcó, así el criterio es el mismo en todos los talleres y el resultado se puede explicar.

- Cada ítem pesa lo mismo dentro de su categoría (peso de la categoría ÷ cantidad de ítems).
- Valor de cada ítem: OK = 1 · Observado = 0,5 · Falla = 0.
- **Puntaje** = Σ (peso del ítem × valor) ÷ Σ pesos × 100, redondeado.

| Resultado | Condición | En el aviso |
|---|---|---|
| Muy bueno | Puntaje ≥ 80 y ningún crítico en Falla | Badge "Verificado" |
| Bueno | Puntaje entre 60 y 79 y ningún crítico en Falla | Badge "Verificado" |
| Regular | Puntaje < 60 y ningún crítico en Falla | Badge "Verificado" |
| Fallas críticas | Algún ítem crítico en Falla, sin importar el puntaje | Sin badge; el informe queda visible |

### 5.4 Kilometraje

Si el kilometraje leído difiere en más de **5 %** del declarado, el aviso muestra la alerta "El kilometraje no coincide con el declarado" y la ficha pasa a mostrar el valor leído.

### 5.5 Vigencia

El informe vale **90 días**. Pierde vigencia antes si el dueño edita marca, modelo, año, kilometraje o patente. Para recuperar el badge hace falta una verificación nueva.

## 6. Descuentos por plan

Sólo quien publica verifica su propio vehículo, así que el beneficio es para los planes **Uso Portal** y **Ambas**. El descuento lo fija la plataforma y el taller lo acepta al adherirse:

| Nivel | Descuento en el taller |
|---|---:|
| Bronce | 10 % |
| Plata | 15 % |
| Oro | 25 % |
| Platino | 35 % |

El pago se hace **en el taller, fuera de la app**, con el mismo criterio que la suscripción simulada. La app sólo muestra el porcentaje que corresponde al plan y el código.

## 7. Reglas de negocio y seguridad

| Regla | Por qué |
|---|---|
| El código es aleatorio criptográfico, de 8 caracteres sin ambiguos (sin 0/O, 1/I), de un solo uso y vence a los 30 días | No se puede adivinar ni reutilizar |
| Un taller tiene como máximo 5 intentos fallidos de código por hora | Evita la fuerza bruta |
| El mecánico debe confirmar que la patente coincide con la de la publicación | Garantiza que el auto revisado es el publicado |
| La patente nunca se muestra completa (`AB***12`) | Privacidad del dueño |
| Un mecánico sólo ve las verificaciones de su taller | Autorización por recurso (IDOR) |
| Un mecánico no puede verificar vehículos publicados por él ni por otro usuario de su taller | Conflicto de interés |
| El informe emitido no se puede editar; una corrección es una verificación nueva | Trazabilidad |
| El dueño no puede ocultar el último informe emitido mientras la publicación esté activa | Evita mostrar sólo los resultados favorables |
| Un taller recién adherido queda pendiente hasta que lo aprueba el administrador | Nadie se autoproclama verificador |
| Las fotos siguen las mismas validaciones de tipo y tamaño que las de la publicación | Misma superficie de ataque que D.3 |

## 8. Pantallas

| Pantalla | Ruta | Rol | Wireframe |
|---|---|---|---|
| Mapa y lista de talleres | `/talleres` | Usuario | § 2.10 |
| Perfil del taller | `/talleres/:id` | Público | § 2.10 |
| Pedir verificación y código | `/mis-publicaciones/:id/verificar` | Publicador | § 2.6 |
| Informe público | `/verificacion/:id` | Público | § 2.10 |
| Adherir un taller | `/talleres/adherirse` | Público | § 2.11 |
| Panel del taller | `/taller` | Mecánico | § 2.12 |
| Inspección con checklist | `/taller/verificacion/:id` | Mecánico | § 2.12 |
| Historial y aprobaciones | `/taller/historial` | Mecánico | § 2.12 |
| Gestión de talleres | `/admin/talleres` | Admin | § 3.7 |
| ABM del checklist | `/admin/checklist` | Admin | § 3.8 |

Además, el módulo agrega elementos a pantallas existentes: el widget "Asociate como mecánico" en la homepage, el badge en el detalle del vehículo, el filtro "Sólo verificados" en la búsqueda y la capa "Talleres" en el mapa.

## 9. Presupuesto

Módulo nuevo **O**, que se suma al [presupuesto funcional de la entrega 1](../Entrega_1/presupuesto-funcional.md):

| ID | Funcionalidad | Prioridad | Compl. | h |
|---|---|---|---|---:|
| O.1 | Taller, rol mecánico, adhesión y aprobación del admin | Must | Media | 8 |
| O.2 | Mapa y lista de talleres (reutiliza el módulo F) | Must | Baja | 5 |
| O.3 | Solicitud de verificación, código y máquina de estados | Must | Media | 6 |
| O.4 | Panel del mecánico, checklist y cálculo del puntaje | Must | Alta | 14 |
| O.5 | Informe público, badge e invalidación | Must | Media | 6 |
| O.6 | Integración con la tasación y filtro de búsqueda | Should | Media | 4 |
| O.7 | Calificación del taller y reportes | Should | Baja | 4 |
| | **Total** | | | **47** |

El margen sobre el alcance comprometido era de 29 h, así que el módulo O entra **reemplazando funcionalidades del tramo condicional** (J, matching con IA, o K.2, asistente). Se propone para la **entrega 4 (9/11)**.

## 10. Concesionarias (siguiente paso)

Las concesionarias se modelan con el mismo patrón que los talleres: un comercio con CUIT que el administrador aprueba, perfil público y ubicación exacta. Lo que cambia:

- Plan para empresas sin límite de publicaciones y perfil de agencia con badge "Agencia".
- Si una concesionaria tiene taller propio, ese taller no puede verificar su stock (mismo criterio de conflicto de interés).

Se detalla cuando se confirme el alcance con los docentes.

## 11. Pendiente de confirmar con los docentes

1. Si el descuento lo fija la plataforma (propuesta actual) o lo elige cada taller.
2. Si un comprador puede pedir una inspección precompra de un vehículo ajeno (segundo caso de uso, unas 8 h más).
3. La vigencia del informe (propuesta: 90 días).
