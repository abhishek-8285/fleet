package repositories

import (
	"fmt"

	"github.com/fleetflow/backend/internal/models"
	"gorm.io/gorm"
)

// PostgresVehicleRepository implements VehicleRepository using GORM
type PostgresVehicleRepository struct {
	db *gorm.DB
}

// NewPostgresVehicleRepository creates a new instance
func NewPostgresVehicleRepository(db *gorm.DB) *PostgresVehicleRepository {
	return &PostgresVehicleRepository{
		db: db,
	}
}

// Ensure PostgresVehicleRepository implements VehicleRepository
var _ VehicleRepository = &PostgresVehicleRepository{}

func (r *PostgresVehicleRepository) CreateVehicle(vehicle *models.Vehicle) error {
	return r.db.Create(vehicle).Error
}

func (r *PostgresVehicleRepository) GetVehicleByLicensePlate(plate string) (*models.Vehicle, error) {
	var vehicle models.Vehicle
	if err := r.db.Where("license_plate = ?", plate).First(&vehicle).Error; err != nil {
		return nil, err
	}
	return &vehicle, nil
}

func (r *PostgresVehicleRepository) GetVehicleByID(id uint) (*models.Vehicle, error) {
	var vehicle models.Vehicle
	if err := r.db.Where("id = ?", id).First(&vehicle).Error; err != nil {
		return nil, err
	}
	return &vehicle, nil
}

func (r *PostgresVehicleRepository) GetVehicles(page, limit int, filters map[string]interface{}) ([]models.Vehicle, int64, error) {
	var vehicles []models.Vehicle
	var total int64
	query := r.db.Model(&models.Vehicle{})

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
			query = query.Where("license_plate ILIKE ? OR make ILIKE ? OR model ILIKE ?", searchTerm, searchTerm, searchTerm)
		}
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	if err := query.Order("id DESC").Offset(offset).Limit(limit).Find(&vehicles).Error; err != nil {
		return nil, 0, err
	}

	return vehicles, total, nil
}

func (r *PostgresVehicleRepository) UpdateVehicle(vehicle *models.Vehicle) error {
	return r.db.Save(vehicle).Error
}

func (r *PostgresVehicleRepository) DeleteVehicle(vehicle *models.Vehicle) error {
	return r.db.Delete(vehicle).Error
}

func (r *PostgresVehicleRepository) UpdateStatus(id uint, status string) error {
	return r.db.Model(&models.Vehicle{}).Where("id = ?", id).Update("status", status).Error
}

func (r *PostgresVehicleRepository) GetLatestLocation(vehicleID uint) (*models.LocationPing, error) {
	var latestPing models.LocationPing
	err := r.db.Where("vehicle_id = ?", vehicleID).
		Order("timestamp DESC").
		First(&latestPing).Error
	if err != nil {
		return nil, err
	}
	return &latestPing, nil
}
