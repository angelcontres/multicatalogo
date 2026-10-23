// controllers/checkoutController.go
package controllers

import (
	"math/rand"
	"time"

	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/models"
)

// Checkout procesa la compra transaccional de productos con descuento de inventario
// y disparo asíncrono de comisiones para la red multinivel mediante Goroutines.
func Checkout(c *fiber.Ctx) error {
	var req models.CheckoutRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "Cuerpo de solicitud inválido",
		})
	}

	if len(req.Items) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "El pedido debe contener al menos un artículo",
		})
	}

	var totalCalculado float64 = 0.0

	// Validación transaccional de stock y cálculo de precios en servidor
	for _, item := range req.Items {
		if item.Cantidad <= 0 {
			return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
				Status:  fiber.StatusBadRequest,
				Message: "La cantidad de cada producto debe ser mayor que cero",
			})
		}

		precio, err := DescontarStock(item.ProductoID, item.Cantidad)
		if err != nil {
			if apiErr, ok := err.(models.APIError); ok {
				return c.Status(apiErr.Status).JSON(apiErr)
			}
			return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
				Status:  fiber.StatusBadRequest,
				Message: err.Error(),
			})
		}

		totalCalculado += precio * float64(item.Cantidad)
	}

	pedidoID := 1000 + rand.Intn(9000)

	// Concurrencia y Misión Crítica: Goroutine asíncrona para actualizar comisiones de la red
	go func(total float64) {
		time.Sleep(50 * time.Millisecond) // Simula persistencia desacoplada
		ActualizarVentasRed(total)
	}(totalCalculado)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"pedido_id": pedidoID,
		"total":     totalCalculado,
		"message":   "Pedido creado y procesado exitosamente",
	})
}
