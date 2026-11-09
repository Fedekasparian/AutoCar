# Pendientes de AutoCar

Lista viva de lo que falta. Cuando alguien toma un ítem, pone su nombre; cuando lo termina, lo tacha (`~~así~~`) o lo borra con el PR que lo resuelve.
El plan completo del enfoque del mecánico está en [`modelo-de-negocio/PLAN.md`](modelo-de-negocio/PLAN.md).

Última actualización: 09/11/2026.

## Entrega 4

- [ ] **Aprobar el PR #20 (`dev` → `main`)**: `main` exige la aprobación de otro integrante. Después, verificar producción (adherirse, publicar, mis publicaciones, admin de talleres, moderar incompletas).
- [ ] **Tag `entrega-4`** en los dos repos, sobre `main`, cuando entre el #20.
- [ ] **Documento de seguridad por capa** (front, proxy de Vercel, back, base).
- [ ] **Validación W3C** del HTML y del CSS de las pantallas principales.
- [ ] **E2E en Firefox y WebKit** (hoy se corren en Chromium).

## Front: pantallas que siguen siendo maqueta

- [ ] **Metabuscador** (`meta-busqueda.html`, `meta-busqueda-nueva.html`, `meta-busqueda-resultados.html`): tienen datos de ejemplo y no llaman a la API, aunque el back está completo (`/api/meta-busquedas`). Falta: listar mis búsquedas, crear una con marcas y modelos reales, resultados con el precio de referencia y el botón **"Mandale un mecánico"** en cada auto (que ya existe en `vehiculo.html`).
- [ ] **Chat** (`mensajes.html`, `conversacion.html`): `js/paginas/mensajes.js` usa conversaciones de ejemplo. El back ya tiene las 4 rutas: bandeja (`GET /api/conversaciones`), mensajes con `?desde=ultimo_id`, enviar (`POST`) y el botón "Contactar al vendedor" (`POST /api/vehiculos/{id}/conversacion`).
- [ ] **Planes** (`planes.html`, `plan.html`): maqueta, depende de las suscripciones (abajo).
- [ ] **Formularios con `action` a rutas que no existen** (`cuenta.html` → `/cuenta`, `contacto.html` → `/contacto`): si se envían dan 404 de Vercel. Conectarlos o avisar "próximamente".

## Suscripciones y pagos (no hay nada hecho)

Hoy no hay tabla de suscripciones ni cobros: los planes son de muestra y las inspecciones tienen el pago **simulado** (queda `retenido`).

- [ ] **Plan Plus del comprador con Mercado Pago (sandbox)**: $ 5.000 por 30 días, sin renovación automática. Pago con tarjetas de prueba por la API REST (sin SDK) y webhook al back que activa el plan.
- [ ] **Tabla `suscripcion`** en Neon (usuario, plan, desde, hasta, estado, id de pago de MP), como migración numerada nueva y en `schema.sql`.
- [ ] **Beneficio real del Plus**: el plan gratis con 1 búsqueda guardada y el Plus sin límite (hoy el máximo es 20 para todos, `Busqueda::MAXIMO_POR_USUARIO`).
- [ ] **Decidir si las inspecciones se cobran con Mercado Pago** o quedan simuladas para la entrega (repartir la plata al mecánico es más complejo).

## Datos y scraper

- [ ] **Cargar los autos del scraper en Firestore** (dev y prod). Hoy el comparador responde `sin_datos`.
- [ ] **Corrida diaria** del scraper (`diario.bat` en la PC a las 9:00 o GitHub Actions).
- [ ] **Ranking de mecánicos con números en dev**: `php bin/demo-historial.php` contra Neon dev.

## Presentación y defensa

- [ ] **Ensayar la demo** con el guion (N4).
- [ ] **Confirmar la fecha de la entrega final** (16/11 o la semana del 23/11; defensa el 30/11).
