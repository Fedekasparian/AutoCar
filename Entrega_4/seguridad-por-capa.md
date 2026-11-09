# Seguridad por capa (Entrega 4)

Actualiza la definición inicial de [`Entrega_1/presupuesto-temporal.md` § 7](../Entrega_1/presupuesto-temporal.md#7-consideraciones-de-seguridad-por-capa) con lo que **está implementado** al 09/11/2026. Al final queda lo que todavía no se hizo.

Recorrido de un pedido: navegador → front en Vercel → proxy `/api` (Vercel) → back PHP en Render → PostgreSQL en Neon (datos de la aplicación) y Firestore (datos del scraper).

## 1. Red y transporte

| Medida | Dónde |
|---|---|
| **HTTPS en todo el recorrido**: Vercel y Render solo sirven HTTPS, y el back se conecta a Neon con `sslmode=require` | Vercel, Render, `Database.php` |
| **HSTS** (`Strict-Transport-Security: max-age=31536000`) cuando el pedido llega por HTTPS | `Backend/src/bootstrap.php` |
| **Proxy de la API en el mismo dominio**: el front pide `/api/...` a su propio dominio y Vercel lo reenvía a Render. Así la cookie de sesión es del propio sitio (no de terceros) y el navegador no habla directo con Render | `Frontend/middleware.js` |
| El proxy **nunca cae a otro entorno**: si falta `BACKEND_URL` responde 503, no manda dev a producción | `middleware.js` (`destinoApi`) |
| **CORS** restringido a los orígenes de `FRONT_URL` (solo afecta a navegadores; pedidos sin `Origin`, como un script, siguen funcionando) | `Backend/src/Core/Cors.php` |

## 2. Sistema operativo y servidor

| Medida | Dónde |
|---|---|
| El back corre en un contenedor (`php:8.3-apache`) y Apache atiende como `www-data`, sin privilegios; solo `storage/` es escribible | `Backend/Dockerfile` |
| `display_errors=0`: PHP nunca muestra errores ni rutas internas en la respuesta; se registran en `storage/logs/app.log` | `bootstrap.php` |
| **Secretos fuera del código**: contraseña de Neon, credenciales de Firestore (`FIRESTORE_CREDENCIALES_JSON`) y `BACKEND_URL` están en variables de entorno de Render y Vercel; `.env` está en `.gitignore` | Render, Vercel |
| Las fotos se guardan en la base, no en el disco: no hay una carpeta de subidas que se pueda ejecutar | `Foto.php`, `GET /api/fotos/{id}` |
| Sin dependencias de terceros en el back ni en el front (menos superficie de ataque por la cadena de suministro) | `composer.json`, `package.json` |

## 3. Base de datos (Neon y Firestore)

| Medida | Dónde |
|---|---|
| **Consultas siempre parametrizadas** con PDO y `ATTR_EMULATE_PREPARES` desactivado; los comodines `%` y `_` de la búsqueda se escapan | todos los modelos |
| **Contraseñas con bcrypt** (`password_hash` / `password_verify`); nunca se guardan ni se devuelven en claro | `AuthController` |
| **Reglas de negocio también en la base**: `CHECK` que impide publicar un vehículo incompleto, montos de la inspección que deben sumar, inspección firmada sin huella, estados válidos | `database/schema.sql`, migraciones 006 y 010 |
| **Informe firmado inalterable**: al firmar se guarda una huella SHA-256 del informe; si alguien lo cambiara, la huella no coincide | `Inspecciones/Huella.php` |
| Bases separadas para desarrollo y producción (dos proyectos de Neon): las pruebas nunca tocan datos reales | `infraestructura.md` |
| Firestore solo lo usa el back con una cuenta de servicio; el front nunca habla con Firestore | `MetaBusqueda`, `Comparador` |

## 4. Aplicación (back)

| Medida | Dónde |
|---|---|
| **Sesión de PHP guardada en la base** (tabla `sesion`), `session.use_strict_mode`, `session_regenerate_id(true)` en el login (evita fijación de sesión), vence a las 2 horas; el logout destruye la sesión en el servidor | `Auth/Auth.php`, `SesionDb.php` |
| **Cookie de sesión** `autocar_sesion` con `HttpOnly`, `Secure` y `SameSite=Strict`; solo lleva el id | `Auth.php` |
| **CSRF**: toda ruta con sesión que cambia datos (`POST`, `PUT`, `PATCH`, `DELETE`) exige `X-CSRF-Token`; el token sale de `random_bytes(32)` y se compara con `hash_equals` | `Router` → `Auth::requireCsrf` |
| **Permisos en el servidor por rol** (`vehiculos.moderar`, `usuarios.editar`, `reclamos.resolver`, …), leídos de la base en cada pedido: un cambio de rol surte efecto al instante | `routes.php`, `Auth::requirePermiso` |
| **Autorización por recurso (contra IDOR)**: cada uno ve y toca solo lo suyo (publicaciones, conversaciones, inspecciones del comprador y del mecánico). Lo ajeno responde **404**, igual que lo inexistente, para no revelar qué existe | `PublicacionController::propio`, `InspeccionController`, `MecanicoController` |
| **Reglas de la inspección**: el vendedor no puede elegir al mecánico, nadie inspecciona su propio auto ni se pide a sí mismo, no hay dos pedidos en curso del mismo aviso | `Inspecciones/Pedido.php` |
| **Links de inspección solo de sitios conocidos** (MercadoLibre, Kavak, Autocosmos o AutoCar). El back mira solo la URL y nunca entra a la página (sin riesgo de SSRF); `javascript:` y otros esquemas se rechazan | `Inspecciones/Fuente.php`, `Pedido.php` |
| **Concurrencia**: aceptar o rechazar una inspección es `UPDATE ... WHERE estado = 'pedida'` (si dos lo hacen a la vez, el segundo recibe 409); guardar el informe y firmar bloquean la fila (`SELECT ... FOR UPDATE`) | `Inspecciones/Inspeccion.php` |
| **Validación en el servidor de todo lo que entra** (la del front es solo para la experiencia de uso): tipos, rangos, largos, estados permitidos | `Vehiculo::validarPorPartes`, `Pedido`, `Reclamo`, … |
| **Fotos**: se revisa el tipo real del archivo con `finfo` (no la extensión ni lo que dice el navegador), hasta 5 por publicación y 2 MB cada una. Se sirven con `Content-Security-Policy: default-src 'none'; sandbox` y `nosniff`: abiertas directo no ejecutan nada | `Foto.php`, `Response::archivo` |
| **Errores sin información interna**: siempre JSON con código HTTP correcto (`{"error": "...", "mensaje": "..."}`); un error inesperado devuelve 500 genérico y el detalle queda solo en el log | `Response.php`, `bootstrap.php` |
| **Login sin pistas**: mismo mensaje y mismo costo si el email no existe o la contraseña es incorrecta | `AuthController` |
| **Ubicación aproximada**: del vehículo solo se publica la localidad, nunca la dirección | `publicar.html`, `Vehiculo` |

## 5. Aplicación (front)

| Medida | Dónde |
|---|---|
| **Sin `innerHTML`**: todo lo que viene de la API se inserta con `textContent` o creando nodos (`vistas.el`), así un texto con `<script>` se muestra como texto (contra XSS) | `js/servicios/vistas.js` y páginas |
| Los links externos (avisos de otros sitios) se abren con `target="_blank"` y `rel="noopener noreferrer"` | `taller.js`, `verificacion.js`, `admin-reclamos.js` |
| El front manda el token CSRF en cada pedido que cambia datos. La sesión es solo la cookie `HttpOnly` (JavaScript no la puede leer); en `sessionStorage` se guardan nada más el nombre y los permisos, para armar la pantalla | `js/api/cliente.js`, `js/servicios/sesion.js` |
| Las pantallas de admin y de mecánico se ocultan según esos permisos, pero es solo comodidad: aunque alguien los cambie en el navegador, cada ruta vuelve a controlar el permiso en el servidor | `sesion.requerirPermiso`, `routes.php` |

## 6. Lo que todavía no está (y cómo lo encararíamos)

- **Rate limiting** en login, registro y pedidos de inspección: hoy no hay límite por IP. Se haría con una tabla de intentos por IP y ventana de tiempo.
- **Usuario de Neon con privilegios mínimos**: la app usa el usuario dueño de la base (puede hacer DDL). Lo correcto es un rol solo con `SELECT/INSERT/UPDATE/DELETE` y correr las migraciones con otro.
- **Concurrencia al moderar publicaciones**: si el vendedor edita justo mientras el moderador aprueba, se puede aprobar una versión que el moderador no vio. Arreglo previsto: aprobar solo si la publicación no cambió desde que se mostró (409 si cambió) y bloquear la fila al moderar y al editar.
- **Cabeceras de seguridad en el front** (CSP, `Referrer-Policy`) configuradas en Vercel.
- **Backups**: dependemos del historial que guarda Neon; no hay un respaldo propio programado.
