# ==============================================================================
# MULTICATÁLOGO - SCRIPT DE DESPLIEGUE A PRODUCCIÓN (POWERSHELL)
# ==============================================================================
# Uso:
#   .\scripts\prod-deploy.ps1 [-Build] [-NoCache] [-Down] [-Logs]
# ==============================================================================

param (
    [switch]$Build,
    [switch]$NoCache,
    [switch]$Down,
    [switch]$Logs
)

$ErrorActionPreference = "Stop"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " MULTICATÁLOGO - PIPELINE DE DESPLIEGUE EN PRODUCCIÓN " -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

# 1. Verificar disponibilidad del CLI de Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "[ERROR] Docker CLI no está instalado en el sistema."
    exit 1
}

# 2. Verificar si el daemon de Docker responde
try {
    docker info > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ALERTA] El Docker daemon no está respondiendo." -ForegroundColor Yellow
        Write-Host "Asegúrese de iniciar Docker Desktop o el servicio dockerd antes de continuar." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "[ALERTA] Error al comunicar con Docker daemon." -ForegroundColor Red
    exit 1
}

# 3. Opción de bajada de servicios
if ($Down) {
    Write-Host "[INFO] Deteniendo servicios de producción..." -ForegroundColor Yellow
    docker compose -f docker-compose.prod.yml down
    Write-Host "[OK] Contenedores detenidos y redes liberadas." -ForegroundColor Green
    exit 0
}

# 4. Verificar existencia de .env
if (-not (Test-Path ".env")) {
    Write-Host "[AVISO] No se encontró el archivo .env. Creando a partir de .env.production.example..." -ForegroundColor Yellow
    Copy-Item ".env.production.example" ".env"
    Write-Host "[OK] .env creado exitosamente. Recuerde cambiar las claves por defecto antes de ir a Internet público." -ForegroundColor Green
}

# 5. Construcción de imágenes
if ($Build -or $NoCache) {
    $buildArgs = @("compose", "-f", "docker-compose.prod.yml", "build")
    if ($NoCache) {
        $buildArgs += "--no-cache"
    }
    Write-Host "[INFO] Compilando imágenes Docker multi-stage optimizadas..." -ForegroundColor Cyan
    & docker @buildArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Error "[ERROR] Falló la compilación de imágenes Docker."
        exit 1
    }
    Write-Host "[OK] Imágenes compiladas con éxito." -ForegroundColor Green
}

# 6. Levantar servicios en segundo plano
Write-Host "[INFO] Levantando stack de producción con Docker Compose..." -ForegroundColor Cyan
docker compose -f docker-compose.prod.yml up -d --remove-orphans

if ($LASTEXITCODE -ne 0) {
    Write-Error "[ERROR] Error al arrancar los contenedores."
    exit 1
}

# 7. Espera activa de verificación de salud
Write-Host "`n[INFO] Verificando estado de salud de los servicios (Healthcheck)..." -ForegroundColor Cyan
$maxAttempts = 30
$attempt = 0
$allHealthy = $false

while ($attempt -lt $maxAttempts -and -not $allHealthy) {
    Start-Sleep -Seconds 2
    $attempt++
    
    $statuses = docker compose -f docker-compose.prod.yml ps --format "{{.Service}}: {{.Health}}" 2>$null
    Write-Host " Intento $attempt/$maxAttempts..." -ForegroundColor Gray
    
    # Comprobar si hay servicios no saludables
    $unhealthy = $statuses | Where-Object { $_ -match "starting" -or $_ -match "unhealthy" }
    if (-not $unhealthy -and $statuses.Count -gt 0) {
        $allHealthy = $true
    }
}

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host " DESPLIEGUE COMPLETADO EXITOSAMENTE " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

docker compose -f docker-compose.prod.yml ps

Write-Host "`n[RUTAS ACTIVAS]:" -ForegroundColor White
Write-Host " - Frontend SPA:         http://localhost:80" -ForegroundColor Cyan
Write-Host " - API Gateway Health:   http://localhost:80/gateway-health" -ForegroundColor Cyan
Write-Host " - Backend API Health:   http://localhost:80/api/health" -ForegroundColor Cyan
Write-Host " - PostgreSQL 16:        localhost:5434" -ForegroundColor Cyan
Write-Host " - Redis 7:              localhost:6379" -ForegroundColor Cyan

if ($Logs) {
    Write-Host "`n[STREAMING DE LOGS - Presione Ctrl+C para salir]:" -ForegroundColor Yellow
    docker compose -f docker-compose.prod.yml logs -f
}
