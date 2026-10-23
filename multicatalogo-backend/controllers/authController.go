// controllers/authController.go
package controllers

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/config"
	"multicatalogo-backend/models"
)

// RegisterRequest define el cuerpo esperado para el alta de un nuevo cliente/distribuidor.
type RegisterRequest struct {
	Nombre   string `json:"nombre"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Ref      string `json:"ref,omitempty"` // Código de referido opcional
}

// Login valida credenciales y entrega un JWT criptográfico real firmado con HS256.
func Login(c *fiber.Ctx) error {
	var req models.LoginRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "Cuerpo de petición inválido",
		})
	}

	email := strings.TrimSpace(req.Email)
	password := strings.TrimSpace(req.Password)

	if email == "" || password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "El correo electrónico y la contraseña son obligatorios",
		})
	}

	// Comprobación de credenciales
	var userID int
	var rol string

	switch {
	case email == "admin@upse.edu.ec" && (password == "123456" || password == "admin"):
		userID = 1
		rol = "admin"
	case email == "cliente@upse.edu.ec" && (password == "123456" || password == "user"):
		userID = 2
		rol = "cliente"
	case email == "ana@upse.edu.ec" && (password == "123456" || password == "user"):
		userID = 3
		rol = "cliente"
	case email == "marta@upse.edu.ec" && (password == "123456" || password == "user"):
		userID = 4
		rol = "cliente"
	case email == "carlos@upse.edu.ec" && (password == "123456" || password == "user"):
		userID = 5
		rol = "cliente"
	case email == "valeria@upse.edu.ec" && (password == "123456" || password == "user"):
		userID = 6
		rol = "cliente"
	default:
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status:  fiber.StatusUnauthorized,
			Message: "Credenciales incorrectas",
		})
	}

	// Emisión de token JWT real
	token, err := config.GenerateToken(userID, email, rol)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status:  fiber.StatusInternalServerError,
			Message: "Error al generar token de sesión",
		})
	}

	return c.JSON(fiber.Map{
		"token": token,
		"email": email,
		"rol":   rol,
	})
}

// Register permite a nuevos usuarios crear su cuenta con código de referido opcional.
func Register(c *fiber.Ctx) error {
	var req RegisterRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "Cuerpo de registro inválido",
		})
	}

	nombre := strings.TrimSpace(req.Nombre)
	email := strings.TrimSpace(req.Email)
	password := strings.TrimSpace(req.Password)

	if nombre == "" || email == "" || password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "Nombre, email y contraseña son obligatorios",
		})
	}

	// Simulación de validación de unicidad
	if email == "admin@upse.edu.ec" || email == "cliente@upse.edu.ec" {
		return c.Status(fiber.StatusConflict).JSON(models.APIError{
			Status:  fiber.StatusConflict,
			Message: "El correo electrónico ya se encuentra registrado",
		})
	}

	userID := 10 + len(email)
	token, err := config.GenerateToken(userID, email, "cliente")
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status:  fiber.StatusInternalServerError,
			Message: "Error al generar sesión tras el registro",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"token":   token,
		"email":   email,
		"nombre":  nombre,
		"rol":     "cliente",
		"message": "Usuario registrado exitosamente en la red MultiCatálogo",
	})
}
