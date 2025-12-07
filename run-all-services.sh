#!/bin/bash

# FleetFlow All Services Runner
# Runs all services except Java Backend and Simulator Service
# Author: FleetFlow Team

set -e  # Exit on any error

echo "🚛 FleetFlow - Starting All Services"
echo "======================================"
echo "Services to start:"
echo "  ✅ Docker (Postgres + Redis)"
echo "  ✅ Go Backend (gRPC + WhatsApp Service)"
echo "  ✅ Web Dashboard (React/Vite)"
echo "  ✅ Mobile App (React Native)"
echo "  ✅ Customer Portal (Next.js)"
echo ""


# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Homebrew (macOS)
install_homebrew() {
    if ! command_exists brew; then
        echo "📦 Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        echo "✅ Homebrew installed successfully"
    else
        echo "✅ Homebrew already installed"
    fi
}

# Function to install Node.js
install_nodejs() {
    if ! command_exists node; then
        echo "📦 Installing Node.js..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install node
        else
            # Linux installation
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        fi
        echo "✅ Node.js installed successfully"
    else
        NODE_VERSION=$(node --version)
        echo "✅ Node.js already installed: $NODE_VERSION"
    fi
}

# Function to install Go
install_go() {
    if ! command_exists go; then
        echo "📦 Installing Go..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install go
        else
            # Linux installation
            wget https://go.dev/dl/go1.23.0.linux-amd64.tar.gz
            sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.23.0.linux-amd64.tar.gz
            echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
            source ~/.bashrc
        fi
        echo "✅ Go installed successfully"
    else
        GO_VERSION=$(go version)
        echo "✅ Go already installed: $GO_VERSION"
    fi
}

# Function to install Docker
install_docker() {
    if ! command_exists docker; then
        echo "📦 Installing Docker..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install --cask docker
            echo "Please start Docker Desktop manually and then re-run this script"
            exit 1
        else
            # Linux installation
            curl -fsSL https://get.docker.com -o get-docker.sh
            sh get-docker.sh
            sudo usermod -aG docker $USER
            echo "Please logout and login again to use Docker without sudo, then re-run this script"
            exit 1
        fi
    else
        echo "✅ Docker already installed"
    fi
}

# Function to install Expo CLI
install_expo() {
    if ! command_exists expo; then
        echo "📦 Installing Expo CLI..."
        npm install -g @expo/cli
        echo "✅ Expo CLI installed successfully"
    else
        echo "✅ Expo CLI already installed"
    fi
}

# Check OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 macOS detected"
    install_homebrew
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Linux detected"
    sudo apt-get update
else
    echo "❌ Unsupported OS. This script works on macOS and Linux."
    exit 1
fi

# Install all dependencies
echo ""
echo "📦 Installing Dependencies..."
echo "============================="
install_nodejs
install_go
install_docker
install_expo

# Check if Docker daemon is running
echo ""
echo "🐳 Checking Docker..."
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker daemon is not running. Please start Docker and try again."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "   Start Docker Desktop application"
    else
        echo "   Run: sudo systemctl start docker"
    fi
    exit 1
fi
echo "✅ Docker daemon is running"

# Create log directory
mkdir -p logs

# Function to start service in background
start_service() {
    local service_name="$1"
    local command="$2"
    local log_file="logs/${service_name}.log"
    
    echo "🚀 Starting $service_name..."
    nohup bash -c "$command" > "$log_file" 2>&1 &
    local pid=$!
    echo "$pid" > "logs/${service_name}.pid"
    echo "   ✅ $service_name started (PID: $pid)"
    echo "   📄 Logs: $log_file"
}

# Start Docker services
echo ""
echo "🐳 Starting Docker Services..."
echo "==============================="
docker-compose down --remove-orphans
docker-compose up -d postgres redis
echo "✅ Docker services (Postgres + Redis) started"

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
sleep 10

# Create database if it doesn't exist
echo "🗄️ Setting up database..."
docker-compose exec -T postgres psql -U fleet -d postgres -c "SELECT 1 FROM pg_database WHERE datname = 'fleetflow';" | grep -q 1 || docker-compose exec -T postgres psql -U fleet -d postgres -c "CREATE DATABASE fleetflow;"
echo "✅ Database setup complete"

# Function to check and install dependencies smartly
install_deps_if_needed() {
    local service_name=$1
    local service_dir=$2
    local package_manager=$3
    
    if [ ! -d "$service_dir" ]; then
        echo "❌ $service_name: Directory missing ($service_dir)"
        return 1
    fi
    
    cd "$service_dir"
    
    if [ "$package_manager" == "npm" ]; then
        if [ ! -f "package.json" ]; then
            echo "❌ $service_name: package.json missing"
            cd ..
            return 1
        fi
        
        # Check if node_modules exists and package-lock.json is newer than package.json
        if [ -d "node_modules" ] && [ -f "package-lock.json" ] && [ "package-lock.json" -nt "package.json" ]; then
            echo "✅ $service_name: Dependencies already installed and up-to-date"
        else
            echo "📦 Installing $service_name dependencies..."
            # Special handling for mobile app due to React version conflicts
            if [ "$service_name" == "Mobile App" ]; then
                npm install --legacy-peer-deps
            elif [ -f "package-lock.json" ]; then
                npm ci
            else
                npm install
            fi
            echo "✅ $service_name dependencies installed"
        fi
    elif [ "$package_manager" == "go" ]; then
        if [ ! -f "go.mod" ]; then
            echo "❌ $service_name: go.mod missing"
            cd ..
            return 1
        fi
        
        # Check if go.sum exists and is recent
        if [ -f "go.sum" ] && [ "go.sum" -nt "go.mod" ]; then
            echo "✅ $service_name: Go dependencies already downloaded and up-to-date"
        else
            echo "📦 Installing $service_name dependencies..."
            go mod download
            echo "✅ $service_name dependencies installed"
        fi
    fi
    
    cd ..
    return 0
}

# Install dependencies for each service
echo ""
echo "📦 Smart Dependency Installation..."
echo "==================================="

install_deps_if_needed "Go Backend" "backend" "go"
install_deps_if_needed "Web Dashboard" "frontend/dashboard" "npm"
install_deps_if_needed "Mobile App" "mobile" "npm"
install_deps_if_needed "Customer Portal" "frontend/portal" "npm"

echo "📦 WhatsApp Service: Integrated in Go Backend"
echo "✅ WhatsApp Service: No separate installation needed (part of Go Backend)"

# Start all services
echo ""
echo "🚀 Starting All Services..."
echo "============================"

# Go Backend
start_service "go-backend" "cd backend && export PORT=8080 && export ENVIRONMENT=development && export DATABASE_URL='postgres://fleet:fleet@localhost:5432/fleetflow?sslmode=disable' && export JWT_SECRET='fleetflow-dev-secret-key-change-in-production' && export JWT_EXPIRATION='24h' && export REFRESH_TOKEN_EXPIRY='168h' && go run main.go"

# Wait a bit for Go backend to start
sleep 5

# Web Dashboard
start_service "web-dashboard" "cd frontend/dashboard && npm run dev"

# Customer Portal
start_service "customer-portal" "cd frontend/portal && npm run dev"

# WhatsApp Service is integrated into Go Backend - no separate service needed
echo "📱 WhatsApp Service: Running as part of Go Backend on port 8080"

# Mobile App (Expo)
start_service "mobile-app" "cd mobile && npx expo start --web --port 19006"

echo ""
echo "🎉 All Services Started Successfully!"
echo "===================================="
echo ""
echo "🌐 Service URLs:"
echo "   • Go Backend (API + WhatsApp): http://localhost:8080"
echo "   • Web Dashboard:         http://localhost:5173"
echo "   • Customer Portal:       http://localhost:3001"  
echo "   • Mobile App (Web):      http://localhost:19006"
echo "   • PostgreSQL:            localhost:5432"
echo "   • Redis:                 localhost:6379"
echo ""
echo "📱 Mobile App:"
echo "   • Expo DevTools:         http://localhost:19002"
echo "   • Scan QR code with Expo Go app on your phone"
echo ""
echo "📄 Logs are stored in the 'logs/' directory"
echo "📱 Mobile app will show QR code - scan with Expo Go app"
echo ""
echo "🛑 To stop all services, run: ./stop-all-services.sh"

# Create stop script
cat > stop-all-services.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping All FleetFlow Services..."
echo "====================================="

# Kill all services
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

# Stop Docker services
echo "🛑 Stopping Docker services..."
docker-compose down

echo "✅ All services stopped"
EOF

chmod +x stop-all-services.sh

echo ""
echo "💡 Tips:"
echo "   • Check logs if any service fails to start"
echo "   • Use 'docker-compose logs' to see Docker service logs"
echo "   • Run './stop-all-services.sh' to stop everything cleanly"
echo ""
echo "🔍 Service Health Checks:"
echo "   • Go Backend (includes WhatsApp): curl http://localhost:8080/health"

# Follow logs
echo ""
echo "📄 Following logs (Ctrl+C to detach)..."
echo "========================================"
tail -f logs/*.log
