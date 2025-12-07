package main

import (
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/fleetflow/backend/internal/config"
	"github.com/fleetflow/backend/internal/database"
	"github.com/fleetflow/backend/internal/grpc/server"
	"github.com/fleetflow/backend/internal/services"
	pb "github.com/fleetflow/backend/proto/gen"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

func main() {
	log.Println("🚀 Starting FleetFlow gRPC Server...")

	// Load configuration
	cfg := config.Load()
	log.Printf("📋 Configuration loaded - Environment: %s", cfg.Environment)

	// Initialize database (includes connection and migrations)
	db, err := database.Initialize(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("❌ Failed to initialize database: %v", err)
	}
	log.Println("✅ Database initialized successfully")

	// Initialize service container
	serviceContainer := services.NewContainer(db, cfg)
	log.Println("✅ Service container initialized")

	// Create gRPC server
	grpcServer := grpc.NewServer()

	// Register gRPC services
	pb.RegisterAuthServiceServer(grpcServer, server.NewAuthServer(serviceContainer))
	pb.RegisterDriverServiceServer(grpcServer, server.NewDriverServer(serviceContainer))
	pb.RegisterVehicleServiceServer(grpcServer, server.NewVehicleServer(serviceContainer))
	pb.RegisterTripServiceServer(grpcServer, server.NewTripServer(serviceContainer))
	pb.RegisterLocationServiceServer(grpcServer, server.NewLocationServer(serviceContainer))
	pb.RegisterFuelServiceServer(grpcServer, server.NewFuelServer(serviceContainer))
	pb.RegisterUploadServiceServer(grpcServer, server.NewUploadServer(serviceContainer))
	pb.RegisterAnalyticsServiceServer(grpcServer, server.NewAnalyticsServer(serviceContainer))

	// Enable gRPC reflection for development
	if cfg.IsDevelopment() {
		reflection.Register(grpcServer)
		log.Println("🔍 gRPC reflection enabled")
	}

	// Setup gRPC listener
	grpcPort := cfg.Port
	if grpcPort == "" {
		grpcPort = "9090"
	}

	listener, err := net.Listen("tcp", ":"+grpcPort)
	if err != nil {
		log.Fatalf("❌ Failed to listen on port %s: %v", grpcPort, err)
	}

	log.Printf("🎯 gRPC server listening on :%s", grpcPort)
	log.Printf("🔌 Available services:")
	log.Printf("   - AuthService (authentication & authorization)")
	log.Printf("   - DriverService (driver management)")
	log.Printf("   - VehicleService (vehicle management)")
	log.Printf("   - TripService (trip lifecycle management)")
	log.Printf("   - LocationService (GPS tracking & geofencing)")
	log.Printf("   - FuelService (fuel monitoring & theft detection)")
	log.Printf("   - UploadService (file upload & storage)")
	log.Printf("   - AnalyticsService (reports & dashboards)")

	// Start gRPC server in a goroutine
	go func() {
		if err := grpcServer.Serve(listener); err != nil {
			log.Fatalf("❌ Failed to serve gRPC: %v", err)
		}
	}()

	log.Println("✅ FleetFlow gRPC server started successfully!")
	log.Printf("📡 Connect using: localhost:%s", grpcPort)

	if cfg.IsDevelopment() {
		log.Printf("🛠️  Use grpcurl for testing:")
		log.Printf("   grpcurl -plaintext localhost:%s list", grpcPort)
		log.Printf("   grpcurl -plaintext localhost:%s fleetflow.v1.AuthService/SendOTP", grpcPort)
	}

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Shutting down FleetFlow gRPC server...")

	// Close service container
	if err := serviceContainer.Close(); err != nil {
		log.Printf("❌ Error closing service container: %v", err)
	}

	// Stop gRPC server gracefully
	grpcServer.GracefulStop()

	log.Println("✅ FleetFlow gRPC server shutdown complete")
}
