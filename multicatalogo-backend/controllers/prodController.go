// controllers/prodController.go
package controllers

import (
	"strconv"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/models"
	"multicatalogo-backend/repository"
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
		{
			ID:          9,
			Nombre:      "Protector Solar Facial SPF 50+",
			Descripcion: "Fluido solar invisible no comedogénico con filtros minerales.",
			Precio:      36.00,
			Stock:       30,
			Categoria:   "Protector",
			Img:         "https://picsum.photos/seed/solar/600",
			Galeria:     []string{"https://picsum.photos/seed/solar1/600"},
			Activo:      true,
		},
		{
			ID:          10,
			Nombre:      "Gel Limpiador Espumoso",
			Descripcion: "Limpiador facial suave con pH 5.5 y ceramidas.",
			Precio:      24.00,
			Stock:       22,
			Categoria:   "Limpiador",
			Img:         "https://picsum.photos/seed/cleanser/600",
			Galeria:     []string{"https://picsum.photos/seed/cleanser1/600"},
			Activo:      true,
		},
		{
			ID:          11,
			Nombre:      "Aceite Facial de Escualano",
			Descripcion: "Aceite 100% puro que retiene la humedad sin efecto graso.",
			Precio:      48.00,
			Stock:       16,
			Categoria:   "Aceite",
			Img:         "https://picsum.photos/seed/oil/600",
			Galeria:     []string{"https://picsum.photos/seed/oil1/600"},
			Activo:      true,
		},
		{
			ID:          12,
			Nombre:      "Mascarilla de Arcilla Rosa",
			Descripcion: "Mascarilla desintoxicante con arcilla francesa purificante.",
			Precio:      38.50,
			Stock:       14,
			Categoria:   "Mascarilla",
			Img:         "https://picsum.photos/seed/clay/600",
			Galeria:     []string{"https://picsum.photos/seed/clay1/600"},
			Activo:      true,
		},
		{
			ID:          13,
			Nombre:      "Serum Niacinamida 10% + Zinc",
			Descripcion: "Tratamiento de alta potencia para reducir poros e imperfecciones.",
			Precio:      42.00,
			Stock:       19,
			Categoria:   "Serum",
			Img:         "https://picsum.photos/seed/niacinamide/600",
			Galeria:     []string{"https://picsum.photos/seed/niacinamide1/600"},
			Activo:      true,
		},
		{
			ID:          14,
			Nombre:      "Bálsamo Labial con Péptidos",
			Descripcion: "Bálsamo nutritivo con manteca de cacao y péptidos.",
			Precio:      18.00,
			Stock:       40,
			Categoria:   "Crema",
			Img:         "https://picsum.photos/seed/lip/600",
			Galeria:     []string{"https://picsum.photos/seed/lip1/600"},
			Activo:      true,
		},
		{
			ID:          15,
			Nombre:      "Agua Micelar Calmante",
			Descripcion: "Solución micelar bifásica con centella asiática para piel sensible.",
			Precio:      22.00,
			Stock:       28,
			Categoria:   "Limpiador",
			Img:         "https://picsum.photos/seed/micellar/600",
			Galeria:     []string{"https://picsum.photos/seed/micellar1/600"},
			Activo:      true,
		},
		{
			ID:          16,
			Nombre:      "Bruma Hidratante Poliglutámica",
			Descripcion: "Spray facial ultrafino de hidratación profunda prolongada.",
			Precio:      30.00,
			Stock:       15,
			Categoria:   "Tónico",
			Img:         "https://picsum.photos/seed/mist/600",
			Galeria:     []string{"https://picsum.photos/seed/mist1/600"},
			Activo:      true,
		},
		{
			ID:          17,
			Nombre:      "Fluido Matificante Mat-Pro",
			Descripcion: "Emulsión ultraligera reguladora con polvo matificante de bambú.",
			Precio:      35.00,
			Stock:       11,
			Categoria:   "Crema",
			Img:         "https://picsum.photos/seed/matt/600",
			Galeria:     []string{"https://picsum.photos/seed/matt1/600"},
			Activo:      true,
		},
		{
			ID:          18,
			Nombre:      "Kit Glow Intensivo",
			Descripcion: "Tratamiento duo con serum revitalizante y mascarilla de arcilla.",
			Precio:      78.00,
			Stock:       7,
			Categoria:   "Kit",
			Img:         "https://picsum.photos/seed/glowkit/600",
			Galeria:     []string{"https://picsum.photos/seed/glowkit1/600"},
			Activo:      true,
		},
	}
)

// GetProductos entrega la lista completa de artículos activos con soporte Cache-Aside (TTL 5m).
func GetProductos(c *fiber.Ctx) error {
	const cacheKey = "productos:all"

	// 1. Intentar lectura desde Redis (Cache Hit)
	var cached []models.Producto
	if repository.GetCache(c.Context(), cacheKey, &cached) {
		c.Set("X-Cache", "HIT")
		return c.JSON(cached)
	}

	// 2. Cache Miss: consultar repositorio (PostgreSQL o fallback memoria)
	prods, err := repository.ObtenerProductos(c.Context())
	if err != nil || len(prods) == 0 {
		catalogoMutex.RLock()
		prods = catalogo
		catalogoMutex.RUnlock()
	}

	// 3. Almacenar en Redis con TTL de 5 minutos
	_ = repository.SetCache(c.Context(), cacheKey, prods, 5*time.Minute)

	c.Set("X-Cache", "MISS")
	return c.JSON(prods)
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

	// Consultar repositorio
	prod, err := repository.ObtenerProductoPorID(c.Context(), id)
	if err == nil && prod != nil {
		return c.JSON(prod)
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

// RestaurarStock repone inventario cuando un pedido es cancelado.
func RestaurarStock(productoID, cantidad int) {
	catalogoMutex.Lock()
	defer catalogoMutex.Unlock()
	for i := range catalogo {
		if catalogo[i].ID == productoID {
			catalogo[i].Stock += cantidad
			return
		}
	}
}

// CrearProducto permite al administrador agregar un nuevo producto al catálogo.
func CrearProducto(c *fiber.Ctx) error {
	var nuevo models.Producto
	if err := c.BodyParser(&nuevo); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "Cuerpo de solicitud inválido",
		})
	}

	if nuevo.Nombre == "" || nuevo.Precio <= 0 || nuevo.Categoria == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "Nombre, precio válido (> 0) y categoría son obligatorios",
		})
	}

	catalogoMutex.Lock()
	defer catalogoMutex.Unlock()

	nuevo.ID = len(catalogo) + 1
	nuevo.Activo = true
	if nuevo.Img == "" {
		nuevo.Img = "https://picsum.photos/seed/prod" + strconv.Itoa(nuevo.ID) + "/600"
	}
	catalogo = append(catalogo, nuevo)
	repository.InvalidateCache(c.Context(), "productos:all")

	return c.Status(fiber.StatusCreated).JSON(nuevo)
}

// ActualizarProducto permite modificar datos de un producto existente.
func ActualizarProducto(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "ID de producto inválido",
		})
	}

	var update models.Producto
	if err := c.BodyParser(&update); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "Cuerpo de solicitud inválido",
		})
	}

	catalogoMutex.Lock()
	defer catalogoMutex.Unlock()

	for i := range catalogo {
		if catalogo[i].ID == id {
			if update.Nombre != "" {
				catalogo[i].Nombre = update.Nombre
			}
			if update.Descripcion != "" {
				catalogo[i].Descripcion = update.Descripcion
			}
			if update.Precio > 0 {
				catalogo[i].Precio = update.Precio
			}
			if update.Stock >= 0 {
				catalogo[i].Stock = update.Stock
			}
			if update.Categoria != "" {
				catalogo[i].Categoria = update.Categoria
			}
			repository.InvalidateCache(c.Context(), "productos:all")
			return c.JSON(catalogo[i])
		}
	}

	return c.Status(fiber.StatusNotFound).JSON(models.APIError{
		Status:  fiber.StatusNotFound,
		Message: "Producto no encontrado",
	})
}

// EliminarProducto ejecuta el borrado lógico de un producto (Activo = false).
func EliminarProducto(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status:  fiber.StatusBadRequest,
			Message: "ID de producto inválido",
		})
	}

	catalogoMutex.Lock()
	defer catalogoMutex.Unlock()

	for i := range catalogo {
		if catalogo[i].ID == id {
			catalogo[i].Activo = false
			repository.InvalidateCache(c.Context(), "productos:all")
			return c.JSON(fiber.Map{
				"message": "Producto desactivado exitosamente (borrado lógico)",
				"id":      id,
			})
		}
	}

	return c.Status(fiber.StatusNotFound).JSON(models.APIError{
		Status:  fiber.StatusNotFound,
		Message: "Producto no encontrado",
	})
}
