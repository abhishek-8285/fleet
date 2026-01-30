package test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/fleetflow/backend/internal/config"
	"github.com/fleetflow/backend/internal/models"
	"github.com/fleetflow/backend/internal/routes"
	"github.com/fleetflow/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// TestFramework provides utilities for API testing
type TestFramework struct {
	Router   *gin.Engine
	DB       *gorm.DB
	Services *services.Container
	Config   *config.Config
}

var (
	sharedDB    *gorm.DB
	hasMigrated bool
)

// NewTestFramework creates a new test framework with in-memory database
func NewTestFramework() (*TestFramework, error) {
	var err error
	if sharedDB == nil {
		// Use a temporary file for SQLite to ensure all connections share the same data and schema
		dbPath := fmt.Sprintf("/tmp/fleetflow_test.db") // Single file for entire run
		sharedDB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
		if err != nil {
			return nil, err
		}
	}

	if !hasMigrated {
		// Auto-migrate all models ONCE per test run
		err = sharedDB.AutoMigrate(
			&models.UserAccount{},
			&models.Driver{},
			&models.Vehicle{},
			&models.Trip{},
			&models.LocationPing{},
			&models.Geofence{},
			&models.FuelEvent{},
			&models.FuelAlert{},
			&models.RefreshToken{},
			&models.OTPVerification{},
			&models.Upload{},
			&models.AuditLog{},
		)
		if err != nil {
			log.Printf("❌ AutoMigrate failed: %v\n", err)
			return nil, err
		}
		hasMigrated = true
		log.Println("✅ Shared test database migrated")
	}

	db := sharedDB

	// Create test configuration
	cfg := &config.Config{
		Environment:        "test",
		Port:               "8080",
		JWTSecret:          "test-secret",
		JWTExpirationTime:  24 * 60 * 60 * time.Second, // 24 hours for tests
		RefreshTokenExpiry: 7 * 24 * time.Hour,
		DatabaseURL:        ":memory:",
	}

	// Initialize services
	serviceContainer := services.NewContainer(db, cfg)

	// Setup Gin router in test mode
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// Register routes
	apiV1 := router.Group("/api/v1")
	routes.RegisterRoutes(apiV1, serviceContainer)

	// Add health endpoint for simple_api_test compatibility
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy", "service": "fleetflow-backend"})
	})

	return &TestFramework{
		Router:   router,
		DB:       db,
		Services: serviceContainer,
		Config:   cfg,
	}, nil
}

// APITestCase represents a single API test case
type APITestCase struct {
	Name            string
	Method          string
	URL             string
	Headers         map[string]string
	RequestBody     interface{}
	HeadersFunc     func(*TestFramework) map[string]string
	RequestBodyFunc func(*TestFramework) interface{}
	ExpectedStatus  int
	ExpectedBody    map[string]interface{}
	Setup           func(*TestFramework)
	Cleanup         func(*TestFramework)
}

// RunAPITest executes a single API test case
func (tf *TestFramework) RunAPITest(t *testing.T, testCase APITestCase) {
	// Setup
	if testCase.Setup != nil {
		testCase.Setup(tf)
	}

	// Cleanup
	if testCase.Cleanup != nil {
		defer testCase.Cleanup(tf)
	}

	// Evaluate dynamic headers and body if functions are provided
	headers := testCase.Headers
	if testCase.HeadersFunc != nil {
		headers = testCase.HeadersFunc(tf)
	}

	body := testCase.RequestBody
	if testCase.RequestBodyFunc != nil {
		body = testCase.RequestBodyFunc(tf)
	}

	// Prepare request body
	var bodyBuffer *bytes.Buffer
	if body != nil {
		bodyBytes, err := json.Marshal(body)
		require.NoError(t, err, "Failed to marshal request body")
		bodyBuffer = bytes.NewBuffer(bodyBytes)
	} else {
		bodyBuffer = bytes.NewBuffer([]byte{})
	}

	// Create request
	req, err := http.NewRequest(testCase.Method, testCase.URL, bodyBuffer)
	require.NoError(t, err, "Failed to create request")

	// Add headers
	req.Header.Set("Content-Type", "application/json")
	for key, value := range headers {
		req.Header.Set(key, value)
	}

	// Execute request
	w := httptest.NewRecorder()
	tf.Router.ServeHTTP(w, req)

	// Assert status code
	assert.Equal(t, testCase.ExpectedStatus, w.Code,
		"Test: %s - Expected status %d, got %d. Response: %s",
		testCase.Name, testCase.ExpectedStatus, w.Code, w.Body.String())

	// Assert response body if provided
	if testCase.ExpectedBody != nil {
		var responseBody map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &responseBody)
		require.NoError(t, err, "Failed to unmarshal response body")

		for key, expectedValue := range testCase.ExpectedBody {
			assert.Equal(t, expectedValue, responseBody[key],
				"Test: %s - Expected %s to be %v, got %v",
				testCase.Name, key, expectedValue, responseBody[key])
		}
	}
}

// CreateTestUser creates a test user in the database
func (tf *TestFramework) CreateTestUser(phone string, role models.Role) (*models.UserAccount, error) {
	user := &models.UserAccount{
		Phone:    phone,
		Role:     role,
		IsActive: true,
	}

	err := tf.DB.Create(user).Error
	return user, err
}

// CreateTestDriver creates a test driver
func (tf *TestFramework) CreateTestDriver(name, phone, license string) (*models.Driver, error) {
	driver := &models.Driver{
		Name:          name,
		Phone:         phone,
		LicenseNumber: license,
		Status:        "AVAILABLE",
		Rating:        5.0,
		IsActive:      true,
	}

	err := tf.DB.Create(driver).Error
	return driver, err
}

// CreateTestVehicle creates a test vehicle
func (tf *TestFramework) CreateTestVehicle(licensePlate, vehicleType string) (*models.Vehicle, error) {
	vehicle := &models.Vehicle{
		LicensePlate: licensePlate,
		VehicleType:  models.VehicleType(vehicleType),
		Status:       models.VehicleStatusActive,
		LoadCapacity: 5000,
		FuelCapacity: 400,
		Make:         "Tata",
		Model:        "Prima",
	}

	err := tf.DB.Create(vehicle).Error
	return vehicle, err
}

// CreateTestTrip creates a test trip
func (tf *TestFramework) CreateTestTrip(pickupAddr, dropoffAddr string, driverID, vehicleID uint) (*models.Trip, error) {
	trip := &models.Trip{
		PickupAddress:  pickupAddr,
		DropoffAddress: dropoffAddr,
		CustomerName:   "Test Customer",
		CustomerPhone:  "+919999888777",
		Status:         models.TripStatusScheduled,
		DriverID:       &driverID,
		VehicleID:      &vehicleID,
		TrackingID:     fmt.Sprintf("RTC%d", 240900000+int(driverID)),
		CargoWeight:    1000,
		BasePrice:      2500,
		TotalAmount:    2500,
	}

	err := tf.DB.Create(trip).Error
	return trip, err
}

// GenerateJWTToken generates a JWT token for testing
func (tf *TestFramework) GenerateJWTToken(user *models.UserAccount) (string, error) {
	return tf.Services.JWTService.GenerateToken(user)
}

func (tf *TestFramework) CleanDatabase() {
	// Delete all records from all tables
	tf.DB.Exec("DELETE FROM audit_logs")
	tf.DB.Exec("DELETE FROM refresh_tokens")
	tf.DB.Exec("DELETE FROM otp_verifications")
	tf.DB.Exec("DELETE FROM uploads")
	tf.DB.Exec("DELETE FROM fuel_alerts")
	tf.DB.Exec("DELETE FROM fuel_events")
	tf.DB.Exec("DELETE FROM location_pings")
	tf.DB.Exec("DELETE FROM trips")
	tf.DB.Exec("DELETE FROM vehicles")
	tf.DB.Exec("DELETE FROM drivers")
	tf.DB.Exec("DELETE FROM user_accounts")
	tf.DB.Exec("DELETE FROM fleets")
	tf.DB.Exec("DELETE FROM organizations")
}

// AssertError checks that response contains expected error
func AssertError(t *testing.T, response *httptest.ResponseRecorder, expectedError string) {
	var errorResponse map[string]interface{}
	err := json.Unmarshal(response.Body.Bytes(), &errorResponse)
	require.NoError(t, err)
	assert.Contains(t, errorResponse["error"], expectedError)
}

// AssertSuccess checks that response indicates success
func AssertSuccess(t *testing.T, response *httptest.ResponseRecorder) {
	var successResponse map[string]interface{}
	err := json.Unmarshal(response.Body.Bytes(), &successResponse)
	require.NoError(t, err)
	assert.True(t, successResponse["success"].(bool))
}

// MockSMSService for testing without actually sending SMS
type MockSMSService struct {
	ShouldFail bool
	SentOTPs   map[string]string // phone -> otp
}

func (m *MockSMSService) SendOTP(phone, otp string) error {
	if m.ShouldFail {
		return fmt.Errorf("mock SMS failure")
	}
	if m.SentOTPs == nil {
		m.SentOTPs = make(map[string]string)
	}
	m.SentOTPs[phone] = otp
	return nil
}

func (m *MockSMSService) Health() error {
	if m.ShouldFail {
		return fmt.Errorf("SMS service unhealthy")
	}
	return nil
}

// Common test data
var (
	TestDriverPhone   = "+919999999991"
	TestAdminPhone    = "+919999999992"
	TestDriverLicense = "MH1420110012345"
	TestVehicleReg    = "MH01AB1234"
	TestOTP           = "123456"
)
