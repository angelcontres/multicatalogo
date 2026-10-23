# REQUIREMENTS CHECKLIST — MultiCatálogo

> **Fuente de verdad del progreso del proyecto.**
> Leer al inicio de cada sesión; marcar `- [x]` y actualizar "Estado General" al completar cualquier tarea.
> 
> **Referencia completa de especificación:** `docs/LEVANTAMIENTO_REQUERIMIENTOS.md`
> **Software Design Document (SDD):** `docs/sdd/`
> **Mapa de navegación:** `PROJECT_MAP.md`

## Estado General

| Ítem | Valor |
|---|---|
| **Hito actual** | **Infraestructura de Producción Docker Ultra-Optimizada (Gateway + Frontend + Backend + Postgres + Redis)** |
| **Última tarea completada** | Dockerfiles multi-stage (Go estático no-root, Nginx SPA con Gzip/Cache), Nginx API Gateway con Rate Limiting perimetral, Docker Compose producción con segmentación Zero-Trust, scripts de despliegue (`prod-deploy.ps1`/`prod-deploy.sh`) y SDD 08 |
| **Siguiente tarea pendiente** | Ejecutar despliegue completo en contenedor cuando Docker daemon esté activo |
| **Bloqueadores** | Docker Desktop detenido en el host (el sistema opera con mock seguro y fallback en memoria hasta que el daemon se inicie) |

---

## UNIDAD 1 — FRAMEWORKS FRONTEND (SPA React 19 + Vite + Tailwind CSS v4)

### U1-T1 / T2 · Entorno SPA y Configuración Base
- [x] Pila tecnológica definida: React 19, TypeScript, Tailwind CSS v4, Vite.
- [x] Repositorio versionado con Git e ignorados configurados (`.gitignore`).
- [x] Cliente HTTP unificado con inyección de JWT (`src/services/http.ts`).
- [x] Nombre de paquete actualizado a `multicatalogo-frontend`.

### U1-T3 / T4 · Estado Global, Contexto y Rutas
- [x] `AuthContext` con autenticación por rol (`admin` / `cliente`).
- [x] `AuthContext` con persistencia de sesión en `localStorage` (`multicatalogo_sesion`).
- [x] `CartContext` con operaciones básicas de adición y remoción.
- [x] `CartContext` con persistencia aislada por email (`multicatalogo_carrito_<email>`).
- [x] Split `context/auth.ts` y `context/cart.ts` (0 errores y 0 warnings en ESLint).
- [x] Enrutamiento con `react-router-dom` y guardas de seguridad (`ProtectedRoute`).
- [x] Guarda de administrador (`AdminRoute`).
- [x] Proveedor intermedio `CartBoundary` con remontaje dinámico por cuenta.

### U1-T5 · Interfaces Full-Screen y Flujos MLM (Práctica 03)
- [x] F1: Storefront a pantalla completa con hero inmersivo (`/tienda`).
- [x] F2: Vista de detalle dinámico de producto (`/producto/:id`).
- [x] F3: Búsqueda reactiva y filtros por categoría en `/catalogo` (`useMemo`, `useSearchParams`).
- [x] F4: Lightbox / galería ampliada accesible con control por teclado (`Escape`).
- [x] F5: Flujo completo de compra: `/carrito` → `/checkout` → `/confirmacion`.
- [x] F6: Árbol multinivel dinámico en `/mi-red` con cálculo de comisiones (10% / 5% / 2%).
- [x] F7: Dashboard administrativo con métricas reales y KPIs derivados (`/`).
- [x] F8: Autenticación con perfil y navegación reactiva por rol (`admin` / `cliente`).
- [x] Auditoría de diseño Mobile-First (touch targets >= 44px, navegación colapsable).

---

## UNIDAD 2 — BACKEND TRANSACCIONAL (Go 1.27 + Fiber v2 + PostgreSQL + Redis)

### U2-T1 · Concurrencia y Misión Crítica
- [x] Goroutine asíncrona para actualización de ventas de referidos post-checkout.
- [x] Cálculo puro de comisiones MLM de 3 niveles (`10%`, `5%`, `2%`).

### U2-T2 · API Robusta y Controladores en Fiber
- [x] Estandarización de respuestas de error con struct `APIError{status, message, details}`.
- [x] Endpoint de monitoreo `/api/health` operativo.
- [x] Validación de entradas HTTP (campos obligatorios en login, ID numérico en productos).
- [x] Puerto de escucha configurable mediante variable de entorno `PORT` (por defecto 3000).

### U2-T3 · Persistencia PostgreSQL y Caché Redis
- [x] Orquestación contenerizada con `docker-compose.yml` (PostgreSQL 16 en 5434 + Redis en 6379).
- [x] Script DDL completo de migración y seed inicial `database/init.sql`.
- [x] Archivo de variables de entorno `.env.example`.
- [ ] Conexión activa a pool `pgx/v5` en host (requiere Docker daemon).
- [ ] Conexión activa a Redis en host (requiere Docker daemon).

### U2-T4 · Inyección de Dependencias, Transacciones ACID y Seguridad
- [x] Endpoint `POST /api/checkout` con descuento seguro de inventario y recálculo de precios.
- [x] Control de stock con retorno de error 400 ante inventario insuficiente.
- [x] Roles diferenciados en autenticación (`admin` / `cliente`).
- [ ] Driver de base de datos con bloqueo pesimista en vivo `FOR UPDATE`.
- [ ] Middlewares JWT con clave HMAC-SHA256 en vivo.

---

## BACK-OFFICE Y ROADMAP POST-SÍLABO (U1+U2 Avanzado)

- [ ] Registro público `POST /api/register` con código de referido `?ref=CODIGO`.
- [ ] Ledger auditable de comisiones (`comisiones`) persistido en la misma transacción del pedido.
- [ ] Endpoint `GET /api/pedidos/mios` para consulta de compras del cliente autenticado.
- [ ] Consola administrativa de pedidos con transiciones de estado y cancelación con devolución de stock.
- [ ] Módulo de liquidación de comisiones a distribuidores (`POST /api/liquidaciones`).
- [ ] Reportes analíticos SQL agregados (volumen de ventas, top productos, top distribuidores).
