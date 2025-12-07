package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/fleetflow/backend/internal/config"
	pb "github.com/fleetflow/backend/proto/gen"
)

func main() {
	log.Println("🚀 Starting FleetFlow API Gateway...")

	// Load configuration
	cfg := config.Load()
	log.Printf("📋 Configuration loaded - Environment: %s", cfg.Environment)

	// Create gRPC connection to our gRPC server
	grpcServerAddr := "localhost:9090" // Default gRPC server address
	if cfg.GRPCServerAddress != "" {
		grpcServerAddr = cfg.GRPCServerAddress
	}

	// Create a client connection to the gRPC server
	conn, err := grpc.DialContext(
		context.Background(),
		grpcServerAddr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		log.Fatalf("❌ Failed to dial gRPC server: %v", err)
	}
	defer conn.Close()

	// Create new gRPC-gateway mux
	mux := runtime.NewServeMux()

	// Register gRPC service handlers
	ctx := context.Background()
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	// Register each service
	err = pb.RegisterAuthServiceHandler(ctx, mux, conn)
	if err != nil {
		log.Fatalf("❌ Failed to register AuthService handler: %v", err)
	}

	err = pb.RegisterDriverServiceHandler(ctx, mux, conn)
	if err != nil {
		log.Fatalf("❌ Failed to register DriverService handler: %v", err)
	}

	err = pb.RegisterVehicleServiceHandler(ctx, mux, conn)
	if err != nil {
		log.Fatalf("❌ Failed to register VehicleService handler: %v", err)
	}

	err = pb.RegisterTripServiceHandler(ctx, mux, conn)
	if err != nil {
		log.Fatalf("❌ Failed to register TripService handler: %v", err)
	}

	err = pb.RegisterLocationServiceHandler(ctx, mux, conn)
	if err != nil {
		log.Fatalf("❌ Failed to register LocationService handler: %v", err)
	}

	err = pb.RegisterFuelServiceHandler(ctx, mux, conn)
	if err != nil {
		log.Fatalf("❌ Failed to register FuelService handler: %v", err)
	}

	err = pb.RegisterAnalyticsServiceHandler(ctx, mux, conn)
	if err != nil {
		log.Fatalf("❌ Failed to register AnalyticsService handler: %v", err)
	}

	// Create HTTP server
	gatewayPort := "8080"
	if cfg.APIGatewayPort != "" {
		gatewayPort = cfg.APIGatewayPort
	}

	server := &http.Server{
		Addr:    ":" + gatewayPort,
		Handler: mux,
	}

	// Start HTTP server in a goroutine
	go func() {
		log.Printf("🌐 API Gateway listening on :%s", gatewayPort)
		log.Printf("🔌 Proxying to gRPC server at %s", grpcServerAddr)
		log.Println("🚀 API Gateway started successfully!")
		
		if cfg.IsDevelopment() {
			log.Println("📚 API Documentation available at http://localhost:" + gatewayPort + "/swagger/")
		}

		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌ Failed to start API Gateway: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Shutting down API Gateway...")
	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("❌ Failed to shutdown server: %v", err)
	}
	log.Println("👋 API Gateway stopped successfully")
}
