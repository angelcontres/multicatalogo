# ==============================================================================
# MULTICATÁLOGO - DOCKERFILE NGINX REVERSE PROXY GATEWAY
# ==============================================================================
FROM nginx:1.27-alpine-slim

LABEL org.opencontainers.image.title="MultiCatálogo API Gateway" \
      org.opencontainers.image.description="Reverse proxy Nginx con Rate Limiting y enrutamiento SPA/API" \
      org.opencontainers.image.version="1.0.0"

# Instalar wget para healthchecks
RUN apk add --no-cache wget

# Eliminar configuración predeterminada y copiar configuración de producción
RUN rm -rf /etc/nginx/conf.d/*
COPY nginx.conf /etc/nginx/nginx.conf

# Exponer puertos HTTP y HTTPS
EXPOSE 80 443

# Verificación de salud interna del Gateway
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
    CMD wget -qO- http://127.0.0.1:80/gateway-health > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
