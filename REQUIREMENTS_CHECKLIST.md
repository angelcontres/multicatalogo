# REQUIREMENTS CHECKLIST — MultiCatálogo

> **Fuente de verdad del progreso del proyecto.**
> Leer al inicio de cada sesión; marcar `- [x]` y actualizar "Estado General" al completar cualquier tarea.
> 
> **Referencia completa de especificación:** `docs/LEVANTAMIENTO_REQUERIMIENTOS.md`
> **Mapa de navegación:** `PROJECT_MAP.md`

## Estado General

| Ítem | Valor |
|---|---|
| **Hito actual** | **Levantamiento de Requerimientos Completado + AI Harness Implementado** |
| **Última tarea completada** | Versionamiento Git estructurado, DRS completa (`docs/LEVANTAMIENTO_REQUERIMIENTOS.md`), AI Harness modular con verificación de contratos, comisiones MLM y presupuesto de tokens |
| **Siguiente tarea pendiente** | Ejecutar Fase 1 Backend (Estandarización `APIError`, validaciones y `/api/health`) y enriquecer vistas Frontend |
| **Bloqueadores** | Ninguno. Base de datos PostgreSQL planificada en puerto **5434** y Redis en **6379**. |

---

## UNIDAD 1 — FRAMEWORKS FRONTEND (SPA React 19 + Vite + Tailwind CSS v4)

### U1-T1 / T2 · Entorno SPA y Configuración Base
- [x] Pila tecnológica definida: React 19, TypeScript, Tailwind CSS v4, Vite.
- [x] Repositorio versionado con Git e ignorados configurados (`.gitignore`).
- [ ] Cliente HTTP unificado con inyección de JWT (`src/services/http.ts`).
- [ ] Variables de entorno configuradas (`VITE_API_URL`).

### U1-T3 / T4 · Estado Global, Contexto y Rutas
- [x] `AuthContext` con autenticación básica.
- [ ] `AuthContext` con persistencia de JWT y perfil de usuario en `localStorage`.
- [x] `CartContext` con operaciones básicas de adición y remoción.
- [ ] `CartContext` con persistencia por email (`multicatalogo_carrito_<email>`).
- [x] Enrutamiento con `react-router-dom` y guardas de seguridad (`ProtectedRoute`).
- [ ] Guarda de administrador (`AdminRoute`).

### U1-T5 · Interfaces Full-Screen y Flujos MLM (Práctica 03)
- [ ] F1: Storefront a pantalla completa con hero inmersivo (`/tienda`).
- [ ] F2: Vista de detalle dinámico de producto (`/producto/:id`).
- [ ] F3: Búsqueda reactiva y filtros por categoría en `/catalogo`.
- [ ] F4: Lightbox / galería ampliada accesible.
- [ ] F5: Flujo completo de compra: `/carrito` → `/checkout` → `/confirmacion`.
- [ ] F6: Árbol multinivel dinámico en `/mi-red` con cálculo de comisiones.
- [ ] F7: Dashboard administrativo con métricas reales (`/`).
- [ ] F8: Autenticación con perfil y redirección por rol (`admin` / `cliente`).
- [ ] Auditoría de diseño Mobile-First (sin scroll horizontal a 360px, touch targets >= 44px).

---

## UNIDAD 2 — BACKEND TRANSACCIONAL (Go 1.27 + Fiber v2 + PostgreSQL + Redis)

### U2-T1 · Concurrencia y Misión Crítica
- [ ] Goroutine asíncrona para actualización de ventas de referidos post-COMMIT.
- [ ] Cálculo puro de comisiones MLM de 3 niveles (`RepartirComisiones`).

### U2-T2 · API Robusta y Controladores en Fiber
- [ ] Estandarización de respuestas de error con struct `APIError{status, message, details}`.
- [ ] Endpoint de monitoreo `/api/health` con comprobación de estado de dependencias.
- [ ] Validación de entradas HTTP (campos requeridos, formato de IDs numéricos).
- [ ] Puerto de escucha configurable mediante variable de entorno `PORT`.

### U2-T3 · Persistencia PostgreSQL y Caché Redis
- [ ] Orquestación contenerizada con `docker-compose.yml` (PostgreSQL 16 en 5434 + Redis en 6379).
- [ ] Script de migración y seed inicial `database/init.sql`.
- [ ] Pool de conexiones seguro con driver `pgx/v5`.
- [ ] Implementación del patrón Cache-Aside para `/api/productos` (`productos:all`, TTL 5m).
- [ ] Implementación de Cache-Aside para el árbol de referidos (`red:tree:{email}`, TTL 10m).

### U2-T4 · Inyección de Dependencias, Transacciones ACID y Seguridad
- [ ] Arquitectura desacoplada con interfaces `DBRepository` y `CacheRepository`.
- [ ] Endpoint `POST /api/checkout` con transacción ACID pesimista (`FOR UPDATE`).
- [ ] Control de stock y rollback ante inventario insuficiente o fallas forzadas.
- [ ] Invalidación inmediata de caché en Redis tras escrituras transaccionales.
- [ ] Criptografía de contraseñas con `bcrypt` (costo >= 10).
- [ ] Emisión y validación de tokens JWT (HS256, expiración 2h).
- [ ] Middlewares de protección `RequireAuth` y `RequireAdmin`.
- [ ] Asignación de identidad en checkout exclusivamente mediante claims del token (`c.Locals`).

---

## BACK-OFFICE Y ROADMAP POST-SÍLABO (U1+U2 Avanzado)

- [ ] Registro público `POST /api/register` con código de referido `?ref=CODIGO`.
- [ ] Ledger auditable de comisiones (`comisiones`) persistido en la misma transacción del pedido.
- [ ] Endpoint `GET /api/pedidos/mios` para consulta de compras del cliente autenticado.
- [ ] Consola administrativa de pedidos con transiciones de estado y cancelación con devolución de stock.
- [ ] Módulo de liquidación de comisiones a distribuidores (`POST /api/liquidaciones`).
- [ ] Reportes analíticos SQL agregados (volumen de ventas, top productos, top distribuidores).
