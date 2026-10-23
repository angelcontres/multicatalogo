// controllers/redController.go
package controllers

import (
	"sync"

	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/models"
)

var (
	redMutex sync.RWMutex
	redArbol = models.Referido{
		ID:     0,
		Nombre: "Tú",
		Codigo: "TU",
		Nivel:  0,
		Ventas: 2400.0,
		Hijos: []models.Referido{
			{
				ID:     1,
				Nombre: "Ana García",
				Codigo: "ANA",
				Nivel:  1,
				Ventas: 1200.0,
				Hijos: []models.Referido{
					{
						ID:     4,
						Nombre: "Carlos Ruiz",
						Codigo: "CARLOS",
						Nivel:  2,
						Ventas: 500.0,
						Hijos: []models.Referido{
							{
								ID:     7,
								Nombre: "Diana Paz",
								Codigo: "DIANA",
								Nivel:  3,
								Ventas: 300.0,
							},
						},
					},
					{
						ID:     5,
						Nombre: "Sofía León",
						Codigo: "SOFIA",
						Nivel:  2,
						Ventas: 430.0,
					},
				},
			},
			{
				ID:     2,
				Nombre: "Luis Poveda",
				Codigo: "LUIS",
				Nivel:  1,
				Ventas: 850.0,
				Hijos: []models.Referido{
					{
						ID:     6,
						Nombre: "Marco Díaz",
						Codigo: "MARCO",
						Nivel:  2,
						Ventas: 380.0,
					},
				},
			},
			{
				ID:     3,
				Nombre: "Marta Sánchez",
				Codigo: "MARTA",
				Nivel:  1,
				Ventas: 430.0,
			},
		},
	}
)

// GetRed entrega el árbol jerárquico de referidos.
func GetRed(c *fiber.Ctx) error {
	redMutex.RLock()
	defer redMutex.RUnlock()
	return c.JSON(redArbol)
}

// ActualizarVentasRed agrega ventas al árbol (ejecutado por goroutines post-checkout)
func ActualizarVentasRed(total float64) {
	redMutex.Lock()
	defer redMutex.Unlock()
	redArbol.Ventas += total
}
