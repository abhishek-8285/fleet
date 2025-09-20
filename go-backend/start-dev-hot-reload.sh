#!/bin/bash

# FleetFlow Go Backend - Hot Reload Development Server

echo "🔥 FleetFlow Go Backend - Hot Reload Mode"
echo "==========================================="
echo "✅ Auto-reload on file changes"
echo "✅ Enhanced error handling"
echo "✅ Crash-proof development"
echo ""

# Check if Air is installed and add to PATH
export PATH="$PATH:$HOME/go/bin"
if ! command -v air &> /dev/null; then
    echo "📦 Installing Air hot reload tool..."
    go install github.com/air-verse/air@latest
    echo "✅ Air installed successfully"
fi

# Set development environment variables
export PORT=8080
export ENVIRONMENT=development
export DATABASE_URL="postgres://fleet:fleet@localhost:5432/fleetflow?sslmode=disable"
export JWT_SECRET="fleetflow-dev-secret-key-change-in-production"
export JWT_EXPIRATION="24h"
export REFRESH_TOKEN_EXPIRY="168h"

# WhatsApp configuration (dev mode - no actual API calls)
export WHATSAPP_ACCESS_TOKEN=""
export WHATSAPP_PHONE_NUMBER_ID=""
export WHATSAPP_VERIFY_TOKEN="fleetflow_verify_token"
export CUSTOMER_PORTAL_URL="http://localhost:3000"

echo "✅ Environment variables configured"

# Check if database is running
echo "🔍 Checking database connectivity..."
if ! docker ps | grep -q "postgres"; then
    echo "🐳 Starting Docker services..."
    docker-compose up -d postgres redis
    echo "⏳ Waiting for database to be ready..."
    sleep 10
fi

# Test database connection
if docker-compose exec -T postgres psql -U fleet -d fleetflow -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Database connection verified"
else
    echo "❌ Database connection failed"
    echo "💡 Make sure Docker services are running: docker-compose up -d postgres redis"
    exit 1
fi

# Clean up old temp files
rm -rf tmp/
mkdir -p tmp/

echo ""
echo "🔧 Development Configuration:"
echo "   • Server Port: $PORT"
echo "   • Environment: $ENVIRONMENT"
echo "   • Hot Reload: ✅ Enabled"
echo "   • Crash Recovery: ✅ Enabled"
echo "   • Request Timeout: ⏱️ 30 seconds"
echo "   • Database: PostgreSQL (fleetflow)"
echo "   • WhatsApp: 🧪 Development mode (logs only)"
echo ""

echo "📋 Available Endpoints:"
echo "   • REST API:         http://localhost:$PORT/api/v1/"
echo "   • Health Check:     http://localhost:$PORT/health"  
echo "   • WhatsApp API:     http://localhost:$PORT/api/v1/whatsapp/"
echo "   • WebSocket:        ws://localhost:$PORT/ws"
echo "   • API Documentation: http://localhost:$PORT/swagger/index.html"
echo ""

echo "🧪 Test Commands:"
echo "   # Health Check"
echo "   curl http://localhost:$PORT/health"
echo ""
echo "   # WhatsApp Status"  
echo "   curl http://localhost:$PORT/api/v1/whatsapp/status"
echo ""
echo "   # Send WhatsApp Test (dev mode)"
echo "   curl -X POST http://localhost:$PORT/api/v1/whatsapp/send \\"
echo "        -H \"Authorization: Bearer dev-token\" \\"
echo "        -H \"Content-Type: application/json\" \\"
echo "        -d '{\"to\":\"+919999999999\",\"message\":\"Hello FleetFlow!\"}'"
echo ""

echo "🚀 Starting FleetFlow with Hot Reload..."
echo "========================================"
echo "💡 Make changes to .go files and they'll auto-reload!"
echo "🛑 Press Ctrl+C to stop"
echo ""

# Start Air hot reload
air
