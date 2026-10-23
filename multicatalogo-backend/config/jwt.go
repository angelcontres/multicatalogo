// config/jwt.go
package config

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var defaultSecret = []byte("super-secret-jwt-key-multicatalogo-2026")

func getJWTSecret() []byte {
	if s := os.Getenv("JWT_SECRET"); s != "" {
		return []byte(s)
	}
	return defaultSecret
}

// CustomClaims define las claims estándar de la sesión.
type CustomClaims struct {
	Sub   int    `json:"sub"`
	Email string `json:"email"`
	Rol   string `json:"rol"`
	jwt.RegisteredClaims
}

// GenerateToken emite un JWT firmado válido por 2 horas.
func GenerateToken(userID int, email, rol string) (string, error) {
	claims := CustomClaims{
		Sub:   userID,
		Email: email,
		Rol:   rol,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(2 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getJWTSecret())
}

// VerifyToken valida la firma y vigencia del JWT.
func VerifyToken(tokenString string) (*CustomClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("método de firma inesperado")
		}
		return getJWTSecret(), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*CustomClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("token inválido")
}

// HashPassword encripta una contraseña con bcrypt.
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	return string(bytes), err
}

// CheckPasswordHash compara una contraseña en texto plano contra su hash bcrypt.
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
