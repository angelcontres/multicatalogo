# RUNBOOK FASE 4: INYECCIÓN DE DEPENDENCIAS, CHECKOUT ACID Y GOROUTINES MLM (UNIDAD 2, TEMA 4)

## 1. Contexto y Objetivos
Construir el núcleo transaccional del checkout con inyección de dependencias estricta, bloqueo pesimista de stock, cálculo asíncrono de comisiones multinivel e invalidación de caché.

## 2. Archivos Afectados
- `multicatalogo-backend/repository/repository.go` (interfaces y PostgreSQL)
- `multicatalogo-backend/controllers/checkoutController.go` (nuevo)
- `multicatalogo-backend/database/002_checkout.sql` (nuevo)
- `multicatalogo-backend/routes/routes.go`
- `multicatalogo-backend/main.go`

## 3. Tareas Técnicas Detalladas
1. **Inyección de Dependencias:**
   - Declarar interfaz `DBRepository` y `CacheRepository`.
   - Controladores instanciados como structs con dependencias inyectadas: `type CheckoutController struct { repo DBRepository; cache CacheRepository }`.
2. **Migración de Tablas:**
   - Tabla `pedidos` (id, cliente_email, total, fecha, estado).
   - Tabla `pedido_items` (id, pedido_id, producto_id, cantidad, precio_unitario).
   - Añadir columna `stock` en `productos`.
3. **Transacción ACID en `CrearPedido`:**
   - Iniciar `tx, err := db.Begin(ctx)`.
   - `SELECT stock FROM productos WHERE id = $1 FOR UPDATE`.
   - Validar stock >= cantidad solicitada. Si falla -> `tx.Rollback()`.
   - Descontar stock: `UPDATE productos SET stock = stock - $1 WHERE id = $2`.
   - Insertar pedido y detalle recalculando total en servidor.
   - `tx.Commit()`.
4. **Goroutine de Comisiones MLM (Concurrencia):**
   - Disparar `go repo.CalcularComisiones(context.Background(), total, usuarioID)`.
   - Subir hasta 3 niveles por `parent_id` (Nivel 1: 10%, Nivel 2: 5%, Nivel 3: 2%).
5. **Invalidación de Caché:**
   - Tras el checkout: `cache.Del("productos:all")` y `cache.Del("red:tree:*")`.

## 4. Verificación con AI Harness
```powershell
python harness/ai_harness.py test mlm
python harness/ai_harness.py test acid-sim
```
