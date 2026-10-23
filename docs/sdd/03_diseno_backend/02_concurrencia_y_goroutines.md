# SDD-03.2: DISEÑO BACKEND — CONCURRENCIA Y GOROUTINES

## 1. Patrón de Desacoplamiento Concurrente para Comisiones MLM

El cálculo de comisiones multinivel involucra recorrer la jerarquía de patrocinadores ascendentes (*upline*) hasta 3 niveles y actualizar sus contadores estadísticos en base de datos. Si este proceso se ejecutara de forma síncrona dentro del ciclo de vida de la petición HTTP de checkout, la latencia para el comprador aumentaría innecesariamente.

```mermaid
sequenceDiagram
    autonumber
    actor Comprador
    participant Controller as CheckoutController
    participant Tx as Transacción ACID (DB)
    participant Worker as Goroutine Asíncrona
    participant DB as PostgreSQL
    participant Redis as Redis Cache

    Comprador->>Controller: POST /api/checkout
    Controller->>Tx: BEGIN (bloqueo stock + creación pedido)
    Tx->>Tx: INSERT pedidos, pedido_items, comisiones
    Tx-->>Controller: COMMIT exitoso (Pedido ID: 42)
    
    Note over Controller,Comprador: Respuesta inmediata (Baja latencia)
    Controller-->>Comprador: 201 Created {"pedido_id": 42, "total": 125.0}

    Note over Controller,Worker: Lanzamiento no bloqueante
    Controller-)Worker: go procesarComisiones(ctx, 125.0, usuarioID)

    Worker->>DB: SELECT parent_id FROM referidos WHERE id = usuarioID
    Worker->>DB: UPDATE referidos SET ventas = ventas + 12.5 WHERE id = upline1 (10%)
    Worker->>DB: UPDATE referidos SET ventas = ventas + 6.25 WHERE id = upline2 (5%)
    Worker->>DB: UPDATE referidos SET ventas = ventas + 2.50 WHERE id = upline3 (2%)
    Worker->>Redis: DEL "productos:all", "red:tree:*"
```

---

## 2. Gestión Segura de Contextos (`context.Context`)

### Riesgo de Cancelación Prematura
En Fiber, cuando una petición HTTP finaliza, el contexto del request (`c.Context()`) es cancelado inmediatamente por el servidor. Si una Goroutine usara ese mismo contexto, el cálculo de comisiones sería abortado a mitad de camino (`context canceled`).

### Solución Arquitectónica
La goroutine crea un contexto desacoplado e independiente con un timeout preventivo:

```go
func (cc *CheckoutController) PostCheckout(c *fiber.Ctx) error {
    // 1. Ejecutar transacción ACID de compra
    pedido, err := cc.repo.CrearPedido(c.Context(), req, usuarioID)
    if err != nil {
        return handleRepoError(c, err)
    }

    // 2. Disparar cálculo asíncrono en background con contexto propio
    go func(total float64, uid int) {
        // Contexto independiente con timeout de 10 segundos
        bgCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
        defer cancel()

        if err := cc.repo.CalcularComisiones(bgCtx, total, uid); err != nil {
            log.Printf("[ERROR] Falla al procesar comisiones asíncronas para usuario %d: %v", uid, err)
        }

        // Invalidar caché tras impacto en red
        _ = cc.cache.Del(bgCtx, "productos:all")
    }(pedido.Total, usuarioID)

    // 3. Responder de inmediato al cliente
    return c.Status(201).JSON(fiber.Map{
        "pedido_id": pedido.ID,
        "total":     pedido.Total,
        "message":   "Pedido creado y procesado exitosamente",
    })
}
```
