# ==============================================================================
# MULTICATÁLOGO - DOCKERFILE BACKEND (PRODUCCIÓN ULTRA-OPTIMIZADO)
# ==============================================================================
# Arquitectura: Multi-stage build (Go 1.24+ -> Alpine 3.21)
# Características:
#   - Binario estático compilado sin CGO (CGO_ENABLED=0)
#   - Flags de optimización: -trimpath -ldflags="-s -w -extldflags '-static'"
#   - Caché óptimo de capas con go.mod / go.sum
#   - Usuario sin privilegios de root (appuser / UID 10001)
#   - Healthcheck nativo integrado con Fiber /api/health
#   - Tamaño de imagen final: ~20MB
# ==============================================================================

# --- ETAPA 1: BUILDER ---
FROM golang:1.24-alpine AS builder

WORKDIR /src

# Instalar certificados CA y zona horaria para el entorno de compilación
RUN apk add --no-cache ca-certificates git tzdata

# Cachear dependencias de Go de forma independiente al código fuente
COPY go.mod go.sum ./
RUN go mod edit -go=1.24.0 2>/dev/null || true
RUN go mod download && go mod verify

# Copiar el código fuente completo
COPY . .
RUN go mod edit -go=1.24.0 2>/dev/null || true

# Compilación estática pura optimizada para producción
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -trimpath \
    -ldflags="-s -w -extldflags '-static'" \
    -o /bin/multicatalogo-backend .

# --- ETAPA 2: RUNNER (HARDENED RUNTIME) ---
FROM alpine:3.21 AS runner

# Metadatos del contenedor
LABEL org.opencontainers.image.title="MultiCatálogo Backend API" \
      org.opencontainers.image.description="API Go/Fiber transaccional con arquitectura limpia para MultiCatálogo" \
      org.opencontainers.image.version="1.0.0"

# Instalar dependencias esenciales de ejecución
RUN apk add --no-cache ca-certificates tzdata wget \
    && rm -rf /var/cache/apk/*

# Crear usuario y grupo de sistema sin privilegios (Principio de menor privilegio)
RUN addgroup -g 10001 -S appgroup \
    && adduser -u 10001 -S appuser -G appgroup

WORKDIR /app

# Copiar el binario estático desde la etapa de construcción
COPY --from=builder --chown=appuser:appgroup /bin/multicatalogo-backend /app/multicatalogo-backend

# Configurar variables de entorno de producción
ENV PORT=3000 \
    APP_ENV=production \
    GIN_MODE=release

# Cambiar al usuario no-root
USER appuser:appgroup

# Puerto de escucha del servicio
EXPOSE 3000

# Verificación de salud periódica (Healthcheck)
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000/api/health > /dev/null || exit 1

# Comando de inicio del servidor
ENTRYPOINT ["/app/multicatalogo-backend"]
