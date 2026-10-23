// controllers/redController.go
package controllers

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/config"
	"multicatalogo-backend/models"
	"multicatalogo-backend/repository"
)

var (
	redMutex sync.RWMutex
	redArbol = models.Referido{
		ID:     0,
		Nombre: "Tú",
		Codigo: "TU",
		Nivel:  0,
		Ventas: 3850.0,
		Hijos: []models.Referido{
			{
				ID:     1,
				Nombre: "Ana García",
				Codigo: "ANA",
				Nivel:  1,
				Ventas: 1850.0,
				Hijos: []models.Referido{
					{
						ID:     4,
						Nombre: "Carlos Ruiz",
						Codigo: "CARLOS",
						Nivel:  2,
						Ventas: 620.0,
						Hijos: []models.Referido{
							{
								ID:     7,
								Nombre: "Diana Paz",
								Codigo: "DIANA",
								Nivel:  3,
								Ventas: 350.0,
							},
							{
								ID:     13,
								Nombre: "Felipe Silva",
								Codigo: "FELIPE",
								Nivel:  3,
								Ventas: 280.0,
							},
						},
					},
					{
						ID:     5,
						Nombre: "Sofía León",
						Codigo: "SOFIA",
						Nivel:  2,
						Ventas: 540.0,
					},
				},
			},
			{
				ID:     2,
				Nombre: "Luis Poveda",
				Codigo: "LUIS",
				Nivel:  1,
				Ventas: 1420.0,
				Hijos: []models.Referido{
					{
						ID:     6,
						Nombre: "Marco Díaz",
						Codigo: "MARCO",
						Nivel:  2,
						Ventas: 480.0,
						Hijos: []models.Referido{
							{
								ID:     14,
								Nombre: "Gabriel Morales",
								Codigo: "GABRIEL",
								Nivel:  3,
								Ventas: 310.0,
							},
						},
					},
					{
						ID:     10,
						Nombre: "Javier Ortiz",
						Codigo: "JAVIER",
						Nivel:  2,
						Ventas: 390.0,
					},
				},
			},
			{
				ID:     3,
				Nombre: "Marta Sánchez",
				Codigo: "MARTA",
				Nivel:  1,
				Ventas: 980.0,
				Hijos: []models.Referido{
					{
						ID:     11,
						Nombre: "Andrea Mora",
						Codigo: "ANDREA",
						Nivel:  2,
						Ventas: 510.0,
						Hijos: []models.Referido{
							{
								ID:     15,
								Nombre: "Natalia Vega",
								Codigo: "NATALIA",
								Nivel:  3,
								Ventas: 410.0,
							},
						},
					},
				},
			},
			{
				ID:     8,
				Nombre: "Carlos Mendoza",
				Codigo: "CARLOSM",
				Nivel:  1,
				Ventas: 750.0,
			},
			{
				ID:     9,
				Nombre: "Valeria Castro",
				Codigo: "VALERIA",
				Nivel:  1,
				Ventas: 1100.0,
				Hijos: []models.Referido{
					{
						ID:     12,
						Nombre: "Diego Torres",
						Codigo: "DIEGO",
						Nivel:  2,
						Ventas: 420.0,
						Hijos: []models.Referido{
							{
								ID:     16,
								Nombre: "Camila Rivas",
								Codigo: "CAMILA",
								Nivel:  3,
								Ventas: 260.0,
							},
						},
					},
				},
			},
		},
	}
)

func clonarArbol(n models.Referido) models.Referido {
	copia := n
	if len(n.Hijos) > 0 {
		copia.Hijos = make([]models.Referido, len(n.Hijos))
		for i, h := range n.Hijos {
			copia.Hijos[i] = clonarArbol(h)
		}
	}
	return copia
}

func recalcularNiveles(n *models.Referido, nivelActual int) {
	n.Nivel = nivelActual
	for i := range n.Hijos {
		recalcularNiveles(&n.Hijos[i], nivelActual+1)
	}
}

func buscarSubarbol(nodo models.Referido, id int) *models.Referido {
	if nodo.ID == id {
		copia := clonarArbol(nodo)
		recalcularNiveles(&copia, 0)
		return &copia
	}
	for _, hijo := range nodo.Hijos {
		if found := buscarSubarbol(hijo, id); found != nil {
			return found
		}
	}
	return nil
}

// GetRed entrega el árbol jerárquico de referidos aplicando Cache-Aside con Redis (TTL 10m).
func GetRed(c *fiber.Ctx) error {
	userEmail := "global"
	if claims, ok := c.Locals("usuario").(*config.CustomClaims); ok && claims != nil {
		userEmail = claims.Email
	}

	cacheKey := fmt.Sprintf("red:tree:%s", userEmail)

	// 1. Intentar lectura desde Redis (Cache Hit)
	var cachedTree models.Referido
	if repository.GetCache(c.Context(), cacheKey, &cachedTree) {
		c.Set("X-Cache", "HIT")
		return c.JSON(cachedTree)
	}

	// 2. Cache Miss: consultar repositorio (PostgreSQL con fallback a memoria)
	tree, err := repository.ObtenerRed(c.Context(), userEmail)
	if err != nil || tree == nil {
		redMutex.RLock()
		targetID := emailToReferidoID(userEmail)
		var resolvedTree *models.Referido
		if targetID > 0 {
			resolvedTree = buscarSubarbol(redArbol, targetID)
		}
		if resolvedTree == nil {
			fallbackTree := clonarArbol(redArbol)
			resolvedTree = &fallbackTree
		}
		redMutex.RUnlock()
		tree = resolvedTree
	}

	// 3. Almacenar en Redis con TTL de 10 minutos
	_ = repository.SetCache(c.Context(), cacheKey, tree, 10*time.Minute)

	c.Set("X-Cache", "MISS")
	return c.JSON(tree)
}

// ActualizarVentasRed agrega ventas al árbol e invalida la caché en Redis.
func ActualizarVentasRed(total float64) {
	redMutex.Lock()
	redArbol.Ventas += total
	redMutex.Unlock()

	// Invalidación reactiva de la caché de árboles en Redis
	repository.InvalidatePattern(context.Background(), "red:tree:*")
}
