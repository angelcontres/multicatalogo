# DIRECTIVAS DE AGENTES IA — MultiCatálogo

> **PROPÓSITO:** Esta guía establece las directivas obligatorias para cualquier modelo o agente de IA que opere sobre este repositorio. El objetivo es maximizar la precisión, garantizar la adherencia a la arquitectura de software del sílabo y minimizar drásticamente el consumo de tokens.

---

## 1. PROTOCOLO DE ARRANQUE Y AHORRO DE TOKENS

1. **Lectura Mandatoria Inicial:**
   - **NUNCA** hagas escaneos recursivos ni ejecutes búsquedas globales de código a ciegas.
   - Lee **PRIMERO** `PROJECT_MAP.md` para ubicar el componente y archivo exacto antes de leer código.
   - Lee `REQUIREMENTS_CHECKLIST.md` para conocer el estado actual y qué falta por implementar.
   - Consulta `docs/LEVANTAMIENTO_REQUERIMIENTOS.md` para cualquier duda sobre especificación formal, reglas de negocio o contratos API.
   - Consulta `docs/sdd/` para detalles de diseño de software (diagramas C4, esquemas DDL, flujos de secuencia ACID y patrones de caché).

2. **Edición Quirúrgica de Código:**
   - Modifica únicamente las líneas o bloques puntuales necesarios.
   - **PROHIBIDO** reescribir archivos enteros si solo cambia una función o un tipo.
   - Preserva todos los comentarios y documentación técnica preexistente.

3. **Ciclo de Actualización del Progreso:**
   - Cada vez que completes una tarea, endpoint o prueba con éxito, actualiza de inmediato `REQUIREMENTS_CHECKLIST.md` marcando `- [x]` y actualizando la tabla de "Estado General".

---

## 2. REGLAS ARQUITECTÓNICAS Y DE NEGOCIO DEL SISTEMA

1. **Separación de Capas en Backend (`multicatalogo-backend/`):**
   - `routes/routes.go`: Registro exclusivo de endpoints y cableado de dependencias.
   - `controllers/`: Manejo de peticiones HTTP, extracción de parámetros, validación de DTOs y formateo de respuesta.
   - `repository/`: Operaciones SQL puras contra PostgreSQL mediante `pgx`. No poner lógica HTTP aquí.
   - `models/models.go`: Definición de DTOs y structs compartidos.
   - `config/`: Inicialización de conexiones a base de datos (`db.go`) y Redis (`redis.go`).

2. **Contrato Canónico de Error:**
   - Todo error HTTP devuelto por la API **DEBE** usar la estructura:
     ```json
     {
       "status": 400,
       "message": "Mensaje legible para el usuario",
       "details": "Detalle técnico interno (solo con APP_ENV=dev)"
     }
     ```

3. **Seguridad por Defecto (Zero Trust):**
   - Ningún endpoint nuevo nace sin validación ni autenticación.
   - Todo endpoint administrativo debe estar protegido con `RequireAdmin`.
   - La identidad del usuario en operaciones de checkout se extrae **obligatoriamente** del token JWT (`c.Locals`), nunca de un email provisto en el cuerpo JSON.
   - Contraseñas siempre hasheadas con `bcrypt`.

4. **Transaccionalidad ACID y Concurrencia:**
   - Operaciones de compra (`POST /api/checkout`) deben ejecutarse dentro de una transacción con bloqueo pesimista `SELECT ... FOR UPDATE` sobre el stock.
   - El cálculo de comisiones MLM ascendentes se ejecuta de forma asíncrona mediante Goroutines desacopladas tras el `COMMIT` del pedido.
   - Si un pedido se cancela, debe ejecutarse la transacción reversa: restauración de stock y clawback de comisiones (`revertida`).

5. **Patrón Cache-Aside (Redis):**
   - `GET /api/productos` lee de `productos:all` (TTL 5m).
   - `GET /api/red` lee de `red:tree:{email}` (TTL 10m).
   - Toda escritura transaccional (checkout, CRUD productos) debe invalidar inmediatamente sus claves en Redis.
   - Si Redis está inaccesible, la API debe degradarse elegantemente consultando PostgreSQL directamente sin colapsar.

6. **Reglas de Comisiones MLM:**
   - Nivel 1 (Patrocinador directo): **10%**.
   - Nivel 2 (Patrocinador secundario): **5%**.
   - Nivel 3 (Patrocinador terciario): **2%**.
   - Más allá del nivel 3: **0%**.

---

## 3. USO DEL AI HARNESS Y VALIDACIÓN AUTOMATIZADA

Utiliza siempre las herramientas provistas en `harness/` para verificar tus cambios antes de reportar la tarea como completada:

```powershell
# Diagnóstico general del entorno (Go, Node, Docker, Puertos)
python harness/ai_harness.py doctor

# Reporte compacto del estado de requerimientos
python harness/ai_harness.py status

# Verificación de lógica pura de comisiones MLM
python harness/ai_harness.py test mlm

# Verificación de contratos y estructura de endpoints
python harness/ai_harness.py test contracts

# Simulación de fallos y comportamiento ACID
python harness/ai_harness.py test acid-sim

# Auditoría de tokens del workspace para evitar saturación de contexto
python harness/ai_harness.py token-audit
```

---

## 4. CONVENCIONES DE PUERTOS Y ENTORNO

| Servicio | Puerto Host | Notas de Configuración |
|---|---|---|
| Frontend (React / Vite) | `5173` | Configurable en `vite.config.ts` |
| Backend (Go / Fiber) | `3000` | Configurable vía variable `PORT` (ej. 3001) |
| PostgreSQL 16 | `5434` | Puerto 5434 para evitar colisiones locales con 5432 o 5433 |
| Redis Alpine | `6379` | Servicio Docker estándar |
