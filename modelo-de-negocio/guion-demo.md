# N4 · Guion de la demo (defensa del 30/11)

Unos 6 minutos. Es la demo de la sección 3 del PLAN, con lo que hoy funciona de verdad. Hay que ensayarla al menos dos veces: una el día anterior contra **dev** y otra esa mañana.

**Quién hace qué:** uno maneja la computadora y otro habla. Cambiar de persona entre el comprador, el mecánico y el admin ayuda a que se entienda que son tres personas distintas.

## Antes de empezar

### Una sola vez, en Neon dev

1. Correr en el SQL Editor `006-inspecciones.sql` y `007-demo-inspecciones-solo-dev.sql`.
2. Correr `php bin/demo-historial.php` contra Neon dev (PR #7 del back). Así el ranking tiene números: Ferreyra arranca **primero con 5,0**.
3. En Render, `FRONT_URL` tiene que incluir el dominio de Vercel.

### Esa mañana (30 minutos antes)

- [ ] **Despertar Render:** abrir `https://<front>/api/mecanicos` y esperar a que responda. La primera vez tarda hasta un minuto.
- [ ] **Abrir tres ventanas**, cada una con su propia sesión: una normal, una de incógnito y otro perfil de Chrome (o Firefox).

  | Ventana | Quién | Usuario |
  |---|---|---|
  | 1 | Comprador | Una cuenta nueva creada en el momento, o `comprador@demo.autocar.com.ar` |
  | 2 | Mecánico | `mecanico1@demo.autocar.com.ar` (Raúl Ferreyra) |
  | 3 | Admin | La cuenta de admin del equipo |

  La contraseña de las cuentas `@demo` está en `007-demo-inspecciones-solo-dev.sql`.
- [ ] **Tener copiado el link de un aviso real de MercadoLibre**, de un auto de Mercedes o Luján (`https://auto.mercadolibre.com.ar/MLA-...`).
- [ ] **Reiniciar la demo** si ya se ensayó (ver el final): Ferreyra tiene que estar primero.
- [ ] Zoom del navegador al 125 %, notificaciones apagadas y la batería cargada.

## La demo

### 1. El problema (30 s, sin tocar nada)
> "Cuando comprás un usado, la revisión la hace alguien que elige el vendedor, o un inspector anónimo de la empresa que te lo vende. Si se equivoca, nadie responde."

### 2. El ranking (45 s) · ventana 1, sin sesión
- Ir a **Cuenta → Mecánicos de la red** (`talleres.html`).
- Mostrar que **Ferreyra está primero, con 5,0**, y que Gómez tiene un reclamo que procedió.
- Abrir "Cómo se arma el ranking".
> "El ranking sale solo de las inspecciones firmadas y de los reclamos que procedieron. Nadie paga para subir."

### 3. Pedir la inspección (1 min) · ventana 1, comprador
- Tocar **Elegir** en Ferreyra. Si no hay sesión, ingresar: vuelve solo al pedido con Ferreyra marcado.
- Pegar el link de MercadoLibre. Abajo aparece "Aviso de MercadoLibre".
- Mostrar el desglose: **$ 130.000 → $ 100.000 al mecánico y $ 30.000 a AutoCar, de los que $ 10.000 van al fondo de garantía**.
- Mostrar **qué revisa y qué no cubre** y marcar la casilla.
> "El comprador sabe antes de pagar de qué se hace responsable el mecánico."
- **Pedir la inspección.** Aparece en Mis inspecciones como "Esperando que el mecánico acepte".

*Si el metabuscador ya está (M2 y F7):* empezar desde el resultado de MercadoLibre, con el botón "Mandale un mecánico".

### 4. El mecánico acepta, revisa y firma (1 min 30 s) · ventana 2
- **Mi taller** muestra el pedido nuevo. **Aceptar**, con un turno para mañana.
- **Revisar y firmar:** marcar todo OK salvo **Carrocería → Observado**, con la nota "Rayón en la puerta trasera". Conclusión: **Con reparos**.
- **Firmar informe → Firmar.** Mostrar la **huella**.
> "Firma con su nombre. La huella es un código que cambia si alguien toca una coma del informe, y desde acá ya no se puede editar."

### 5. El comprador ve el informe (30 s) · ventana 1
- Recargar Mis inspecciones y entrar a la inspección: el informe firmado, la huella y **los trámites a pedir antes de pagar** (informe de dominio, libre deuda, VTV y 08).

### 6. El reclamo (1 min) · ventana 1 y después la 3
- En la misma pantalla, **Reclamo**: ítem *Estructura*, "Tenía un golpe en el zócalo derecho y el informe no lo marca". **Enviar.**
- Ventana 3 → **Administración → Reclamos de inspecciones** → **Resolver**.
- Elegir **Procede**. Intentar poner una compensación más alta que el tope para mostrar que no deja. Después poner **$ 390.000**, que es el tope de 3 veces el precio, y una respuesta. **Guardar.**

### 7. El ranking cambia en vivo (30 s) · ventana 1
- Volver a **Mecánicos de la red**: **Ferreyra bajó al tercer lugar (3,9)** y ahora muestra "1 reclamo procedió".
- En la inspección, el comprador ve "Procede" y el pago reembolsado.

### 8. Cierre (20 s)
> "Kavak te muestra solo su stock y MercadoLibre solo sus avisos. Nosotros te dejamos elegir a alguien que revisa el auto y que responde si se equivoca."

## Si algo falla

| Pasa esto | Hacer |
|---|---|
| Render no responde | Esperar 30 segundos y recargar. Si sigue igual, pasar al **plan B**: correr todo en local con la base de demo |
| "No hay mecánicos" | Falta el historial o la 007 en Neon. Plan B |
| No deja pedir porque "ya tenés una inspección en curso para ese auto" | Usar otro link de MercadoLibre |
| El admin no ve el botón Resolver | Está ingresado con la cuenta del comprador o la del mecánico: el que tiene interés propio no puede resolver |
| Algo raro en la pantalla | Mostrar la prueba automática: `npx playwright test tests/e2e/inspecciones.spec.js --headed` hace el mismo recorrido solo |

**Plan B (local):** el back con `DB_NAME=<base local con schema + seed + 007 + historial>` en el puerto 8000 y el front servido desde la raíz del repo en el 5500 (Live Server). Las páginas quedan en `http://localhost:5500/front/pages/...`.

## Reiniciar la demo después de un ensayo

Cada ensayo deja a Ferreyra con un reclamo que procedió. Para que vuelva a estar primero, en el SQL Editor de **Neon dev** (nunca en main) se borran las inspecciones de Ferreyra que **no** son del historial. Las del historial tienen links a `historial.demo.invalid`:

```sql
-- SOLO Neon dev. Borra lo que se hizo en los ensayos con Ferreyra; el historial queda.
DELETE FROM reclamo WHERE inspeccion_id IN (
  SELECT i.id FROM inspeccion i JOIN usuario u ON u.id = i.mecanico_id
  WHERE u.email = 'mecanico1@demo.autocar.com.ar' AND i.url NOT LIKE 'https://historial.demo.invalid/%');
DELETE FROM inspeccion WHERE id IN (
  SELECT i.id FROM inspeccion i JOIN usuario u ON u.id = i.mecanico_id
  WHERE u.email = 'mecanico1@demo.autocar.com.ar' AND i.url NOT LIKE 'https://historial.demo.invalid/%');
```

Después de correrlo, comprobar en **Mecánicos de la red** que Ferreyra está primero con 5,0.

## Preguntas que nos pueden hacer

- **¿Y si el mecánico arregla con el vendedor?** El vendedor no lo elige y no sabe quién es hasta el turno. Además, al mecánico le va el ranking y la plata de los reclamos.
- **¿Quién decide si un reclamo procede?** El moderador o el admin, con las pruebas (fotos, informe de otro taller). Quien tiene interés propio no puede resolver: el sistema no lo deja.
- **¿Cómo gana plata AutoCar?** Con el 23 % de cada inspección, del que un tercio va al fondo que paga los reclamos. El pago de esta versión es simulado.
- **¿Qué pasa con los papeles?** El mecánico verifica motor y chasis contra la cédula. Los trámites (dominio, deudas, VTV, 08) se le indican al comprador, porque no hay una API pública del Registro.
- **¿Cómo sabemos que anda?** Por las pruebas unitarias y de integración del back, y por la prueba de punta a punta que hace este mismo recorrido en Chromium, Firefox y WebKit.
