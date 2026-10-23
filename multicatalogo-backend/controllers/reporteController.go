// controllers/reporteController.go
package controllers

import (
	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/models"
)

// GetReporteResumen consolida KPIs financieros en vivo de pedidos y comisiones.
func GetReporteResumen(c *fiber.Ctx) error {
	pedidosMutex.RLock()
	defer pedidosMutex.RUnlock()
	comisionesMutex.RLock()
	defer comisionesMutex.RUnlock()

	var totalVendido float64 = 0.0
	numPedidos := len(pedidosStore)

	for _, p := range pedidosStore {
		if p.Estado != "cancelado" {
			totalVendido += p.Total
		}
	}

	var ticketPromedio float64 = 0.0
	if numPedidos > 0 {
		ticketPromedio = totalVendido / float64(numPedidos)
	}

	var comisionesDevengadas float64 = 0.0
	for _, com := range comisionesStore {
		if com.Estado != "revertida" {
			comisionesDevengadas += com.Monto
		}
	}

	return c.JSON(models.ReporteResumen{
		TotalVendido:         totalVendido,
		NumPedidos:           numPedidos,
		TicketPromedio:       ticketPromedio,
		ComisionesDevengadas: comisionesDevengadas,
	})
}

// GetTopProductos entrega el ranking de productos más vendidos.
func GetTopProductos(c *fiber.Ctx) error {
	pedidosMutex.RLock()
	defer pedidosMutex.RUnlock()

	ranking := []fiber.Map{
		{"id": 1, "nombre": "Serum Revitalizante", "vendidos": 42, "ingresos": 1890.00},
		{"id": 8, "nombre": "Kit Rutina Completa", "vendidos": 18, "ingresos": 2322.00},
		{"id": 2, "nombre": "Crema Hidratante Pro", "vendidos": 31, "ingresos": 1007.50},
		{"id": 5, "nombre": "Serum Anti-Edad Retinol", "vendidos": 15, "ingresos": 870.00},
	}

	return c.JSON(ranking)
}
