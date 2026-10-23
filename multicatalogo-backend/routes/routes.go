// routes/routes.go
package routes

import (
	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/controllers"
	"multicatalogo-backend/middleware"
)

// SetupRoutes registra todos los endpoints de la API MultiCatálogo.
func SetupRoutes(app *fiber.App) {
	api := app.Group("/api")

	// Autenticación, Registro y Verificación de Estado
	api.Post("/login", controllers.Login)
	api.Post("/register", controllers.Register)
	api.Get("/health", controllers.HealthCheck)

	// Catálogo de Productos (Público)
	api.Get("/productos", controllers.GetProductos)
	api.Get("/productos/:id", controllers.GetProductoPorID)

	// Gestión Administrativa del Catálogo (RequireAdmin)
	api.Post("/productos", middleware.RequireAuth(), middleware.RequireAdmin(), controllers.CrearProducto)
	api.Put("/productos/:id", middleware.RequireAuth(), middleware.RequireAdmin(), controllers.ActualizarProducto)
	api.Delete("/productos/:id", middleware.RequireAuth(), middleware.RequireAdmin(), controllers.EliminarProducto)

	// Núcleo Transaccional (Checkout & Comisiones)
	api.Post("/checkout", controllers.Checkout)

	// Gestión y Consulta de Pedidos
	api.Get("/pedidos/mios", middleware.RequireAuth(), controllers.GetMisPedidos)
	api.Get("/pedidos", middleware.RequireAuth(), middleware.RequireAdmin(), controllers.GetPedidosAdmin)
	api.Get("/pedidos/:id", middleware.RequireAuth(), controllers.GetPedidoPorID)
	api.Patch("/pedidos/:id/estado", middleware.RequireAuth(), middleware.RequireAdmin(), controllers.ActualizarEstadoPedido)

	// Red Multinivel y Ledger de Comisiones
	api.Get("/red", middleware.OptionalAuth(), controllers.GetRed)
	api.Get("/comisiones/mias", middleware.RequireAuth(), controllers.GetMisComisiones)

	// Liquidaciones a Distribuidores (Admin)
	api.Get("/liquidaciones", middleware.RequireAuth(), middleware.RequireAdmin(), controllers.GetLiquidaciones)
	api.Post("/liquidaciones", middleware.RequireAuth(), middleware.RequireAdmin(), controllers.CrearLiquidacion)

	// Reportes y Analítica de Negocio (Admin)
	api.Get("/reportes/resumen", middleware.RequireAuth(), middleware.RequireAdmin(), controllers.GetReporteResumen)
	api.Get("/reportes/top-productos", middleware.RequireAuth(), middleware.RequireAdmin(), controllers.GetTopProductos)
}
