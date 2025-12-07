#!/bin/bash

# FleetFlow Service Monitor
# Shows status of all running services

echo "🔍 FleetFlow Service Monitor"
echo "============================"

# Function to check if port is in use
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "✅ $service (Port $port): Running"
    else
        echo "❌ $service (Port $port): Not running"
    fi
}

# Function to check service by PID file
check_service_pid() {
    local service_name=$1
    local pid_file="logs/${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "✅ $service_name (PID $pid): Running"
            return 0
        else
            echo "❌ $service_name: Dead (stale PID file)"
            rm -f "$pid_file"
            return 1
        fi
    else
        echo "❌ $service_name: Not started"
        return 1
    fi
}

echo ""
echo "🌐 Network Services:"
check_port 8080 "Go Backend (REST + WhatsApp)"
check_port 9090 "Go Backend (gRPC)"
check_port 5173 "Web Dashboard" 
check_port 3000 "Customer Portal"
check_port 19006 "Mobile App (Web)"
check_port 19002 "Expo DevTools"

echo ""
echo "🐳 Docker Services:"
check_port 5432 "PostgreSQL"
check_port 6379 "Redis"

echo ""
echo "📊 Process Status:"
if [ -d "logs" ]; then
    check_service_pid "go-backend"
    check_service_pid "web-dashboard" 
    check_service_pid "customer-portal"
    check_service_pid "whatsapp-service"
    check_service_pid "mobile-app"
else
    echo "❌ No logs directory found - services not started via script"
fi

echo ""
echo "🔗 Quick Links:"
echo "   • API Health:           curl http://localhost:8080/health"
echo "   • WhatsApp Health:      curl http://localhost:8080/api/v1/whatsapp/status"
echo "   • gRPC Health:          grpcurl -plaintext localhost:9090 list"
echo "   • Web Dashboard:        http://localhost:5173"
echo "   • Customer Portal:      http://localhost:3000"
echo "   • Mobile (Web):         http://localhost:19006"
echo ""
echo "📄 Log Files:"
if [ -d "logs" ]; then
    ls -la logs/*.log 2>/dev/null | awk '{print "   • " $9 " (" $5 " bytes)"}' || echo "   • No log files found"
else
    echo "   • No logs directory"
fi
