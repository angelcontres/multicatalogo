# RUNBOOK FASE 2: PERSISTENCIA RELACIONAL POSTGRESQL 16 (UNIDAD 2, TEMA 3)

## 1. Contexto y Objetivos
Migrar el almacenamiento en memoria hacia una base de datos relacional PostgreSQL 16 ejecutándose en Docker, empleando SQL nativo y pool de conexiones `pgx/v5`.

## 2. Archivos Afectados
- `multicatalogo-backend/docker-compose.yml` (nuevo)
- `multicatalogo-backend/.env.example` (nuevo)
- `multicatalogo-backend/config/db.go` (nuevo)
- `multicatalogo-backend/database/init.sql` (nuevo)
- `multicatalogo-backend/repository/repository.go` (nuevo)
- `multicatalogo-backend/main.go`

## 3. Tareas Técnicas Detalladas
1. **`docker-compose.yml`:**
   - Servicio `postgres` con imagen `postgres:16-alpine`.
   - Mapeo de puertos `5434:5432` (para evitar conflictos con PostgreSQL local).
   - Volumen persistente `pgdata:/var/lib/postgresql/data`.
   - Auto-ejecución de scripts montando `./database/init.sql:/docker-entrypoint-initdb.d/init.sql`.
2. **`database/init.sql`:**
   - DDL para `usuarios` (id, email, password, rol).
   - DDL para `productos` (id, nombre, descripcion, precio, categoria, img, galeria TEXT[]).
   - DDL para `referidos` (id, nombre, nivel, ventas, parent_id FK auto-referenciada).
   - Seeds idénticos a los del mock.
3. **`config/db.go`:**
   - Crear pool `pgxpool.New(context.Background(), connString)`.
   - Exponer función `ConnectDB()` y `CloseDB()`.
4. **`repository/repository.go`:**
   - Crear funciones:
     - `BuscarUsuarioPorCredenciales(email, password string) (*models.Usuario, error)`
     - `ObtenerProductos() ([]models.Producto, error)`
     - `ObtenerProductoPorID(id int) (*models.Producto, error)`
     - `ObtenerRed() ([]models.Referido, error)` (reconstrucción jerárquica)
