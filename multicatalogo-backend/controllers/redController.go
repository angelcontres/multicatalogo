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
		fallbackTree := redArbol
		redMutex.RUnlock()
		tree = &fallbackTree
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
