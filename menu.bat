@echo off
setlocal EnableDelayedExpansion
title MultiCatálogo - Centro de Control y Despliegue

:MENU
cls
echo ==============================================================================
echo              MULTICATALOGO - CENTRO DE CONTROL Y DESPLIEGUE
echo ==============================================================================
echo.
echo   [1] Modo Desarrollo Local (Frontend + Backend en Host sin Docker)
echo   [2] Modo Produccion Docker Completo (Gateway + Frontend + Backend + BD + Redis)
echo   [3] Modo Hibrido: Solo BD (Postgres :5434) y Redis (:6379) en Docker
echo   [4] Diagnostico del Entorno y Puertos (AI Harness Doctor)
echo   [5] Ejecutar Suite de Pruebas Automatizadas (MLM, Contratos, ACID)
echo   [6] Ver Logs en Vivo de Contenedores Docker
echo   [7] Detener Todos los Servicios (Docker y Procesos Locales)
echo   [0] Salir
echo.
echo ==============================================================================
choice /c 12345670 /n /m " Seleccione una opcion [0-7]: "

if errorlevel 8 goto SALIR
if errorlevel 7 goto STOP_ALL
if errorlevel 6 goto DOCKER_LOGS
if errorlevel 5 goto HARNESS_TESTS
if errorlevel 4 goto HARNESS_DOCTOR
if errorlevel 3 goto DOCKER_DATA
if errorlevel 2 goto DOCKER_PROD
if errorlevel 1 goto DEV_LOCAL

:: ------------------------------------------------------------------------------
:: 1. DESARROLLO LOCAL
:: ------------------------------------------------------------------------------
:DEV_LOCAL
cls
echo ==============================================================================
echo   INICIANDO MODO DESARROLLO LOCAL (HOST)
echo ==============================================================================
echo.
echo [*] Iniciando Backend Go/Fiber en puerto 3000 (Ventana independiente)...
start "MultiCatalogo - Backend API (Go :3000)" cmd /k "cd multicatalogo-backend & go run ."

echo [*] Esperando 2 segundos para inicializacion del Backend...
ping -n 3 127.0.0.1 > nul

echo [*] Iniciando Frontend React/Vite en puerto 5173 (Ventana independiente)...
start "MultiCatalogo - Frontend SPA (Vite :5173)" cmd /k "cd multicatalogo-frontend & npm run dev"

echo.
echo [OK] Ambos servicios fueron lanzados en ventanas dedicadas.
echo.
echo   - Frontend:  http://localhost:5173
echo   - Backend:   http://localhost:3000/api/health
echo.
pause
goto MENU

:: ------------------------------------------------------------------------------
:: 2. PRODUCCION DOCKER COMPLETO
:: ------------------------------------------------------------------------------
:DOCKER_PROD
cls
echo ==============================================================================
echo   DESPLIEGUE EN PRODUCCION (DOCKER COMPOSE)
echo ==============================================================================
echo.
docker info > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker daemon no esta respondiendo.
    echo Inicie Docker Desktop antes de continuar.
    echo.
    pause
    goto MENU
)

if not exist ".env" (
    echo [*] Creando archivo .env a partir de .env.production.example...
    copy .env.production.example .env > nul
)

echo [*] Compilando imagenes y levantando el stack de produccion...
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

echo.
echo [OK] Stack de produccion activo:
echo   - Gateway Nginx: http://localhost:80
echo   - Salud Gateway: http://localhost:80/gateway-health
echo   - Salud Backend: http://localhost:80/api/health
echo   - Postgres 16:   localhost:5434
echo   - Redis 7:       localhost:6379
echo.
pause
goto MENU

:: ------------------------------------------------------------------------------
:: 3. HIBRIDO: SOLO SERVICIOS DE DATOS EN DOCKER
:: ------------------------------------------------------------------------------
:DOCKER_DATA
cls
echo ==============================================================================
echo   LEVANTANDO SOLO POSTGRESQL Y REDIS EN DOCKER
echo ==============================================================================
echo.
docker info > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker daemon no esta respondiendo. Inicie Docker Desktop.
    echo.
    pause
    goto MENU
)

echo [*] Levantando contenedores de base de datos y cache...
docker compose up -d postgres redis

echo.
echo [OK] Servicios de datos activos:
echo   - PostgreSQL 16: localhost:5434
echo   - Redis 7:       localhost:6379
echo.
echo Ya puedes ejecutar localmente 'go run .' en multicatalogo-backend y
echo se conectara directamente a la base de datos y Redis reales.
echo.
pause
goto MENU

:: ------------------------------------------------------------------------------
:: 4. DIAGNOSTICO AI HARNESS
:: ------------------------------------------------------------------------------
:HARNESS_DOCTOR
cls
echo ==============================================================================
echo   DIAGNOSTICO DEL ENTORNO (AI HARNESS DOCTOR)
echo ==============================================================================
echo.
python harness/ai_harness.py doctor
echo.
python harness/ai_harness.py status
echo.
pause
goto MENU

:: ------------------------------------------------------------------------------
:: 5. PRUEBAS AUTOMATIZADAS
:: ------------------------------------------------------------------------------
:HARNESS_TESTS
cls
echo ==============================================================================
echo   EJECUTANDO SUITE DE PRUEBAS AUTOMATIZADAS
echo ==============================================================================
echo.
echo [*] 1/3 Probando logica pura de comisiones MLM...
python harness/ai_harness.py test mlm
echo.
echo [*] 2/3 Validando contratos y esquemas APIError...
python harness/ai_harness.py test contracts
echo.
echo [*] 3/3 Simulando transacciones ACID y Rollback de stock...
python harness/ai_harness.py test acid-sim
echo.
pause
goto MENU

:: ------------------------------------------------------------------------------
:: 6. LOGS DOCKER
:: ------------------------------------------------------------------------------
:DOCKER_LOGS
cls
echo ==============================================================================
echo   STREAMING DE LOGS DOCKER (Presione Ctrl+C para salir de los logs)
echo ==============================================================================
echo.
docker compose -f docker-compose.prod.yml logs -f --tail=50
pause
goto MENU

:: ------------------------------------------------------------------------------
:: 7. DETENER SERVICIOS
:: ------------------------------------------------------------------------------
:STOP_ALL
cls
echo ==============================================================================
echo   DETENIENDO TODOS LOS SERVICIOS
echo ==============================================================================
echo.
echo [*] Deteniendo contenedores Docker de produccion...
docker compose -f docker-compose.prod.yml down > nul 2>&1
docker compose down > nul 2>&1

echo [*] Cerrando procesos locales en puerto 3000 y 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a > nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /f /pid %%a > nul 2>&1

echo.
echo [OK] Todos los contenedores y procesos locales fueron detenidos.
echo.
pause
goto MENU

:SALIR
cls
echo ==============================================================================
echo   Gracias por usar MultiCatalogo.
echo ==============================================================================
exit /b 0
