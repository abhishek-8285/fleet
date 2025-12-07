package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/fleetflow/backend/internal/models"
	"gorm.io/gorm"
)

// DriverStatusUpdate represents a driver status update for streaming
type DriverStatusUpdate struct {
	DriverID  uint                `json:"driver_id"`
	Name      string              `json:"name"`
	Status    models.DriverStatus `json:"status"`
	Location  models.LocationPing `json:"location"`
	OldStatus models.DriverStatus `json:"old_status"`
	NewStatus models.DriverStatus `json:"new_status"`
	Reason    string              `json:"reason"`
	Timestamp time.Time           `json:"timestamp"`
}

// DriverLocationUpdate represents a driver location update for streaming
type DriverLocationUpdate struct {
	DriverID         uint                `json:"driver_id"`
	Name             string              `json:"name"`
	Location         models.LocationPing `json:"location"`
	Status           models.DriverStatus `json:"status"`
	CurrentTripID    *uint               `json:"current_trip_id"`
	CurrentVehicleID *uint               `json:"current_vehicle_id"`
}

// DriverService handles driver operations
type DriverService struct {
	db           *gorm.DB
	auditService *AuditService
}

// NewDriverService creates a new driver service
func NewDriverService(db *gorm.DB, auditService *AuditService) *DriverService {
	return &DriverService{
		db:           db,
		auditService: auditService,
	}
}

// CreateDriver creates a new driver
func (s *DriverService) CreateDriver(driver *models.Driver) (*models.Driver, error) {
	// Check if phone number already exists
	var existingDriver models.Driver
	if err := s.db.Where("phone = ?", driver.Phone).First(&existingDriver).Error; err == nil {
		return nil, errors.New("driver with this phone number already exists")
	}

	// Create driver
	if err := s.db.Create(driver).Error; err != nil {
		return nil, fmt.Errorf("failed to create driver: %w", err)
	}

	// Log audit event
	s.auditService.LogEntityChange(
		nil, // System created
		"driver_created",
		"drivers",
		driver.ID,
		nil,
		driver,
		fmt.Sprintf("Driver created: %s", driver.Name),
	)

	return driver, nil
}

// GetDriverByID gets driver by ID
func (s *DriverService) GetDriverByID(id uint) (*models.Driver, error) {
	var driver models.Driver
	if err := s.db.Where("id = ?", id).First(&driver).Error; err != nil {
		return nil, err
	}
	return &driver, nil
}

// GetDrivers retrieves paginated list of drivers with filters
func (s *DriverService) GetDrivers(page, limit int, filters map[string]interface{}) ([]models.Driver, int64, error) {
	var drivers []models.Driver
	var total int64

	query := s.db.Model(&models.Driver{})

	// Apply filters
	for key, value := range filters {
		switch key {
		case "status":
			query = query.Where("status = ?", value)
		case "is_active":
			query = query.Where("is_active = ?", value)
		case "search":
			searchTerm := fmt.Sprintf("%%%s%%", value)
			query = query.Where("name ILIKE ? OR phone ILIKE ? OR license_number ILIKE ?",
				searchTerm, searchTerm, searchTerm)
		case "license_expiring":
			if value.(bool) {
				// Drivers whose license expires within 30 days
				query = query.Where("license_expiry <= ?", time.Now().AddDate(0, 0, 30))
			}
		}
	}

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * limit
	if err := query.Order("name ASC").
		Offset(offset).Limit(limit).
		Find(&drivers).Error; err != nil {
		return nil, 0, err
	}

	return drivers, total, nil
}

// UpdateDriver updates a driver
func (s *DriverService) UpdateDriver(driver *models.Driver) (*models.Driver, error) {
	if err := s.db.Save(driver).Error; err != nil {
		return nil, fmt.Errorf("failed to update driver: %w", err)
	}

	return driver, nil
}

// DeleteDriver deletes a driver
func (s *DriverService) DeleteDriver(id uint) error {
	if err := s.db.Delete(&models.Driver{}, id).Error; err != nil {
		return fmt.Errorf("failed to delete driver: %w", err)
	}

	return nil
}

// UpdateDriverStatus updates driver status
func (s *DriverService) UpdateDriverStatus(id uint, status string, reason string) error {
	if err := s.db.Model(&models.Driver{}).Where("id = ?", id).Update("status", status).Error; err != nil {
		return fmt.Errorf("failed to update driver status: %w", err)
	}

	return nil
}

// GetDriverPerformance gets driver performance metrics
func (s *DriverService) GetDriverPerformance(id uint, period string) (*models.DriverPerformanceMetric, error) {
	// Implementation would calculate performance metrics
	// For now, return mock data
	driver, err := s.GetDriverByID(id)
	if err != nil {
		return nil, err
	}

	return &models.DriverPerformanceMetric{
		DriverID:       driver.ID,
		DriverName:     driver.Name,
		Rating:         driver.Rating,
		TotalTrips:     int(driver.TotalTrips),
		CompletedTrips: int(driver.TotalTrips), // Mock
		OnTimeRate:     95.0,                   // Mock
		FuelEfficiency: driver.FuelEfficiency,
		CustomerRating: 4.5, // Mock
	}, nil
}

// GetDriverCompliance gets driver compliance status
func (s *DriverService) GetDriverCompliance(id uint) (*models.DriverCompliance, error) {
	// Implementation would check compliance
	// For now, return mock data
	driver, err := s.GetDriverByID(id)
	if err != nil {
		return nil, err
	}

	return &models.DriverCompliance{
		DriverID:                driver.ID,
		DriverName:              driver.Name,
		LicenseStatus:           "valid",
		LicenseDaysToExpiry:     30, // Mock
		MedicalCertStatus:       "valid",
		MedicalCertDaysToExpiry: 60, // Mock
		ComplianceScore:         85.0,
	}, nil
}

// GetAvailableDrivers gets available drivers for assignment
func (s *DriverService) GetAvailableDrivers(location *models.Location, maxDistance float64) ([]models.AvailableDriver, error) {
	// Implementation would find nearby available drivers
	// For now, return mock data
	var drivers []models.Driver
	if err := s.db.Where("status = ? AND is_active = ?", "available", true).Find(&drivers).Error; err != nil {
		return nil, err
	}

	var availableDrivers []models.AvailableDriver
	for _, driver := range drivers {
		availableDrivers = append(availableDrivers, models.AvailableDriver{
			Driver:              driver,
			DistanceKm:          5.0, // Mock
			EstimatedETAMinutes: 15,  // Mock
			CanBeAssigned:       true,
		})
	}

	return availableDrivers, nil
}

// GetDriverSummaryStats gets overall driver statistics
func (s *DriverService) GetDriverSummaryStats() (*models.DriverSummaryStats, error) {
	var stats models.DriverSummaryStats
	var count int64

	// Count total drivers
	s.db.Model(&models.Driver{}).Count(&count)
	stats.TotalDrivers = int(count)

	// Count by status
	s.db.Model(&models.Driver{}).Where("is_active = ?", true).Count(&count)
	stats.ActiveDrivers = int(count)

	s.db.Model(&models.Driver{}).Where("status = ?", "available").Count(&count)
	stats.AvailableDrivers = int(count)

	s.db.Model(&models.Driver{}).Where("status = ?", "on_trip").Count(&count)
	stats.OnTripDrivers = int(count)

	// Mock other stats
	stats.AverageRating = 4.2
	stats.TopPerformerName = "John Doe"
	stats.TopPerformerRating = 4.8

	return &stats, nil
}

// Streaming subscription functions (mocked for now)
func (s *DriverService) SubscribeToStatusUpdates(driverIDs []uint32, statusChan chan *DriverStatusUpdate) func() {
	// Mock implementation
	return func() {} // Unsubscribe function
}

func (s *DriverService) SubscribeToLocationUpdates(driverIDs []uint32, locationChan chan *DriverLocationUpdate) func() {
	// Mock implementation
	return func() {} // Unsubscribe function
}
