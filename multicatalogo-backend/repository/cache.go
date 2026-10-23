// repository/cache.go
package repository

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"multicatalogo-backend/config"
)

// GetCache intenta leer y deserializar un objeto desde Redis.
// Retorna true en caso de Cache Hit exitoso; false en Cache Miss o degradación.
func GetCache(ctx context.Context, key string, dest interface{}) bool {
	if config.RedisClient == nil {
		return false
	}

	val, err := config.RedisClient.Get(ctx, key).Result()
	if err != nil {
		return false
	}

	if err := json.Unmarshal([]byte(val), dest); err != nil {
		log.Printf("[WARN] Falla al deserializar clave de caché '%s': %v", key, err)
		return false
	}

	return true
}

// SetCache serializa a JSON y almacena un valor en Redis con el TTL indicado.
func SetCache(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	if config.RedisClient == nil {
		return nil
	}

	data, err := json.Marshal(value)
	if err != nil {
		return err
	}

	return config.RedisClient.Set(ctx, key, data, ttl).Err()
}

// InvalidateCache elimina una o más claves exactas de Redis de forma atómica.
func InvalidateCache(ctx context.Context, keys ...string) {
	if config.RedisClient == nil || len(keys) == 0 {
		return
	}

	if err := config.RedisClient.Del(ctx, keys...).Err(); err != nil {
		log.Printf("[WARN] Error al invalidar claves en Redis (%v): %v", keys, err)
	} else {
		log.Printf("[INFO] Claves invalidadas en Redis: %v", keys)
	}
}

// InvalidatePattern busca e invalida claves que coincidan con un patrón (ej. "red:tree:*").
func InvalidatePattern(ctx context.Context, pattern string) {
	if config.RedisClient == nil {
		return
	}

	iter := config.RedisClient.Scan(ctx, 0, pattern, 0).Iterator()
	var keys []string
	for iter.Next(ctx) {
		keys = append(keys, iter.Val())
	}

	if len(keys) > 0 {
		InvalidateCache(ctx, keys...)
	}
}
