# AutoCar
Trabajo integrador de Programación en Ambiente Web (11086) — Comisión 50, UNLu.

Integrantes: Federico Kasparian, Justino Bernal, Lautaro Marino y Ponti Mateo (legajos en `autores.txt`). Versión: ver `VERSION`.

## Modelo de negocio

Misión, visión, propuesta de valor, competencia, garantía, ingresos y hoja de ruta: [`modelo-de-negocio/`](modelo-de-negocio/) (presentación + README).

## Entornos y pruebas

Los entornos (local, dev y producción), las variables de cada uno y los flujos de deploy están en `infraestructura.md`.

- **Proxy de la API:** `middleware.js` reenvía `/api/*` al back que indica la variable `BACKEND_URL` de Vercel. Esa variable tiene un valor para Preview y otro para Production. Si falta, el middleware responde 503 en vez de usar el back de otro entorno.
- **Unitarias:** `npm ci && npm test` (Node 20 o más nuevo; no necesita navegador).
- **Punta a punta:** `npx playwright install` una vez, y después `BASE_URL=<url del front> npm run test:e2e`. Contra producción solo se corre `npm run test:humo`, que no escribe datos.
