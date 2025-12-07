#!/bin/bash
# FleetFlow Cross-Platform Service Runner
# Works on macOS, Linux, and Windows (PowerShell)

set -e

# Detect OS
OS_TYPE="$(uname -s 2>/dev/null || echo Windows_NT)"

case "$OS_TYPE" in
    Darwin*)
        echo "🍎 macOS detected"
        SHELL_TYPE="bash"
        ;;
    Linux*)
        echo "🐧 Linux detected"
        SHELL_TYPE="bash"
        ;;
    MINGW*|MSYS*|CYGWIN*|Windows_NT)
        echo "🪟 Windows detected"
        SHELL_TYPE="powershell"
        ;;
    *)
        echo "❌ Unsupported OS: $OS_TYPE"
        exit 1
        ;;
esac

############################################
# macOS / Linux Implementation
############################################
run_bash() {
    echo "🚛 FleetFlow - Starting All Services (macOS/Linux)"
    echo "======================================"

    # Check dependencies
    command -v docker >/dev/null 2>&1 || { echo "❌ Docker not installed"; exit 1; }
    docker info >/dev/null 2>&1 || { echo "❌ Docker daemon not running"; exit 1; }

    mkdir -p logs

    # Start Docker services
    docker compose down --remove-orphans || docker-compose down --remove-orphans
    docker compose up -d postgres redis || docker-compose up -d postgres redis
    sleep 10

    # Setup DB
    docker exec -i $(docker ps -qf name=postgres) psql -U fleet -d postgres -c \
      "SELECT 1 FROM pg_database WHERE datname = 'fleetflow';" | grep -q 1 || \
      docker exec -i $(docker ps -qf name=postgres) psql -U fleet -d postgres -c "CREATE DATABASE fleetflow;"

    # Start services
    start_service() {
        local name="$1"; shift
        local cmd="$@"
        local log="logs/$name.log"
        echo "🚀 Starting $name..."
        nohup bash -c "$cmd" >"$log" 2>&1 &
        echo $! >"logs/$name.pid"
    }

    start_service go-backend "cd go-backend && PORT=8080 DATABASE_URL='postgres://fleet:fleet@localhost:5432/fleetflow?sslmode=disable' go run main.go"
    sleep 5
    start_service web-dashboard "cd web && npm run dev"
    start_service customer-portal "cd customer-portal && npm run dev -- --port 3000"
    start_service mobile-app "cd mobile && npx expo start --web --port 19006"

    echo "🎉 All services started (macOS/Linux)"
}

############################################
# Windows Implementation (PowerShell)
############################################
run_powershell() {
    powershell  -NoProfile -Command @'
    Write-Host "🚛 FleetFlow - Starting All Services (Windows)"
    Write-Host "======================================"

    function Command-Exists($cmd) {
        $null -ne (Get-Command $cmd -ErrorAction SilentlyContinue)
    }

    if (-not (Command-Exists docker)) {
        Write-Error "❌ Docker not installed"
        exit 1
    }
    try { docker info | Out-Null } catch { Write-Error "❌ Docker not running"; exit 1 }

    if (-not (Test-Path logs)) { New-Item -ItemType Directory logs | Out-Null }

    # Docker services
    if (Command-Exists "docker-compose") {
        docker-compose down --remove-orphans
        docker-compose up -d postgres redis
    } else {
        docker compose down --remove-orphans
        docker compose up -d postgres redis
    }
    Start-Sleep -Seconds 10

    # Setup DB
    $pg = docker ps --filter "name=postgres" -q
    docker exec -i $pg psql -U fleet -d postgres -c "SELECT 1 FROM pg_database WHERE datname = 'fleetflow';" | Select-String "1" `
        || docker exec -i $pg psql -U fleet -d postgres -c "CREATE DATABASE fleetflow;"

    function Start-Service-Background($name, $cmd) {
        $log = "logs/$name.log"
        $proc = Start-Process powershell  -ArgumentList "-NoProfile", "-Command", "$cmd | Tee-Object -FilePath $log" -PassThru
        $proc.Id | Set-Content "logs/$name.pid"
        Write-Host "🚀 $name started (PID: $($proc.Id))"
    }

    Start-Service-Background "go-backend" "cd go-backend; $env:PORT=8080; $env:DATABASE_URL='postgres://fleet:fleet@localhost:5432/fleetflow?sslmode=disable'; go run main.go"
    Start-Sleep -Seconds 5
    Start-Service-Background "web-dashboard" "cd web; npm run dev"
    Start-Service-Background "customer-portal" "cd customer-portal; npm run dev -- --port 3000"
    Start-Service-Background "mobile-app" "cd mobile; npx expo start --web --port 19006"

    Write-Host "🎉 All services started (Windows)"
'@
}

############################################
# Run Correct Section
############################################
if [ "$SHELL_TYPE" = "bash" ]; then
    run_bash
else
    run_powershell
fi
