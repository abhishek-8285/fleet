package repositories

import (
	"fmt"

	"github.com/fleetflow/backend/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// PostgresTripRepository implements TripRepository using GORM
type PostgresTripRepository struct {
	db *gorm.DB
}

// NewPostgresTripRepository creates a new instance
func NewPostgresTripRepository(db *gorm.DB) *PostgresTripRepository {
	return &PostgresTripRepository{
		db: db,
	}
}

// Ensure PostgresTripRepository implements TripRepository
var _ TripRepository = &PostgresTripRepository{}

func (r *PostgresTripRepository) CreateTrip(trip *models.Trip) error {
	return r.db.Create(trip).Error
}

func (r *PostgresTripRepository) GetTripByID(id uint) (*models.Trip, error) {
	var trip models.Trip
	if err := r.db.Preload("Driver").Preload("Vehicle").First(&trip, id).Error; err != nil {
		return nil, err
	}
	return &trip, nil
}

func (r *PostgresTripRepository) GetTrips(page, limit int, filters map[string]interface{}) ([]models.Trip, int64, error) {
	var trips []models.Trip
	var total int64
	query := r.db.Model(&models.Trip{}).Preload("Driver").Preload("Vehicle")

	for key, value := range filters {
		switch key {
		case "status":
			query = query.Where("status = ?", value)
		case "driver_id":
			query = query.Where("driver_id = ?", value)
		case "vehicle_id":
			query = query.Where("vehicle_id = ?", value)
		case "customer_phone":
			query = query.Where("customer_phone = ?", value)
		case "search":
			searchTerm := fmt.Sprintf("%%%s%%", value)
			query = query.Where("tracking_id ILIKE ? OR customer_name ILIKE ? OR pickup_address ILIKE ?", searchTerm, searchTerm, searchTerm)
		}
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&trips).Error; err != nil {
		return nil, 0, err
	}

	return trips, total, nil
}

func (r *PostgresTripRepository) UpdateTrip(trip *models.Trip) error {
	return r.db.Save(trip).Error
}

func (r *PostgresTripRepository) DeleteTrip(trip *models.Trip) error {
	return r.db.Delete(trip).Error
}

func (r *PostgresTripRepository) AssignTrip(tripID, driverID, vehicleID uint) (*models.Trip, error) {
	var trip models.Trip

	err := r.db.Transaction(func(tx *gorm.DB) error {
		// Get trip with lock
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&trip, tripID).Error; err != nil {
			return err
		}

		if trip.Status != models.TripStatusScheduled {
			return fmt.Errorf("cannot assign trip with status %s", trip.Status)
		}

		// Lock and verify vehicle exists and is available
		var vehicle models.Vehicle
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&vehicle, vehicleID).Error; err != nil {
			return err
		}
		if vehicle.Status != models.VehicleStatusActive {
			return fmt.Errorf("vehicle %s is not available (status: %s)", vehicle.LicensePlate, vehicle.Status)
		}

		// Lock and verify driver exists and is available
		var driver models.Driver
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&driver, driverID).Error; err != nil {
			return err
		}

		// Check if driver is already assigned to another active trip
		var activeTrips int64
		tx.Model(&models.Trip{}).
			Where("driver_id = ? AND status IN ?", driverID, []string{
				string(models.TripStatusAssigned),
				string(models.TripStatusInProgress),
			}).
			Count(&activeTrips)
		if activeTrips > 0 {
			return fmt.Errorf("driver %s is already assigned to an active trip", driver.Name)
		}

		// Assign trip: update fields
		trip.DriverID = &driverID
		trip.VehicleID = &vehicleID
		trip.Status = models.TripStatusAssigned

		if err := tx.Save(&trip).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &trip, nil
}
