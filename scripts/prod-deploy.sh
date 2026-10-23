#!/usr/bin/env bash
# ==============================================================================
# MULTICATÁLOGO - SCRIPT DE DESPLIEGUE A PRODUCCIÓN (BASH)
# ==============================================================================
# Uso:
#   chmod +x ./scripts/prod-deploy.sh
#   ./scripts/prod-deploy.sh [--build] [--no-cache] [--down] [--logs]
# ==============================================================================

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "\n${CYAN}========================================================${NC}"
echo -e "${CYAN} MULTICATÁLOGO - PIPELINE DE DESPLIEGUE EN PRODUCCIÓN ${NC}"
echo -e "${CYAN}========================================================\n${NC}"

BUILD=false
NOCACHE=false
DOWN=false
LOGS=false

for arg in "$@"; do
  case $arg in
    --build)
      BUILD=true
      shift
      ;;
    --no-cache)
      NOCACHE=true
      shift
      ;;
    --down)
      DOWN=true
      shift
      ;;
    --logs)
      LOGS=true
      shift
      ;;
  esac
done

# 1. Comprobar Docker CLI
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR] Docker CLI no está instalado.${NC}"
    exit 1
fi

# 2. Comprobar daemon
if ! docker info &> /dev/null; then
    echo -e "${YELLOW}[ALERTA] Docker daemon no está respondiendo. Inicie dockerd o Docker Desktop.${NC}"
    exit 1
fi

# 3. Opción de bajada
if [ "$DOWN" = true ]; then
    echo -e "${YELLOW}[INFO] Deteniendo y eliminando contenedores...${NC}"
    docker compose -f docker-compose.prod.yml down
    echo -e "${GREEN}[OK] Servicios detenidos exitosamente.${NC}"
    exit 0
fi

# 4. Asegurar archivo .env
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[AVISO] .env no encontrado. Copiando .env.production.example a .env...${NC}"
    cp .env.production.example .env
    echo -e "${GREEN}[OK] .env generado.${NC}"
fi

# 5. Compilar imágenes
if [ "$BUILD" = true ] || [ "$NOCACHE" = true ]; then
    BUILD_ARGS=("-f" "docker-compose.prod.yml" "build")
    if [ "$NOCACHE" = true ]; then
        BUILD_ARGS+=("--no-cache")
    fi
    echo -e "${CYAN}[INFO] Compilando imágenes Docker de producción...${NC}"
    docker compose "${BUILD_ARGS[@]}"
    echo -e "${GREEN}[OK] Compilación completada.${NC}"
fi

# 6. Levantar servicios
echo -e "${CYAN}[INFO] Levantando contenedores en background...${NC}"
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# 7. Verificación de salud
echo -e "\n${CYAN}[INFO] Esperando a que los servicios estén saludables (Healthchecks)...${NC}"
attempt=0
max_attempts=30

until [ $attempt -ge $max_attempts ]
do
    sleep 2
    attempt=$((attempt+1))
    echo -ne " Intento $attempt/$max_attempts...\r"
    
    unhealthy=$(docker compose -f docker-compose.prod.yml ps --format '{{.Health}}' | grep -E 'starting|unhealthy' || true)
    if [ -z "$unhealthy" ]; then
        break
    fi
done

echo -e "\n${GREEN}========================================================${NC}"
echo -e "${GREEN} DESPLIEGUE COMPLETADO EXITOSAMENTE ${NC}"
echo -e "${GREEN}========================================================${NC}\n"

docker compose -f docker-compose.prod.yml ps

echo -e "\n[RUTAS ACTIVAS]:"
echo -e " - Frontend SPA:         http://localhost:80"
echo -e " - API Gateway Health:   http://localhost:80/gateway-health"
echo -e " - Backend API Health:   http://localhost:80/api/health"
echo -e " - PostgreSQL 16:        localhost:5434"
echo -e " - Redis 7:              localhost:6379"

if [ "$LOGS" = true ]; then
    echo -e "\n${YELLOW}[STREAMING DE LOGS - Presione Ctrl+C para salir]:${NC}"
    docker compose -f docker-compose.prod.yml logs -f
fi
