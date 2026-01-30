package routes

import (
	"github.com/fleetflow/backend/internal/handlers"
	"github.com/fleetflow/backend/internal/middleware"
	"github.com/fleetflow/backend/internal/services"
	"github.com/gin-gonic/gin"
)

// RegisterRoutes registers all API routes
func RegisterRoutes(router *gin.RouterGroup, container *services.Container) {
	// Initialize handlers
	authHandler := handlers.NewAuthHandler(container)
	orgHandler := handlers.NewOrganizationHandler(services.NewOrganizationService(container.DB), container.AuthService)
	driverHandler := handlers.NewDriverHandler(container)
	vehicleHandler := handlers.NewVehicleHandler(container)
	tripHandler := handlers.NewTripHandler(container)
	fuelHandler := handlers.NewFuelHandler(container)
	uploadHandler := handlers.NewUploadHandler(container)
	locationHandler := handlers.NewLocationHandler(container)
	analyticsHandler := handlers.NewAnalyticsHandler(container)
	whatsappHandler := handlers.NewWhatsAppHandler(container)

	// JWT Middleware
	jwtMiddleware := middleware.JWTMiddleware(container.JWTService)

	// Public routes (no authentication required)
	public := router.Group("/")
	public.Use(middleware.PublicRateLimiter()) // Rate limit all public endpoints
	{
		// Organization Registration (Public)
		public.POST("/organizations/register", orgHandler.RegisterOrganization)

		// Authentication routes - WITH VALIDATION
		auth := public.Group("/auth")
		auth.Use(middleware.ValidationMiddleware())      // Double-ensure security
		auth.Use(middleware.PhoneValidationMiddleware()) // Double-ensure phone validation
		auth.Use(middleware.AuthRateLimiter())           // Stricter rate limiting for auth
		{
			auth.POST("/otp/send", authHandler.SendOTP)
			auth.POST("/otp/verify", authHandler.VerifyOTP)
			auth.POST("/refresh", authHandler.RefreshToken)
		}

		// Public tracking (for customers)
		tracking := public.Group("/tracking")
		{
			tracking.GET("/:tracking_id", tripHandler.GetPublicTripStatus)
		}

		// Health check
		public.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status":  "healthy",
				"service": "fleetflow-api",
				"version": "1.0.0",
			})
		})

		// WhatsApp webhook (public for Meta verification)
		whatsapp := public.Group("/whatsapp")
		{
			whatsapp.GET("/webhook", whatsappHandler.HandleWebhook)
			whatsapp.POST("/webhook", whatsappHandler.HandleWebhook)
		}

		// Quick test driver stats endpoint (public for testing)
		public.GET("/test-driver-stats", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"rating":           4.8,
				"totalTrips":       127,
				"todayEarnings":    850.0,
				"fuelEfficiency":   12.5,
				"onTimeDeliveries": 95,
				"customerRating":   4.7,
			})
		})
	}

	// Protected routes (authentication required)
	protected := router.Group("/")
	protected.Use(jwtMiddleware)
	{
		// Auth operations (logout, profile)
		revokeHandler := handlers.NewRevokeTokenHandler(container)
		auth := protected.Group("/auth")
		{
			auth.POST("/logout", authHandler.Logout)
			auth.POST("/revoke", revokeHandler.RevokeToken) // NEW: Token revocation
			auth.GET("/profile", authHandler.GetProfile)
			auth.PUT("/profile", authHandler.UpdateProfile)
		}

		// Organization Management
		org := protected.Group("/organizations")
		{
			org.GET("/me", orgHandler.GetMyOrganization)
		}

		// Maintenance
		maintenanceHandler := handlers.NewMaintenanceHandler(services.NewMaintenanceService(container.DB))
		maintenance := protected.Group("/maintenance")
		{
			maintenance.POST("/dvir", maintenanceHandler.SubmitDVIR)
			maintenance.GET("/due", maintenanceHandler.GetMaintenanceDue)
			maintenance.POST("/work-order", maintenanceHandler.CreateWorkOrder)
			maintenance.POST("/work-order/:id/resolve", maintenanceHandler.ResolveWorkOrder)
		}

		// ELD & HOS
		eldHandler := handlers.NewELDHandler(services.NewHOSService(container.DB))
		eld := protected.Group("/eld")
		{
			eld.POST("/status", eldHandler.UpdateDutyStatus)
			eld.GET("/clocks", eldHandler.GetClocks)
		}

		// Safety
		safetyHandler := handlers.NewSafetyHandler(services.NewSafetyService(container.DB, container.MQTTService))
		safety := protected.Group("/safety")
		{
			safety.GET("/events", safetyHandler.GetSafetyEvents)
			safety.GET("/score", safetyHandler.GetDriverScore)
		}

		// Telemetry
		telemetryHandler := handlers.NewTelemetryHandler(services.NewTelemetryService(container.DB, container.MQTTService))
		telemetry := protected.Group("/telemetry")
		{
			telemetry.GET("/latest", telemetryHandler.GetLatestTelemetry)
			telemetry.GET("/dtc", telemetryHandler.GetActiveDTCs)
		}

		// Navigation
		navHandler := handlers.NewNavigationHandler(services.NewNavigationService(container.MapsClient))
		nav := protected.Group("/navigation")
		{
			nav.GET("/dead-reckoning", navHandler.SimulateDeadReckoning)
			nav.GET("/snap", navHandler.SnapToRoad)
			nav.GET("/directions", navHandler.GetDirections)
		}

		// Asset & Yard
		assetHandler := handlers.NewAssetHandler(services.NewAssetService(container.DB))
		assets := protected.Group("/assets")
		{
			assets.POST("/", assetHandler.CreateAsset)
			assets.POST("/ping", assetHandler.SimulateBeaconPing)
		}
		protected.POST("/yards", assetHandler.CreateYard)

		inventory := protected.Group("/inventory")
		{
			inventory.POST("/:id/update", assetHandler.UpdateInventory)
			inventory.GET("/low-stock", assetHandler.GetLowStock)
		}

		// Video & Vision AI
		videoHandler := handlers.NewVideoHandler(services.NewVideoService(container.DB))
		video := protected.Group("/video")
		{
			video.POST("/cameras", videoHandler.RegisterCamera)
			video.POST("/events", videoHandler.ProcessAIEvent)
			video.GET("/clips", videoHandler.GetClips)
		}

		// Driver routes
		drivers := protected.Group("/drivers")
		{
			drivers.GET("", driverHandler.GetDrivers)
			drivers.POST("", middleware.RequireAdmin(), driverHandler.CreateDriver)
			drivers.GET("/:id", driverHandler.GetDriver)
			drivers.PUT("/:id", middleware.RequireAdmin(), driverHandler.UpdateDriver)
			drivers.DELETE("/:id", middleware.RequireAdmin(), driverHandler.DeleteDriver)
			drivers.GET("/:id/performance", driverHandler.GetDriverPerformance)
			drivers.GET("/:id/compliance", driverHandler.GetDriverCompliance)
			drivers.PUT("/:id/status", driverHandler.UpdateDriverStatus)
		}

		// Current driver endpoints (for mobile app)
		protected.GET("/driver/stats", driverHandler.GetCurrentDriverStats)
		protected.GET("/driver/profile", driverHandler.GetCurrentDriverProfile)
		protected.GET("/driver/trips/current", driverHandler.GetCurrentDriverTrips)

		// Driver Change Request routes
		protected.POST("/driver/change-request", driverHandler.SubmitChangeRequest)
		protected.GET("/driver/change-requests", driverHandler.GetDriverChangeRequests)
		protected.PUT("/driver/change-request/:id/cancel", driverHandler.CancelChangeRequest)
		// Alternative route for debugging
		drivers.GET("/current/stats", driverHandler.GetCurrentDriverStats)

		// Vehicle routes
		vehicles := protected.Group("/vehicles")
		{
			vehicles.GET("", vehicleHandler.GetVehicles)
			vehicles.POST("", middleware.RequireAdmin(), vehicleHandler.CreateVehicle)
			vehicles.GET("/:id", vehicleHandler.GetVehicle)
			vehicles.PUT("/:id", middleware.RequireAdmin(), vehicleHandler.UpdateVehicle)
			vehicles.DELETE("/:id", middleware.RequireAdmin(), vehicleHandler.DeleteVehicle)
			vehicles.GET("/:id/location", vehicleHandler.GetVehicleLocation)
			vehicles.GET("/:id/performance", vehicleHandler.GetVehiclePerformance)
			vehicles.GET("/:id/compliance", vehicleHandler.GetVehicleCompliance)
			vehicles.PUT("/:id/location", vehicleHandler.UpdateVehicleLocation)
		}

		// Trip routes
		trips := protected.Group("/trips")
		{
			trips.GET("", tripHandler.GetTrips)
			trips.POST("", middleware.RequireAdmin(), tripHandler.CreateTrip)
			trips.GET("/:id", tripHandler.GetTrip)
			trips.PUT("/:id", middleware.RequireAdmin(), tripHandler.UpdateTrip)
			trips.DELETE("/:id", middleware.RequireAdmin(), tripHandler.DeleteTrip)

			// Trip lifecycle
			trips.POST("/:id/assign", middleware.RequireAdmin(), tripHandler.AssignTrip)
			trips.POST("/:id/start", middleware.RequireAdminOrDriver(), tripHandler.StartTrip)
			trips.POST("/:id/pause", middleware.RequireAdminOrDriver(), tripHandler.PauseTrip)
			trips.POST("/:id/resume", middleware.RequireAdminOrDriver(), tripHandler.ResumeTrip)
			trips.POST("/:id/complete", middleware.RequireAdminOrDriver(), tripHandler.CompleteTrip)
			trips.POST("/:id/cancel", middleware.RequireAdmin(), tripHandler.CancelTrip)

			// Trip tracking
			trips.GET("/:id/location", tripHandler.GetTripLocation)
			trips.GET("/:id/route", tripHandler.GetTripRoute)
			trips.PUT("/:id/eta", tripHandler.UpdateETA)
		}

		// Fuel management routes
		fuel := protected.Group("/fuel")
		{
			// Fuel events
			fuel.GET("/events", fuelHandler.GetFuelEvents)
			fuel.POST("/events", fuelHandler.CreateFuelEvent)
			fuel.GET("/events/:id", fuelHandler.GetFuelEvent)
			fuel.PUT("/events/:id", middleware.RequireAdmin(), fuelHandler.UpdateFuelEvent)
			fuel.POST("/events/:id/verify", middleware.RequireAdmin(), fuelHandler.VerifyFuelEvent)
			fuel.POST("/events/:id/reject", middleware.RequireAdmin(), fuelHandler.RejectFuelEvent)

			// Fuel alerts
			fuel.GET("/alerts", fuelHandler.GetFuelAlerts)
			fuel.GET("/alerts/:id", fuelHandler.GetFuelAlert)
			fuel.POST("/alerts/:id/resolve", middleware.RequireAdmin(), fuelHandler.ResolveFuelAlert)

			// Fuel analytics
			fuel.GET("/analytics", fuelHandler.GetFuelAnalytics)
			fuel.GET("/analytics/:vehicle_id", fuelHandler.GetVehicleFuelAnalytics)

			// Fuel stations
			fuel.GET("/stations", fuelHandler.GetNearbyFuelStations)
			fuel.POST("/stations", middleware.RequireAdmin(), fuelHandler.CreateFuelStation)
		}

		// Location and tracking routes
		location := protected.Group("/location")
		{
			location.POST("/ping", middleware.RequireDriver(), locationHandler.RecordLocationPing)
			location.GET("/vehicle/:id", locationHandler.GetVehicleLocation)
			location.GET("/vehicle/:id/history", locationHandler.GetLocationHistory)
			location.GET("/driver/:id", locationHandler.GetDriverLocation)

			// Geofencing
			location.GET("/geofences", locationHandler.GetGeofences)
			location.POST("/geofences", middleware.RequireAdmin(), locationHandler.CreateGeofence)
			location.PUT("/geofences/:id", middleware.RequireAdmin(), locationHandler.UpdateGeofence)
			location.DELETE("/geofences/:id", middleware.RequireAdmin(), locationHandler.DeleteGeofence)
		}

		// File upload routes
		uploads := protected.Group("/uploads")
		{
			uploads.POST("/fuel-receipt", uploadHandler.UploadFuelReceipt)
			uploads.POST("/pod", uploadHandler.UploadPOD)
			uploads.POST("/document", uploadHandler.UploadDocument)
			uploads.GET("/:id", uploadHandler.GetUpload)
			uploads.DELETE("/:id", uploadHandler.DeleteUpload)
			uploads.POST("/:id/verify", middleware.RequireAdmin(), uploadHandler.VerifyUpload)
		}

		// Analytics and reporting routes
		analytics := protected.Group("/analytics")
		analytics.Use(middleware.RequireAdmin()) // Only admins can access analytics
		{
			analytics.GET("/dashboard", analyticsHandler.GetDashboardStats)
			analytics.GET("/fleet-performance", analyticsHandler.GetFleetPerformance)
			analytics.GET("/driver-performance", analyticsHandler.GetDriverPerformance)
			analytics.GET("/vehicle-utilization", analyticsHandler.GetVehicleUtilization)
			analytics.GET("/fuel-efficiency", analyticsHandler.GetFuelEfficiency)
			analytics.GET("/revenue", analyticsHandler.GetRevenueAnalytics)
			analytics.GET("/compliance", analyticsHandler.GetComplianceReport)
		}

		// WhatsApp service routes
		whatsappProtected := protected.Group("/whatsapp")
		{
			whatsappProtected.POST("/send", whatsappHandler.SendMessage)
			whatsappProtected.POST("/trip-notification", whatsappHandler.SendTripNotification)
			whatsappProtected.GET("/status", whatsappHandler.GetStatus)
			whatsappProtected.POST("/process-event", whatsappHandler.ProcessTripEvent)
		}

		// Reports (for generating PDF/CSV exports)
		reports := protected.Group("/reports")
		reports.Use(middleware.RequireAdmin())
		{
			reports.GET("/trips", tripHandler.ExportTrips)
			reports.GET("/fuel", fuelHandler.ExportFuelEvents)
			reports.GET("/drivers", driverHandler.ExportDrivers)
			reports.GET("/vehicles", vehicleHandler.ExportVehicles)
		}

		// Admin-only routes
		admin := protected.Group("/admin")
		admin.Use(middleware.RequireAdmin())
		{
			// Change request management
			admin.GET("/change-requests", driverHandler.GetAllChangeRequests)
			admin.PUT("/change-request/:id/approve", driverHandler.ApproveChangeRequest)
			admin.PUT("/change-request/:id/reject", driverHandler.RejectChangeRequest)

			// User management
			users := admin.Group("/users")
			{
				users.GET("/", authHandler.GetUsers)
				users.POST("/", authHandler.CreateUser)
				users.PUT("/:id", authHandler.UpdateUser)
				users.DELETE("/:id", authHandler.DeleteUser)
				users.POST("/:id/reset-password", authHandler.ResetUserPassword)
			}

			// System settings
			admin.GET("/settings", analyticsHandler.GetSystemSettings)
			admin.PUT("/settings", analyticsHandler.UpdateSystemSettings)

			// Audit logs
			admin.GET("/audit-logs", analyticsHandler.GetAuditLogs)
			admin.GET("/security-events", analyticsHandler.GetSecurityEvents)
		}

		// MQTT routes for real-time communication
		mqtt := protected.Group("/mqtt")
		{
			mqttHandler := handlers.NewMQTTHandler(container)

			// MQTT status and health
			mqtt.GET("/status", mqttHandler.GetMQTTStatus)

			// Vehicle MQTT endpoints
			mqtt.POST("/vehicle/:vehicle_id/location", mqttHandler.PublishLocationUpdate)

			// Trip MQTT endpoints
			mqtt.POST("/trip/:trip_id/update", mqttHandler.PublishTripUpdate)

			// Driver mobile communication
			mqtt.POST("/driver/:driver_id/message", mqttHandler.PublishDriverMessage)

			// Fleet-wide communication
			mqtt.POST("/fleet/alert", mqttHandler.PublishFleetAlert)
			mqtt.POST("/fleet/broadcast", mqttHandler.PublishFleetBroadcast)
		}
	}

	// WebSocket route for real-time updates
	router.GET("/ws", locationHandler.HandleWebSocket)
}
