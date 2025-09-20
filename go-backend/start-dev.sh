#!/bin/bash

# FleetFlow Go Backend - Development Startup Script

echo "🚛 Starting FleetFlow Go Backend (Development Mode)"
echo "=================================================="

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go 1.21 or higher."
    exit 1
fi

# Check Go version
GO_VERSION=$(go version | awk '{print $3}' | sed 's/go//')
echo "✅ Go version: $GO_VERSION"

# Set development environment variables
export PORT=8080
export ENVIRONMENT=development
export DATABASE_URL="postgres://fleet:fleet@localhost:5432/fleetflow?sslmode=disable"
export JWT_SECRET="fleetflow-dev-secret-key-change-in-production"
export JWT_EXPIRATION="24h"
export REFRESH_TOKEN_EXPIRY="168h"

echo "✅ Environment variables set for development"

# Check if database exists (optional)
echo "📋 Database connection will be tested on startup"
echo "   Make sure PostgreSQL is running and 'fleetflow' database exists"
echo "   Run: createdb fleetflow"

# Download dependencies
echo "📦 Downloading Go dependencies..."
go mod download

if [ $? -ne 0 ]; then
    echo "❌ Failed to download dependencies"
    exit 1
fi

echo "✅ Dependencies downloaded successfully"

# Display helpful information
echo ""
echo "🔧 Development Configuration:"
echo "   • Server Port: $PORT"
echo "   • Environment: $ENVIRONMENT"
echo "   • Database: PostgreSQL (fleetflow)"
echo "   • OTP Code: 111111 (development)"
echo "   • JWT Secret: Set (development key)"
echo ""
echo "📋 API Endpoints will be available at:"
echo "   • Health Check: http://localhost:$PORT/health"
echo "   • API Base: http://localhost:$PORT/api/v1"
echo "   • Swagger Docs: http://localhost:$PORT/swagger/index.html"
echo ""
echo "🧪 To test the API after startup:"
echo "   ./test-api.sh"
echo ""

# Start the application
echo "🚀 Starting FleetFlow Go Backend..."
echo "=================================================="
go run main.go
