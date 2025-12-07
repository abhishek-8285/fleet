package services

import (
	"github.com/fleetflow/backend/internal/config"
	"github.com/fleetflow/backend/internal/middleware"
	"googlemaps.github.io/maps"
	"gorm.io/gorm"
)

// Container holds all service dependencies
type Container struct {
	// Database
	DB *gorm.DB

	// Configuration
	Config *config.Config

	// Core services
	JWTService          *middleware.JWTService
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

	// Initialize core services
	container.JWTService = middleware.NewJWTService(cfg, db)
	container.AuditService = NewAuditService(db)
	container.AuthService = NewAuthService(db, cfg, container.AuditService)
	container.DriverService = NewDriverService(db, container.AuditService)
	container.VehicleService = NewVehicleService(db, container.AuditService)
	container.TripService = NewTripService(db, container.AuditService)
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
