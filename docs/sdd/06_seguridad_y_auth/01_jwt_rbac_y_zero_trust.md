# SDD-06.1: SEGURIDAD Y AUTENTICACIÓN — JWT, RBAC Y ZERO-TRUST

## 1. Arquitectura de Autenticación sin Estado (Stateless JWT)

La autenticación utiliza JSON Web Tokens (JWT) firmados mediante el algoritmo HMAC-SHA256 (`HS256`) utilizando una clave secreta configurable vía variable de entorno (`JWT_SECRET`).

### Estructura de Claims del Token
```json
{
  "sub": 102,
  "email": "cliente@upse.edu.ec",
  "rol": "cliente",
  "iat": 1761168000,
  "exp": 1761175200
}
```
- **Expiración:** 2 horas continuas (`exp = iat + 7200s`).
- **Validación de Integridad:** Se realiza en cada petición privada mediante el middleware `RequireAuth`.

---

## 2. Matriz de Control de Acceso Basado en Roles (RBAC)

| Endpoint | Método | Autenticación Requerida | Rol Mínimo Requerido | Identidad Extraída De |
|---|---|---|---|---|
| `/api/login` | POST | Pública | Cualquiera | Body JSON |
| `/api/register` | POST | Pública | Cualquiera | Body JSON |
| `/api/productos` | GET | Pública | Cualquiera | N/A (Cache / DB) |
| `/api/productos/:id` | GET | Pública | Cualquiera | N/A |
| `/api/checkout` | POST | `RequireAuth` | `cliente` o `admin` | **Claims JWT (`c.Locals`)** |
| `/api/pedidos/mios` | GET | `RequireAuth` | `cliente` | Claims JWT |
| `/api/red/mia` | GET | `RequireAuth` | `cliente` o `admin` | Claims JWT |
| `/api/productos` | POST | `RequireAuth` + `RequireAdmin` | **`admin`** | Claims JWT |
| `/api/productos/:id` | PUT/DELETE | `RequireAuth` + `RequireAdmin` | **`admin`** | Claims JWT |
| `/api/pedidos` | GET | `RequireAuth` + `RequireAdmin` | **`admin`** | Claims JWT |
| `/api/pedidos/:id/estado` | PATCH | `RequireAuth` + `RequireAdmin` | **`admin`** | Claims JWT |
| `/api/liquidaciones` | POST | `RequireAuth` + `RequireAdmin` | **`admin`** | Claims JWT |
| `/api/reportes/*` | GET | `RequireAuth` + `RequireAdmin` | **`admin`** | Claims JWT |

---

## 3. Principio Zero-Trust e Inmunidad a Suplantación (Token Binding)

En arquitecturas vulnerables, el endpoint de checkout recibe el email del cliente en el body:
`{ "email": "victima@upse.edu.ec", "total": 500.0, ... }`
Esto permite a un atacante comprar a nombre de otra persona o atribuir comisiones a cuentas ajenas.

### Solución en MultiCatálogo:
El middleware `RequireAuth` decodifica y verifica la firma del token, depositando las claims verificadas en el contexto local de la conexión Fiber (`c.Locals("usuario")`). 

El `CheckoutController` **IGNORA** cualquier campo `email` enviado en el JSON del cliente y extrae la identidad exclusivamente de `c.Locals`:

```go
func (cc *CheckoutController) PostCheckout(c *fiber.Ctx) error {
    // 1. Extraer usuario verificado del token
    claims, ok := c.Locals("user").(*jwt.MapClaims)
    if !ok {
        return c.Status(401).JSON(models.APIError{Status: 401, Message: "Token inválido o ausente"})
    }
    
    usuarioEmail := (*claims)["email"].(string)
    usuarioID := int((*claims)["sub"].(float64))

    var req models.CheckoutRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(models.APIError{Status: 400, Message: "Payload inválido"})
    }

    // SOBREESCRITURA OBLIGATORIA CON LA IDENTIDAD CRIPTOGRÁFICA
    req.Email = usuarioEmail

    // Ejecución segura de la compra...
    return nil
}
```

---

## 4. Criptografía de Contraseñas con `bcrypt`

Las contraseñas nunca se persisten en texto plano:
1. En el registro (`POST /api/register`), la contraseña pasa por `bcrypt.GenerateFromPassword([]byte(pass), 12)`.
2. En la autenticación (`POST /api/login`), se valida con `bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))`.
3. Previene ataques por fuerza bruta mediante costo computacional calibrado.
