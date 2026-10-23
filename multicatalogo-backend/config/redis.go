// config/redis.go
package config

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client

// ConnectRedis inicializa el cliente de Redis Alpine.
// Si Redis no está disponible, no bloquea ni tumba la aplicación (degradación elegante).
func ConnectRedis() *redis.Client {
	host := getEnv("REDIS_HOST", "localhost")
	port := getEnv("REDIS_PORT", "6379")
	addr := fmt.Sprintf("%s:%s", host, port)

	client := redis.NewClient(&redis.Options{
		Addr:         addr,
		Password:     getEnv("REDIS_PASSWORD", ""),
		DB:           0,
		DialTimeout:  1 * time.Second,
		ReadTimeout:  1 * time.Second,
		WriteTimeout: 1 * time.Second,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		log.Printf("[WARN] Redis en %s no responde: %v. Operando sin caché en memoria.", addr, err)
		client.Close()
		return nil
	}

	log.Printf("[INFO] Conectado exitosamente a Redis en %s.", addr)
	RedisClient = client
	return client
}

// CloseRedis cierra la conexión con Redis si está activa.
func CloseRedis() {
	if RedisClient != nil {
		_ = RedisClient.Close()
		log.Println("[INFO] Conexión con Redis cerrada.")
	}
}
