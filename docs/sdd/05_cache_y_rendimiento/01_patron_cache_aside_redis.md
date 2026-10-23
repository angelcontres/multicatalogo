# SDD-05.1: CACHÉ Y RENDIMIENTO — PATRÓN CACHE-ASIDE CON REDIS

## 1. Convención de Claves y Políticas de Expiración (TTL)

La capa de caché en Redis opera bajo el patrón **Cache-Aside** (Lazy Loading): la aplicación consulta primero la caché; ante un fallo de lectura (*cache miss*), consulta PostgreSQL, almacena el resultado serializado en JSON con TTL y lo retorna.

| Clave Redis | Tipo de Dato | TTL (Segundos) | Justificación de Negocio | Disparadores de Invalidación |
|---|---|---|---|---|
| `productos:all` | String (JSON) | 300s (5 min) | Catálogo público consultado frecuentemente por miles de visitantes. | `POST /api/checkout`<br>`POST /api/productos`<br>`PUT /api/productos/:id`<br>`DELETE /api/productos/:id` |
| `red:tree:{email}` | String (JSON) | 600s (10 min) | Estructura jerárquica pesada de calcular; cambia solo cuando ingresan pedidos o referidos en su downline. | `POST /api/checkout`<br>`POST /api/register` |

---

## 2. Resiliencia y Degradación Elegante (Graceful Degradation)

Un requisito no funcional esencial es que la indisponibilidad de Redis (por reinicio, saturación de memoria o desconexión de red) **NUNCA debe provocar una falla en cascada ni colapsar la API**.

### Estrategia de Fallback:
1. Las operaciones contra Redis devuelven un error que es capturado y logueado como `WARN`.
2. El flujo de ejecución continúa transparentemente hacia PostgreSQL.
3. El endpoint `/api/health` evalúa las dos dependencias:
   - Si PostgreSQL falla: HTTP `503 Service Unavailable` (la API no puede operar).
   - Si Redis falla pero Postgres está vivo: HTTP `200 OK` con payload `{"status": "degraded", "redis": "down", "db": "up"}`.

```go
func (pc *ProdController) GetProductos(c *fiber.Ctx) error {
    ctx := c.Context()
    
    // 1. Intento de lectura en Caché
    if cachedJSON, err := pc.cache.Get(ctx, "productos:all"); err == nil && cachedJSON != "" {
        var productos []models.Producto
        if err := json.Unmarshal([]byte(cachedJSON), &productos); err == nil {
            c.Set("X-Cache", "HIT")
            return c.JSON(productos)
        }
    }

    // 2. Fallback a Base de Datos (Miss o Falla de Redis)
    productos, err := pc.repo.ObtenerProductos(ctx)
    if err != nil {
        return c.Status(500).JSON(models.APIError{Status: 500, Message: "Error al consultar catálogo"})
    }

    // 3. Escritura asíncrona o silenciosa en Redis (sin bloquear respuesta)
    if data, err := json.Marshal(productos); err == nil {
        _ = pc.cache.Set(ctx, "productos:all", string(data), 5*time.Minute)
    }

    c.Set("X-Cache", "MISS")
    return c.JSON(productos)
}
```
