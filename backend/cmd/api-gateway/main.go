package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/fleetflow/backend/internal/config"
	"github.com/fleetflow/backend/internal/middleware"
	"github.com/fleetflow/backend/internal/pkg/logger"
	"github.com/fleetflow/backend/internal/pkg/telemetry"
	pb "github.com/fleetflow/backend/proto/gen"
)

func main() {
	ctx := context.Background()

	// Temporarily set a default logger before config is loaded
	logger.Info(ctx, "🚀 Starting FleetFlow API Gateway...")

	// Load configuration
	cfg := config.Load()
	logger.Info(ctx, "📋 Configuration loaded", "environment", cfg.Environment)

	// Initialize OpenTelemetry
	// Assuming default Jaeger/OTLP port 4317 if not specified
	otelEndpoint := "localhost:4317"
	tp, err := telemetry.InitTracerProvider(ctx, "api-gateway", otelEndpoint)
	if err != nil {
		logger.Error(ctx, "❌ Failed to initialize telemetry", "error", err)
		// We continue even if telemetry fails, but verify if this is desired behavior
	} else {
		defer func() {
			if err := tp.Shutdown(ctx); err != nil {
				logger.Error(ctx, "❌ Error shutting down tracer provider", "error", err)
			}
		}()
		logger.Info(ctx, "📡 Telemetry initialized", "endpoint", otelEndpoint)
	}

	// Create gRPC connection to our gRPC server
	grpcServerAddr := "localhost:9090" // Default gRPC server address
	if cfg.GRPCServerAddress != "" {
		grpcServerAddr = cfg.GRPCServerAddress
	}

	// Create a client connection to the gRPC server
	// TODO: Add OTel gRPC interceptor here
	conn, err := grpc.NewClient(
		grpcServerAddr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		logger.Error(ctx, "❌ Failed to dial gRPC server", "error", err)
		os.Exit(1)
	}
	defer func() { _ = conn.Close() }()

	// Create new gRPC-gateway mux
	mux := runtime.NewServeMux()

	// Register gRPC service handlers
	// We use a cancellable context for registration
	regCtx, cancel := context.WithCancel(ctx)
	defer cancel()

	// Helper to register services
	registerService := func(name string, registerFunc func(context.Context, *runtime.ServeMux, *grpc.ClientConn) error) {
		if err := registerFunc(regCtx, mux, conn); err != nil {
			log.Fatalf("❌ Failed to register %s handler: %v", name, err)
		} else {
			log.Printf("✅ Registered %s handler", name)
		}
	}

	// Register each service
	// Register all services from standard proto definitions
	// Register all services from standard proto definitions
	registerService("AuthService", pb.RegisterAuthServiceHandler)
	// registerService("DriverService", pb.RegisterDriverServiceHandler)
	// registerService("VehicleService", pb.RegisterVehicleServiceHandler)
	// registerService("TripService", pb.RegisterTripServiceHandler)
	// registerService("AnalyticsService", pb.RegisterAnalyticsServiceHandler)
	// registerService("FuelService", pb.RegisterFuelServiceHandler)
	// registerService("AnalyticsService", pb.RegisterAnalyticsServiceHandler)

	// Create HTTP server
	gatewayPort := "8080"
	if cfg.APIGatewayPort != "" {
		gatewayPort = cfg.APIGatewayPort
	}

	// Wrap mux with Middleware and OTel
	// Apply Security Middleware first (so it runs before OTel)
	var rootHandler http.Handler = mux
	rootHandler = middleware.GatewaySecurity(rootHandler)
	rootHandler = otelhttp.NewHandler(rootHandler, "api-gateway")

	server := &http.Server{
		Addr:    ":" + gatewayPort,
		Handler: rootHandler,
	}

	// Start HTTP server in a goroutine
	go func() {
		logger.Info(ctx, "🌐 API Gateway listening", "port", gatewayPort)
		logger.Info(ctx, "🔌 Proxying to gRPC server", "address", grpcServerAddr)

		if cfg.IsDevelopment() {
			logger.Info(ctx, "📚 API Documentation available", "url", "http://localhost:"+gatewayPort+"/swagger/")
		}

		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error(ctx, "❌ Failed to start API Gateway", "error", err)
			os.Exit(1)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info(ctx, "🛑 Shutting down API Gateway...")

	// Create a deadline to wait for.
	ctxShutdown, cancelShutdown := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelShutdown()

	if err := server.Shutdown(ctxShutdown); err != nil {
		logger.Error(ctx, "❌ Failed to shutdown server", "error", err)
		os.Exit(1)
	}
	logger.Info(ctx, "👋 API Gateway stopped successfully")
}
