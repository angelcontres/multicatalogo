# SOFTWARE DESIGN DOCUMENT (SDD) — MultiCatálogo
## Documento Maestro de Diseño de Software

> **Proyecto:** MultiCatálogo — Plataforma de E-commerce Cosmético con Red Multinivel (MLM)  
> **Asignatura:** Framework Programación Web (UPSE, Periodo 2026-02)  
> **Estándar:** Basado en IEEE 1016-2009 y Modelo C4  
> **Versión:** 2.0.0 (Modular por Carpetas)  
> **Requerimientos Asociados:** [`docs/LEVANTAMIENTO_REQUERIMIENTOS.md`](file:///C:/Users/OMEN/Documents/remontada/docs/LEVANTAMIENTO_REQUERIMIENTOS.md)

---

## 1. PROPÓSITO Y ORGANIZACIÓN DEL SDD

El objetivo de este documento de diseño de software (SDD) es especificar de forma técnica y rigurosa la arquitectura interna, diseño estructural, interacción de componentes, modelos de datos, protocolos de seguridad y patrones de concurrencia del sistema **MultiCatálogo**.

Para garantizar la máxima legibilidad, mantenimiento y ahorro de contexto para agentes de Inteligencia Artificial y desarrolladores humanos, el SDD se encuentra modularizado en las siguientes carpetas temáticas:

| Directorio | Contenido y Enfoque Técnico | Documentos |
|---|---|---|
| [`01_arquitectura_general/`](file:///C:/Users/OMEN/Documents/remontada/docs/sdd/01_arquitectura_general/) | Visión de alto nivel, Modelo C4 (Contexto, Contenedores), topología políglota y principios de diseño. | - `01_c4_model_y_contenedores.md`<br>- `02_patrones_arquitectonicos.md` |
| [`02_diseno_frontend/`](file:///C:/Users/OMEN/Documents/remontada/docs/sdd/02_diseno_frontend/) | Arquitectura de la SPA en React 19 + TypeScript + Tailwind v4, jerarquía de componentes, UI full-screen, estado global y servicios. | - `01_componentes_y_layout.md`<br>- `02_estado_global_y_servicios.md` |
| [`03_diseno_backend/`](file:///C:/Users/OMEN/Documents/remontada/docs/sdd/03_diseno_backend/) | Arquitectura en capas en Go 1.27 + Fiber v2, Inyección de Dependencias por interfaces y concurrencia con Goroutines desacopladas. | - `01_capas_y_inyeccion_dependencias.md`<br>- `02_concurrencia_y_goroutines.md` |
| [`04_persistencia_y_datos/`](file:///C:/Users/OMEN/Documents/remontada/docs/sdd/04_persistencia_y_datos/) | Esquema relacional PostgreSQL 16, DDL, índices, bloqueo pesimista `SELECT ... FOR UPDATE` y transacciones ACID. | - `01_modelo_relacional_y_ddl.md`<br>- `02_transacciones_acid_y_bloqueos.md` |
| [`05_cache_y_rendimiento/`](file:///C:/Users/OMEN/Documents/remontada/docs/sdd/05_cache_y_rendimiento/) | Patrón Cache-Aside con Redis Alpine (go-redis v9), claves, TTLs, invalidación reactiva y degradación elegante. | - `01_patron_cache_aside_redis.md` |
| [`06_seguridad_y_auth/`](file:///C:/Users/OMEN/Documents/remontada/docs/sdd/06_seguridad_y_auth/) | Autenticación JWT sin estado, hashing `bcrypt`, RBAC (`RequireAuth`, `RequireAdmin`), Zero-Trust y vinculación estricta de identidad. | - `01_jwt_rbac_y_zero_trust.md` |
| [`07_flujos_y_secuencias/`](file:///C:/Users/OMEN/Documents/remontada/docs/sdd/07_flujos_y_secuencias/) | Diagramas de secuencia de procesos transaccionales: Checkout ACID + Comisiones asíncronas, y Cancelación simétrica con Clawback. | - `01_flujo_checkout_y_comisiones.md`<br>- `02_flujo_cancelacion_clawback.md` |

---

## 2. PILARES ARQUITECTÓNICOS DEL SISTEMA

1. **Inversión de Control e Inyección de Dependencias (IoC / DI):** Las capas externas dependen de interfaces (`DBRepository`, `CacheRepository`). Cero variables globales mutables fuera de `main.go`.
2. **Atomicidad Transaccional Pesimista:** La compra es una transacción cerrada. El stock nunca se descuenta en memoria ni de forma optimista; se asegura mediante bloqueo en PostgreSQL.
3. **Desacoplamiento Concurrente:** Procesos no bloqueantes (cálculo de comisiones a 3 niveles e invalidación de caché) son delegados a Goroutines asíncronas con contextos independientes tras el `COMMIT`.
4. **Resiliencia y Degradación Elegante:** Si la caché Redis falla o el servicio no responde, la API atiende directamente sobre PostgreSQL sin emitir HTTP 500 al cliente.
5. **Aislamiento de Estado Mobile-First:** El carrito persiste en `localStorage` aislado por usuario (`multicatalogo_carrito_<email>`). La interfaz está garantizada a 360px sin desbordamiento.
