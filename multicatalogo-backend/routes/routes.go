// routes/routes.go
package routes

import (
	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/controllers"
)

// SetupRoutes registra todos los endpoints de la API MultiCatálogo.
func SetupRoutes(app *fiber.App) {
	api := app.Group("/api")

	// Autenticación y Verificación de Estado
	api.Post("/login", controllers.Login)
	api.Get("/health", controllers.HealthCheck)

	// Catálogo de Productos
	api.Get("/productos", controllers.GetProductos)
	api.Get("/productos/:id", controllers.GetProductoPorID)

	// Núcleo Transaccional (Checkout & Comisiones)
	api.Post("/checkout", controllers.Checkout)

	// Red Multinivel
	api.Get("/red", controllers.GetRed)
}
