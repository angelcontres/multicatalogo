// middleware/auth.go
package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/config"
	"multicatalogo-backend/models"
)

// RequireAuth intercepta las peticiones y verifica la presencia y validez del JWT.
func RequireAuth() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
				Status:  fiber.StatusUnauthorized,
				Message: "Token de autorización requerido",
			})
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
				Status:  fiber.StatusUnauthorized,
				Message: "Formato de autorización inválido. Use 'Bearer <token>'",
			})
		}

		claims, err := config.VerifyToken(parts[1])
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
				Status:  fiber.StatusUnauthorized,
				Message: "Token inválido o expirado",
				Details: err.Error(),
			})
		}

		// Inyectamos las claims verificadas en el contexto local de Fiber
		c.Locals("usuario", claims)
		return c.Next()
	}
}

// OptionalAuth intenta extraer y validar el token JWT si está presente en el header Authorization,
// pero no bloquea la petición si el cliente no envía credenciales.
func OptionalAuth() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				if claims, err := config.VerifyToken(parts[1]); err == nil && claims != nil {
					c.Locals("usuario", claims)
				}
			}
		}
		return c.Next()
	}
}

// RequireAdmin valida que el usuario autenticado tenga el rol 'admin'.
func RequireAdmin() fiber.Handler {
	return func(c *fiber.Ctx) error {
		claims, ok := c.Locals("usuario").(*config.CustomClaims)
		if !ok || claims.Rol != "admin" {
			return c.Status(fiber.StatusForbidden).JSON(models.APIError{
				Status:  fiber.StatusForbidden,
				Message: "Acceso denegado: se requieren permisos de administrador",
			})
		}
		return c.Next()
	}
}
