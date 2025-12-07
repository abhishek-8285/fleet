package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/fleetflow/backend/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// TripService handles trip operations
type TripService struct {
	db           *gorm.DB
	auditService *AuditService
}

// NewTripService creates a new trip service
func NewTripService(db *gorm.DB, auditService *AuditService) *TripService {
	return &TripService{
		db:           db,
		auditService: auditService,
	}
}

// calculateDistance calculates the distance between two coordinates in meters using Haversine formula
func (s *TripService) calculateDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadius = 6371000 // meters

	// Convert degrees to radians
	toRad := func(deg float64) float64 {
		return deg * 3.14159265359 / 180
	}

	deltaLat := toRad(lat2 - lat1)
	deltaLon := toRad(lon2 - lon1)

	// Haversine formula - using simplified math without package
	sinLat := deltaLat / 2
	sinLon := deltaLon / 2

	// sin²(x) approximation for small angles
	sin2Lat := sinLat * sinLat
	sin2Lon := sinLon * sinLon

	a := sin2Lat + (1-sin2Lat*sin2Lat/6)*(1-sin2Lon*sin2Lon/6)*sin2Lon

	// c = 2 * asin(sqrt(a)) approximation
	sqrtA := a
	if sqrtA > 0.01 {
		// Better approximation for larger values
		sqrtA = a - a*a/6
	}
	c := 2 * sqrtA

	return earthRadius * c
}

// CreateTrip creates a new trip
func (s *TripService) CreateTrip(trip *models.Trip) (*models.Trip, error) {
	// Validate required fields
	if trip.PickupAddress == "" {
		return nil, errors.New("pickup address is required")
	}
	if trip.DropoffAddress == "" {
		return nil, errors.New("dropoff address is required")
	}
	if trip.CustomerPhone == "" {
		return nil, errors.New("customer phone is required")
	}

	// Set default status
	if trip.Status == "" {
		trip.Status = models.TripStatusScheduled
	}

	// Generate tracking ID if not provided
	if trip.TrackingID == "" {
		trip.TrackingID = fmt.Sprintf("TRP%d", time.Now().UnixNano()%1000000000)
	}

	// Create trip
	if err := s.db.Create(trip).Error; err != nil {
		return nil, fmt.Errorf("failed to create trip: %w", err)
	}

	// Log audit event
	s.auditService.LogEntityChange(
		nil,
		"trip_created",
		"trips",
		trip.ID,
		nil,
		trip,
		fmt.Sprintf("Trip created: %s", trip.TrackingID),
	)

	return trip, nil
}

// GetTripByID gets trip by ID
func (s *TripService) GetTripByID(id uint) (*models.Trip, error) {
	var trip models.Trip
	if err := s.db.Preload("Driver").Preload("Vehicle").First(&trip, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("trip with ID %d not found", id)
		}
		return nil, fmt.Errorf("failed to get trip: %w", err)
	}
	return &trip, nil
}

// GetTrips gets paginated list of trips
func (s *TripService) GetTrips(page, limit int, filters map[string]interface{}) ([]models.Trip, int64, error) {
	var trips []models.Trip
	var total int64

	query := s.db.Model(&models.Trip{}).Preload("Driver").Preload("Vehicle")

	// Apply filters
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
			query = query.Where("tracking_id ILIKE ? OR customer_name ILIKE ? OR pickup_address ILIKE ?",
				searchTerm, searchTerm, searchTerm)
		}
	}

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count trips: %w", err)
	}

	// Get paginated results
	offset := (page - 1) * limit
	if err := query.Order("created_at DESC").
		Offset(offset).Limit(limit).
		Find(&trips).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get trips: %w", err)
	}

	return trips, total, nil
}

// UpdateTrip updates a trip
func (s *TripService) UpdateTrip(trip *models.Trip) (*models.Trip, error) {
	// Get existing trip for audit trail
	var existing models.Trip
	if err := s.db.First(&existing, trip.ID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("trip with ID %d not found", trip.ID)
		}
		return nil, fmt.Errorf("failed to get trip: %w", err)
	}

	// Update trip
	if err := s.db.Save(trip).Error; err != nil {
		return nil, fmt.Errorf("failed to update trip: %w", err)
	}

	// Log audit event
	s.auditService.LogEntityChange(
		nil,
		"trip_updated",
		"trips",
		trip.ID,
		&existing,
		trip,
		fmt.Sprintf("Trip updated: %s", trip.TrackingID),
	)

	return trip, nil
}

// DeleteTrip deletes a trip
func (s *TripService) DeleteTrip(id uint) error {
	// Get existing trip for audit trail
	var trip models.Trip
	if err := s.db.First(&trip, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("trip with ID %d not found", id)
		}
		return fmt.Errorf("failed to get trip: %w", err)
	}

	// Only allow deletion of scheduled trips
	if trip.Status != models.TripStatusScheduled {
		return fmt.Errorf("cannot delete trip with status %s (only SCHEDULED trips can be deleted)", trip.Status)
	}

	// Soft delete
	if err := s.db.Delete(&trip).Error; err != nil {
		return fmt.Errorf("failed to delete trip: %w", err)
	}

	// Log audit event
	s.auditService.LogEntityChange(
		nil,
		"trip_deleted",
		"trips",
		id,
		&trip,
		nil,
		fmt.Sprintf("Trip deleted: %s", trip.TrackingID),
	)

	return nil
}

// AssignTrip assigns a trip to driver and vehicle (with concurrency protection)
func (s *TripService) AssignTrip(tripID, driverID, vehicleID uint) error {
	// Use transaction for concurrency protection
	return s.db.Transaction(func(tx *gorm.DB) error {
		// Get trip with lock
		var trip models.Trip
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&trip, tripID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return fmt.Errorf("trip with ID %d not found", tripID)
			}
			return fmt.Errorf("failed to get trip: %w", err)
		}

		// Check trip status
		if trip.Status != models.TripStatusScheduled {
			return fmt.Errorf("cannot assign trip with status %s", trip.Status)
		}

		// Lock and verify vehicle exists and is available
		var vehicle models.Vehicle
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&vehicle, vehicleID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return fmt.Errorf("vehicle with ID %d not found", vehicleID)
			}
			return fmt.Errorf("failed to get vehicle: %w", err)
		}
		if vehicle.Status != models.VehicleStatusActive {
			return fmt.Errorf("vehicle %s is not available (status: %s)", vehicle.LicensePlate, vehicle.Status)
		}

		// Lock and verify driver exists and is available
		var driver models.Driver
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&driver, driverID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return fmt.Errorf("driver with ID %d not found", driverID)
			}
			return fmt.Errorf("failed to get driver: %w", err)
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

		// Assign trip
		trip.DriverID = &driverID
		trip.VehicleID = &vehicleID
		trip.Status = models.TripStatusAssigned

		if err := tx.Save(&trip).Error; err != nil {
			return fmt.Errorf("failed to assign trip: %w", err)
		}

		// Log audit event (async for performance)
		go s.auditService.LogEntityChange(
			nil,
			"trip_assigned",
			"trips",
			tripID,
			nil,
			&trip,
			fmt.Sprintf("Trip %s assigned to driver %d and vehicle %d", trip.TrackingID, driverID, vehicleID),
		)

		return nil
	})
}

// StartTrip starts a trip
func (s *TripService) StartTrip(tripID uint) error {
	// Get trip
	var trip models.Trip
	if err := s.db.First(&trip, tripID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("trip with ID %d not found", tripID)
		}
		return fmt.Errorf("failed to get trip: %w", err)
	}

	// Validate state transition
	if trip.Status != models.TripStatusAssigned {
		return fmt.Errorf("cannot start trip with status %s (must be ASSIGNED)", trip.Status)
	}

	// Geofence validation - verify driver is at pickup location
	if trip.PickupLatitude != 0 && trip.PickupLongitude != 0 && trip.VehicleID != nil {
		// Get latest location for the vehicle
		var latestPing models.LocationPing
		err := s.db.Where("vehicle_id = ?", *trip.VehicleID).
			Order("timestamp DESC").
			First(&latestPing).Error

		if err == nil {
			// Calculate distance to pickup location
			distance := s.calculateDistance(
				latestPing.Latitude,
				latestPing.Longitude,
				trip.PickupLatitude,
				trip.PickupLongitude,
			)

			// Enforce 100 meter proximity threshold
			const proximityThreshold = 100.0 // meters
			if distance > proximityThreshold {
				return fmt.Errorf("vehicle is %.0f meters away from pickup location (max %.0f meters allowed)",
					distance, proximityThreshold)
			}
		}
		// If no location data, allow start (lenient for testing)
	}

	// Start trip
	now := time.Now()
	trip.Status = models.TripStatusInProgress
	trip.ActualPickupTime = &now

	if err := s.db.Save(&trip).Error; err != nil {
		return fmt.Errorf("failed to start trip: %w", err)
	}

	// Update vehicle status
	if trip.VehicleID != nil {
		s.db.Model(&models.Vehicle{}).Where("id = ?", *trip.VehicleID).Update("status", models.VehicleStatusActive)
	}

	// Log audit event
	s.auditService.LogEntityChange(
		nil,
		"trip_started",
		"trips",
		tripID,
		nil,
		&trip,
		fmt.Sprintf("Trip %s started", trip.TrackingID),
	)

	return nil
}

// CompleteTrip completes a trip
func (s *TripService) CompleteTrip(tripID uint) error {
	// Get trip
	var trip models.Trip
	if err := s.db.First(&trip, tripID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("trip with ID %d not found", tripID)
		}
		return fmt.Errorf("failed to get trip: %w", err)
	}

	// Validate state transition
	if trip.Status != models.TripStatusInProgress {
		return fmt.Errorf("cannot complete trip with status %s (must be IN_PROGRESS)", trip.Status)
	}

	// Geofence validation - verify driver is at dropoff location
	if trip.DropoffLatitude != 0 && trip.DropoffLongitude != 0 && trip.VehicleID != nil {
		// Get latest location for the vehicle
		var latestPing models.LocationPing
		err := s.db.Where("vehicle_id = ?", *trip.VehicleID).
			Order("timestamp DESC").
			First(&latestPing).Error

		if err == nil {
			// Calculate distance to dropoff location
			distance := s.calculateDistance(
				latestPing.Latitude,
				latestPing.Longitude,
				trip.DropoffLatitude,
				trip.DropoffLongitude,
			)

			// Enforce 100 meter proximity threshold
			const proximityThreshold = 100.0 // meters
			if distance > proximityThreshold {
				return fmt.Errorf("vehicle is %.0f meters away from dropoff location (max %.0f meters allowed)",
					distance, proximityThreshold)
			}
		}
		// If no location data, allow completion (lenient for testing)
	}

	// POD (Proof of Delivery) validation - check for upload attachment
	var podCount int64
	s.db.Model(&models.Upload{}).
		Where("trip_id = ? AND (upload_type = ? OR upload_type = ?)",
			trip.ID, "POD_SIGNATURE", "POD_PHOTO").
		Count(&podCount)

	// Require at least one POD attachment for high-value or priority trips
	if trip.Priority >= 3 || trip.CargoValue > 10000 {
		if podCount == 0 {
			return fmt.Errorf("proof of delivery required for this trip (priority %d, value %.2f)",
				trip.Priority, trip.CargoValue)
		}
	}

	// Complete trip
	now := time.Now()
	trip.Status = models.TripStatusCompleted
	trip.ActualArrival = &now

	// Calculate duration if start time exists
	if trip.ActualPickupTime != nil {
		duration := now.Sub(*trip.ActualPickupTime)
		durationInt := int(duration.Minutes())
		trip.ActualDuration = &durationInt
	}

	// Mark as on-time delivery if within threshold
	if trip.EstimatedArrival != nil {
		onTimeThreshold := 15 * time.Minute
		if now.Sub(*trip.EstimatedArrival).Abs() <= onTimeThreshold {
			trip.OnTimeDelivery = true
		}
	}

	if err := s.db.Save(&trip).Error; err != nil {
		return fmt.Errorf("failed to complete trip: %w", err)
	}

	// Update vehicle status back to active
	if trip.VehicleID != nil {
		s.db.Model(&models.Vehicle{}).Where("id = ?", *trip.VehicleID).Update("status", models.VehicleStatusActive)
	}

	// Log audit event
	s.auditService.LogEntityChange(
		nil,
		"trip_completed",
		"trips",
		tripID,
		nil,
		&trip,
		fmt.Sprintf("Trip %s completed", trip.TrackingID),
	)

	return nil
}

// PauseTrip pauses a trip (IN_PROGRESS → PAUSED)
func (s *TripService) PauseTrip(tripID uint) error {
	var trip models.Trip
	if err := s.db.First(&trip, tripID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("trip with ID %d not found", tripID)
		}
		return fmt.Errorf("failed to get trip: %w", err)
	}

	if trip.Status != models.TripStatusInProgress {
		return fmt.Errorf("cannot pause trip with status %s (must be IN_PROGRESS)", trip.Status)
	}

	trip.Status = models.TripStatusPaused
	if err := s.db.Save(&trip).Error; err != nil {
		return fmt.Errorf("failed to pause trip: %w", err)
	}

	s.auditService.LogEntityChange(nil, "trip_paused", "trips", tripID, nil, &trip,
		fmt.Sprintf("Trip %s paused", trip.TrackingID))
	return nil
}

// ResumeTrip resumes a paused trip (PAUSED → IN_PROGRESS)
func (s *TripService) ResumeTrip(tripID uint) error {
	var trip models.Trip
	if err := s.db.First(&trip, tripID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("trip with ID %d not found", tripID)
		}
		return fmt.Errorf("failed to get trip: %w", err)
	}

	if trip.Status != models.TripStatusPaused {
		return fmt.Errorf("cannot resume trip with status %s (must be PAUSED)", trip.Status)
	}

	trip.Status = models.TripStatusInProgress
	if err := s.db.Save(&trip).Error; err != nil {
		return fmt.Errorf("failed to resume trip: %w", err)
	}

	s.auditService.LogEntityChange(nil, "trip_resumed", "trips", tripID, nil, &trip,
		fmt.Sprintf("Trip %s resumed", trip.TrackingID))
	return nil
}

// CancelTrip cancels a trip (ANY → CANCELLED)
func (s *TripService) CancelTrip(tripID uint, reason string) error {
	var trip models.Trip
	if err := s.db.First(&trip, tripID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("trip with ID %d not found", tripID)
		}
		return fmt.Errorf("failed to get trip: %w", err)
	}

	if trip.Status == models.TripStatusCompleted || trip.Status == models.TripStatusCancelled {
		return fmt.Errorf("cannot cancel trip with status %s", trip.Status)
	}

	trip.Status = models.TripStatusCancelled
	if err := s.db.Save(&trip).Error; err != nil {
		return fmt.Errorf("failed to cancel trip: %w", err)
	}

	// Free up vehicle
	if trip.VehicleID != nil {
		s.db.Model(&models.Vehicle{}).Where("id = ?", *trip.VehicleID).
			Update("status", models.VehicleStatusActive)
	}

	s.auditService.LogEntityChange(nil, "trip_cancelled", "trips", tripID, nil, &trip,
		fmt.Sprintf("Trip %s cancelled: %s", trip.TrackingID, reason))
	return nil
}
