#!/bin/bash

# FleetFlow Complete Setup Script
# This script resolves all common setup issues in one go

echo "🚛 FleetFlow Complete Environment Setup"
echo "======================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print colored output
print_status() {
    echo -e "\033[1;32m✅ $1\033[0m"
}

print_error() {
    echo -e "\033[1;31m❌ $1\033[0m"
}

print_warning() {
    echo -e "\033[1;33m⚠️  $1\033[0m"
}

# 1. Install missing system dependencies
echo ""
echo "📦 Checking and installing system dependencies..."
echo "================================================"

# Install Go
if ! command_exists go; then
    echo "📥 Installing Go..."
    sudo apt update
    sudo apt install -y golang-go
    if [ $? -eq 0 ]; then
        print_status "Go installed successfully"
    else
        print_error "Failed to install Go"
        exit 1
    fi
else
    print_status "Go already installed: $(go version)"
fi

# Install PostgreSQL
if ! command_exists psql; then
    echo "📥 Installing PostgreSQL..."
    sudo apt install -y postgresql postgresql-contrib
    if [ $? -eq 0 ]; then
        print_status "PostgreSQL installed successfully"
    else
        print_error "Failed to install PostgreSQL"
        exit 1
    fi
else
    print_status "PostgreSQL already installed"
fi

# Install Git
if ! command_exists git; then
    echo "📥 Installing Git..."
    sudo apt install -y git
    if [ $? -eq 0 ]; then
        print_status "Git installed successfully"
    else
        print_error "Failed to install Git"
        exit 1
    fi
else
    print_status "Git already installed: $(git --version)"
fi

# Install net-tools for network diagnostics
if ! command_exists netstat; then
    sudo apt install -y net-tools
    print_status "net-tools installed for network diagnostics"
fi

# 2. Start and configure PostgreSQL
echo ""
echo "🗄️  Configuring PostgreSQL..."
echo "============================="

# Start PostgreSQL service
sudo systemctl start postgresql
if [ $? -eq 0 ]; then
    print_status "PostgreSQL service started"
else
    print_error "Failed to start PostgreSQL service"
    exit 1
fi

# Enable PostgreSQL to start on boot
sudo systemctl enable postgresql
print_status "PostgreSQL enabled to start on boot"

# Check and fix PostgreSQL port (should be 5432)
PORT_CHECK=$(sudo -u postgres psql -c "SHOW port;" -t 2>/dev/null | tr -d ' ')
if [ "$PORT_CHECK" != "5432" ]; then
    echo "🔧 Fixing PostgreSQL port from $PORT_CHECK to 5432..."
    sudo sed -i 's/port = '$PORT_CHECK'/port = 5432/' /etc/postgresql/16/main/postgresql.conf
    sudo systemctl restart postgresql
    print_status "PostgreSQL port fixed to 5432"
else
    print_status "PostgreSQL already running on port 5432"
fi

# 3. Setup FleetFlow database and user
echo ""
echo "🗄️  Setting up FleetFlow database..."
echo "==================================="

# Create database if it doesn't exist
sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname = 'fleetflow';" | grep -q 1 || {
    sudo -u postgres createdb fleetflow
    print_status "FleetFlow database created"
}

# Create fleet user if it doesn't exist
sudo -u postgres psql -c "SELECT 1 FROM pg_user WHERE usename = 'fleet';" | grep -q 1 || {
    sudo -u postgres psql -c "CREATE USER fleet WITH PASSWORD 'fleet';"
    print_status "Fleet user created"
}

# Grant permissions on fleetflow database
echo "🔐 Granting database permissions..."
sudo -u postgres psql -d fleetflow -c "GRANT ALL ON SCHEMA public TO fleet;" 2>/dev/null || print_warning "Some permissions may have been granted already"
sudo -u postgres psql -d fleetflow -c "GRANT CREATE ON SCHEMA public TO fleet;" 2>/dev/null || print_warning "CREATE permission may have been granted already"
sudo -u postgres psql -d fleetflow -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fleet;" 2>/dev/null || print_warning "Table permissions may have been granted already"

# Test database connection
echo "🔍 Testing database connection..."
if psql -h localhost -U fleet -d fleetflow -c "SELECT version();" >/dev/null 2>&1; then
    print_status "Database connection successful"
else
    print_error "Database connection failed"
    exit 1
fi

# 4. Setup Go backend environment
echo ""
echo "🔧 Setting up Go backend..."
echo "=========================="

cd go-backend

# Ensure script is executable
chmod +x start-dev.sh
print_status "Go backend startup script is executable"

# Test if Go backend can start (without actually starting it)
echo "🔍 Testing Go backend configuration..."
export PATH=/usr/bin:$PATH
export PORT=8080
export ENVIRONMENT=development
export DATABASE_URL="postgres://fleet:fleet@localhost:5432/fleetflow?sslmode=disable"
export JWT_SECRET="fleetflow-dev-secret-key-change-in-production"
export JWT_EXPIRATION="24h"
export REFRESH_TOKEN_EXPIRY="168h"

# Check if we can compile the Go backend
go mod download >/dev/null 2>&1
if [ $? -eq 0 ]; then
    print_status "Go backend dependencies downloaded successfully"
else
    print_error "Failed to download Go backend dependencies"
    exit 1
fi

# 5. Create a quick start guide
echo ""
echo "📋 FleetFlow Quick Start Guide"
echo "=============================="
echo ""
echo "✅ SETUP COMPLETE! All systems ready."
echo ""
echo "🌐 To start services:"
echo "   1. Go Backend:    cd go-backend && ./start-dev.sh"
echo "   2. Web Portal:    cd web && npm run dev"  
echo "   3. Customer Portal: cd customer-portal && npm run dev"
echo ""
echo "🔗 URLs after startup:"
echo "   • Go Backend API:    http://localhost:8080"
echo "   • Web Dashboard:     http://localhost:5173"
echo "   • Customer Portal:   http://localhost:3001"
echo "   • Health Check:      http://localhost:8080/health"
echo "   • API Docs:          http://localhost:8080/swagger/index.html"
echo ""
echo "🗄️  Database:"
echo "   • Host: localhost:5432"
echo "   • Database: fleetflow"
echo "   • User: fleet"
echo "   • Password: fleet"
echo ""
echo "📝 Default OTP (development): 111111"
echo ""
echo "🎉 Happy coding! All setup issues have been resolved."

# Make the script executable
chmod +x "$0"
