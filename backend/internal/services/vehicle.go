package services

import (
	"errors"
	"fmt"

	"github.com/fleetflow/backend/internal/models"
	"gorm.io/gorm"
)

// VehicleService handles vehicle operations
type VehicleService struct {
	db           *gorm.DB
	auditService *AuditService
}

// NewVehicleService creates a new vehicle service
func NewVehicleService(db *gorm.DB, auditService *AuditService) *VehicleService {
	return &VehicleService{
		db:           db,
		auditService: auditService,
	}
}

// CreateVehicle creates a new vehicle
func (s *VehicleService) CreateVehicle(vehicle *models.Vehicle) (*models.Vehicle, error) {
	// Validate required fields
	if vehicle.LicensePlate == "" {
		return nil, errors.New("license plate is required")
	}
	if vehicle.VehicleType == "" {
		return nil, errors.New("vehicle type is required")
	}

	// Check for duplicate license plate
	var existing models.Vehicle
	err := s.db.Where("license_plate = ?", vehicle.LicensePlate).First(&existing).Error
	if err == nil {
		return nil, fmt.Errorf("vehicle with license plate %s already exists", vehicle.LicensePlate)
	}
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("failed to check for duplicate: %w", err)
	}

	// Set default status if not provided
	if vehicle.Status == "" {
		vehicle.Status = models.VehicleStatusActive
	}

	// Create vehicle
	if err := s.db.Create(vehicle).Error; err != nil {
		return nil, fmt.Errorf("failed to create vehicle: %w", err)
	}

	// Log audit event
	s.auditService.LogEntityChange(
		nil, // System created
		"vehicle_created",
		"vehicles",
		vehicle.ID,
		nil,
		vehicle,
		fmt.Sprintf("Vehicle created: %s", vehicle.LicensePlate),
	)

	return vehicle, nil
}

// GetVehicleByID gets vehicle by ID
func (s *VehicleService) GetVehicleByID(id uint) (*models.Vehicle, error) {
	var vehicle models.Vehicle
	if err := s.db.Where("id = ?", id).First(&vehicle).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("vehicle with ID %d not found", id)
		}
		return nil, fmt.Errorf("failed to get vehicle: %w", err)
	}
	return &vehicle, nil
}

// GetVehicles gets paginated list of vehicles
func (s *VehicleService) GetVehicles(page, limit int, filters map[string]interface{}) ([]models.Vehicle, int64, error) {
	var vehicles []models.Vehicle
	var total int64

	query := s.db.Model(&models.Vehicle{})

	// Apply filters
	for key, value := range filters {
		switch key {
		case "status":
			query = query.Where("status = ?", value)
		case "vehicle_type":
			query = query.Where("vehicle_type = ?", value)
		case "is_active":
			query = query.Where("is_active = ?", value)
		case "search":
			searchTerm := fmt.Sprintf("%%%s%%", value)
			query = query.Where("license_plate ILIKE ? OR make ILIKE ? OR model ILIKE ?",
				searchTerm, searchTerm, searchTerm)
		}
	}

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count vehicles: %w", err)
	}

	// Get paginated results
	offset := (page - 1) * limit
	if err := query.Order("id DESC").
		Offset(offset).Limit(limit).
		Find(&vehicles).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get vehicles: %w", err)
	}

	return vehicles, total, nil
}

// UpdateVehicle updates a vehicle
func (s *VehicleService) UpdateVehicle(vehicle *models.Vehicle) (*models.Vehicle, error) {
	// Get existing vehicle for audit trail
	var existing models.Vehicle
	if err := s.db.First(&existing, vehicle.ID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("vehicle with ID %d not found", vehicle.ID)
		}
		return nil, fmt.Errorf("failed to get vehicle: %w", err)
	}

	// Update vehicle
	if err := s.db.Save(vehicle).Error; err != nil {
		return nil, fmt.Errorf("failed to update vehicle: %w", err)
	}

	// Log audit event
	s.auditService.LogEntityChange(
		nil, // System updated
		"vehicle_updated",
		"vehicles",
		vehicle.ID,
		&existing,
		vehicle,
		fmt.Sprintf("Vehicle updated: %s", vehicle.LicensePlate),
	)

	return vehicle, nil
}

// DeleteVehicle deletes a vehicle
func (s *VehicleService) DeleteVehicle(id uint) error {
	// Get existing vehicle for audit trail
	var vehicle models.Vehicle
	if err := s.db.First(&vehicle, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("vehicle with ID %d not found", id)
		}
		return fmt.Errorf("failed to get vehicle: %w", err)
	}

	// Soft delete
	if err := s.db.Delete(&vehicle).Error; err != nil {
		return fmt.Errorf("failed to delete vehicle: %w", err)
	}

	// Log audit event
	s.auditService.LogEntityChange(
		nil,
		"vehicle_deleted",
		"vehicles",
		id,
		&vehicle,
		nil,
		fmt.Sprintf("Vehicle deleted: %s", vehicle.LicensePlate),
	)

	return nil
}
