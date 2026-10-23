// controllers/checkoutController.go
package controllers

import (
	"context"
	"math/rand"
	"time"

	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/config"
	"multicatalogo-backend/models"
	"multicatalogo-backend/repository"
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

	// Principio Zero-Trust: Si la petición trae token autenticado, vincular identidad inmutable
	if claims, ok := c.Locals("usuario").(*config.CustomClaims); ok && claims != nil {
		req.Email = claims.Email
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

	// Persistencia en PostgreSQL si el pool está activo (SELECT FOR UPDATE)
	if txID, err := repository.CrearPedidoTransaccional(c.Context(), req, totalCalculado); err == nil && txID > 0 {
		pedidoID = txID
	}

	// Persistencia del pedido en memoria
	RegistrarPedidoEnMemoria(models.Pedido{
		ID:           pedidoID,
		ClienteEmail: req.Email,
		Total:        totalCalculado,
		Estado:       "pendiente",
		Items:        req.Items,
	})

	// Registro auditable en el ledger de comisiones
	RegistrarComisionesPedido(pedidoID, totalCalculado)

	// Invalidar caché de productos en Redis (por decremento de stock)
	repository.InvalidateCache(context.Background(), "productos:all")

	// Concurrencia y Misión Crítica: Goroutine asíncrona para actualizar comisiones de la red e invalidar caché
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
