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
			ID:           1000,
			ClienteEmail: "admin@upse.edu.ec",
			Total:        129.00,
			Estado:       "entregado",
			Items: []models.ItemPedido{
				{ProductoID: 8, Cantidad: 1, PrecioUnitario: 129.00},
			},
		},
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
		{
			ID:           1006,
			ClienteEmail: "ana@upse.edu.ec",
			Total:        80.00,
			Estado:       "enviado",
			Items: []models.ItemPedido{
				{ProductoID: 5, Cantidad: 1, PrecioUnitario: 58.00},
				{ProductoID: 15, Cantidad: 1, PrecioUnitario: 22.00},
			},
		},
		{
			ID:           1007,
			ClienteEmail: "carlos@upse.edu.ec",
			Total:        48.00,
			Estado:       "entregado",
			Items: []models.ItemPedido{
				{ProductoID: 11, Cantidad: 1, PrecioUnitario: 48.00},
			},
		},
		{
			ID:           1008,
			ClienteEmail: "marta@upse.edu.ec",
			Total:        68.50,
			Estado:       "entregado",
			Items: []models.ItemPedido{
				{ProductoID: 16, Cantidad: 1, PrecioUnitario: 30.00},
				{ProductoID: 12, Cantidad: 1, PrecioUnitario: 38.50},
			},
		},
		{
			ID:           1009,
			ClienteEmail: "admin@upse.edu.ec",
			Total:        78.00,
			Estado:       "enviado",
			Items: []models.ItemPedido{
				{ProductoID: 18, Cantidad: 1, PrecioUnitario: 78.00},
			},
		},
		{
			ID:           1010,
			ClienteEmail: "marta@upse.edu.ec",
			Total:        42.00,
			Estado:       "preparando",
			Items: []models.ItemPedido{
				{ProductoID: 13, Cantidad: 1, PrecioUnitario: 42.00},
			},
		},
		{
			ID:           1011,
			ClienteEmail: "valeria@upse.edu.ec",
			Total:        71.00,
			Estado:       "entregado",
			Items: []models.ItemPedido{
				{ProductoID: 17, Cantidad: 1, PrecioUnitario: 35.00},
				{ProductoID: 9, Cantidad: 1, PrecioUnitario: 36.00},
			},
		},
		{
			ID:           1012,
			ClienteEmail: "valeria@upse.edu.ec",
			Total:        42.00,
			Estado:       "enviado",
			Items: []models.ItemPedido{
				{ProductoID: 10, Cantidad: 1, PrecioUnitario: 24.00},
				{ProductoID: 14, Cantidad: 1, PrecioUnitario: 18.00},
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

	if config.DBPool != nil {
		rows, err := config.DBPool.Query(c.Context(), `
			SELECT id, cliente_email, total, estado
			FROM pedidos
			WHERE cliente_email = $1
			ORDER BY id DESC
		`, claims.Email)
		if err == nil {
			defer rows.Close()
			var dbPedidos []models.Pedido
			for rows.Next() {
				var p models.Pedido
				if err := rows.Scan(&p.ID, &p.ClienteEmail, &p.Total, &p.Estado); err == nil {
					p.Items = []models.ItemPedido{}
					dbPedidos = append(dbPedidos, p)
				}
			}

			for i := range dbPedidos {
				itemRows, err := config.DBPool.Query(c.Context(), `
					SELECT producto_id, cantidad, precio_unitario
					FROM pedido_items
					WHERE pedido_id = $1
				`, dbPedidos[i].ID)
				if err == nil {
					for itemRows.Next() {
						var item models.ItemPedido
						if err := itemRows.Scan(&item.ProductoID, &item.Cantidad, &item.PrecioUnitario); err == nil {
							dbPedidos[i].Items = append(dbPedidos[i].Items, item)
						}
					}
					itemRows.Close()
				}
			}

			if len(dbPedidos) > 0 {
				return c.JSON(dbPedidos)
			}
		}
	}

	pedidosMutex.RLock()
	defer pedidosMutex.RUnlock()

	misPedidos := make([]models.Pedido, 0)
	for _, p := range pedidosStore {
		if p.ClienteEmail == claims.Email {
			misPedidos = append(misPedidos, p)
		}
	}

	return c.JSON(misPedidos)
}

// GetPedidosAdmin devuelve la lista completa de pedidos para el panel de administración.
func GetPedidosAdmin(c *fiber.Ctx) error {
	estadoFiltro := c.Query("estado")

	if config.DBPool != nil {
		query := `SELECT id, cliente_email, total, estado FROM pedidos`
		var args []interface{}
		if estadoFiltro != "" {
			query += " WHERE estado = $1 ORDER BY id DESC"
			args = append(args, estadoFiltro)
		} else {
			query += " ORDER BY id DESC"
		}

		rows, err := config.DBPool.Query(c.Context(), query, args...)
		if err == nil {
			defer rows.Close()
			var dbPedidos []models.Pedido
			for rows.Next() {
				var p models.Pedido
				if err := rows.Scan(&p.ID, &p.ClienteEmail, &p.Total, &p.Estado); err == nil {
					p.Items = []models.ItemPedido{}
					dbPedidos = append(dbPedidos, p)
				}
			}

			for i := range dbPedidos {
				itemRows, err := config.DBPool.Query(c.Context(), `
					SELECT producto_id, cantidad, precio_unitario
					FROM pedido_items
					WHERE pedido_id = $1
				`, dbPedidos[i].ID)
				if err == nil {
					for itemRows.Next() {
						var item models.ItemPedido
						if err := itemRows.Scan(&item.ProductoID, &item.Cantidad, &item.PrecioUnitario); err == nil {
							dbPedidos[i].Items = append(dbPedidos[i].Items, item)
						}
					}
					itemRows.Close()
				}
			}

			if len(dbPedidos) > 0 {
				return c.JSON(dbPedidos)
			}
		}
	}

	pedidosMutex.RLock()
	defer pedidosMutex.RUnlock()

	if estadoFiltro == "" {
		all := make([]models.Pedido, len(pedidosStore))
		copy(all, pedidosStore)
		return c.JSON(all)
	}

	filtrados := make([]models.Pedido, 0)
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
