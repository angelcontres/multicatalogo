// controllers/comisionController.go
package controllers

import (
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/config"
	"multicatalogo-backend/models"
)

var (
	comisionesMutex sync.RWMutex
	comisionesStore = []models.Comision{
		{ID: 1, PedidoID: 1001, ReferidoID: 0, Nivel: 1, Porcentaje: 0.10, Monto: 7.75, Estado: "pagada"},
		{ID: 2, PedidoID: 1002, ReferidoID: 0, Nivel: 1, Porcentaje: 0.10, Monto: 8.40, Estado: "pendiente"},
		{ID: 3, PedidoID: 1003, ReferidoID: 0, Nivel: 1, Porcentaje: 0.10, Monto: 12.90, Estado: "pagada"},
		{ID: 4, PedidoID: 1004, ReferidoID: 1, Nivel: 1, Porcentaje: 0.10, Monto: 9.40, Estado: "pagada"},
		{ID: 5, PedidoID: 1004, ReferidoID: 0, Nivel: 2, Porcentaje: 0.05, Monto: 4.70, Estado: "pendiente"},
		{ID: 6, PedidoID: 1005, ReferidoID: 0, Nivel: 1, Porcentaje: 0.10, Monto: 5.00, Estado: "pendiente"},
		{ID: 7, PedidoID: 1006, ReferidoID: 1, Nivel: 1, Porcentaje: 0.10, Monto: 8.00, Estado: "pendiente"},
		{ID: 8, PedidoID: 1006, ReferidoID: 0, Nivel: 2, Porcentaje: 0.05, Monto: 4.00, Estado: "pendiente"},
		{ID: 9, PedidoID: 1007, ReferidoID: 1, Nivel: 1, Porcentaje: 0.10, Monto: 4.80, Estado: "pagada"},
		{ID: 10, PedidoID: 1007, ReferidoID: 0, Nivel: 2, Porcentaje: 0.05, Monto: 2.40, Estado: "pendiente"},
		{ID: 11, PedidoID: 1008, ReferidoID: 0, Nivel: 1, Porcentaje: 0.10, Monto: 6.85, Estado: "pagada"},
		{ID: 12, PedidoID: 1010, ReferidoID: 0, Nivel: 1, Porcentaje: 0.10, Monto: 4.20, Estado: "pendiente"},
		{ID: 13, PedidoID: 1011, ReferidoID: 0, Nivel: 1, Porcentaje: 0.10, Monto: 7.10, Estado: "pagada"},
		{ID: 14, PedidoID: 1012, ReferidoID: 0, Nivel: 1, Porcentaje: 0.10, Monto: 4.20, Estado: "pendiente"},
		// Comisiones devengadas por Luis Poveda (Referido ID 2)
		{ID: 15, PedidoID: 1001, ReferidoID: 2, Nivel: 1, Porcentaje: 0.10, Monto: 14.50, Estado: "pagada"},
		{ID: 16, PedidoID: 1002, ReferidoID: 2, Nivel: 1, Porcentaje: 0.10, Monto: 12.00, Estado: "pendiente"},
		{ID: 17, PedidoID: 1005, ReferidoID: 2, Nivel: 2, Porcentaje: 0.05, Monto: 6.50, Estado: "pagada"},
		{ID: 18, PedidoID: 1006, ReferidoID: 2, Nivel: 1, Porcentaje: 0.10, Monto: 8.50, Estado: "pendiente"},
		// Comisiones devengadas por Marta Sánchez (Referido ID 3)
		{ID: 19, PedidoID: 1003, ReferidoID: 3, Nivel: 1, Porcentaje: 0.10, Monto: 15.00, Estado: "pagada"},
		{ID: 20, PedidoID: 1008, ReferidoID: 3, Nivel: 1, Porcentaje: 0.10, Monto: 9.50, Estado: "pendiente"},
		{ID: 21, PedidoID: 1010, ReferidoID: 3, Nivel: 2, Porcentaje: 0.05, Monto: 5.00, Estado: "pendiente"},
		// Comisiones devengadas por Carlos Ruiz (Referido ID 4)
		{ID: 22, PedidoID: 1004, ReferidoID: 4, Nivel: 1, Porcentaje: 0.10, Monto: 12.50, Estado: "pagada"},
		{ID: 23, PedidoID: 1007, ReferidoID: 4, Nivel: 1, Porcentaje: 0.10, Monto: 8.80, Estado: "pendiente"},
		{ID: 24, PedidoID: 1011, ReferidoID: 4, Nivel: 1, Porcentaje: 0.10, Monto: 7.50, Estado: "pagada"},
		// Comisiones devengadas por Valeria Castro (Referido ID 9)
		{ID: 25, PedidoID: 1009, ReferidoID: 9, Nivel: 1, Porcentaje: 0.10, Monto: 18.00, Estado: "pagada"},
		{ID: 26, PedidoID: 1011, ReferidoID: 9, Nivel: 1, Porcentaje: 0.10, Monto: 11.50, Estado: "pendiente"},
		{ID: 27, PedidoID: 1012, ReferidoID: 9, Nivel: 2, Porcentaje: 0.05, Monto: 6.20, Estado: "pagada"},
	}

	liquidacionesMutex sync.RWMutex
	liquidacionesStore = []models.Liquidacion{
		{
			ID:         1,
			ReferidoID: 1, // Ana García
			Total:      85.00,
			Estado:     "pagada",
			CreadoEn:   time.Now().Add(-168 * time.Hour).Format(time.RFC3339),
			PagadaEn:   time.Now().Add(-168 * time.Hour).Format(time.RFC3339),
		},
		{
			ID:         2,
			ReferidoID: 2, // Luis Poveda
			Total:      62.00,
			Estado:     "pagada",
			CreadoEn:   time.Now().Add(-96 * time.Hour).Format(time.RFC3339),
			PagadaEn:   time.Now().Add(-96 * time.Hour).Format(time.RFC3339),
		},
		{
			ID:         3,
			ReferidoID: 3, // Marta Sánchez
			Total:      45.00,
			Estado:     "pagada",
			CreadoEn:   time.Now().Add(-72 * time.Hour).Format(time.RFC3339),
			PagadaEn:   time.Now().Add(-72 * time.Hour).Format(time.RFC3339),
		},
		{
			ID:         4,
			ReferidoID: 4, // Carlos Ruiz
			Total:      38.00,
			Estado:     "pagada",
			CreadoEn:   time.Now().Add(-48 * time.Hour).Format(time.RFC3339),
			PagadaEn:   time.Now().Add(-48 * time.Hour).Format(time.RFC3339),
		},
		{
			ID:         5,
			ReferidoID: 9, // Valeria Castro
			Total:      52.00,
			Estado:     "pagada",
			CreadoEn:   time.Now().Add(-24 * time.Hour).Format(time.RFC3339),
			PagadaEn:   time.Now().Add(-24 * time.Hour).Format(time.RFC3339),
		},
	}
)

// RegistrarComisionesPedido inserta en el ledger las comisiones calculadas para un pedido.
func RegistrarComisionesPedido(pedidoID int, total float64) {
	comisionesMutex.Lock()
	defer comisionesMutex.Unlock()

	// Niveles MLM de la regla de negocio: 10%, 5%, 2%
	tasas := []struct {
		Nivel      int
		ReferidoID int
		Porcentaje float64
	}{
		{Nivel: 1, ReferidoID: 2, Porcentaje: 0.10},
		{Nivel: 2, ReferidoID: 1, Porcentaje: 0.05},
		{Nivel: 3, ReferidoID: 0, Porcentaje: 0.02},
	}

	for _, t := range tasas {
		c := models.Comision{
			ID:         len(comisionesStore) + 1,
			PedidoID:   pedidoID,
			ReferidoID: t.ReferidoID,
			Nivel:      t.Nivel,
			Porcentaje: t.Porcentaje,
			Monto:      total * t.Porcentaje,
			Estado:     "pendiente",
		}
		comisionesStore = append(comisionesStore, c)
	}
}

// RevertirComisionesPedido marca como 'revertida' las comisiones cuando se cancela una orden.
func RevertirComisionesPedido(pedidoID int) {
	comisionesMutex.Lock()
	defer comisionesMutex.Unlock()

	for i := range comisionesStore {
		if comisionesStore[i].PedidoID == pedidoID {
			comisionesStore[i].Estado = "revertida"
		}
	}
}

// emailToReferidoID mapea cuentas de demostración a sus identificadores de la red multinivel.
func emailToReferidoID(email string) int {
	switch email {
	case "admin@upse.edu.ec":
		return 0
	case "ana@upse.edu.ec":
		return 1
	case "cliente@upse.edu.ec":
		return 2
	case "marta@upse.edu.ec":
		return 3
	case "carlos@upse.edu.ec":
		return 4
	case "valeria@upse.edu.ec":
		return 9
	default:
		return -1
	}
}

// GetMisComisiones devuelve el ledger de comisiones correspondientes al usuario autenticado.
func GetMisComisiones(c *fiber.Ctx) error {
	claims, ok := c.Locals("usuario").(*config.CustomClaims)
	if !ok || claims == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status:  fiber.StatusUnauthorized,
			Message: "Identidad de usuario requerida",
		})
	}

	targetRefID := emailToReferidoID(claims.Email)

	// 1. Si PostgreSQL está activo, consultar comisiones persistidas
	if config.DBPool != nil {
		var args []interface{}
		query := `SELECT id, pedido_id, referido_id, nivel, porcentaje, monto, estado, liquidacion_id, COALESCE(creado_en::text, '') FROM comisiones`
		if claims.Rol != "admin" {
			query += " WHERE referido_id = $1 ORDER BY id DESC"
			args = append(args, targetRefID)
		} else {
			query += " ORDER BY id DESC"
		}

		rows, err := config.DBPool.Query(c.Context(), query, args...)
		if err == nil {
			defer rows.Close()
			misComisiones := make([]models.Comision, 0)
			var totalPendiente float64 = 0.0
			var totalPagado float64 = 0.0

			for rows.Next() {
				var com models.Comision
				if err := rows.Scan(&com.ID, &com.PedidoID, &com.ReferidoID, &com.Nivel, &com.Porcentaje, &com.Monto, &com.Estado, &com.LiquidacionID, &com.CreadoEn); err == nil {
					misComisiones = append(misComisiones, com)
					if com.Estado == "pendiente" {
						totalPendiente += com.Monto
					} else if com.Estado == "pagada" {
						totalPagado += com.Monto
					}
				}
			}
			if len(misComisiones) > 0 {
				return c.JSON(fiber.Map{
					"comisiones":      misComisiones,
					"total_pendiente": totalPendiente,
					"total_pagado":    totalPagado,
				})
			}
		}
	}

	// 2. Fallback de memoria
	comisionesMutex.RLock()
	defer comisionesMutex.RUnlock()

	misComisiones := make([]models.Comision, 0)
	var totalPendiente float64 = 0.0
	var totalPagado float64 = 0.0

	for _, com := range comisionesStore {
		if claims.Rol == "admin" || com.ReferidoID == targetRefID {
			misComisiones = append(misComisiones, com)
			if com.Estado == "pendiente" {
				totalPendiente += com.Monto
			} else if com.Estado == "pagada" {
				totalPagado += com.Monto
			}
		}
	}

	return c.JSON(fiber.Map{
		"comisiones":      misComisiones,
		"total_pendiente": totalPendiente,
		"total_pagado":    totalPagado,
	})
}

// GetLiquidaciones lista los pagos de comisiones realizados.
func GetLiquidaciones(c *fiber.Ctx) error {
	if config.DBPool != nil {
		rows, err := config.DBPool.Query(c.Context(), `
			SELECT id, referido_id, total, estado, COALESCE(creado_en::text, ''), COALESCE(pagada_en::text, '')
			FROM liquidaciones
			ORDER BY id DESC
		`)
		if err == nil {
			defer rows.Close()
			list := make([]models.Liquidacion, 0)
			for rows.Next() {
				var l models.Liquidacion
				if err := rows.Scan(&l.ID, &l.ReferidoID, &l.Total, &l.Estado, &l.CreadoEn, &l.PagadaEn); err == nil {
					list = append(list, l)
				}
			}
			if len(list) > 0 {
				return c.JSON(list)
			}
		}
	}

	liquidacionesMutex.RLock()
	defer liquidacionesMutex.RUnlock()
	return c.JSON(liquidacionesStore)
}

// CrearLiquidacion procesa y liquida comisiones pendientes de un distribuidor.
func CrearLiquidacion(c *fiber.Ctx) error {
	type LiquidacionReq struct {
		ReferidoID int `json:"referido_id"`
	}
	var req LiquidacionReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "Cuerpo de solicitud inválido",
		})
	}

	comisionesMutex.Lock()
	defer comisionesMutex.Unlock()

	var totalLiquidado float64 = 0.0
	var idsLiquidados []int

	for i := range comisionesStore {
		if comisionesStore[i].ReferidoID == req.ReferidoID && comisionesStore[i].Estado == "pendiente" {
			totalLiquidado += comisionesStore[i].Monto
			idsLiquidados = append(idsLiquidados, comisionesStore[i].ID)
		}
	}

	if len(idsLiquidados) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "No hay comisiones pendientes para liquidar en este referido",
		})
	}

	liquidacionesMutex.Lock()
	liq := models.Liquidacion{
		ID:         len(liquidacionesStore) + 1,
		ReferidoID: req.ReferidoID,
		Total:      totalLiquidado,
		Estado:     "pagada",
		CreadoEn:   time.Now().Format(time.RFC3339),
		PagadaEn:   time.Now().Format(time.RFC3339),
	}
	liquidacionesStore = append(liquidacionesStore, liq)
	liquidacionesMutex.Unlock()

	for i := range comisionesStore {
		for _, id := range idsLiquidados {
			if comisionesStore[i].ID == id {
				comisionesStore[i].Estado = "pagada"
				comisionesStore[i].LiquidacionID = &liq.ID
			}
		}
	}

	return c.Status(fiber.StatusCreated).JSON(liq)
}
