// main.go
package main

import (
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"multicatalogo-backend/routes"
)

func main() {
	app := fiber.New(fiber.Config{
		AppName: "MultiCatálogo API - Core Transaccional",
	})

	// Middleware CORS flexible para desarrollo y pruebas
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:5173, http://127.0.0.1:5173, http://localhost:5174, http://172.17.82.108:5173, *",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
	}))

	// Registro de rutas
	routes.SetupRoutes(app)

	// Configuración de puerto por variable de entorno o por defecto 3000
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	app.Listen(":" + port)
}
