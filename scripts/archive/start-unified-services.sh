#!/bin/bash

# FleetFlow Unified Go Architecture - Service Starter
# Now with WhatsApp integrated into Go backend

echo "🚛 FleetFlow - Unified Go Backend Architecture"
echo "=============================================="
echo "✅ Java Backend: REMOVED"
echo "✅ Node.js WhatsApp: MIGRATED to Go"
echo "✅ Unified Go Backend: REST + gRPC + WhatsApp"
echo ""

# Create logs directory
mkdir -p logs

# Start Docker services
echo "🐳 Starting Docker Services..."
docker-compose up -d postgres redis
echo "✅ Docker services started"

# Wait for databases
echo "⏳ Waiting for databases..."
sleep 8

# Install dependencies if needed
echo "📦 Installing Dependencies..."
cd go-backend && go mod download && go mod tidy && cd ..
cd web && npm ci && cd ..
cd mobile && npm install --legacy-peer-deps && cd ..
cd customer-portal && npm ci && cd ..

echo "✅ Dependencies installed"

# Function to start service in background
start_service() {
    local service_name="$1"
    local command="$2"
    local log_file="logs/${service_name}.log"
    
    echo "🚀 Starting $service_name..."
    
    # Clear old logs
    > "$log_file"
    
    # Start service
    nohup bash -c "$command" > "$log_file" 2>&1 &
    local pid=$!
    echo "$pid" > "logs/${service_name}.pid"
    
    echo "   ✅ $service_name started (PID: $pid) - Logs: $log_file"
    sleep 2
}

# Start the unified Go backend (includes WhatsApp service)
start_service "go-unified-backend" "cd go-backend && export PORT=8080 && export ENVIRONMENT=development && export DATABASE_URL='postgres://fleet:fleet@localhost:5432/fleetflow?sslmode=disable' && export JWT_SECRET='fleetflow-dev-secret-key-change-in-production' && export JWT_EXPIRATION='24h' && export REFRESH_TOKEN_EXPIRY='168h' && export WHATSAPP_VERIFY_TOKEN='fleetflow_verify_token' && export CUSTOMER_PORTAL_URL='http://localhost:3000' && export WHATSAPP_ACCESS_TOKEN='' && export WHATSAPP_PHONE_NUMBER_ID='' && go run main.go"

# Wait for backend to start
echo "⏳ Waiting for Go Backend..."
sleep 8

# Start frontend services
start_service "web-dashboard" "cd web && npm run dev"
start_service "customer-portal" "cd customer-portal && npm run dev -- --port 3000"  
start_service "mobile-app" "cd mobile && npx expo start --web --port 19006"

echo ""
echo "🎉 Unified FleetFlow Architecture Started!"
echo "========================================"
echo ""
echo "🚀 ARCHITECTURE IMPROVEMENTS:"
echo "   ✅ Unified Go Backend (was Java + Node.js + Go)"
echo "   ✅ WhatsApp integrated into main API (was separate service)"
echo "   ✅ Single language stack (Go only)"
echo "   ✅ Better performance and maintainability"
echo ""
echo "🌐 Service URLs:"
echo "   • Go Backend (REST):     http://localhost:8080"
echo "   • Go Backend (gRPC):     http://localhost:9090"
echo "   • WhatsApp API:          http://localhost:8080/api/v1/whatsapp"
echo "   • Web Dashboard:         http://localhost:5173"
echo "   • Customer Portal:       http://localhost:3000"
echo "   • Mobile App (Web):      http://localhost:19006"
echo ""
echo "📱 WhatsApp Integration Test:"
echo "   curl -X POST http://localhost:8080/api/v1/whatsapp/send \\"
echo "        -H \"Authorization: Bearer dev-token\" \\"
echo "        -H \"Content-Type: application/json\" \\"
echo "        -d '{\"to\":\"+919999999999\",\"message\":\"Hello from FleetFlow!\"}'"
echo ""
echo "📊 Health Checks:"
echo "   • Go Backend:    curl http://localhost:8080/health"
echo "   • WhatsApp:      curl http://localhost:8080/api/v1/whatsapp/status"
echo "   • gRPC Services: grpcurl -plaintext localhost:9090 list"

echo ""
echo "🔍 Checking service health in 10 seconds..."
sleep 10

# Check service health
echo "📊 Service Health Status:"
echo "=========================="

# Test Go backend
if curl -s http://localhost:8080/health >/dev/null 2>&1; then
    echo "✅ Go Backend: Running"
else
    echo "❌ Go Backend: Not responding"
fi

# Test WhatsApp integration
if curl -s http://localhost:8080/api/v1/whatsapp/status >/dev/null 2>&1; then
    echo "✅ WhatsApp Service: Integrated and running"
else
    echo "❌ WhatsApp Service: Not responding"
fi

# Test customer portal
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ Customer Portal: Running"
else
    echo "❌ Customer Portal: Not responding"
fi

echo ""
echo "🎯 Unified Architecture Benefits:"
echo "   • 🚀 Single Go binary deployment"
echo "   • ⚡ Better performance (no HTTP overhead for WhatsApp)"
echo "   • 🔧 Easier debugging (single language)"
echo "   • 📊 Unified logging and monitoring"
echo "   • 🔒 Consistent security patterns"
echo ""
echo "📄 Logs are in ./logs/ directory"
echo "🛑 Stop services: ./stop-all-services.sh"
