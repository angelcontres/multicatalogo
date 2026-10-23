# RUNBOOK FASE 1: ARQUITECTURA Y API ROBUSTA (UNIDAD 2, TEMA 2)

## 1. Contexto y Objetivos
Refactorizar el backend para desacoplar el manejo de errores mediante el contrato canónico `APIError`, implementar validaciones estrictas de entrada y habilitar el endpoint de verificación de salud `/api/health`.

## 2. Archivos Afectados
- `multicatalogo-backend/models/models.go`
- `multicatalogo-backend/controllers/authController.go`
- `multicatalogo-backend/controllers/prodController.go`
- `multicatalogo-backend/controllers/healthController.go` (nuevo)
- `multicatalogo-backend/routes/routes.go`

## 3. Tareas Técnicas Detalladas
1. **`models/models.go`:**
   - Crear struct `APIError`:
     ```go
     type APIError struct {
         Status  int         `json:"status"`
         Message string      `json:"message"`
         Details interface{} `json:"details,omitempty"`
     }
     ```
2. **`controllers/authController.go`:**
   - Validar que `Email` y `Password` no vengan vacíos.
   - Si faltan, devolver HTTP 400 con `APIError{Status: 400, Message: "Email y contraseña requeridos"}`.
   - Si credenciales no coinciden, devolver HTTP 401 con `APIError{Status: 401, Message: "Credenciales incorrectas"}`.
3. **`controllers/prodController.go`:**
   - En `GetProductoPorID`, convertir `c.Params("id")` con `strconv.Atoi`.
   - Si falla, devolver HTTP 400 con `APIError{Status: 400, Message: "El ID del producto debe ser numérico"}`.
4. **`controllers/healthController.go`:**
   - Crear función `HealthCheck(c *fiber.Ctx) error`.
   - Responder con HTTP 200 y JSON `{"status": "ok", "message": "Servidor Go/Fiber operativo"}`.
5. **`routes/routes.go`:**
   - Registrar `app.Get("/api/health", controllers.HealthCheck)`.
   - Registrar `app.Get("/api/productos/:id", controllers.GetProductoPorID)`.

## 4. Verificación con AI Harness
```powershell
python harness/ai_harness.py test contracts
```
