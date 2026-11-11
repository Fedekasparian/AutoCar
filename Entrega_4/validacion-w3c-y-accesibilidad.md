# Validación W3C y accesibilidad (Entrega 4)

Revisión del 09/11/2026 sobre la rama `dev`.

## HTML: validador del W3C (Nu Html Checker)

Se pasaron **las 41 páginas** del front (`front/index.html` y `front/pages/**/*.html`) por https://validator.w3.org/nu/.

**Resultado: 0 errores en las 41.** Se corrigieron los 5 errores y las advertencias que aparecieron:

| Página | Qué decía el validador | Arreglo |
|---|---|---|
| `vehiculos/tasacion.html` | `aria-label` en un `span` sin rol (4 veces) | El signo `+`/`−` queda `aria-hidden` y el texto "Sube el valor" / "Baja el valor" va en un `span.solo-lector` |
| `talleres/taller.html` | `autocomplete="street-address"` no vale en un `input` de una línea | `autocomplete="address-line1"` |
| `vehiculos/favoritos.html` | Comentario con `--` adentro (HTML comentado) | Se reemplazó por un comentario de una línea |
| `vehiculos/vehiculo.html` | Encabezado vacío (lo completa JavaScript) | Texto inicial "Vehículo" |
| `operaciones/propuestas.html` | `article` sin encabezado | `div` |

**Advertencia que se deja a propósito:** "The `list` role is unnecessary for element `ul`". Las listas sin viñetas (`list-style: none`) llevan `role="list"` porque Safari con VoiceOver deja de anunciarlas como lista si no lo tienen.

Cómo repetirlo desde la raíz del repo del front:

```bash
for f in front/index.html front/pages/*/*.html; do
  curl -s -H "Content-Type: text/html; charset=utf-8" --data-binary @"$f" "https://validator.w3.org/nu/?out=gnu"
done
```

## CSS: validador del W3C (Jigsaw)

8 hojas de estilo, **0 errores en 7**. En `identidad.css` el validador marca `mask: url(...) center / contain no-repeat` (el logo). Es CSS válido de la especificación *CSS Masking* y lo soportan todos los navegadores actuales, pero el validador todavía no reconoce esa forma abreviada.

## Accesibilidad (WCAG 2 A y AA)

Se revisaron con **axe** (en Chromium, con sesión de admin para que entren las pantallas protegidas) las 15 páginas principales: portada, inicio, login, registro, buscar, detalle del vehículo, publicar, mis publicaciones, talleres, pedir inspección, mis inspecciones, adherir taller, moderar, reclamos y planes.

**Resultado: 0 violaciones** (contraste, formularios con `label`, nombres accesibles de botones y links, estructura de encabezados, atributos ARIA).

Lo que ya trae el sitio:

- **Teclado**: link "Saltar al contenido" al principio de cada página, foco visible, todo se maneja con `Tab`/`Enter`/`Espacio`.
- **Formularios**: cada campo con `label`, errores asociados con `aria-describedby` y anunciados con `role="alert"`, ayuda con `aria-live`.
- **Responsive**: diseño pensado desde el celular (`meta viewport` y estilos que se adaptan al ancho).
- **Contraste**: revisado con axe en el tema por defecto (aqua). Hay hoja de impresión (`print.css`).

## Revisión después del rediseño visual (11/11/2026, rama `feat/visual-base`)

**HTML (Nu Html Checker):** 0 errores en las 40 páginas. Se corrigieron:

- `index.html`: el atributo `pathLength` va en un `<path>` (el validador no lo acepta en `<circle>`).
- `mensajes.html` y `conversacion.html`: el encabezado del chat arranca con el texto "Conversación" en vez de vacío.

**CSS (Jigsaw):** `interiores.css` sin errores. En `base-visual.css` y `portada.css` el validador marca propiedades nuevas que todavía no reconoce:

- transiciones entre páginas: `@view-transition` y `view-transition-name`;
- animación con el scroll: `animation-timeline` y `animation-range`.

Son mejoras progresivas: un navegador que no las conoce las ignora y la página funciona igual.

**Accesibilidad (axe, WCAG 2.1 A y AA):** 0 violaciones en 22 páginas, revisadas en **tema claro y oscuro**: las públicas, las de usuario (publicaciones, búsquedas, chat, inspecciones) y las de admin (panel, métricas, moderar). Se corrigió el contraste de:

- las etiquetas de estado de las inspecciones (verde, ámbar y azul más oscuros);
- el cartel "Este auto" de la barra de precios;
- la hora de los mensajes del chat.

Los gráficos de Métricas son listas (`<ul>`) con el nombre y el número escritos: se leen igual con lector de pantalla y sin ver los colores.

**Pruebas E2E (Playwright) contra la vista previa de la rama, que usa el back de dev:**

- Chromium y Firefox: todas pasan.
- WebKit: se colgaba ("Page crashed") al navegar con la transición entre páginas activa. Ahora la transición se activa solo en Chromium (desde `js/tema.js`).
- Se omiten las pruebas que necesitan credenciales de admin o vendedor (`E2E_ADMIN_*`, `E2E_VENDEDOR_*`).
