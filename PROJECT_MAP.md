# PROJECT MAP — MultiCatálogo (framework-web-2026-02)

> Mapa arquitectónico y de navegación ultra-compacto.
> **LEER ESTE ARCHIVO ANTES DE EXPLORAR CÓDIGO** para preservar contexto y ahorrar tokens.
> Proyecto integrador "MultiCatálogo": e-commerce cosmético con red multinivel (MLM 3 niveles).
> Asignatura: Framework Programación Web (UPSE, 2026-02).

## Visión de Arquitectura

```
React SPA (:5173) ──fetch (Bearer JWT)──► Go/Fiber API (:3000) ──pgx────► PostgreSQL 16 (:5434)
                                                │
                                                └──go-redis──► Redis (:6379) [Cache-Aside]
```

## Estructura de Navegación del Repositorio

| Directorio / Archivo | Responsabilidad / Contenido |
|---|---|
| `docs/LEVANTAMIENTO_REQUERIMIENTOS.md` | **Especificación Oficial (DRS/SRS)**: Requerimientos funcionales (RF), no funcionales (RNF), contratos API, reglas de negocio y modelo relacional. |
| `GUIA_DEFENSA.md` | **Manual de Sustentación para el Estudiante**: Guión paso a paso, demostraciones en vivo (ACID/Redis/Goroutines) y respuestas a preguntas del docente. |
| `docs/sdd/` | **Software Design Document (SDD) Modular**: Arquitectura C4, Frontend, Backend Go, DDL PostgreSQL, Cache-Aside Redis, Seguridad JWT/RBAC y Secuencias ACID. |
| `PROJECT_MAP.md` | Este archivo. Índice de navegación y contratos clave. |
| `REQUIREMENTS_CHECKLIST.md` | Lista de chequeo y estado de avance por Unidad del sílabo y Back-office. |
| `.windsurfrules` / `.cursorrules` / `AGENTS.md` | Directivas del agente IA: ahorro de tokens, navegación quirúrgica, testing. |
| `mcp_config.json` | Configuración de servidores MCP (Playwright, Memory, FileSystem). |
| `harness/` | **AI Harness & Evaluation Suite**: Herramientas de verificación automatizada, auditoría de tokens y diagnósticos rápidos. |
| `context_docs/` | Documentos didácticos originales (guías de laboratorio, notebooks de fases, sílabo). |
| `multicatalogo-frontend/` | SPA React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router v7. |
| `multicatalogo-backend/` | API REST transaccional Go + Fiber v2 + pgx + Redis. |
| `docker/` | Configuración del API Gateway & Reverse Proxy Nginx perimetral con Rate Limiting. |
| `docker-compose.prod.yml` | Orquestación de producción Zero-Trust (Gateway, Frontend, Backend, Postgres 5434, Redis 6379). |
| `.github/workflows/` | **CI/CD Pipelines**: `deploy.yml` para despliegue continuo en servidor casero (`anonymous`) y `ci.yml` para validaciones automáticas. |
| `menu.bat` / `menu.sh` | **Centro de Control Interactivo**: Menú para despliegue local, híbrido, Docker producción, diagnósticos y tests. |
| `scripts/` | Automatización de despliegue en producción (`prod-deploy.ps1` y `prod-deploy.sh`). |

## Frontend (`multicatalogo-frontend/src/`)

- Puerto: `5173` | Comandos: `npm run dev` \| `npm run build` \| `npm run lint`
- `App.tsx`: Enrutador central, guardas `ProtectedRoute`, contexto de autenticación y carrito.
- `context/AuthContext.tsx`: Sesión de usuario con JWT y rol (`admin` \| `cliente`).
- `context/CartContext.tsx`: Carrito persistente en `localStorage` por usuario (`multicatalogo_carrito_<email>`).
- `components/Storefront.tsx`: `/tienda` — Hero full-screen, categorías cosméticas y plan MLM.
- `components/Catalogo.tsx`: `/catalogo` — Búsqueda en vivo + filtro por categoría.
- `components/DetalleProducto.tsx`: `/producto/:id` — Vista detallada y galería lightbox.
- `components/Carrito.tsx`: `/carrito` — Gestión de ítems, cantidades y cálculo de total.
- `components/Checkout.tsx`: `/checkout` — Formulario de compra transaccional (`POST /api/checkout`).
- `components/Confirmacion.tsx`: `/confirmacion` — Resumen de orden y vaciado de carrito.
- `components/MiRed.tsx`: `/mi-red` — Visualización de red personal, comisiones, ledger devengado y enlace de referido.
- `components/MisPedidos.tsx`: `/mis-pedidos` — Historial de compras del cliente y estado de entrega.
- `components/Register.tsx`: `/registro` — Alta pública de nuevos distribuidores con código patrocinador (`?ref=`).
- `components/Dashboard.tsx`: `/` — Dashboard administrativo con KPIs reales.
- `components/AdminProductos.tsx`: `/admin/productos` — Inventario comercial, alta/edición y borrado de productos.
- `components/AdminPedidos.tsx`: `/admin/pedidos` — Gestión del ciclo de vida de pedidos y reversión/cancelación.
- `components/AdminLiquidaciones.tsx`: `/admin/liquidaciones` — Emisión y liquidación masiva de comisiones MLM.

## Backend (`multicatalogo-backend/`)

- Puerto: `3000` (configurable con `PORT`) | Postgres: `:5434` | Redis: `:6379`
- `main.go`: Punto de entrada, conexión a DB y Redis, DI y registro de middleware CORS.
- `routes/routes.go`: Definición modular de rutas.
- `controllers/`: Lógica HTTP para autenticación, catálogo, pedidos, comisiones y salud.
- `models/models.go`: Modelos Go y DTOs (`APIError`, `LoginRequest`, `Producto`, `CheckoutRequest`, etc.).
- `repository/`: Capa de persistencia SQL pura con transacciones pesimistas (`FOR UPDATE`).
- `config/`: Pool de PostgreSQL (`pgx`) y cliente Redis (`go-redis`).

## Contratos Clave

- **Error Canónico:** Siempre `{"status": N, "message": "...", "details": "..."}`.
- **Login:** `POST /api/login` → `200 {"token": "JWT", "email": "...", "rol": "admin"|"cliente"}`.
- **Checkout:** `POST /api/checkout` (requiere JWT) → Transacción ACID: valida stock, crea pedido y registra comisiones en ledger.
- **Comisiones MLM:** 3 niveles en cadena ascendente (Nivel 1: 10%, Nivel 2: 5%, Nivel 3: 2%).
