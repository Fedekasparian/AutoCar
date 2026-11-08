# AutoCar
Trabajo integrador de Programación en Ambiente Web (11086) — Comisión 50, UNLu.

Integrantes: Federico Kasparian, Justino Bernal, Lautaro Marino y Ponti Mateo (legajos en `autores.txt`). Versión: ver `VERSION`.

## Modelo de negocio

**Eje (v4, 08/11/2026): el mecánico independiente que firma.** El comprador encuentra un auto en cualquier sitio, elige un mecánico de la zona (el vendedor no puede elegirlo), el mecánico firma el informe con su nombre y, si se le pasó algo que se veía, AutoCar devuelve la plata y lo baja en el ranking. El metabuscador muestra autos de todos los sitios, cada uno con el botón "Mandale un mecánico".

- Modelo de negocio completo (misión, problema, solución, competencia, quién gana, planes y sustentabilidad): [`modelo-de-negocio/README.md`](modelo-de-negocio/README.md) y la presentación.
- **Plan de trabajo hasta el 30/11** (qué ya está, qué falta, reparto y calendario): [`modelo-de-negocio/PLAN.md`](modelo-de-negocio/PLAN.md).

## Entornos y pruebas

Los entornos (local, dev y producción), las variables de cada uno y los flujos de deploy están en `infraestructura.md`.

- **Proxy de la API:** `middleware.js` reenvía `/api/*` al back que indica la variable `BACKEND_URL` de Vercel. Esa variable tiene un valor para Preview y otro para Production. Si falta, el middleware responde 503 en vez de usar el back de otro entorno.
- **Unitarias:** `npm ci && npm test` (Node 20 o más nuevo; no necesita navegador).
- **Punta a punta:** `npx playwright install` una vez, y después `BASE_URL=<url del front> npm run test:e2e`. Contra producción solo se corre `npm run test:humo`, que no escribe datos.
