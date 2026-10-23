// controllers/healthController.go
package controllers

import (
	"github.com/gofiber/fiber/v2"
)

// HealthCheck responde con el estado operativo del servidor Go/Fiber.
func HealthCheck(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":  "ok",
		"message": "Servidor Go/Fiber operativo",
	})
}
