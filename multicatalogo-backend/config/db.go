// config/db.go
package config

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var DBPool *pgxpool.Pool

// ConnectDB inicializa el pool de conexiones a PostgreSQL 16.
// Si la base de datos no está disponible (ej. Docker Desktop apagado),
// registra una advertencia y retorna nil para permitir degradación elegante.
func ConnectDB() *pgxpool.Pool {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5434")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "postgres")
	dbname := getEnv("DB_NAME", "multicatalogo")

	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		user, password, host, port, dbname)

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, connStr)
	if err != nil {
		log.Printf("[WARN] No se pudo inicializar pool de PostgreSQL (%s): %v. Operando en modo memoria.", connStr, err)
		return nil
	}

	if err := pool.Ping(ctx); err != nil {
		log.Printf("[WARN] PostgreSQL en puerto %s no responde al Ping: %v. Operando en modo memoria.", port, err)
		pool.Close()
		return nil
	}

	log.Printf("[INFO] Conectado exitosamente a PostgreSQL 16 en el puerto %s.", port)
	DBPool = pool
	return pool
}

// CloseDB cierra el pool de conexiones si está activo.
func CloseDB() {
	if DBPool != nil {
		DBPool.Close()
		log.Println("[INFO] Pool de PostgreSQL cerrado.")
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
