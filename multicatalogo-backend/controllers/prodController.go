// controllers/prodController.go
package controllers

import (
	"strconv"
	"sync"

	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/models"
)

// Catálogo enriquecido con soporte de stock y persistencia en memoria
var (
	catalogoMutex sync.RWMutex
	catalogo      = []models.Producto{
		{
			ID:          1,
			Nombre:      "Serum Revitalizante",
			Descripcion: "Serum concentrado con vitamina C y ácido hialurónico. Ilumina la piel y reduce manchas.",
			Precio:      45.00,
			Stock:       15,
			Categoria:   "Serum",
			Img:         "https://picsum.photos/seed/serum/600",
			Galeria: []string{
				"https://picsum.photos/seed/serum1/600",
				"https://picsum.photos/seed/serum2/600",
			},
			Activo: true,
		},
		{
			ID:          2,
			Nombre:      "Crema Hidratante Pro",
			Descripcion: "Crema facial de textura ligera con niacinamida y manteca de karité.",
			Precio:      32.50,
			Stock:       20,
			Categoria:   "Crema",
			Img:         "https://picsum.photos/seed/crema/600",
			Galeria: []string{
				"https://picsum.photos/seed/crema1/600",
				"https://picsum.photos/seed/crema2/600",
			},
			Activo: true,
		},
		{
			ID:          3,
			Nombre:      "Tónico Purificante",
			Descripcion: "Tónico sin alcohol con hamamelis y agua de rosas. Limpia poros y equilibra el pH.",
			Precio:      28.00,
			Stock:       25,
			Categoria:   "Tónico",
			Img:         "https://picsum.photos/seed/tonico/600",
			Galeria: []string{
				"https://picsum.photos/seed/tonico1/600",
				"https://picsum.photos/seed/tonico2/600",
			},
			Activo: true,
		},
		{
			ID:          4,
			Nombre:      "Mascarilla Nocturna",
			Descripcion: "Mascarilla de noche con colágeno y vitamina E. Repara la piel mientras duermes.",
			Precio:      50.00,
			Stock:       12,
			Categoria:   "Mascarilla",
			Img:         "https://picsum.photos/seed/mascarilla/600",
			Galeria: []string{
				"https://picsum.photos/seed/mascarilla1/600",
				"https://picsum.photos/seed/mascarilla2/600",
			},
			Activo: true,
		},
		{
			ID:          5,
			Nombre:      "Serum Anti-Edad Retinol",
			Descripcion: "Serum de retinol encapsulado que suaviza líneas de expresión y mejora la firmeza.",
			Precio:      58.00,
			Stock:       10,
			Categoria:   "Serum",
			Img:         "https://picsum.photos/seed/retinol/600",
			Galeria: []string{
				"https://picsum.photos/seed/retinol1/600",
				"https://picsum.photos/seed/retinol2/600",
			},
			Activo: true,
		},
		{
			ID:          6,
			Nombre:      "Crema Contorno de Ojos",
			Descripcion: "Contorno de ojos con cafeína y péptidos. Reduce bolsas y ojeras.",
			Precio:      26.00,
			Stock:       18,
			Categoria:   "Crema",
			Img:         "https://picsum.photos/seed/ojos/600",
			Galeria: []string{
				"https://picsum.photos/seed/ojos1/600",
				"https://picsum.photos/seed/ojos2/600",
			},
			Activo: true,
		},
		{
			ID:          7,
			Nombre:      "Tónico Exfoliante AHA-BHA",
			Descripcion: "Exfoliación química suave con ácidos AHA y BHA. Renueva la textura cutánea.",
			Precio:      34.00,
			Stock:       14,
			Categoria:   "Tónico",
			Img:         "https://picsum.photos/seed/exfoliante/600",
			Galeria: []string{
				"https://picsum.photos/seed/exfoliante1/600",
				"https://picsum.photos/seed/exfoliante2/600",
			},
			Activo: true,
		},
		{
			ID:          8,
			Nombre:      "Kit Rutina Completa",
			Descripcion: "Kit integral con serum, crema, tónico y mascarilla. Limpieza, tratamiento e hidratación.",
			Precio:      129.00,
			Stock:       8,
			Categoria:   "Kit",
			Img:         "https://picsum.photos/seed/kit/600",
			Galeria: []string{
				"https://picsum.photos/seed/kit1/600",
				"https://picsum.photos/seed/kit2/600",
			},
			Activo: true,
		},
	}
)

// GetProductos entrega la lista completa de artículos activos.
func GetProductos(c *fiber.Ctx) error {
	catalogoMutex.RLock()
	defer catalogoMutex.RUnlock()
	return c.JSON(catalogo)
}

// GetProductoPorID busca un artículo específico por su identificador numérico.
func GetProductoPorID(c *fiber.Ctx) error {
	paramID := c.Params("id")
	id, err := strconv.Atoi(paramID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "El ID del producto debe ser numérico",
		})
	}

	catalogoMutex.RLock()
	defer catalogoMutex.RUnlock()

	for _, p := range catalogo {
		if p.ID == id {
			return c.JSON(p)
		}
	}

	return c.Status(fiber.StatusNotFound).JSON(models.APIError{
		Status:  fiber.StatusNotFound,
		Message: "Producto no encontrado",
	})
}

// DescontarStock descuenta inventario de forma segura (para el checkout).
func DescontarStock(productoID, cantidad int) (float64, error) {
	catalogoMutex.Lock()
	defer catalogoMutex.Unlock()

	for i := range catalogo {
		if catalogo[i].ID == productoID {
			if catalogo[i].Stock < cantidad {
				return 0, models.APIError{
					Status:  400,
					Message: "Stock insuficiente para el producto seleccionado",
				}
			}
			catalogo[i].Stock -= cantidad
			return catalogo[i].Precio, nil
		}
	}
	return 0, models.APIError{
		Status:  404,
		Message: "Producto no encontrado en inventario",
	}
}
