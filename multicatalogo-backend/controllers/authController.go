// controllers/authController.go
package controllers

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/models"
)

// Login es la función controladora que valida credenciales y entrega el rol del usuario.
func Login(c *fiber.Ctx) error {
	var req models.LoginRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "Cuerpo de petición inválido",
		})
	}

	// Validación de campos vacíos (Fase 1 DRS)
	email := strings.TrimSpace(req.Email)
	password := strings.TrimSpace(req.Password)

	if email == "" || password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "El correo electrónico y la contraseña son obligatorios",
		})
	}

	// Verificación de credenciales con soporte de roles (admin y cliente)
	switch {
	case email == "admin@upse.edu.ec" && password == "123456":
		return c.JSON(fiber.Map{
			"token": "fake-jwt-token-admin-123",
			"email": email,
			"rol":   "admin",
		})
	case email == "cliente@upse.edu.ec" && password == "123456":
		return c.JSON(fiber.Map{
			"token": "fake-jwt-token-cliente-456",
			"email": email,
			"rol":   "cliente",
		})
	default:
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status:  fiber.StatusUnauthorized,
			Message: "Credenciales incorrectas",
		})
	}
}
