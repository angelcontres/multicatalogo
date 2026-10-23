// controllers/pedidoController.go
package controllers

import (
	"strconv"
	"sync"

	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/config"
	"multicatalogo-backend/models"
)

var (
	pedidosMutex sync.RWMutex
	pedidosStore = []models.Pedido{
		{
			ID:           1001,
			ClienteEmail: "cliente@upse.edu.ec",
			Total:        77.50,
			Estado:       "entregado",
			Items: []models.ItemPedido{
				{ProductoID: 1, Cantidad: 1, PrecioUnitario: 45.00},
				{ProductoID: 2, Cantidad: 1, PrecioUnitario: 32.50},
			},
		},
		{
			ID:           1002,
			ClienteEmail: "cliente@upse.edu.ec",
			Total:        84.00,
			Estado:       "enviado",
			Items: []models.ItemPedido{
				{ProductoID: 3, Cantidad: 3, PrecioUnitario: 28.00},
			},
		},
		{
			ID:           1003,
			ClienteEmail: "ana@upse.edu.ec",
			Total:        129.00,
			Estado:       "entregado",
			Items: []models.ItemPedido{
				{ProductoID: 8, Cantidad: 1, PrecioUnitario: 129.00},
			},
		},
		{
			ID:           1004,
			ClienteEmail: "carlos@upse.edu.ec",
			Total:        94.00,
			Estado:       "preparando",
			Items: []models.ItemPedido{
				{ProductoID: 5, Cantidad: 1, PrecioUnitario: 58.00},
				{ProductoID: 9, Cantidad: 1, PrecioUnitario: 36.00},
			},
		},
		{
			ID:           1005,
			ClienteEmail: "cliente@upse.edu.ec",
			Total:        50.00,
			Estado:       "pendiente",
			Items: []models.ItemPedido{
				{ProductoID: 4, Cantidad: 1, PrecioUnitario: 50.00},
			},
		},
	}
)

// RegistrarPedidoEnMemoria almacena el pedido generado durante el checkout.
func RegistrarPedidoEnMemoria(p models.Pedido) {
	pedidosMutex.Lock()
	defer pedidosMutex.Unlock()
	pedidosStore = append(pedidosStore, p)
}

// GetMisPedidos devuelve los pedidos asociados al usuario autenticado.
func GetMisPedidos(c *fiber.Ctx) error {
	claims, ok := c.Locals("usuario").(*config.CustomClaims)
	if !ok || claims == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status:  fiber.StatusUnauthorized,
			Message: "Identidad de usuario requerida",
		})
	}

	pedidosMutex.RLock()
	defer pedidosMutex.RUnlock()

	var misPedidos []models.Pedido
	for _, p := range pedidosStore {
		if p.ClienteEmail == claims.Email {
			misPedidos = append(misPedidos, p)
		}
	}

	return c.JSON(misPedidos)
}

// GetPedidosAdmin devuelve la lista completa de pedidos para el panel de administración.
func GetPedidosAdmin(c *fiber.Ctx) error {
	pedidosMutex.RLock()
	defer pedidosMutex.RUnlock()

	estadoFiltro := c.Query("estado")
	if estadoFiltro == "" {
		return c.JSON(pedidosStore)
	}

	var filtrados []models.Pedido
	for _, p := range pedidosStore {
		if p.Estado == estadoFiltro {
			filtrados = append(filtrados, p)
		}
	}
	return c.JSON(filtrados)
}

// GetPedidoPorID busca el detalle de un pedido por su identificador.
func GetPedidoPorID(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "ID de pedido inválido",
		})
	}

	pedidosMutex.RLock()
	defer pedidosMutex.RUnlock()

	for _, p := range pedidosStore {
		if p.ID == id {
			return c.JSON(p)
		}
	}

	return c.Status(fiber.StatusNotFound).JSON(models.APIError{
		Status:  fiber.StatusNotFound,
		Message: "Pedido no encontrado",
	})
}

// ActualizarEstadoPedido modifica el estado del pedido. Si se cancela,
// ejecuta la transacción reversa: repone inventario y revierte comisiones.
func ActualizarEstadoPedido(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "ID de pedido inválido",
		})
	}

	type EstadoUpdate struct {
		Estado string `json:"estado"`
	}
	var req EstadoUpdate
	if err := c.BodyParser(&req); err != nil || req.Estado == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "Estado requerido (pendiente, preparando, enviado, entregado, cancelado)",
		})
	}

	pedidosMutex.Lock()
	defer pedidosMutex.Unlock()

	for i := range pedidosStore {
		if pedidosStore[i].ID == id {
			estadoAnterior := pedidosStore[i].Estado
			pedidosStore[i].Estado = req.Estado

			// Espejo transaccional ACID: si se cancela un pedido activo, restaurar stock y revertir comisiones
			if req.Estado == "cancelado" && estadoAnterior != "cancelado" {
				for _, item := range pedidosStore[i].Items {
					RestaurarStock(item.ProductoID, item.Cantidad)
				}
				RevertirComisionesPedido(id)
			}

			return c.JSON(fiber.Map{
				"message":         "Estado del pedido actualizado exitosamente",
				"pedido_id":       id,
				"estado_anterior": estadoAnterior,
				"nuevo_estado":    req.Estado,
			})
		}
	}

	return c.Status(fiber.StatusNotFound).JSON(models.APIError{
		Status:  fiber.StatusNotFound,
		Message: "Pedido no encontrado",
	})
}
