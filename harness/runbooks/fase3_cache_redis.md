# RUNBOOK FASE 3: OPTIMIZACIÓN DE LECTURA CON REDIS (UNIDAD 2, TEMA 3)

## 1. Contexto y Objetivos
Integrar Redis bajo el patrón Cache-Aside para reducir latencia en lecturas repetitivas (catálogo y árbol multinivel), garantizando tolerancia a fallas si la caché cae.

## 2. Archivos Afectados
- `multicatalogo-backend/docker-compose.yml`
- `multicatalogo-backend/config/redis.go` (nuevo)
- `multicatalogo-backend/controllers/prodController.go`
- `multicatalogo-backend/controllers/redController.go`
- `multicatalogo-backend/main.go`

## 3. Tareas Técnicas Detalladas
1. **`docker-compose.yml`:**
   - Añadir servicio `redis` con imagen `redis:7-alpine`, puerto `6379:6379`.
2. **`config/redis.go`:**
   - Conexión con `github.com/redis/go-redis/v9`.
   - Exponer cliente global y métodos `Get`, `Set`, `Del` seguros ante punteros nulos.
3. **Controladores con Cache-Aside:**
   - `GetProductos`:
     1. Buscar clave `productos:all` en Redis.
     2. Si existe (Hit): deserializar JSON y responder directamente (<10ms).
     3. Si no existe (Miss): consultar DB, serializar, guardar en Redis con TTL de 5 min (300s) y responder.
   - `GetRed`:
     1. Buscar clave `red:tree:{email}` en Redis.
     2. Guardar con TTL de 10 min (600s).
   - Degradación: Si Redis arroja error de conexión, registrar advertencia y consultar PostgreSQL sin romper la API.

## 4. Verificación con AI Harness
```powershell
python harness/ai_harness.py test cache-eval
```
