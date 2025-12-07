#!/bin/bash

# FleetFlow Simple Service Starter
# Starts all services without extensive checks since prerequisites are met

echo "🚛 FleetFlow - Starting All Services"
echo "====================================="

# Create logs directory
mkdir -p logs

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
    sleep 1
}

# Start Docker services
echo "🐳 Starting Docker Services..."
docker-compose up -d postgres redis
echo "✅ Docker services started"

# Wait for databases
echo "⏳ Waiting for databases..."
sleep 8

# Start all services
echo ""
echo "🚀 Starting Application Services..."
echo "==================================="

# Go Backend
start_service "go-backend" "cd go-backend && export PORT=8080 && export ENVIRONMENT=development && export DATABASE_URL='postgres://fleet:fleet@localhost:5432/fleetflow?sslmode=disable' && export JWT_SECRET='fleetflow-dev-secret-key-change-in-production' && export JWT_EXPIRATION='24h' && export REFRESH_TOKEN_EXPIRY='168h' && go run main.go"

# Wait for backend to start
sleep 8

# Web Dashboard
start_service "web-dashboard" "cd web && npm run dev"

# Customer Portal
start_service "customer-portal" "cd customer-portal && npm run dev"

# WhatsApp Service
start_service "whatsapp-service" "cd whatsapp-service && npm run dev"

# Mobile App
{{ ... }}

echo ""
echo "🎉 All Services Started!"
echo "========================"
echo ""
echo "🌐 Service URLs:"
echo "   • Go Backend (API):     http://localhost:8080"
echo "   • Go Backend (gRPC):    http://localhost:9090"
echo "   • WhatsApp Service:     http://localhost:8080/api/v1/whatsapp (integrated)"
echo "   • Web Dashboard:        http://localhost:5173"
echo "   • Customer Portal:      http://localhost:3001"
echo "   • Mobile App (Web):     http://localhost:19006"
echo ""
echo "📄 Check logs in ./logs/ directory"
echo "🛑 Stop all services: ./stop-all-services.sh"

# Create stop script
cat > stop-all-services.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping All FleetFlow Services..."

if [ -d "logs" ]; then
    for pid_file in logs/*.pid; do
        if [ -f "$pid_file" ]; then
            service_name=$(basename "$pid_file" .pid)
            pid=$(cat "$pid_file")
            if kill -0 "$pid" 2>/dev/null; then
                echo "🛑 Stopping $service_name (PID: $pid)..."
                kill "$pid"
            fi
            rm -f "$pid_file"
        fi
    done
fi

echo "🛑 Stopping Docker services..."
docker-compose down

echo "✅ All services stopped"
EOF

chmod +x stop-all-services.sh

echo ""
echo "🔍 Checking service health in 15 seconds..."
sleep 15
./monitor-services.sh
