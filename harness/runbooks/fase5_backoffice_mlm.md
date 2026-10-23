# RUNBOOK FASE 5: BACK-OFFICE REAL, RED MLM Y LEDGER DE COMISIONES (U1+U2 AVANZADO)

## 1. Contexto y Objetivos
Hacer crecer el negocio permitiendo registro público con código de patrocinador (`?ref=`), persistencia del ledger inmutable de comisiones, trazabilidad de pedidos y liquidaciones.

## 2. Archivos Afectados
- `multicatalogo-backend/database/004_backoffice.sql`
- `multicatalogo-backend/controllers/authController.go` (`POST /api/register`)
- `multicatalogo-backend/controllers/pedidoController.go`
- `multicatalogo-backend/controllers/liqController.go`
- `multicatalogo-frontend/src/components/Registro.tsx`
- `multicatalogo-frontend/src/components/MisPedidos.tsx`

## 3. Tareas Técnicas Detalladas
1. **Migración de Datos `004_backoffice.sql`:**
   - `ALTER usuarios`: `+ nombre`, `+ activo DEFAULT true`, `+ referido_id FK`.
   - `ALTER referidos`: `+ codigo VARCHAR UNIQUE`.
   - Tabla `comisiones(id, pedido_id, referido_id, nivel, porcentaje, monto, estado DEFAULT 'pendiente')`.
   - Tabla `liquidaciones(id, referido_id, total, estado, creado_en)`.
2. **Registro de Usuarios con Patrocinador:**
   - `POST /api/register` con `{nombre, email, password, ref?}`.
   - Si viene `ref`, asociar `parent_id` al referido que posee ese código.
3. **Ledger de Comisiones:**
   - Insertar comisiones en la misma transacción del pedido.
4. **Liquidaciones:**
   - `POST /api/liquidaciones` marca comisiones como `pagada`.

## 4. Verificación con AI Harness
```powershell
python harness/ai_harness.py status
python harness/ai_harness.py test all
```
