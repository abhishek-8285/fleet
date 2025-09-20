package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"runtime/debug"
	"syscall"
	"time"

	"github.com/fleetflow/backend/internal/config"
	"github.com/fleetflow/backend/internal/database"
	"github.com/fleetflow/backend/internal/middleware"
	"github.com/fleetflow/backend/internal/routes"
	"github.com/fleetflow/backend/internal/services"
	"github.com/gin-gonic/gin"

	// Swagger imports
	_ "github.com/fleetflow/backend/docs" // Import generated swagger docs
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title FleetFlow API
// @version 1.0
// @description Fleet Management System API for India
// @termsOfService http://swagger.io/terms/

// @contact.name FleetFlow Support
// @contact.url http://www.fleetflow.in/support
// @contact.email support@fleetflow.in

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database
	db, err := database.Initialize(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	// Initialize services
	serviceContainer := services.NewContainer(db, cfg)

	// Initialize Gin router
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// Global middleware (order matters!)
	router.Use(middleware.RequestIDMiddleware()) // Add unique request IDs
	router.Use(gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("[%s] %s %s %d %s \"%s\" \"%s\" [%s]\n",
			param.TimeStamp.Format("2006-01-02 15:04:05"),
			param.ClientIP,
			param.Method,
			param.StatusCode,
			param.Latency,
			param.Path,
			param.Request.UserAgent(),
			param.Request.Header.Get("X-Request-ID"),
		)
	}))
	router.Use(middleware.RecoveryWithWriter())             // Enhanced panic recovery
	router.Use(middleware.ErrorHandler())                   // Application error handling
	router.Use(middleware.TimeoutHandler(30 * time.Second)) // Request timeout
	router.Use(middleware.CORS())
	router.Use(middleware.Security())

	// Add circuit breaker for external APIs
	circuitBreaker := middleware.NewCircuitBreaker(5, 2*time.Minute)
	router.Use(circuitBreaker.MiddlewareFunc())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().Unix(),
			"version":   "1.0.0",
		})
	})

	// API routes
	apiV1 := router.Group("/api/v1")
	routes.RegisterRoutes(apiV1, serviceContainer)

	// Swagger documentation
	if cfg.IsDevelopment() {
		router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
		log.Println("📋 Swagger UI enabled at /swagger/index.html")
	}

	// Start server with production-ready configuration
	server := &http.Server{
		Addr:           fmt.Sprintf(":%s", cfg.Port),
		Handler:        router,
		ReadTimeout:    15 * time.Second,
		WriteTimeout:   15 * time.Second,
		IdleTimeout:    60 * time.Second,
		MaxHeaderBytes: 1 << 20, // 1MB
	}

	// Start WebSocket hub in a goroutine
	if serviceContainer.WebSocketHub != nil {
		go serviceContainer.WebSocketHub.Run()
		log.Println("🔌 WebSocket hub started")
	}

	// Start server with error recovery
	go func() {
		defer func() {
			if recovered := recover(); recovered != nil {
				log.Printf("🚨 Server startup panic recovered: %v", recovered)
				log.Printf("📍 Stack trace:\n%s", debug.Stack())
			}
		}()

		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("❌ Server error: %v", err)
			log.Printf("🔄 Server will attempt to restart if using hot reload...")
		}
	}()

	log.Printf("🚛 FleetFlow server starting on port %s", cfg.Port)
	log.Printf("📊 Environment: %s", cfg.Environment)
	log.Printf("📋 API Documentation: http://localhost:%s/swagger/index.html", cfg.Port)

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatal("❌ Server forced to shutdown:", err)
	}

	log.Println("✅ Server exited")
}
