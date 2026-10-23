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
		{ID: 1, PedidoID: 1001, ReferidoID: 2, Nivel: 1, Porcentaje: 0.10, Monto: 10.25, Estado: "pendiente"},
		{ID: 2, PedidoID: 1001, ReferidoID: 0, Nivel: 2, Porcentaje: 0.05, Monto: 5.12, Estado: "pendiente"},
	}

	liquidacionesMutex sync.RWMutex
	liquidacionesStore = []models.Liquidacion{
		{
			ID:         1,
			ReferidoID: 0,
			Total:      240.00,
			Estado:     "pagada",
			CreadoEn:   time.Now().Add(-48 * time.Hour).Format(time.RFC3339),
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

// GetMisComisiones devuelve el ledger de comisiones correspondientes al usuario autenticado.
func GetMisComisiones(c *fiber.Ctx) error {
	claims, ok := c.Locals("usuario").(*config.CustomClaims)
	if !ok || claims == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status:  fiber.StatusUnauthorized,
			Message: "Identidad de usuario requerida",
		})
	}

	comisionesMutex.RLock()
	defer comisionesMutex.RUnlock()

	var misComisiones []models.Comision
	var totalPendiente float64 = 0.0
	var totalPagado float64 = 0.0

	for _, com := range comisionesStore {
		// Simulación de asociación de usuario con su ID de referido
		if claims.Rol == "admin" || com.ReferidoID == 2 {
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
