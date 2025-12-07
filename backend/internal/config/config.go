package config

import (
	"os"
	"strconv"
	"time"
)

// Config holds all configuration for the application
type Config struct {
	// Server configuration
	Port              string
	APIGatewayPort    string
	GRPCServerAddress string
	Environment       string

	// Database configuration
	DatabaseURL string

	// JWT configuration
	JWTSecret          string
	JWTExpirationTime  time.Duration
	RefreshTokenExpiry time.Duration

	// Redis configuration
	RedisURL      string
	RedisPassword string

	// External services
	TwilioAccountSID string
	TwilioAuthToken  string
	TwilioFromNumber string
	AWSAccessKey     string
	AWSSecretKey     string
	AWSRegion        string
	S3BucketName     string
	S3Bucket         string
	S3Region         string
	S3AccessKey      string
	S3SecretKey      string

	// Local storage
	LocalStoragePath string

	// WebSocket configuration
	WSMaxConnections int
	WSReadTimeout    time.Duration
	WSWriteTimeout   time.Duration

	// Rate limiting
	RateLimitRPM int // Requests per minute

	// File upload limits
	MaxUploadSize int64 // in bytes

	// Google Maps API
	GoogleMapsAPIKey string

	// WhatsApp Business API configuration
	WhatsAppAccessToken   string
	WhatsAppPhoneNumberID string
	WhatsAppVerifyToken   string
	CustomerPortalURL     string

	// MQTT Configuration
	MQTT MQTTConfig
}

// MQTTConfig holds MQTT broker configuration
type MQTTConfig struct {
	Enabled   bool   `json:"enabled"`
	Broker    string `json:"broker"`
	Username  string `json:"username"`
	Password  string `json:"password"`
	ClientID  string `json:"client_id"`
	KeepAlive int    `json:"keep_alive"` // seconds
	QoS       byte   `json:"qos"`        // 0, 1, or 2
	Retained  bool   `json:"retained"`   // retain messages
}

// Load loads configuration from environment variables
func Load() *Config {
	return &Config{
		// Server
		Port:              getEnv("PORT", "8080"),
		APIGatewayPort:    getEnv("API_GATEWAY_PORT", "8081"),
		GRPCServerAddress: getEnv("GRPC_SERVER_ADDRESS", "localhost:9090"),
		Environment:       getEnv("ENVIRONMENT", "development"),

		// Database
		DatabaseURL: getEnv("DATABASE_URL", "postgres://fleet:fleet@localhost:5432/fleetflow?sslmode=disable"),

		// JWT - SECURITY: Short TTL for production
		JWTSecret:          getEnv("JWT_SECRET", ""),                         // NO DEFAULT - must be set in production
		JWTExpirationTime:  getDurationEnv("JWT_EXPIRATION", 15*time.Minute), // 15 minutes (was 24h)
		RefreshTokenExpiry: getDurationEnv("REFRESH_TOKEN_EXPIRY", 7*24*time.Hour),

		// Redis
		RedisURL:      getEnv("REDIS_URL", "localhost:6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),

		// External services
		TwilioAccountSID: getEnv("TWILIO_ACCOUNT_SID", ""),
		TwilioAuthToken:  getEnv("TWILIO_AUTH_TOKEN", ""),
		TwilioFromNumber: getEnv("TWILIO_FROM_NUMBER", ""),
		AWSAccessKey:     getEnv("AWS_ACCESS_KEY", ""),
		AWSSecretKey:     getEnv("AWS_SECRET_KEY", ""),
		AWSRegion:        getEnv("AWS_REGION", "ap-south-1"),
		S3BucketName:     getEnv("S3_BUCKET_NAME", "fleetflow-uploads"),
		S3Bucket:         getEnv("S3_BUCKET", "fleetflow-uploads"),
		S3Region:         getEnv("S3_REGION", "ap-south-1"),
		S3AccessKey:      getEnv("S3_ACCESS_KEY", ""),
		S3SecretKey:      getEnv("S3_SECRET_KEY", ""),

		// Local storage
		LocalStoragePath: getEnv("LOCAL_STORAGE_PATH", "./uploads"),

		// WebSocket
		WSMaxConnections: getIntEnv("WS_MAX_CONNECTIONS", 10000),
		WSReadTimeout:    getDurationEnv("WS_READ_TIMEOUT", 60*time.Second),
		WSWriteTimeout:   getDurationEnv("WS_WRITE_TIMEOUT", 10*time.Second),

		// Rate limiting
		RateLimitRPM: getIntEnv("RATE_LIMIT_RPM", 100),

		// File uploads
		MaxUploadSize: getInt64Env("MAX_UPLOAD_SIZE", 10*1024*1024), // 10MB

		// Google Maps
		GoogleMapsAPIKey: getEnv("GOOGLE_MAPS_API_KEY", ""),

		// WhatsApp Business API
		WhatsAppAccessToken:   getEnv("WHATSAPP_ACCESS_TOKEN", ""),
		WhatsAppPhoneNumberID: getEnv("WHATSAPP_PHONE_NUMBER_ID", ""),
		WhatsAppVerifyToken:   getEnv("WHATSAPP_VERIFY_TOKEN", "fleetflow_verify_token"),
		CustomerPortalURL:     getEnv("CUSTOMER_PORTAL_URL", "http://localhost:3000"),

		// MQTT Configuration
		MQTT: MQTTConfig{
			Enabled:   getBoolEnv("MQTT_ENABLED", false),
			Broker:    getEnv("MQTT_BROKER", "tcp://localhost:1883"),
			Username:  getEnv("MQTT_USERNAME", "fleetflow"),
			Password:  getEnv("MQTT_PASSWORD", "fleetflow123"),
			ClientID:  getEnv("MQTT_CLIENT_ID", "fleetflow-backend"),
			KeepAlive: getIntEnv("MQTT_KEEP_ALIVE", 60),
			QoS:       byte(getIntEnv("MQTT_QOS", 1)),
			Retained:  getBoolEnv("MQTT_RETAINED", false),
		},
	}
}

// Helper functions
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getIntEnv(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getInt64Env(key string, defaultValue int64) int64 {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.ParseInt(value, 10, 64); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getDurationEnv(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}

func getBoolEnv(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}

// IsDevelopment returns true if the environment is development
func (c *Config) IsDevelopment() bool {
	return c.Environment == "development"
}

// IsProduction returns true if the environment is production
func (c *Config) IsProduction() bool {
	return c.Environment == "production"
}
