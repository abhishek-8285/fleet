package services

import (
	"errors"
	"fmt"

	"github.com/fleetflow/backend/internal/models"
	"github.com/fleetflow/backend/internal/repositories"
)

// VehicleService handles vehicle operations
type VehicleService struct {
	repo         repositories.VehicleRepository
	auditService *AuditService
}

// NewVehicleService creates a new vehicle service
func NewVehicleService(repo repositories.VehicleRepository, auditService *AuditService) *VehicleService {
	return &VehicleService{
		repo:         repo,
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
	if _, err := s.repo.GetVehicleByLicensePlate(vehicle.LicensePlate); err == nil {
		return nil, fmt.Errorf("vehicle with license plate %s already exists", vehicle.LicensePlate)
	}

	// Set default status if not provided
	if vehicle.Status == "" {
		vehicle.Status = models.VehicleStatusActive
	}

	// Create vehicle
	if err := s.repo.CreateVehicle(vehicle); err != nil {
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
	vehicle, err := s.repo.GetVehicleByID(id)
	if err != nil {
		return nil, fmt.Errorf("failed to get vehicle: %w", err)
	}
	return vehicle, nil
}

// GetVehicles gets paginated list of vehicles
func (s *VehicleService) GetVehicles(page, limit int, filters map[string]interface{}) ([]models.Vehicle, int64, error) {
	return s.repo.GetVehicles(page, limit, filters)
}

// UpdateVehicle updates a vehicle
func (s *VehicleService) UpdateVehicle(vehicle *models.Vehicle) (*models.Vehicle, error) {
	// Get existing vehicle for audit trail
	existing, err := s.repo.GetVehicleByID(vehicle.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get vehicle for update: %w", err)
	}

	// Update vehicle
	if err := s.repo.UpdateVehicle(vehicle); err != nil {
		return nil, fmt.Errorf("failed to update vehicle: %w", err)
	}

	// Log audit event
	s.auditService.LogEntityChange(
		nil, // System updated
		"vehicle_updated",
		"vehicles",
		vehicle.ID,
		existing, // Pass struct directly if interface method changed, but typically pointer
		vehicle,
		fmt.Sprintf("Vehicle updated: %s", vehicle.LicensePlate),
	)

	return vehicle, nil
}

// DeleteVehicle deletes a vehicle
func (s *VehicleService) DeleteVehicle(id uint) error {
	// Get existing vehicle for audit trail
	vehicle, err := s.repo.GetVehicleByID(id)
	if err != nil {
		return fmt.Errorf("failed to get vehicle for deletion: %w", err)
	}

	// Soft delete
	if err := s.repo.DeleteVehicle(vehicle); err != nil {
		return fmt.Errorf("failed to delete vehicle: %w", err)
	}

	// Log audit event
	s.auditService.LogEntityChange(
		nil,
		"vehicle_deleted",
		"vehicles",
		id,
		vehicle,
		nil,
		fmt.Sprintf("Vehicle deleted: %s", vehicle.LicensePlate),
	)

	return nil
}
