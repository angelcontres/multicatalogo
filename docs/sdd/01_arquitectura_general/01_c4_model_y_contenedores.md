# SDD-01.1: MODELO C4 Y CONTENEDORES DEL SISTEMA

## 1. Diagrama de Contexto del Sistema (C4 - Nivel 1)

El sistema **MultiCatálogo** atiende a usuarios públicos, clientes registrados, distribuidores de la red multinivel y administradores del negocio, interactuando con pasarelas de notificación y servicios de base de datos.

```mermaid
flowchart TD
    subgraph Usuarios ["Usuarios del Sistema"]
        UserPub["Visitante / Cliente Potencial"]
        UserCli["Cliente Comprador"]
        UserDis["Distribuidor / Líder MLM"]
        UserAdm["Administrador del Negocio"]
    end

    subgraph MultiCatalogoSystem ["Sistema MultiCatálogo (Límite del Sistema)"]
        SPA["Frontend SPA (React 19 + Vite)"]
        API["Backend API Transaccional (Go / Fiber)"]
        SaaS["Capa SaaS / Multitenant (FastAPI - Proyectada)"]
    end

    subgraph ExternalServices ["Sistemas Externos & Persistencia"]
        DB[("PostgreSQL 16 (Datos Transaccionales)")]
        RedisCache[("Redis Alpine (Caché & Sesiones)")]
    end

    UserPub -->|Explora catálogo y storefront| SPA
    UserCli -->|Compra y gestiona pedidos| SPA
    UserDis -->|Gestiona red y comisiones| SPA
    UserAdm -->|Supervisa KPIs y liquidaciones| SPA

    SPA -->|REST API over HTTPS / JWT| API
    SPA -.->|REST API SaaS| SaaS
    API -->|TCP / pgxpool :5434| DB
    API -->|TCP / RESP :6379| RedisCache
```

---

## 2. Diagrama de Contenedores (C4 - Nivel 2)

Los contenedores representan aplicaciones ejecutables, almacenes de datos o microservicios que componen la solución:

```mermaid
flowchart LR
    subgraph ClientLayer ["Capa de Cliente (Navegador)"]
        Browser["Navegador Web / Mobile\n(Chrome, Safari, Firefox)"]
    end

    subgraph FrontendApp ["Contenedor Frontend (:5173)"]
        ReactApp["React 19 SPA\nTypeScript + Vite + Tailwind v4\nReact Router v7"]
    end

    subgraph BackendCore ["Contenedor Backend Núcleo Transaccional (:3000)"]
        FiberAPI["API REST Go 1.27 + Fiber v2\n- Enrutamiento & CORS\n- Middleware JWT & RBAC\n- Motor ACID de Checkout\n- Worker Goroutine MLM"]
    end

    subgraph StorageLayer ["Capa de Almacenamiento & Caché"]
        PostgresContainer[("PostgreSQL 16 (:5434)\n- usuarios, productos\n- referidos, pedidos\n- pedido_items, comisiones\n- liquidaciones")]
        RedisContainer[("Redis 7 Alpine (:6379)\n- productos:all (5 min)\n- red:tree:{email} (10 min)")]
    end

    Browser -->|HTTP/2 / TLS| ReactApp
    ReactApp -->|JSON / REST + Bearer JWT| FiberAPI
    FiberAPI -->|SQL Nativo / pgx| PostgresContainer
    FiberAPI -->|Comandos GET/SET/DEL| RedisContainer
```

---

## 3. Topología de Red y Convenciones de Puertos

| Servicio | Contenedor / Host | Puerto Interno | Puerto Host Mapeado | Justificación de Puerto |
|---|---|---|---|---|
| **Frontend Web** | Local Node.js / Vite | `5173` | `5173` | Puerto estándar de Vite, configurable en `vite.config.ts`. |
| **Backend API** | Binario Go nativo | `3000` | `3000` (o `3001` vía `PORT`) | Configurable por variable de entorno para evitar colisión con otros servicios. |
| **PostgreSQL 16** | Docker `multicatalogo-postgres` | `5432` | `5434` | **Puerto 5434 obligatorio** para evitar colisiones con instancias locales (`postgres.exe` en 5432 y contenedores en 5433). |
| **Redis 7 Alpine** | Docker `multicatalogo-redis` | `6379` | `6379` | Puerto estándar Redis. |
