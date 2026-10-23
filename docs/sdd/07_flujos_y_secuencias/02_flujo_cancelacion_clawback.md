# SDD-07.2: FLUJOS Y SECUENCIAS — CANCELACIÓN Y REVERSIÓN (CLAWBACK)

## 1. Principio de Transacción Espejo (Clawback)

En un negocio multinivel, si un pedido es cancelado o devuelto por el comprador, el sistema no puede limitarse a cambiar un flag en la cabecera del pedido. Hacerlo sin una transacción de reversión completa causaría dos inconsistencias graves:
1. **Pérdida de Inventario:** El stock físico volvería a bodega pero no en la base de datos.
2. **Fraude en Comisiones:** Los distribuidores cobrarían comisiones por ventas que nunca se concretaron.

---

## 2. Diagrama de Secuencia de Cancelación

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrador
    participant SPA as React Admin (:5173)
    participant AuthMW as RequireAdmin Middleware
    participant Controller as PedidoController
    participant Repo as PostgresRepository
    participant PG as PostgreSQL 16 (:5434)
    participant Redis as Redis (:6379)

    Admin->>SPA: Clic en "Cancelar Pedido #42"
    SPA->>AuthMW: PATCH /api/pedidos/42/estado {"estado": "cancelado"}
    AuthMW->>AuthMW: Verificar rol === 'admin'
    AuthMW->>Controller: Invocar controlador con pedidoID = 42

    Controller->>Repo: CancelarPedido(ctx, 42)
    Repo->>PG: BEGIN TRANSACTION

    Repo->>PG: SELECT estado FROM pedidos WHERE id = 42 FOR UPDATE
    Note over Repo,PG: Validar que el pedido no esté ya 'cancelado' o 'entregado'

    Repo->>PG: UPDATE pedidos SET estado = 'cancelado' WHERE id = 42

    loop Por cada item en pedido_items WHERE pedido_id = 42
        Repo->>PG: UPDATE productos SET stock = stock + item.cantidad WHERE id = item.producto_id
    end

    Repo->>PG: UPDATE comisiones SET estado = 'revertida' WHERE pedido_id = 42

    Repo->>PG: UPDATE referidos SET ventas = ventas - monto WHERE id IN (upline_afectado)

    Repo->>PG: COMMIT TRANSACTION
    Repo-->>Controller: Cancelación exitosa

    Controller->>Redis: DEL "productos:all"
    Controller->>Redis: DEL "red:tree:*"

    Controller-->>SPA: 200 OK {"message": "Pedido cancelado, inventario repuesto y comisiones revertidas"}
    SPA-->>Admin: Actualiza estado en UI a badge rojo 'cancelado'
```
