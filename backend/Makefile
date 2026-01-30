# FleetFlow gRPC Makefile

# Variables
PROTO_DIR = proto
GEN_DIR = proto/gen
BUF_VERSION = v1.28.1

# Ensure Go bin is in PATH for CI
GOPATH = $(shell go env GOPATH)
export PATH := $(GOPATH)/bin:$(PATH)

# Default target
.PHONY: all
all: clean gen-proto build

# Install required tools
.PHONY: install-tools
install-tools:
	@echo "Installing gRPC tools..."
	go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
	go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@latest
	go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-openapiv2@latest
	@echo "✅ Tools installed successfully"

# Check if protoc is installed
.PHONY: check-protoc
check-protoc:
	@which protoc > /dev/null || (echo "❌ protoc not found. Please install Protocol Buffers compiler" && exit 1)
	@echo "✅ protoc found: $$(protoc --version)"

# Clean generated files
.PHONY: clean
clean:
	@echo "🧹 Cleaning generated files..."
	rm -rf $(GEN_DIR)
	mkdir -p $(GEN_DIR)

# Generate Go code from protobuf files
.PHONY: gen-proto
gen-proto: check-protoc clean
	@echo "🔧 Generating gRPC code..."
	@mkdir -p $(GEN_DIR)
	
	# Generate Go protobuf code
	# Generate internal protos
	protoc \
		--proto_path=$(PROTO_DIR) \
		--proto_path=third_party \
		--go_out=$(GEN_DIR) \
		--go_opt=paths=source_relative \
		--go-grpc_out=$(GEN_DIR) \
		--go-grpc_opt=paths=source_relative \
		--grpc-gateway_out=$(GEN_DIR) \
		--grpc-gateway_opt=paths=source_relative \
		--openapiv2_out=$(GEN_DIR) \
		$(PROTO_DIR)/*.proto

	# Generate partner protos
	protoc \
		--proto_path=$(PROTO_DIR) \
		--proto_path=third_party \
		--go_out=$(GEN_DIR) \
		--go_opt=paths=source_relative \
		--go-grpc_out=$(GEN_DIR) \
		--go-grpc_opt=paths=source_relative \
		--grpc-gateway_out=$(GEN_DIR) \
		--grpc-gateway_opt=paths=source_relative \
		--openapiv2_out=$(GEN_DIR) \
		$(PROTO_DIR)/partner/*.proto
	
	@echo "✅ gRPC code generated successfully"
	@echo "📁 Generated files in: $(GEN_DIR)/"

# Build the application
.PHONY: build
build:
	@echo "🔨 Building FleetFlow gRPC server..."
	go mod tidy
	go build -o bin/fleetflow-grpc ./cmd/grpc-server
	@echo "✅ Build completed: bin/fleetflow-grpc"

# Build for production
.PHONY: build-prod
build-prod:
	@echo "🚀 Building for production..."
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o bin/fleetflow-grpc-linux ./cmd/grpc-server
	@echo "✅ Production build completed: bin/fleetflow-grpc-linux"

# Run the gRPC server
.PHONY: run-grpc
run-grpc: gen-proto build
	@echo "🚛 Starting FleetFlow gRPC server..."
	./bin/fleetflow-grpc

# Run with auto-restart on file changes (requires air)
.PHONY: dev
dev: gen-proto
	@echo "🔄 Starting development server with auto-reload..."
	air -c .air.toml

# Run tests
.PHONY: test
test: gen-proto
	@echo "🧪 Running tests..."
	go test -v ./...

# Run tests with coverage
.PHONY: test-coverage
test-coverage: gen-proto
	@echo "🧪 Running tests with coverage..."
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "📊 Coverage report: coverage.html"

# Lint the code
.PHONY: lint
lint:
	@echo "🔍 Linting code..."
	golangci-lint run

# Format the code
.PHONY: fmt
fmt:
	@echo "✨ Formatting code..."
	go fmt ./...
	goimports -w .

# Generate mock files for testing
.PHONY: gen-mocks
gen-mocks: gen-proto
	@echo "🎭 Generating mocks..."
	mockgen -source=$(GEN_DIR)/auth_grpc.pb.go -destination=internal/mocks/auth_mock.go
	mockgen -source=$(GEN_DIR)/driver_grpc.pb.go -destination=internal/mocks/driver_mock.go
	mockgen -source=$(GEN_DIR)/vehicle_grpc.pb.go -destination=internal/mocks/vehicle_mock.go
	@echo "✅ Mocks generated"

# Docker build
.PHONY: docker-build
docker-build: build-prod
	@echo "🐳 Building Docker image..."
	docker build -t fleetflow-grpc:latest .
	@echo "✅ Docker image built: fleetflow-grpc:latest"

# Docker run
.PHONY: docker-run
docker-run:
	@echo "🐳 Running Docker container..."
	docker run -p 50051:50051 -p 8080:8080 fleetflow-grpc:latest

# Start database for development
.PHONY: db-up
db-up:
	@echo "🗄️ Starting database..."
	docker-compose up -d postgres redis
	@echo "✅ Database started"

# Stop database
.PHONY: db-down
db-down:
	@echo "🗄️ Stopping database..."
	docker-compose down
	@echo "✅ Database stopped"

# Database migration
.PHONY: db-migrate
db-migrate:
	@echo "🗄️ Running database migrations..."
	go run cmd/migrate/main.go
	@echo "✅ Migrations completed"

# Generate Swagger documentation
.PHONY: gen-swagger
gen-swagger: gen-proto
	@echo "📚 Generating Swagger documentation..."
	swagger-codegen generate -i $(GEN_DIR)/fleetflow.swagger.json -l html2 -o docs/swagger
	@echo "✅ Swagger docs generated: docs/swagger/index.html"

# Start full development environment
.PHONY: dev-env
dev-env: db-up
	@echo "🚀 Starting full development environment..."
	@echo "🗄️ Database: ✅"
	@echo "🔧 Generating protobuf code..."
	@$(MAKE) gen-proto
	@echo "🚛 Starting gRPC server..."
	@$(MAKE) run-grpc

# Load test the gRPC server
.PHONY: load-test
load-test:
	@echo "⚡ Running load tests..."
	ghz --insecure \
		--proto $(PROTO_DIR)/driver.proto \
		--call fleetflow.v1.DriverService/GetDrivers \
		--data '{"pagination":{"page":1,"limit":10}}' \
		--connections 50 \
		--concurrency 200 \
		--total 10000 \
		localhost:50051

# Benchmark the application
.PHONY: bench
bench: gen-proto
	@echo "🏁 Running benchmarks..."
	go test -bench=. -benchmem ./...

# Security scan
.PHONY: security
security:
	@echo "🔒 Running security scan..."
	gosec ./...

# Check for outdated dependencies
.PHONY: deps-check
deps-check:
	@echo "📦 Checking for outdated dependencies..."
	go list -u -m all

# Update dependencies
.PHONY: deps-update
deps-update:
	@echo "📦 Updating dependencies..."
	go get -u ./...
	go mod tidy

# Install development tools
.PHONY: install-dev-tools
install-dev-tools: install-tools
	@echo "🛠️ Installing development tools..."
	go install github.com/cosmtrek/air@latest
	go install github.com/swaggo/swag/cmd/swag@latest
	go install github.com/golang/mock/mockgen@latest
	go install github.com/securecodewarrior/sast-scan@latest
	@echo "✅ Development tools installed"

# Show help
.PHONY: help
help:
	@echo "🚛 FleetFlow gRPC Makefile Commands"
	@echo "=================================="
	@echo ""
	@echo "📋 Setup & Installation:"
	@echo "  install-tools      Install required gRPC tools"
	@echo "  install-dev-tools  Install all development tools"
	@echo ""
	@echo "🔧 Code Generation:"
	@echo "  gen-proto         Generate Go code from protobuf"
	@echo "  gen-mocks         Generate mock files for testing"
	@echo "  gen-swagger       Generate Swagger documentation"
	@echo ""
	@echo "🔨 Build & Run:"
	@echo "  build             Build the application"
	@echo "  build-prod        Build for production"
	@echo "  run-grpc          Run the gRPC server"
	@echo "  dev               Run with auto-reload"
	@echo "  dev-env           Start full development environment"
	@echo ""
	@echo "🧪 Testing & Quality:"
	@echo "  test              Run tests"
	@echo "  test-coverage     Run tests with coverage"
	@echo "  lint              Lint the code"
	@echo "  fmt               Format the code"
	@echo "  bench             Run benchmarks"
	@echo "  load-test         Run load tests"
	@echo "  security          Run security scan"
	@echo ""
	@echo "🗄️ Database:"
	@echo "  db-up             Start database"
	@echo "  db-down           Stop database"
	@echo "  db-migrate        Run migrations"
	@echo ""
	@echo "🐳 Docker:"
	@echo "  docker-build      Build Docker image"
	@echo "  docker-run        Run Docker container"
	@echo ""
	@echo "📦 Dependencies:"
	@echo "  deps-check        Check for outdated dependencies"
	@echo "  deps-update       Update dependencies"
	@echo ""
	@echo "🧹 Cleanup:"
	@echo "  clean             Clean generated files"
	@echo ""
	@echo "ℹ️  For more info: make <command>"

# Default help when no target specified
.DEFAULT_GOAL := help
