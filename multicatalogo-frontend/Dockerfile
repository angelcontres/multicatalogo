# ==============================================================================
# MULTICATÁLOGO - DOCKERFILE FRONTEND (PRODUCCIÓN ULTRA-OPTIMIZADO)
# ==============================================================================
# Arquitectura: Multi-stage build (Node 22-alpine -> Nginx Alpine Slim)
# Características:
#   - Instalación limpia y reproducible con npm ci
#   - Build de Vite con minificación, compresión y hashing de chunks
#   - Servidor Nginx Alpine con compresión GZIP, cabeceras de seguridad y caché inmutable
#   - Endpoint /healthz para comprobación de estado de orquestadores
#   - Tamaño de imagen final: ~25MB
# ==============================================================================

# --- ETAPA 1: BUILDER ---
FROM node:22-alpine AS builder

WORKDIR /app

# Cachear dependencias de node
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit

# Copiar el código fuente completo
COPY . .

# Construcción optimizada para producción (TypeScript + Vite)
RUN npm run build

# --- ETAPA 2: NGINX RUNNER ---
FROM nginx:1.27-alpine-slim AS runner

LABEL org.opencontainers.image.title="MultiCatálogo Frontend SPA" \
      org.opencontainers.image.description="SPA React 19 + Tailwind CSS v4 para MultiCatálogo servida en Nginx" \
      org.opencontainers.image.version="1.0.0"

# Instalar wget para healthcheck
RUN apk add --no-cache wget

# Eliminar configuración predeterminada de Nginx
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# Copiar configuración optimizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar artefactos compilados desde el builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer puerto HTTP
EXPOSE 80

# Verificación de salud interna
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
    CMD wget -qO- http://127.0.0.1:80/healthz > /dev/null || exit 1

# Iniciar servidor Nginx
CMD ["nginx", "-g", "daemon off;"]
