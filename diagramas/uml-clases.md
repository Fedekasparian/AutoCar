# Diagrama de clases UML — AutoCar

Bernal Justino · Marino Lautaro · Kasparian Federico · Programación en Ambiente Web · UNLu Mercedes · 2026

Este documento tiene tres diagramas:

1. **Modelo de dominio completo**: las 18 entidades de [arquitectura-y-modelo.md § 2](../Entrega_2/arquitectura-y-modelo.md#2-modelo-de-objetos-back-end) y [talleres-adheridos.md](../Entrega_2/talleres-adheridos.md), con atributos, métodos y relaciones (multiplicidad, composición, agregación).
2. **Enumeraciones** que usan los atributos del modelo.
3. **Clases implementadas en el back-end** ([AutoCarBackend/src](https://github.com/MateoPonti/AutoCarBackend)), tal como están hoy en el código PHP.

En el código la entidad *Publicación* se llama `Vehiculo` (tabla `vehiculo`), así que el diagrama usa ese nombre. Las entidades marcadas con `<<implementada>>` ya tienen tabla y API; las demás siguen en diseño y sus pantallas son maqueta.

---

## 1. Modelo de dominio

```mermaid
classDiagram
    direction LR

    class Usuario {
        <<implementada>>
        +int id
        +string nombre
        +string email
        -string passwordHash
        +string telefono
        +string localidad
        +string ubicacionBase
        +Rol rol
        +int tallerId
        +bool verificado
        +datetime createdAt
        +registrar(nombre, email, password) Usuario
        +iniciarSesion(email, password) bool
        +cerrarSesion() void
        +actualizarPerfil(datos) void
        +cambiarPassword(actual, nueva) void
        +planVigente() Suscripcion
        +puedePublicar() bool
        +esAdmin() bool
        +esMecanico() bool
        +perfilPublico() array
    }

    class Suscripcion {
        +int id
        +int usuarioId
        +TipoPlan tipoPlan
        +Nivel nivel
        +EstadoSuscripcion estado
        +date fechaInicio
        +date fechaFin
        +activar() void
        +cancelar() void
        +estaVigente() bool
        +cupoPublicaciones() int
        +maxFotos() int
        +permiteMetaBusqueda() bool
        +descuentoTaller() int
    }

    class Vehiculo {
        <<implementada>>
        +int id
        +int usuarioId
        +string marca
        +string modelo
        +string version
        +int anio
        +decimal precio
        +int kilometraje
        -string patente
        +Combustible combustible
        +Transmision transmision
        +Condicion condicion
        +EstadoPublicacion estado
        +string descripcion
        +bool aceptaCanje
        +string buscaCanje
        +string localidad
        +string ubicacionOfuscada
        +string motivoRechazo
        +datetime createdAt
        +datetime updatedAt
        +validar(datos) array
        +publicar() void
        +editar(datos) void
        +aprobar() void
        +rechazar(motivo) void
        +marcarVendido() void
        +eliminar() void
        +esVisible() bool
        +patenteParcial() string
        +verificacionVigente() Verificacion
        +tasacionVigente() Tasacion
    }

    class Foto {
        <<implementada>>
        +int id
        +int vehiculoId
        +int orden
        +string mime
        -bytes datos
        +datetime createdAt
        +validarSubida(archivo) bool
        +url() string
        +esPublica() bool
    }

    class CatalogoMarcaModelo {
        +string marca
        +string modelo
        +string version
        +marcas() List~string~
        +modelosDe(marca) List~string~
        +existe(marca, modelo) bool
    }

    class PropuestaCanje {
        +int id
        +int publicacionOrigenId
        +int publicacionDestinoId
        +int usuarioProponeId
        +decimal diferenciaEfectivo
        +EstadoPropuesta estado
        +datetime fecha
        +proponer() void
        +contraofertar(diferencia) void
        +aceptar() void
        +rechazar() void
        +cancelar() void
        +diferenciaSugerida() decimal
    }

    class Conversacion {
        +int id
        +int publicacionId
        +int usuario1Id
        +int usuario2Id
        +iniciar(publicacion, interesado) Conversacion
        +enviar(autor, texto) Mensaje
        +mensajesDesde(fecha) List~Mensaje~
        +noLeidos(usuario) int
        +participa(usuario) bool
    }

    class Mensaje {
        +int id
        +int conversacionId
        +int usuarioId
        +string texto
        +datetime fecha
        +bool leido
        +marcarLeido() void
    }

    class BusquedaGuardada {
        +int id
        +int usuarioId
        +json criterios
        +date fechaUltimoReporte
        +desdeTextoLibre(texto) json
        +ejecutar() List~Coincidencia~
        +generarReporte() void
    }

    class Coincidencia {
        +int id
        +int busquedaId
        +FuenteCoincidencia fuente
        +string referenciaOrigen
        +datetime fecha
    }

    class Tasacion {
        +int id
        +int publicacionId
        +decimal valorMinEstimado
        +decimal valorMaxEstimado
        +json comparablesUsados
        +datetime fecha
        +calcular(vehiculo) Tasacion
        +necesitaRecalculo() bool
    }

    class Reporte {
        +int id
        +TipoReporte tipo
        +int objetivoId
        +int usuarioReportaId
        +string motivo
        +EstadoReporte estado
        +crear() void
        +resolver(accion) void
        +descartar() void
    }

    class ListaFavoritos {
        +int id
        +int usuarioId
        +string nombre
        +date fechaCreacion
        +renombrar(nombre) void
        +agregar(vehiculo) void
        +quitar(vehiculo) void
        +eliminar() void
    }

    class Favorito {
        +int usuarioId
        +int publicacionId
        +int listaId
        +moverA(lista) void
    }

    class Taller {
        +int id
        +string nombre
        +string cuit
        +string direccion
        +string ubicacion
        +string telefono
        +string horarios
        +EstadoTaller estado
        +decimal calificacionPromedio
        +date fechaAlta
        +solicitarAdhesion() void
        +aprobar() void
        +suspender() void
        +recalcularCalificacion() void
        +intentosFallidosUltimaHora() int
    }

    class Verificacion {
        +int id
        +int publicacionId
        +int tallerId
        +int mecanicoId
        +int usuarioSolicitaId
        -string codigo
        +EstadoVerificacion estado
        +int kmLeido
        +int puntaje
        +ResultadoVerificacion resultado
        +int versionChecklist
        +datetime fechaSolicitud
        +datetime fechaEmision
        +date vence
        +int calificacionTaller
        +solicitar(vehiculo, taller) string
        +validarCodigo(codigo, patente, km) bool
        +registrarItem(item, estado, comentario, foto) void
        +emitir() void
        +calcularPuntaje() int
        +determinarResultado() ResultadoVerificacion
        +kmDifiere() bool
        +cancelar() void
        +vencer() void
        +calificarTaller(estrellas) void
    }

    class ItemChecklist {
        +int id
        +string categoria
        +int pesoCategoria
        +string descripcion
        +bool critico
        +int version
        +pesoItem() decimal
    }

    class ResultadoItem {
        +int verificacionId
        +int itemId
        +EstadoItem estado
        +string comentario
        +string fotoUrl
        +valor() decimal
    }

    %% Usuario y plan
    Usuario "1" --> "0..*" Suscripcion : contrata
    Usuario "0..1" --> "0..*" Vehiculo : publica

    %% Publicación
    Vehiculo "1" *-- "0..5" Foto : tiene
    Vehiculo ..> CatalogoMarcaModelo : valida marca y modelo
    Vehiculo "1" --> "0..1" Tasacion : tasación vigente

    %% Canje
    PropuestaCanje "0..*" --> "1" Vehiculo : ofrece (origen)
    PropuestaCanje "0..*" --> "1" Vehiculo : pide (destino)
    Usuario "1" --> "0..*" PropuestaCanje : propone

    %% Mensajería
    Vehiculo "1" --> "0..*" Conversacion : sobre
    Conversacion "0..*" --> "2" Usuario : participantes
    Conversacion "1" *-- "0..*" Mensaje : contiene
    Usuario "1" --> "0..*" Mensaje : escribe

    %% Meta-búsqueda
    Usuario "1" --> "0..*" BusquedaGuardada : guarda
    BusquedaGuardada "1" *-- "0..*" Coincidencia : genera

    %% Favoritos
    Usuario "1" *-- "0..*" ListaFavoritos : crea
    Usuario "1" --> "0..*" Favorito : marca
    Favorito "0..*" --> "1" Vehiculo : refiere a
    ListaFavoritos "0..1" o-- "0..*" Favorito : agrupa

    %% Reportes
    Usuario "1" --> "0..*" Reporte : reporta

    %% Talleres y verificación
    Taller "0..1" o-- "0..*" Usuario : mecánicos
    Vehiculo "1" --> "0..*" Verificacion : historial
    Taller "1" --> "0..*" Verificacion : realiza
    Usuario "0..1" --> "0..*" Verificacion : inspecciona (mecánico)
    Usuario "1" --> "0..*" Verificacion : solicita (publicador)
    Verificacion "1" *-- "0..*" ResultadoItem : detalle
    ItemChecklist "1" --> "0..*" ResultadoItem : evaluado en
```

### Cómo leer las relaciones

| Símbolo | Significado | Ejemplo |
|---|---|---|
| `*--` (rombo lleno) | **Composición**: la parte no existe sin el todo y se borra con él | Al borrar un `Vehiculo` se borran sus `Foto` (`ON DELETE CASCADE`); un `Mensaje` sólo existe dentro de su `Conversacion` |
| `o--` (rombo vacío) | **Agregación**: la parte sobrevive al todo | Al eliminar una `ListaFavoritos` sus `Favorito` quedan sin lista ("Todos"); un mecánico sigue siendo usuario si el taller se suspende |
| `-->` | **Asociación** navegable con multiplicidad | `Usuario "0..1" --> "0..*" Vehiculo`: un vehículo cargado por el admin no tiene dueño (`usuario_id` NULL) |
| `..>` | **Dependencia** | `Vehiculo` consulta `CatalogoMarcaModelo` al validar |

### Reglas que el diagrama no puede expresar

- `Usuario` tiene **una sola** `Suscripcion` vigente a la vez; el resto es histórico.
- `Vehiculo` tiene como máximo **una** `Verificacion` activa (solicitada / en inspección) y **una** vigente (emitida y no vencida).
- La cantidad máxima de `Foto` depende del plan (hoy el back fija 5, `Foto::MAX`).
- `PropuestaCanje` sólo se puede crear si el vehículo destino tiene `aceptaCanje = true`.
- `Usuario.tallerId` sólo tiene valor si `rol = mecanico`.
- `Favorito` es la clase de asociación de la relación N a N entre `Usuario` y `Vehiculo`.

---

## 2. Enumeraciones

```mermaid
classDiagram
    direction LR
    class Rol {
        <<enumeration>>
        usuario
        mecanico
        admin
    }
    class TipoPlan {
        <<enumeration>>
        free
        metaSearching
        usoPortal
        ambas
    }
    class Nivel {
        <<enumeration>>
        bronce
        plata
        oro
        platino
    }
    class EstadoSuscripcion {
        <<enumeration>>
        activa
        vencida
        cancelada
    }
    class EstadoPublicacion {
        <<enumeration>>
        pendiente
        disponible
        rechazado
        vendido
        eliminado
    }
    class Combustible {
        <<enumeration>>
        nafta
        diesel
        gnc
        hibrido
        electrico
    }
    class Transmision {
        <<enumeration>>
        manual
        automatica
    }
    class Condicion {
        <<enumeration>>
        excelente
        muy_bueno
        bueno
        regular
    }
    class EstadoPropuesta {
        <<enumeration>>
        pendiente
        contraofertada
        aceptada
        rechazada
        cancelada
    }
    class FuenteCoincidencia {
        <<enumeration>>
        portal
        externa
    }
    class TipoReporte {
        <<enumeration>>
        publicacion
        usuario
        verificacion
    }
    class EstadoReporte {
        <<enumeration>>
        pendiente
        resuelto
        descartado
    }
    class EstadoTaller {
        <<enumeration>>
        pendiente
        activo
        suspendido
    }
    class EstadoVerificacion {
        <<enumeration>>
        solicitada
        en_inspeccion
        emitida
        cancelada
        vencida
    }
    class ResultadoVerificacion {
        <<enumeration>>
        muy_bueno
        bueno
        regular
        fallas_criticas
    }
    class EstadoItem {
        <<enumeration>>
        ok
        observado
        falla
    }
```

`EstadoSuscripcion` y `EstadoReporte` no tienen valores fijados en los documentos de diseño; los del diagrama son una propuesta.

---

## 3. Clases implementadas en el back-end (PHP)

Arquitectura en capas: `Router` → controladores → modelos (acceso a datos con PDO). Los modelos son clases `final` con métodos estáticos (en UML, subrayados; acá marcados con `$`).

```mermaid
classDiagram
    direction TB

    namespace Core {
        class Router {
            -array routes
            +get(path, handler, guard) void
            +post(path, handler, guard) void
            +put(path, handler, guard) void
            +patch(path, handler, guard) void
            +delete(path, handler, guard) void
            -add(method, pattern, handler, guard) void
            +dispatch(method, uri) void
        }
        class Request {
            +json()$ array
            +formulario()$ array
            +texto(datos, campo)$ string
            -bytes(valor)$ int
        }
        class Response {
            +json(datos, status)$ never
            +archivo(contenido, tipo, publico)$ never
            +noContent()$ never
            +error(status, codigo, mensaje, errores)$ never
        }
        class Database {
            -PDO pdo$
            +pdo()$ PDO
        }
        class Config {
            -array env$
            +load(file)$ void
            +get(key, default)$ string
        }
        class Cors {
            +handle()$ void
        }
        class Logger {
            +error(mensaje)$ void
        }
    }

    namespace Auth {
        class AuthSesion["Auth"] {
            +string COOKIE$
            -array claims$
            -bool leido$
            +ttl()$ int
            +iniciarSesion(usuario)$ void
            +cerrarSesion()$ void
            +id()$ int
            +csrf()$ string
            +requireLogin()$ void
            +requireCsrf()$ void
            +requireAdmin()$ void
            -cookie(valor, vence)$ void
            -https()$ bool
        }
        class Jwt {
            +emitir(claims, ttl)$ string
            +verificar(token)$ array
            +firmar(dato)$ string
            -secreto()$ string
        }
        class UsuarioModelo["Usuario"] {
            +porEmail(email)$ array
            +porId(id)$ array
            +crear(nombre, email, hash)$ int
            +rolDe(id)$ string
            +publico(usuario)$ array
        }
        class AuthController {
            +registro() void
            +login() void
            +logout() void
            +me() void
        }
    }

    namespace Catalogo {
        class VehiculoModelo["Vehiculo"] {
            +array COMBUSTIBLES$
            +array TRANSMISIONES$
            +array CONDICIONES$
            +array ESTADOS$
            +array VISIBLES$
            +buscar(filtros, pagina, porPagina, soloDisponibles)$ array
            +marcas()$ array
            +find(id)$ array
            +delUsuario(usuarioId)$ array
            +deUsuario(id, usuarioId)$ array
            +cambiarEstado(id, estado, motivo)$ void
            +crear(datos, usuarioId)$ int
            +actualizar(id, datos)$ void
            +validar(entrada, publicacion)$ array
            +paraApi(vehiculo)$ array
            -columnas(datos)$ array
        }
        class CatalogoController {
            +int POR_PAGINA$
            +index() void
            +detalle(id) void
            +marcas() void
            +listado(filtros, soloDisponibles, porPagina)$ array
            +filtros(get)$ array
        }
    }

    namespace Publicaciones {
        class FotoModelo["Foto"] {
            +int MAX$
            +int MAX_BYTES$
            +array TIPOS$
            +validarSubidas(campo)$ array
            +guardar(vehiculoId, fotos)$ void
            +rutasDe(vehiculoId)$ array
            +find(id)$ array
            -normalizar(campo)$ array
        }
        class PublicacionController {
            -array TRANSICIONES$
            +index() void
            +crear() void
            +actualizar(id) void
            +cambiarEstado(id) void
            +eliminar(id) void
            +foto(id) void
            -propio(id)$ array
            -puedeVerPrivada(duenioId)$ bool
        }
    }

    namespace Admin {
        class AdminVehiculoController {
            -array TRANSICIONES$
            +index() void
            +detalle(id) void
            +crear() void
            +actualizar(id) void
            +moderar(id) void
            +eliminar(id) void
            -existente(id)$ array
        }
    }

    Router ..> AuthSesion : aplica guard auth / admin / CSRF
    Router ..> AuthController : despacha
    Router ..> CatalogoController : despacha
    Router ..> PublicacionController : despacha
    Router ..> AdminVehiculoController : despacha
    Router ..> Response : 404 / 405

    AuthController ..> UsuarioModelo
    AuthController ..> AuthSesion
    AuthSesion ..> Jwt : emite y verifica token
    AuthSesion ..> UsuarioModelo : rolDe()

    CatalogoController ..> VehiculoModelo
    CatalogoController ..> FotoModelo
    PublicacionController ..> VehiculoModelo
    PublicacionController ..> FotoModelo
    PublicacionController ..> AuthSesion : id()
    AdminVehiculoController ..> VehiculoModelo
    AdminVehiculoController ..> FotoModelo
    AdminVehiculoController ..> CatalogoController : listado()

    UsuarioModelo ..> Database
    VehiculoModelo ..> Database
    FotoModelo ..> Database
    Database ..> Config
    Jwt ..> Config
    AuthSesion ..> Config : JWT_TTL
```

### Rutas de la API por controlador

| Controlador | Método | Ruta | Guard |
|---|---|---|---|
| `CatalogoController` | `index` · `detalle` · `marcas` | `GET /api/vehiculos` · `GET /api/vehiculos/{id}` · `GET /api/marcas` | público |
| `PublicacionController` | `foto` | `GET /api/fotos/{id}` | público (controla visibilidad adentro) |
| `PublicacionController` | `index` · `crear` · `actualizar` · `cambiarEstado` · `eliminar` | `GET` · `POST /api/mis-vehiculos` · `PUT` · `PATCH …/{id}/estado` · `DELETE /api/mis-vehiculos/{id}` | `auth` + CSRF |
| `AuthController` | `registro` · `login` · `logout` · `me` | `POST /api/registro` · `POST /api/login` · `POST /api/logout` · `GET /api/me` | público · `me` con `auth` |
| `AdminVehiculoController` | `index` · `detalle` · `crear` · `actualizar` · `moderar` · `eliminar` | `/api/admin/vehiculos[/{id}[/estado]]` | `admin` + CSRF |
