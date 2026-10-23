#!/usr/bin/env bash
# ==============================================================================
# MULTICATÁLOGO - CENTRO DE CONTROL Y DESPLIEGUE INTERACTIVO (BASH)
# ==============================================================================
# Uso:
#   chmod +x ./menu.sh
#   ./menu.sh
# ==============================================================================

set -u

# Códigos de Color ANSI
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

LOCAL_BACKEND_PID=""
LOCAL_FRONTEND_PID=""

mostrar_menu() {
    clear
    echo -e "${CYAN}==============================================================================${NC}"
    echo -e "${BOLD}${CYAN}              MULTICATÁLOGO - CENTRO DE CONTROL Y DESPLIEGUE${NC}"
    echo -e "${CYAN}==============================================================================${NC}"
    echo ""
    echo -e "  ${BOLD}[1]${NC} Modo Desarrollo Local (Frontend + Backend en Host sin Docker)"
    echo -e "  ${BOLD}[2]${NC} Modo Producción Docker Completo (Gateway + Frontend + Backend + BD + Redis)"
    echo -e "  ${BOLD}[3]${NC} Modo Híbrido: Solo BD (Postgres :5434) y Redis (:6379) en Docker"
    echo -e "  ${BOLD}[4]${NC} Diagnóstico del Entorno y Puertos (AI Harness Doctor)"
    echo -e "  ${BOLD}[5]${NC} Ejecutar Suite de Pruebas Automatizadas (MLM, Contratos, ACID)"
    echo -e "  ${BOLD}[6]${NC} Ver Logs en Vivo de Contenedores Docker"
    echo -e "  ${BOLD}[7]${NC} Detener Todos los Servicios (Docker y Procesos Locales)"
    echo -e "  ${BOLD}[0]${NC} Salir"
    echo ""
    echo -e "${CYAN}==============================================================================${NC}"
    echo -ne "${YELLOW} Seleccione una opción [0-7] y presione Enter: ${NC}"
}

pausa() {
    echo ""
    echo -ne "${CYAN}Presione [Enter] para volver al menú principal...${NC}"
    read -r
}

dev_local() {
    clear
    echo -e "${CYAN}==============================================================================${NC}"
    echo -e "${BOLD}  INICIANDO MODO DESARROLLO LOCAL (HOST)${NC}"
    echo -e "${CYAN}==============================================================================${NC}"
    echo ""

    echo -e "${YELLOW}[*] Arrancando Backend Go/Fiber en puerto 3000...${NC}"
    (cd multicatalogo-backend && go run .) &
    LOCAL_BACKEND_PID=$!
    echo -e "${GREEN}[OK] Backend corriendo en segundo plano (PID: $LOCAL_BACKEND_PID).${NC}"

    sleep 2

    echo -e "${YELLOW}[*] Arrancando Frontend React/Vite en puerto 5173...${NC}"
    (cd multicatalogo-frontend && npm run dev) &
    LOCAL_FRONTEND_PID=$!
    echo -e "${GREEN}[OK] Frontend corriendo en segundo plano (PID: $LOCAL_FRONTEND_PID).${NC}"

    echo ""
    echo -e "${GREEN}==============================================================================${NC}"
    echo -e "${BOLD} SERVICIOS LOCALES ACTIVOS:${NC}"
    echo -e "  - Frontend:  ${CYAN}http://localhost:5173${NC}"
    echo -e "  - Backend:   ${CYAN}http://localhost:3000/api/health${NC}"
    echo -e "${GREEN}==============================================================================${NC}"
    echo -e "Nota: Para detenerlos, use la opción [7] del menú."
    pausa
}

docker_prod() {
    clear
    echo -e "${CYAN}==============================================================================${NC}"
    echo -e "${BOLD}  DESPLIEGUE EN PRODUCCIÓN (DOCKER COMPOSE PROD)${NC}"
    echo -e "${CYAN}==============================================================================${NC}"
    echo ""

    if ! command -v docker &> /dev/null || ! docker info &> /dev/null; then
        echo -e "${RED}[ERROR] Docker daemon no responde. Inicie dockerd o Docker Desktop.${NC}"
        pausa
        return
    fi

    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}[*] Generando archivo .env a partir de .env.production.example...${NC}"
        cp .env.production.example .env
    fi

    echo -e "${YELLOW}[*] Compilando imágenes Docker multi-stage y levantando stack...${NC}"
    docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

    echo ""
    echo -e "${GREEN}==============================================================================${NC}"
    echo -e "${BOLD} STACK DE PRODUCCIÓN ACTIVO:${NC}"
    echo -e "  - Gateway Nginx: ${CYAN}http://localhost:80${NC}"
    echo -e "  - Salud Gateway: ${CYAN}http://localhost:80/gateway-health${NC}"
    echo -e "  - Salud Backend: ${CYAN}http://localhost:80/api/health${NC}"
    echo -e "  - PostgreSQL 16: ${CYAN}localhost:5434${NC}"
    echo -e "  - Redis 7:       ${CYAN}localhost:6379${NC}"
    echo -e "${GREEN}==============================================================================${NC}"
    pausa
}

docker_data() {
    clear
    echo -e "${CYAN}==============================================================================${NC}"
    echo -e "${BOLD}  LEVANTANDO SOLO POSTGRESQL Y REDIS EN DOCKER${NC}"
    echo -e "${CYAN}==============================================================================${NC}"
    echo ""

    if ! command -v docker &> /dev/null || ! docker info &> /dev/null; then
        echo -e "${RED}[ERROR] Docker daemon no responde. Inicie Docker Desktop.${NC}"
        pausa
        return
    fi

    echo -e "${YELLOW}[*] Iniciando PostgreSQL 16 (:5434) y Redis 7 (:6379)...${NC}"
    docker compose up -d postgres redis

    echo ""
    echo -e "${GREEN}[OK] Servicios de datos listos:${NC}"
    echo -e "  - PostgreSQL 16: ${CYAN}localhost:5434${NC}"
    echo -e "  - Redis 7:       ${CYAN}localhost:6379${NC}"
    echo ""
    echo -e "Ya puedes ejecutar localmente 'go run .' en multicatalogo-backend y se"
    echo -e "conectará directamente a los servicios reales de base de datos y caché."
    pausa
}

harness_doctor() {
    clear
    echo -e "${CYAN}==============================================================================${NC}"
    echo -e "${BOLD}  DIAGNÓSTICO DEL ENTORNO (AI HARNESS DOCTOR)${NC}"
    echo -e "${CYAN}==============================================================================${NC}"
    echo ""
    python harness/ai_harness.py doctor
    echo ""
    python harness/ai_harness.py status
    pausa
}

harness_tests() {
    clear
    echo -e "${CYAN}==============================================================================${NC}"
    echo -e "${BOLD}  SUITE DE PRUEBAS AUTOMATIZADAS${NC}"
    echo -e "${CYAN}==============================================================================${NC}"
    echo ""
    echo -e "${YELLOW}[*] 1/3 Probando comisiones multinivel (10%/5%/2%)...${NC}"
    python harness/ai_harness.py test mlm
    echo ""
    echo -e "${YELLOW}[*] 2/3 Validando contratos y esquemas APIError...${NC}"
    python harness/ai_harness.py test contracts
    echo ""
    echo -e "${YELLOW}[*] 3/3 Simulando transacciones ACID y Rollback...${NC}"
    python harness/ai_harness.py test acid-sim
    pausa
}

docker_logs() {
    clear
    echo -e "${CYAN}==============================================================================${NC}"
    echo -e "${BOLD}  STREAMING DE LOGS DOCKER (Presione Ctrl+C para volver)${NC}"
    echo -e "${CYAN}==============================================================================${NC}"
    echo ""
    docker compose -f docker-compose.prod.yml logs -f --tail=50
    pausa
}

stop_all() {
    clear
    echo -e "${CYAN}==============================================================================${NC}"
    echo -e "${BOLD}  DETENIENDO TODOS LOS SERVICIOS${NC}"
    echo -e "${CYAN}==============================================================================${NC}"
    echo ""

    echo -e "${YELLOW}[*] Deteniendo contenedores Docker...${NC}"
    docker compose -f docker-compose.prod.yml down &> /dev/null || true
    docker compose down &> /dev/null || true

    echo -e "${YELLOW}[*] Deteniendo procesos en puertos 3000 y 5173...${NC}"
    if command -v fuser &> /dev/null; then
        fuser -k 3000/tcp &> /dev/null || true
        fuser -k 5173/tcp &> /dev/null || true
    elif command -v lsof &> /dev/null; then
        lsof -ti:3000 | xargs kill -9 &> /dev/null || true
        lsof -ti:5173 | xargs kill -9 &> /dev/null || true
    fi

    if [ -n "$LOCAL_BACKEND_PID" ]; then
        kill "$LOCAL_BACKEND_PID" &> /dev/null || true
    fi
    if [ -n "$LOCAL_FRONTEND_PID" ]; then
        kill "$LOCAL_FRONTEND_PID" &> /dev/null || true
    fi

    echo -e "${GREEN}[OK] Todos los servicios fueron detenidos exitosamente.${NC}"
    pausa
}

# Bucle principal del menú
while true; do
    mostrar_menu
    read -r opcion
    case "$opcion" in
        1) dev_local ;;
        2) docker_prod ;;
        3) docker_data ;;
        4) harness_doctor ;;
        5) harness_tests ;;
        6) docker_logs ;;
        7) stop_all ;;
        0)
            clear
            echo -e "${GREEN}Gracias por usar MultiCatálogo. ¡Hasta pronto!${NC}"
            exit 0
            ;;
        *)
            echo -e "\n${RED}[!] Opción inválida. Intente nuevamente.${NC}"
            sleep 1
            ;;
    esac
done
