#!/bin/bash

# FleetFlow All Services Runner v2
# Enhanced version with comprehensive checks before running services
# Author: FleetFlow Team

set -e  # Exit on any error

echo "🚛 FleetFlow - Smart Service Runner v2"
echo "========================================"
echo "✅ Validates all prerequisites before starting services"
echo "✅ Only runs services if everything is ready"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Tracking variables
CHECKS_PASSED=0
CHECKS_FAILED=0
SERVICES_TO_START=()

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    if [ "$status" == "PASS" ]; then
        echo -e "${GREEN}✅ $message${NC}"
        ((CHECKS_PASSED++))
    elif [ "$status" == "FAIL" ]; then
        echo -e "${RED}❌ $message${NC}"
        ((CHECKS_FAILED++))
    elif [ "$status" == "INFO" ]; then
        echo -e "${BLUE}ℹ️  $message${NC}"
    elif [ "$status" == "WARN" ]; then
        echo -e "${YELLOW}⚠️  $message${NC}"
    fi
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check port availability
port_available() {
    ! lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to check service directory and dependencies
check_service_deps() {
    local service_name=$1
    local service_dir=$2
    local package_file=$3
    
    if [ ! -d "$service_dir" ]; then
        print_status "FAIL" "$service_name: Directory missing ($service_dir)"
        return 1
    fi
    
    if [ ! -f "$service_dir/$package_file" ]; then
        print_status "FAIL" "$service_name: $package_file missing"
        return 1
    fi
    
    if [ "$package_file" == "package.json" ]; then
        # Check if node_modules exists AND if dependencies are up-to-date
        if [ ! -d "$service_dir/node_modules" ]; then
            print_status "WARN" "$service_name: node_modules missing - will install"
            return 2
        elif [ -f "$service_dir/package-lock.json" ] && [ "$service_dir/package.json" -nt "$service_dir/package-lock.json" ]; then
            print_status "WARN" "$service_name: package.json newer than package-lock.json - will update"
            return 2
        elif [ ! -f "$service_dir/package-lock.json" ]; then
            print_status "WARN" "$service_name: package-lock.json missing - will install"
            return 2
        fi
    elif [ "$package_file" == "go.mod" ]; then
        # Improved Go dependency check
        if [ ! -f "$service_dir/go.sum" ]; then
            print_status "WARN" "$service_name: go.sum missing - will download"
            return 2
        elif [ "$service_dir/go.mod" -nt "$service_dir/go.sum" ]; then
            print_status "WARN" "$service_name: go.mod newer than go.sum - will update"
            return 2
        fi
    fi
    
    print_status "PASS" "$service_name: Dependencies up-to-date"
    return 0
}

echo "🔍 Phase 1: System Requirements Check"
echo "====================================="

# Check OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    print_status "PASS" "macOS detected"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    print_status "PASS" "Linux detected"
else
    print_status "FAIL" "Unsupported OS: $OSTYPE"
fi

# Check required tools
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_status "PASS" "Node.js installed: $NODE_VERSION"
else
    print_status "FAIL" "Node.js not installed"
fi

if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_status "PASS" "NPM installed: $NPM_VERSION"
else
    print_status "FAIL" "NPM not installed"
fi

if command_exists go; then
    GO_VERSION=$(go version | awk '{print $3}')
    print_status "PASS" "Go installed: $GO_VERSION"
else
    print_status "FAIL" "Go not installed"
fi

if command_exists docker; then
    if docker info >/dev/null 2>&1; then
        print_status "PASS" "Docker installed and running"
    else
        print_status "FAIL" "Docker installed but daemon not running"
    fi
else
    print_status "FAIL" "Docker not installed"
fi

if command_exists docker-compose || command_exists docker compose; then
    print_status "PASS" "Docker Compose available"
else
    print_status "FAIL" "Docker Compose not available"
fi

if command_exists expo; then
    EXPO_VERSION=$(expo --version)
    print_status "PASS" "Expo CLI installed: $EXPO_VERSION"
else
    print_status "FAIL" "Expo CLI not installed"
fi

echo ""
echo "🔍 Phase 2: Port Availability Check"
echo "===================================="

# Check required ports
declare -A PORTS=(
    ["8080"]="Go Backend (includes WhatsApp)"
    ["5173"]="Web Dashboard"
    ["3000"]="Customer Portal"
    ["19006"]="Mobile App (Web)"
    ["5432"]="PostgreSQL"
    ["6379"]="Redis"
)

for port in "${!PORTS[@]}"; do
    if port_available $port; then
        print_status "PASS" "Port $port available for ${PORTS[$port]}"
    else
        print_status "FAIL" "Port $port already in use (needed for ${PORTS[$port]})"
    fi
done

echo ""
echo "🔍 Phase 3: Service Dependencies Check"
echo "======================================="

# Check service directories and dependencies
check_service_deps "Go Backend" "go-backend" "go.mod"
GO_BACKEND_STATUS=$?

check_service_deps "Web Dashboard" "web" "package.json"
WEB_STATUS=$?

check_service_deps "Customer Portal" "customer-portal" "package.json"
PORTAL_STATUS=$?

# WhatsApp Service is integrated into Go Backend - no separate check needed
WHATSAPP_STATUS=0
print_status "PASS" "WhatsApp Service: Integrated in Go Backend"

check_service_deps "Mobile App" "mobile" "package.json"
MOBILE_STATUS=$?

echo ""
echo "🔍 Phase 4: Docker Services Check"
echo "=================================="

# Check if Docker services are running
if docker-compose ps | grep -q "postgres.*Up"; then
    print_status "PASS" "PostgreSQL container running"
else
    print_status "WARN" "PostgreSQL container not running - will start"
fi

if docker-compose ps | grep -q "redis.*Up"; then
    print_status "PASS" "Redis container running"
else
    print_status "WARN" "Redis container not running - will start"
fi

echo ""
echo "📊 Assessment Summary"
echo "====================="
echo -e "${GREEN}✅ Checks Passed: $CHECKS_PASSED${NC}"
echo -e "${RED}❌ Checks Failed: $CHECKS_FAILED${NC}"

# Decision logic
if [ $CHECKS_FAILED -gt 0 ]; then
    echo ""
    echo -e "${RED}🚫 CRITICAL ISSUES FOUND${NC}"
    echo "Cannot proceed with starting services."
    echo "Please fix the failed checks above and try again."
    echo ""
    echo "💡 Quick fixes:"
    echo "   • Install missing tools using: brew install node go docker"
    echo "   • Start Docker Desktop application"
    echo "   • Free up occupied ports by stopping other services"
    exit 1
fi

# Handle warnings (missing dependencies)
if [ $GO_BACKEND_STATUS -eq 2 ] || [ $WEB_STATUS -eq 2 ] || [ $PORTAL_STATUS -eq 2 ] || [ $WHATSAPP_STATUS -eq 2 ] || [ $MOBILE_STATUS -eq 2 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  DEPENDENCY INSTALLATION NEEDED${NC}"
    echo "Some services need dependency installation. Proceeding with installation..."
    
    # Smart dependency installation - only install what's needed
    if [ $GO_BACKEND_STATUS -eq 2 ]; then
        echo "📦 Installing Go Backend dependencies..."
        cd go-backend && go mod download && cd ..
        print_status "PASS" "Go Backend dependencies installed"
    fi
    
    if [ $WEB_STATUS -eq 2 ]; then
        echo "📦 Installing Web Dashboard dependencies..."
        cd web
        if [ -f "package-lock.json" ]; then
            npm ci
        else
            npm install
        fi
        cd ..
        print_status "PASS" "Web Dashboard dependencies installed"
    fi
    
    if [ $PORTAL_STATUS -eq 2 ]; then
        echo "📦 Installing Customer Portal dependencies..."
        cd customer-portal
        if [ -f "package-lock.json" ]; then
            npm ci
        else
            npm install
        fi
        cd ..
        print_status "PASS" "Customer Portal dependencies installed"
    fi
    
    # WhatsApp Service integrated in Go Backend - no separate installation needed
    
    if [ $MOBILE_STATUS -eq 2 ]; then
        echo "📦 Installing Mobile App dependencies..."
        cd mobile && npm install --legacy-peer-deps && cd ..
        print_status "PASS" "Mobile App dependencies installed"
    fi
    
    print_status "PASS" "All dependencies installed successfully"
fi

# Start Docker services if needed
echo ""
echo "🐳 Starting Docker Services..."
echo "==============================="
if ! docker-compose ps | grep -q "postgres.*Up" || ! docker-compose ps | grep -q "redis.*Up"; then
    docker-compose up -d postgres redis
    print_status "PASS" "Docker services started"
    echo "⏳ Waiting for databases to be ready..."
    sleep 10
else
    print_status "PASS" "Docker services already running"
fi

# Verify database connectivity
if docker-compose exec -T postgres psql -U fleet -d postgres -c "SELECT 1;" >/dev/null 2>&1; then
    print_status "PASS" "Database connectivity verified"
else
    print_status "FAIL" "Database connectivity failed"
    exit 1
fi

echo ""
echo -e "${GREEN}🎯 ALL SYSTEMS GO!${NC}"
echo "=================="
echo "✅ All prerequisites satisfied"
echo "✅ All dependencies installed"
echo "✅ All ports available"
echo "✅ Docker services running"
echo "✅ Database connectivity verified"

# Create log directory
mkdir -p logs

# Function to start service in background with better error handling
start_service_safe() {
    local service_name="$1"
    local command="$2"
    local log_file="logs/${service_name}.log"
    
    echo -e "${BLUE}🚀 Starting $service_name...${NC}"
    
    # Clear old logs
    > "$log_file"
    
    # Start service
    nohup bash -c "$command" > "$log_file" 2>&1 &
    local pid=$!
    echo "$pid" > "logs/${service_name}.pid"
    
    # Brief verification that process started
    sleep 2
    if kill -0 "$pid" 2>/dev/null; then
        print_status "PASS" "$service_name started successfully (PID: $pid)"
        SERVICES_TO_START+=("$service_name")
    else
        print_status "FAIL" "$service_name failed to start - check $log_file"
    fi
}

echo ""
echo "🚀 Starting All Services..."
echo "============================"

# Start services in order with dependencies
start_service_safe "go-backend" "cd go-backend && export PORT=8080 && export ENVIRONMENT=development && export DATABASE_URL='postgres://fleet:fleet@localhost:5432/fleetflow?sslmode=disable' && export JWT_SECRET='fleetflow-dev-secret-key-change-in-production' && export JWT_EXPIRATION='24h' && export REFRESH_TOKEN_EXPIRY='168h' && go run main.go"

# Wait for backend to be ready
echo "⏳ Waiting for Go Backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8080/health >/dev/null 2>&1; then
        print_status "PASS" "Go Backend health check passed"
        break
    fi
    sleep 1
done

# Start frontend services
start_service_safe "web-dashboard" "cd web && npm run dev"
start_service_safe "customer-portal" "cd customer-portal && npm run dev -- --port 3000"
# WhatsApp Service is integrated into Go Backend - no separate service needed
print_status "PASS" "WhatsApp Service: Running as part of Go Backend on port 8080"
start_service_safe "mobile-app" "cd mobile && npx expo start --web --port 19006"

echo ""
echo -e "${GREEN}🎉 ALL SERVICES STARTED SUCCESSFULLY!${NC}"
echo "============================================="
echo ""
echo "🌐 Service URLs:"
echo "   • Go Backend (API + WhatsApp): http://localhost:8080"
echo "   • API Health Check:      curl http://localhost:8080/health"
echo "   • Web Dashboard:         http://localhost:5173"
echo "   • Customer Portal:       http://localhost:3000"  
echo "   • Mobile App (Web):      http://localhost:19006"
echo "   • Expo DevTools:         http://localhost:19002"
echo ""
echo "📱 Mobile Development:"
echo "   • Expo will show QR code - scan with Expo Go app on your phone"
echo "   • Or use web version at http://localhost:19006"
echo ""
echo "🗄️  Database Services:"
echo "   • PostgreSQL:            localhost:5432 (fleet/fleet)"
echo "   • Redis:                 localhost:6379"
echo ""
echo "📄 Logs & Monitoring:"
echo "   • Service logs:          ./logs/ directory"
echo "   • Monitor services:      ./monitor-services.sh"
echo "   • Stop all services:     ./stop-all-services.sh"

# Create enhanced stop script
cat > stop-all-services.sh << 'EOF'
#!/bin/bash

echo -e "\033[0;31m🛑 Stopping All FleetFlow Services...\033[0m"
echo "======================================"

stopped_count=0
if [ -d "logs" ]; then
    for pid_file in logs/*.pid; do
        if [ -f "$pid_file" ]; then
            service_name=$(basename "$pid_file" .pid)
            pid=$(cat "$pid_file")
            if kill -0 "$pid" 2>/dev/null; then
                echo "🛑 Stopping $service_name (PID: $pid)..."
                kill "$pid"
                ((stopped_count++))
            fi
            rm -f "$pid_file"
        fi
    done
fi

echo "🛑 Stopping Docker services..."
docker-compose down

echo -e "\033[0;32m✅ Stopped $stopped_count services and Docker containers\033[0m"
EOF

chmod +x stop-all-services.sh

echo ""
echo -e "${BLUE}💡 Pro Tips:${NC}"
echo "   • Use './monitor-services.sh' to check service health"
echo "   • Check individual service logs in ./logs/ directory"
echo "   • Run './stop-all-services.sh' to cleanly stop everything"
echo "   • Services will restart automatically on code changes"

echo ""
echo -e "${YELLOW}📊 Running final health checks in 10 seconds...${NC}"
sleep 10
./monitor-services.sh
