# DOCUMENTO DE ESPECIFICACIÓN Y LEVANTAMIENTO DE REQUERIMIENTOS DEL SISTEMA (SRS / DRS)
## Proyecto: MultiCatálogo — Plataforma de Comercio Electrónico y Red Multinivel (MLM)
**Asignatura:** Framework Programación Web (UPSE, Periodo 2026-02)  
**Versión del Documento:** 2.0.0 (Consolidado Unidades 1 a 4 + Back-Office Real)  
**Estado:** Aprobado / Especificación Oficial de Arquitectura y Requerimientos  

---

## 1. INTRODUCCIÓN Y VISIÓN DEL PRODUCTO

### 1.1 Propósito
El presente documento formaliza el levantamiento integral de requerimientos funcionales, requerimientos no funcionales, reglas de negocio, modelos de datos y arquitectura tecnológica para la plataforma **MultiCatálogo**. Este sistema ha sido concebido como un producto integrador políglota de alto rendimiento, orientado al sector cosmético y de bienestar, que combina la experiencia de compra fluida B2C con una red comercial multinivel (MLM de 3 niveles) y un motor transaccional de misión crítica.

### 1.2 Alcance del Sistema
MultiCatálogo integra cuatro grandes horizontes arquitectónicos alineados a las unidades del sílabo académico y llevados al estándar de la industria:
1. **Frontend SPA Reactivo (Unidad 1):** Single Page Application construida con React 19, TypeScript, Vite, Tailwind CSS v4 y React Router v7. Proporciona navegación inmersiva a pantalla completa, carrito persistente por usuario y back-office responsivo con enfoque *mobile-first*.
2. **Núcleo Transaccional Seguro (Unidad 2):** Microservicio en Go 1.27 + Fiber v2, PostgreSQL 16 con `pgx` pool y Redis Alpine bajo el patrón *Cache-Aside*. Gestiona transacciones ACID pesimistas (`FOR UPDATE`), cómputo asíncrono de comisiones mediante goroutines e inyección de dependencias estricta.
3. **Capa SaaS / Multitenant (Unidad 3):** Arquitectura modular proyectada en FastAPI/Python para la gestión de múltiples catálogos, aislamiento de esquemas y analítica avanzada.
4. **Despliegue Contenerizado y DevSecOps (Unidad 4):** Orquestación con Docker Compose, proxy inverso Caddy/Nginx con terminación SSL, auditoría OWASP y pipelines de integración continua.

---

## 2. ACTORES, PERFILES Y MATRIZ DE ACCESO (RBAC)

| Actor | Código | Descripción | Permisos Principales |
|---|---|---|---|
| **Visitante / Público** | `ACT-PUB` | Usuario no autenticado que navega en la web. | Visualizar storefront `/tienda`, consultar catálogo público `/catalogo`, ver detalle de producto `/producto/:id`, registrarse con o sin patrocinador. |
| **Cliente Comprador** | `ACT-CLI` | Usuario registrado con rol `cliente`. | Iniciar sesión, gestionar su propio carrito, ejecutar checkout transaccional, consultar `/mis-pedidos`, acceder a `/red/mia` y link de referido. |
| **Distribuidor / Líder MLM** | `ACT-DIS` | Cliente que promueve la red con su código único de patrocinador. | Todo lo del Cliente + compartir link `?ref=CODIGO`, consultar árbol personal en `/mi-red`, consultar ledger de comisiones devengadas y cobradas. |
| **Administrador del Sistema** | `ACT-ADM` | Operador con rol `admin`. | Acceso al Dashboard de métricas y KPIs reales, CRUD integral de productos (activar/desactivar), gestión de pedidos (cambio de estados), liquidación de comisiones a distribuidores. |
| **Harness / Agente IA** | `ACT-IA` | Agente inteligente y suite automatizada de validación y contexto. | Auditoría de contratos API, verificación de reglas de comisiones, simulación de fallas ACID, optimización de presupuesto de tokens y verificación de requerimientos. |

---

## 3. MODELO DE DOMINIO Y REGLAS DE NEGOCIO (BR)

### 3.1 Reglas de la Red Multinivel (MLM)
- **BR-MLM-01 (Jerarquía de 3 Niveles):** Las ventas generadas por un usuario acreditan comisiones a sus patrocinadores ascendentes (*upline*) en un máximo de 3 niveles:
  - **Nivel 1 (Patrocinador directo):** 10% del subtotal de la compra.
  - **Nivel 2 (Patrocinador secundario):** 5% del subtotal de la compra.
  - **Nivel 3 (Patrocinador terciario):** 2% del subtotal de la compra.
  - **Total de comisiones distribuidas:** 17% del valor comercial vendido.
- **BR-MLM-02 (Nodo Raíz y Registro):** La raíz del árbol es el nodo 0 ("Tú" / Admin). Todo nuevo usuario registrado mediante `POST /api/register?ref=CODIGO` crea simultáneamente un registro en `usuarios` y un nodo en `referidos` enlazado al `parent_id` del referente. Si no proporciona código, cuelga del nodo raíz.
- **BR-MLM-03 (Ledger Inmutable de Comisiones):** Cada pedido completado debe generar registros auditables e inmutables en la tabla `comisiones(pedido_id, referido_id, nivel, porcentaje, monto, estado)`. El campo `referidos.ventas` actúa únicamente como caché de lectura rápida, pero el ledger es la fuente única de verdad legal y contable.
- **BR-MLM-04 (Liquidación Idempotente):** Las comisiones en estado `pendiente` son agrupadas en una `liquidacion` por distribuidor. Tras la liquidación (`POST /api/liquidaciones`), pasan a estado `pagada` y no pueden liquidarse nuevamente bajo ningún concepto.

### 3.2 Reglas Transaccionales de Compra e Inventario
- **BR-TX-01 (Atomicidad en Checkout):** El checkout (`POST /api/checkout`) opera bajo una transacción SQL estricta (`BEGIN ... COMMIT / ROLLBACK`):
  1. Bloqueo pesimista de stock con `SELECT stock FROM productos WHERE id = $1 FOR UPDATE`.
  2. Verificación de existencia de stock suficiente (`stock >= cantidad`). De lo contrario, rollback inmediato con HTTP 400.
  3. Descuento de stock en `productos`.
  4. Inserción de cabecera en `pedidos` con total recalculado en servidor (precio unitario real del producto en BD, nunca el precio enviado por el cliente).
  5. Inserción de líneas en `pedido_items`.
  6. Inserción del ledger de comisiones en `comisiones`.
  7. Confirmación (`COMMIT`).
- **BR-TX-02 (Concurrencia Desacoplada):** Una vez realizado el `COMMIT` del pedido, se dispara una goroutine asíncrona con contexto desacoplado para actualizar los contadores estadísticos de la red e invalidar selectivamente las claves de Redis (`productos:all`, `red:tree:*`).
- **BR-TX-03 (Cancelación Simétrica / Clawback):** Si un pedido es cancelado (`PATCH /api/pedidos/:id/estado` con `estado='cancelado'`), el sistema ejecuta una transacción espejo:
  1. Retorna el stock de cada ítem a la tabla `productos`.
  2. Actualiza el estado de las comisiones asociadas a `'revertida'` (evitando pagos fraudulentos).
  3. Descuenta las ventas correspondientes en el contador del upline.
- **BR-TX-04 (Borrado Lógico):** La eliminación de productos en el catálogo (`DELETE /api/productos/:id`) realiza un borrado lógico (`activo = false`) para preservar la integridad referencial histórica de `pedido_items`.

---

## 4. ESPECIFICACIÓN DE REQUERIMIENTOS FUNCIONALES (RF)

### MÓDULO 1: Autenticación, Sesión y Control de Acceso
- **RF-AUTH-01 (Registro de Clientes con Patrocinador):** El sistema debe permitir a nuevos usuarios registrarse vía `POST /api/register` proporcionando nombre, email, contraseña y código de patrocinador opcional (`ref`). La contraseña debe encriptarse con `bcrypt` (costo >= 10).
- **RF-AUTH-02 (Inicio de Sesión y Emisión de JWT):** `POST /api/login` debe validar credenciales contra PostgreSQL mediante `bcrypt.CompareHashAndPassword`. Ante éxito, debe emitir un token JWT firmado (HS256) con expiración de 2 horas y claims `{sub, email, rol, iat, exp}`.
- **RF-AUTH-03 (Bloqueo de Cuentas Inactivas):** Si un usuario tiene `activo = false`, el intento de autenticación debe ser rechazado con HTTP 403 Forbidden ("cuenta desactivada").
- **RF-AUTH-04 (Middleware de Protección RequireAuth):** Todos los endpoints privados deben requerir la cabecera `Authorization: Bearer <token>`, validando la firma y la fecha de expiración. La identidad autenticada se inyecta en el contexto de la petición (`c.Locals`).
- **RF-AUTH-05 (Middleware de Rol RequireAdmin):** Los endpoints de gestión (`/api/admin/*`, creación/edición de productos, liquidaciones, estados de pedido) deben verificar que `rol === 'admin'`, devolviendo HTTP 403 si el usuario es `cliente`.
- **RF-AUTH-06 (Persistencia de Sesión Frontend):** La SPA en React debe mantener la sesión en `localStorage` (`multicatalogo_sesion`) y auto-inyectar el token en todas las llamadas vía `services/http.ts`.
- **RF-AUTH-07 (Redirección Inteligente por Perfil):** Al autenticarse, los administradores deben ser dirigidos al `/` (Dashboard analítico) y los clientes al `/tienda` o `/catalogo`.

### MÓDULO 2: Catálogo de Productos y Navegación
- **RF-CAT-01 (Storefront Inmersivo a Pantalla Completa):** Vista `/tienda` con diseño full-viewport (hero inmersivo, accesos directos por categoría, productos destacados y banner explicativo del plan MLM).
- **RF-CAT-02 (Catálogo Paginado y Filtrable):** Vista `/catalogo` con búsqueda reactiva en tiempo real y filtrado por parámetros de URL (`?categoria=`).
- **RF-CAT-03 (Detalle de Producto y Lightbox):** Vista `/producto/:id` con información detallada, selector de cantidad, especificaciones cosméticas y galería interactiva con ampliación tipo lightbox accesible vía teclado (Esc).
- **RF-CAT-04 (Caché Cache-Aside del Catálogo):** `GET /api/productos` debe consultar primero la clave `productos:all` en Redis. Si existe, retorna en <10ms; si no, consulta PostgreSQL, escribe en Redis con TTL de 5 minutos y retorna.
- **RF-CAT-05 (CRUD de Productos por Administrador):** Endpoints `POST /api/productos` (creación), `PUT /api/productos/:id` (edición) y `DELETE /api/productos/:id` (desactivación lógica). Cada escritura debe invalidar automáticamente la clave `productos:all` en Redis.
- **RF-CAT-06 (Búsqueda Server-Side en Panel Admin):** Endpoint `GET /api/admin/productos?q=termino&page=1&limit=10` con búsqueda insensible a mayúsculas (`ILIKE`) sobre nombre y descripción.

### MÓDULO 3: Carrito de Compras y Checkout Transaccional
- **RF-CART-01 (Aislamiento de Carrito por Usuario):** El carrito de compras debe persistir en `localStorage` bajo una clave única vinculada al correo del usuario (`multicatalogo_carrito_<email>`), evitando mezclar carritos entre diferentes sesiones en el mismo navegador.
- **RF-CART-02 (Operaciones del Carrito):** Añadir producto, incrementar/decrementar cantidad con controles táctiles (mínimo 44px), eliminar producto y vaciar carrito.
- **RF-CART-03 (Checkout Transaccional Seguro):** `POST /api/checkout` recibe los datos del comprador y el arreglo de ítems. La identidad del comprador se extrae **obligatoriamente** del token JWT (`c.Locals`), impidiendo la suplantación de identidad mediante payloads manipulados.
- **RF-CART-04 (Recálculo de Totales en Servidor):** El servidor calcula los precios unitarios e importes totales consultando directamente la base de datos dentro de la transacción, descartando cualquier valor monetario provisto por el cliente.
- **RF-CART-05 (Control Estricto de Stock):** Descuento transaccional con bloqueo pesimista. Si la cantidad solicitada supera el stock disponible de cualquier producto, se aborta la transacción y se retorna error descriptivo con código 400.
- **RF-CART-06 (Confirmación y Limpieza):** Tras un checkout exitoso (HTTP 201), la SPA redirige a `/confirmacion`, muestra el número de orden y limpia automáticamente el carrito local.

### MÓDULO 4: Red Multinivel y Crecimiento de Distribuidores
- **RF-MLM-01 (Visualización de Red Personal):** Endpoint `GET /api/red/mia` que reconstruye la estructura arbórea descendente a partir del nodo del usuario autenticado (no el árbol global del administrador).
- **RF-MLM-02 (Caché del Árbol de Red):** Las lecturas del árbol deben cachearse en Redis bajo la clave `red:tree:{email}` con un TTL de 10 minutos, invalidándose al completarse pedidos en su downline.
- **RF-MLM-03 (Generación y Copia de Enlace de Referido):** Vista `/mi-red` que exhibe el código único del distribuidor y un botón para copiar el enlace de invitación directo (`/registro?ref=CODIGO`).
- **RF-MLM-04 (Cálculo Pura de Comisiones):** Función pura de dominio `RepartirComisiones(total float64, tasas []float64) []Comision` libre de efectos secundarios y testeable unitariamente.

### MÓDULO 5: Pedidos, Historial y Liquidaciones
- **RF-ORD-01 (Historial Personal de Pedidos):** Endpoint `GET /api/pedidos/mios` accesible para clientes para consultar sus órdenes históricas, estado actual y detalle de productos adquiridos.
- **RF-ORD-02 (Consola de Gestión de Pedidos Admin):** Endpoint `GET /api/pedidos` con filtrado por estado (`pendiente`, `preparando`, `enviado`, `entregado`, `cancelado`) y paginación.
- **RF-ORD-03 (Transición de Estados y Rollback):** `PATCH /api/pedidos/:id/estado` valida transiciones de estado legales. Al pasar a `cancelado`, ejecuta la restauración de inventario y la revocación de comisiones.
- **RF-ORD-04 (Consulta de Comisiones Propias):** `GET /api/comisiones/mias` para que el distribuidor audite sus ganancias desglosadas por orden, nivel (1, 2, 3), fecha y estado (`pendiente`, `pagada`, `revertida`).
- **RF-ORD-05 (Liquidación de Comisiones):** `POST /api/liquidaciones` permite al administrador procesar el corte de pagos pendientes por distribuidor, registrando la liquidación y marcando los ítems del ledger como liquidados.

### MÓDULO 6: Reportería y Dashboard de Rendimiento
- **RF-REP-01 (KPIs de Negocio en Tiempo Real):** `GET /api/reportes/resumen` calcula en PostgreSQL las métricas agregadas del negocio: volumen total facturado, cantidad de pedidos procesados, ticket promedio y comisiones devengadas.
- **RF-REP-02 (Top Productos y Distribuidores):** Endpoints `GET /api/reportes/top-productos` y `GET /api/reportes/top-referidos` para visualizar en el Dashboard los artículos más vendidos y los distribuidores con mayor tracción.
- **RF-REP-03 (Monitoreo de Salud con Dependencias):** `GET /api/health` evalúa la conectividad en vivo con PostgreSQL (503 Service Unavailable si falla) y Redis (retorna `"status": "degraded"` si Redis no responde, manteniendo la API operativa).

---

## 5. ESPECIFICACIÓN DE REQUERIMIENTOS NO FUNCIONALES (RNF)

- **RNF-01 (Seguridad y Hardening):** 
  - Contraseñas almacenadas exclusivamente mediante hash `bcrypt` con salt generado.
  - Autenticación sin estado (stateless) vía JSON Web Tokens firmados criptográficamente.
  - Respuestas de error sanitizadas: mensajes técnicos internos y stack traces solo se exponen si `APP_ENV === 'dev'`.
  - Configuración CORS explícita y restringida a los orígenes del frontend autorizados (`http://localhost:5173`, `http://localhost:5174`).
- **RNF-02 (Rendimiento y Latencia):**
  - Tiempos de respuesta para consultas cacheadas en Redis < 15ms.
  - Tiempos de respuesta en base de datos para operaciones transaccionales < 100ms.
  - Pool de conexiones `pgxpool` con reaprovechamiento de sockets y límites de concurrencia.
- **RNF-03 (Concurrencia e Integridad de Datos):**
  - Propiedades ACID garantizadas mediante transacciones SQL y bloqueo pesimista `SELECT ... FOR UPDATE` para evitar condiciones de carrera (*race conditions*) en inventario.
  - Procesos en background desacoplados usando Goroutines en Go, sin interferir en el ciclo de respuesta HTTP.
- **RNF-04 (Usabilidad y Diseño Mobile-First):**
  - Interfaces fluidas y adaptables desde un ancho mínimo de pantalla de 360px sin desbordamiento horizontal.
  - Elementos de interacción táctil (botones de compra, steppers de cantidad, enlaces de navegación) con dimensiones mínimas de 44x44px conforme a pautas WCAG 2.1.
- **RNF-05 (Eficiencia de Contexto y Harness para Agentes IA):**
  - Estructuración del repositorio bajo directivas de bajo consumo de tokens.
  - Prohibición de escaneos recursivos ciegos; uso mandatorio de `PROJECT_MAP.md` y `REQUIREMENTS_CHECKLIST.md`.
  - Pruebas automatizadas modulares que permiten evaluar funcionalidades de forma aislada sin saturar la ventana de contexto del LLM.

---

## 6. CONTRATOS DE API Y ESTANDARIZACIÓN DE ERRORES

Todas las respuestas de error del sistema deben implementar de manera obligatoria la estructura uniforme:

```json
{
  "status": 400,
  "message": "Descripción clara y accionable del error",
  "details": "Detalles técnicos o validaciones específicas (solo en modo desarrollo)"
}
```

### Matriz de Códigos de Estado HTTP
| Código | Semántica | Caso de Uso |
|---|---|---|
| `200 OK` | Operación de lectura o actualización exitosa. | `GET /api/productos`, `POST /api/login`. |
| `201 Created` | Creación de recurso transaccional exitosa. | `POST /api/register`, `POST /api/checkout`. |
| `400 Bad Request` | Petición mal formada, campos vacíos o stock insuficiente. | Body inválido, falta de stock. |
| `401 Unauthorized` | Ausencia de token, token caducado o credenciales inválidas. | Login incorrecto, sin header Bearer. |
| `403 Forbidden` | Usuario autenticado carece de privilegios requeridos. | Cliente intentando acceder a ruta admin. |
| `404 Not Found` | Recurso solicitado no existe en base de datos. | Producto inexistente, pedido no encontrado. |
| `409 Conflict` | Conflicto de unicidad de datos. | Correo electrónico ya registrado. |
| `500 Internal Error` | Falla imprevista en el servidor. | Error crítico de base de datos no controlado. |
| `503 Unavailable` | Servicio esencial no disponible. | PostgreSQL caído en `/api/health`. |

---

## 7. ESQUEMA RELACIONAL DE BASE DE DATOS (POSTGRESQL 16)

```
       +------------------+             +------------------+
       |     usuarios     |             |    referidos     |
       +------------------+             +------------------+
       | id (PK)          |<----------->| id (PK)          |
       | email (UNIQUE)   |             | nombre           |
       | password (HASH)  |             | codigo (UNIQUE)  |
       | nombre           |             | nivel            |
       | rol              |             | ventas           |
       | activo           |             | parent_id (FK)---+ (Self-ref)
       | referido_id (FK) |             +------------------+
       | creado_en        |
       +------------------+
                |
                | 1:N
                v
       +------------------+             +--------------------+
       |     pedidos      |             |    pedido_items    |
       +------------------+             +--------------------+
       | id (PK)          |<----------->| id (PK)            |
       | cliente_email    |             | pedido_id (FK)     |
       | total            |             | producto_id (FK)   |
       | estado           |             | cantidad           |
       | usuario_id (FK)  |             | precio_unitario    |
       | creado_en        |             +--------------------+
       +------------------+                       |
                |                                 |
                | 1:N                             v
                v                       +--------------------+
       +------------------+             |     productos      |
       |    comisiones    |             +--------------------+
       +------------------+             | id (PK)            |
       | id (PK)          |             | nombre             |
       | pedido_id (FK)   |             | descripcion        |
       | referido_id (FK) |             | precio             |
       | nivel (1, 2, 3)  |             | stock              |
       | porcentaje       |             | categoria          |
       | monto            |             | img                |
       | estado           |             | galeria (TEXT[])   |
       | liquidacion_id   |             | activo             |
       | creado_en        |             +--------------------+
       +------------------+
```

---

## 8. MATRIZ DE TRAZABILIDAD (REQUERIMIENTO VS. COMPONENTE)

| Requerimiento | Componente Frontend | Componente Backend | Persistencia / Almacenamiento |
|---|---|---|---|
| **RF-AUTH-01/02** | `Login.tsx`, `Registro.tsx` | `authController.go` | Tabla `usuarios` (bcrypt), JWT |
| **RF-CAT-01/02/03**| `Storefront.tsx`, `Catalogo.tsx`, `DetalleProducto.tsx` | `prodController.go` | Tabla `productos`, Redis `productos:all` |
| **RF-CAT-05/06** | `AdminProductos.tsx` | `prodController.go` | Tabla `productos`, `DEL productos:all` |
| **RF-CART-01..06** | `Carrito.tsx`, `Checkout.tsx`, `Confirmacion.tsx` | `checkoutController.go` | Transacción ACID en `pedidos`, `pedido_items` |
| **RF-MLM-01..04** | `MiRed.tsx`, `Dashboard.tsx` | `redController.go`, `comisiones.go` | Tabla `referidos`, `comisiones`, Redis `red:tree:*` |
| **RF-ORD-01..05** | `MisPedidos.tsx`, `AdminPedidos.tsx`, `AdminLiquidaciones.tsx` | `pedidoController.go`, `liqController.go` | Tablas `pedidos`, `comisiones`, `liquidaciones` |
| **RF-REP-01/02** | `Dashboard.tsx` | `reportController.go` | Agregaciones SQL (`SUM`, `COUNT`, `GROUP BY`) |
| **RF-REP-03** | `Layout.tsx` (Health indicator) | `healthController.go` | Ping Postgres + Ping Redis |

---

## 9. DEFINICIÓN DE TERMINADO (DEFINITION OF DONE - DoD)

Una funcionalidad se considera completada únicamente cuando:
1. Cumple con la especificación funcional y no funcional correspondiente.
2. Posee pruebas de verificación ejecutables mediante el **AI Harness** sin errores.
3. No rompe los contratos de API existentes esperados por los consumidores.
4. Mantiene la seguridad por defecto (`RequireAuth`/`RequireAdmin` e identidad vinculada a token).
5. Las casillas correspondientes en `REQUIREMENTS_CHECKLIST.md` son actualizadas.
6. El código se encuentra debidamente versionado mediante commits convencionales en Git.
