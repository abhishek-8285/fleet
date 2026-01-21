package services

import (
	"github.com/fleetflow/backend/internal/config"
	"github.com/fleetflow/backend/internal/repositories"
	"googlemaps.github.io/maps"
	"gorm.io/gorm"
)

// Container holds all service dependencies
type Container struct {
	// Database
	DB *gorm.DB

	// Configuration
	Config *config.Config

	// Repositories
	AuthRepo    repositories.AuthRepository
	DriverRepo  repositories.DriverRepository
	VehicleRepo repositories.VehicleRepository
	TripRepo    repositories.TripRepository
	UploadRepo  repositories.UploadRepository

	// Core services
	JWTService          *JWTService
	AuthService         *AuthService
	DriverService       *DriverService
	VehicleService      *VehicleService
	TripService         *TripService
	FuelService         *FuelService
	LocationService     *LocationService
	UploadService       *UploadService
	AnalyticsService    *AnalyticsService
	NotificationService *NotificationService
	AuditService        *AuditService

	// External services
	SMSService        SMSProvider
	StorageService    StorageProvider
	MapsClient        *maps.Client
	WhatsAppService   *WhatsAppService
	WebSocketHub      *WebSocketHub
	MQTTService       *MQTTService
	IngestionService  *IngestionService
	TelemetryService  *TelemetryService
	NavigationService *NavigationService
	AssetService      *AssetService
	VideoService      *VideoService
	SafetyService     *SafetyService
}

// NewContainer creates a new service container with all dependencies
func NewContainer(db *gorm.DB, cfg *config.Config) *Container {
	container := &Container{
		DB:     db,
		Config: cfg,
	}

	// Initialize repositories
	container.AuthRepo = repositories.NewPostgresAuthRepository(db)
	container.DriverRepo = repositories.NewPostgresDriverRepository(db)
	container.VehicleRepo = repositories.NewPostgresVehicleRepository(db)
	container.TripRepo = repositories.NewPostgresTripRepository(db)
	container.UploadRepo = repositories.NewPostgresUploadRepository(db)

	// Initialize core services
	container.JWTService = NewJWTService(cfg, db)
	container.AuditService = NewAuditService(db)

	// Create AuthService and others with Repository
	container.AuthService = NewAuthService(container.AuthRepo, cfg, container.AuditService)
	// Re-inject AuthService into JWTService if needed (assuming JWTService has a field for it, though NewJWTService doesn't take it currently)
	// container.JWTService.authService = container.AuthService

	container.DriverService = NewDriverService(container.DriverRepo, container.AuditService)
	container.VehicleService = NewVehicleService(container.VehicleRepo, container.AuditService)

	// Trip Service needs TripRepo, VehicleRepo, UploadRepo
	container.TripService = NewTripService(container.TripRepo, container.VehicleRepo, container.UploadRepo, container.AuditService)

	container.FuelService = NewFuelService(db, container.AuditService)
	container.LocationService = NewLocationService(db, container.AuditService)
	container.UploadService = NewUploadService(db, cfg, container.AuditService)
	container.AnalyticsService = NewAnalyticsService(db)
	container.NotificationService = NewNotificationService(cfg)

	// Initialize external services
	if cfg.IsDevelopment() {
		container.SMSService = NewDevSMSService()
		container.StorageService = NewLocalStorageService(cfg)
	} else {
		container.SMSService = NewTwilioSMSService(cfg)
		container.StorageService = NewS3StorageService(cfg)
	}

	// Initialize Google Maps Client
	if cfg.GoogleMapsAPIKey != "" {
		mapsClient, err := maps.NewClient(maps.WithAPIKey(cfg.GoogleMapsAPIKey))
		if err == nil {
			container.MapsClient = mapsClient
		}
	}

	// Initialize WhatsApp service
	whatsappConfig := WhatsAppConfig{
		APIEndpoint:       "https://graph.facebook.com/v18.0",
		AccessToken:       cfg.WhatsAppAccessToken,
		PhoneNumberID:     cfg.WhatsAppPhoneNumberID,
		VerifyToken:       cfg.WhatsAppVerifyToken,
		CustomerPortalURL: cfg.CustomerPortalURL,
	}
	container.WhatsAppService = NewWhatsAppService(whatsappConfig)

	// Initialize WebSocket hub
	container.WebSocketHub = NewWebSocketHub(container.LocationService)

	// Initialize MQTT service
	container.MQTTService = NewMQTTService(cfg)

	// Initialize Ingestion service
	container.IngestionService = NewIngestionService(db, container.MQTTService)

	// Initialize Telemetry service
	container.TelemetryService = NewTelemetryService(db, container.MQTTService)

	// Initialize Navigation service
	container.NavigationService = NewNavigationService(container.MapsClient)

	// Initialize Asset service
	container.AssetService = NewAssetService(db)

	// Initialize Video service
	container.VideoService = NewVideoService(db)

	// Initialize Safety service (connects to core)
	container.SafetyService = NewSafetyService(db, container.MQTTService)

	return container
}

// Health checks the health of all services
func (c *Container) Health() map[string]string {
	health := make(map[string]string)

	// Check database
	sqlDB, err := c.DB.DB()
	if err != nil {
		health["database"] = "error: " + err.Error()
	} else if err := sqlDB.Ping(); err != nil {
		health["database"] = "error: " + err.Error()
	} else {
		health["database"] = "healthy"
	}

	// Check external services
	if c.SMSService != nil {
		if err := c.SMSService.Health(); err != nil {
			health["sms"] = "error: " + err.Error()
		} else {
			health["sms"] = "healthy"
		}
	}

	if c.StorageService != nil {
		if err := c.StorageService.Health(); err != nil {
			health["storage"] = "error: " + err.Error()
		} else {
			health["storage"] = "healthy"
		}
	}

	// Check WebSocket hub
	if c.WebSocketHub != nil {
		health["websocket"] = "healthy"
	}

	// Check WhatsApp service
	if c.WhatsAppService != nil {
		health["whatsapp"] = "healthy"
	}

	// Check MQTT service
	if c.MQTTService != nil {
		if c.MQTTService.IsEnabled() {
			health["mqtt"] = "connected"
		} else {
			health["mqtt"] = "disabled"
		}
	}

	return health
}

// Close gracefully shuts down all services
func (c *Container) Close() error {
	// Close MQTT service
	if c.MQTTService != nil {
		c.MQTTService.Disconnect()
	}

	// Close Ingestion service
	if c.IngestionService != nil {
		c.IngestionService.Stop()
	}

	// Close WebSocket hub
	if c.WebSocketHub != nil {
		c.WebSocketHub.Close()
	}

	// Close database connections
	if c.DB != nil {
		sqlDB, err := c.DB.DB()
		if err != nil {
			return err
		}
		return sqlDB.Close()
	}

	return nil
}
