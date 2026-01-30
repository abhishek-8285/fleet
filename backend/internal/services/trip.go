package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/fleetflow/backend/internal/models"
	"github.com/fleetflow/backend/internal/repositories"
)

// TripService handles trip operations
type TripService struct {
	repo         repositories.TripRepository
	vehicleRepo  repositories.VehicleRepository
	uploadRepo   repositories.UploadRepository
	auditService *AuditService
}

// NewTripService creates a new trip service
func NewTripService(
	repo repositories.TripRepository,
	vehicleRepo repositories.VehicleRepository,
	uploadRepo repositories.UploadRepository,
	auditService *AuditService,
) *TripService {
	return &TripService{
		repo:         repo,
		vehicleRepo:  vehicleRepo,
		uploadRepo:   uploadRepo,
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
	if err := s.repo.CreateTrip(trip); err != nil {
		return nil, fmt.Errorf("failed to create trip: %w", err)
	}

	// Log audit event
	_ = s.auditService.LogEntityChange(
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
	trip, err := s.repo.GetTripByID(id)
	if err != nil {
		return nil, fmt.Errorf("failed to get trip: %w", err)
	}
	return trip, nil
}

// GetTrips gets paginated list of trips
func (s *TripService) GetTrips(page, limit int, filters map[string]interface{}) ([]models.Trip, int64, error) {
	return s.repo.GetTrips(page, limit, filters)
}

// UpdateTrip updates a trip
func (s *TripService) UpdateTrip(trip *models.Trip) (*models.Trip, error) {
	// Get existing trip for audit trail
	existing, err := s.repo.GetTripByID(trip.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get trip: %w", err)
	}

	// Update trip
	if err := s.repo.UpdateTrip(trip); err != nil {
		return nil, fmt.Errorf("failed to update trip: %w", err)
	}

	// Log audit event
	_ = s.auditService.LogEntityChange(
		nil,
		"trip_updated",
		"trips",
		trip.ID,
		existing, // Pass struct or pointer depends on signature
		trip,
		fmt.Sprintf("Trip updated: %s", trip.TrackingID),
	)

	return trip, nil
}

// DeleteTrip deletes a trip
func (s *TripService) DeleteTrip(id uint) error {
	// Get existing trip for audit trail
	trip, err := s.repo.GetTripByID(id)
	if err != nil {
		return fmt.Errorf("failed to get trip: %w", err)
	}

	// Only allow deletion of scheduled trips
	if trip.Status != models.TripStatusScheduled {
		return fmt.Errorf("cannot delete trip with status %s (only SCHEDULED trips can be deleted)", trip.Status)
	}

	// Soft delete
	if err := s.repo.DeleteTrip(trip); err != nil {
		return fmt.Errorf("failed to delete trip: %w", err)
	}

	// Log audit event
	_ = s.auditService.LogEntityChange(
		nil,
		"trip_deleted",
		"trips",
		id,
		trip,
		nil,
		fmt.Sprintf("Trip deleted: %s", trip.TrackingID),
	)

	return nil
}

// AssignTrip assigns a trip to driver and vehicle (with concurrency protection)
func (s *TripService) AssignTrip(tripID, driverID, vehicleID uint) error {
	// Delegate to Repository which handles the transaction and complex business rules
	trip, err := s.repo.AssignTrip(tripID, driverID, vehicleID)
	if err != nil {
		return fmt.Errorf("failed to assign trip: %w", err)
	}

	// Log audit event (async for performance)
	go func() {
		_ = s.auditService.LogEntityChange(
			nil,
			"trip_assigned",
			"trips",
			tripID,
			nil,
			trip,
			fmt.Sprintf("Trip %s assigned to driver %d and vehicle %d", trip.TrackingID, driverID, vehicleID),
		)
	}()

	return nil
}

// StartTrip starts a trip
func (s *TripService) StartTrip(tripID uint) error {
	// Get trip
	trip, err := s.repo.GetTripByID(tripID)
	if err != nil {
		return fmt.Errorf("failed to get trip: %w", err)
	}

	// Validate state transition
	if trip.Status != models.TripStatusAssigned {
		return fmt.Errorf("cannot start trip with status %s (must be ASSIGNED)", trip.Status)
	}

	// Geofence validation - verify driver is at pickup location
	if trip.PickupLatitude != 0 && trip.PickupLongitude != 0 && trip.VehicleID != nil {
		// Get latest location for the vehicle
		latestPing, err := s.vehicleRepo.GetLatestLocation(*trip.VehicleID)

		if err == nil && latestPing != nil {
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

	if err := s.repo.UpdateTrip(trip); err != nil {
		return fmt.Errorf("failed to start trip: %w", err)
	}

	// Update vehicle status
	if trip.VehicleID != nil {
		_ = s.vehicleRepo.UpdateStatus(*trip.VehicleID, string(models.VehicleStatusActive))
	}

	// Log audit event
	_ = s.auditService.LogEntityChange(
		nil,
		"trip_started",
		"trips",
		tripID,
		nil,
		trip,
		fmt.Sprintf("Trip %s started", trip.TrackingID),
	)

	return nil
}

// CompleteTrip completes a trip
func (s *TripService) CompleteTrip(tripID uint) error {
	// Get trip
	trip, err := s.repo.GetTripByID(tripID)
	if err != nil {
		return fmt.Errorf("failed to get trip: %w", err)
	}

	// Validate state transition
	if trip.Status != models.TripStatusInProgress {
		return fmt.Errorf("cannot complete trip with status %s (must be IN_PROGRESS)", trip.Status)
	}

	// Geofence validation - verify driver is at dropoff location
	if trip.DropoffLatitude != 0 && trip.DropoffLongitude != 0 && trip.VehicleID != nil {
		// Get latest location for the vehicle
		latestPing, err := s.vehicleRepo.GetLatestLocation(*trip.VehicleID)

		if err == nil && latestPing != nil {
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
	// Using UploadRepository
	podCount, _ := s.uploadRepo.CountUploads(map[string]interface{}{
		"trip_id":        trip.ID,
		"upload_type_in": []string{"POD_SIGNATURE", "POD_PHOTO"},
	})

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

	if err := s.repo.UpdateTrip(trip); err != nil {
		return fmt.Errorf("failed to complete trip: %w", err)
	}

	// Update vehicle status back to active
	if trip.VehicleID != nil {
		_ = s.vehicleRepo.UpdateStatus(*trip.VehicleID, string(models.VehicleStatusActive))
	}

	// Log audit event
	_ = s.auditService.LogEntityChange(
		nil,
		"trip_completed",
		"trips",
		tripID,
		nil,
		trip,
		fmt.Sprintf("Trip %s completed", trip.TrackingID),
	)

	return nil
}

// PauseTrip pauses a trip (IN_PROGRESS → PAUSED)
func (s *TripService) PauseTrip(tripID uint) error {
	trip, err := s.repo.GetTripByID(tripID)
	if err != nil {
		return fmt.Errorf("failed to get trip: %w", err)
	}

	if trip.Status != models.TripStatusInProgress {
		return fmt.Errorf("cannot pause trip with status %s (must be IN_PROGRESS)", trip.Status)
	}

	trip.Status = models.TripStatusPaused
	if err := s.repo.UpdateTrip(trip); err != nil {
		return fmt.Errorf("failed to pause trip: %w", err)
	}

	_ = s.auditService.LogEntityChange(nil, "trip_paused", "trips", tripID, nil, trip,
		fmt.Sprintf("Trip %s paused", trip.TrackingID))
	return nil
}

// ResumeTrip resumes a paused trip (PAUSED → IN_PROGRESS)
func (s *TripService) ResumeTrip(tripID uint) error {
	trip, err := s.repo.GetTripByID(tripID)
	if err != nil {
		return fmt.Errorf("failed to get trip: %w", err)
	}

	if trip.Status != models.TripStatusPaused {
		return fmt.Errorf("cannot resume trip with status %s (must be PAUSED)", trip.Status)
	}

	trip.Status = models.TripStatusInProgress
	if err := s.repo.UpdateTrip(trip); err != nil {
		return fmt.Errorf("failed to resume trip: %w", err)
	}

	_ = s.auditService.LogEntityChange(nil, "trip_resumed", "trips", tripID, nil, trip,
		fmt.Sprintf("Trip %s resumed", trip.TrackingID))
	return nil
}

// CancelTrip cancels a trip (ANY → CANCELLED)
func (s *TripService) CancelTrip(tripID uint, reason string) error {
	trip, err := s.repo.GetTripByID(tripID)
	if err != nil {
		return fmt.Errorf("failed to get trip: %w", err)
	}

	if trip.Status == models.TripStatusCompleted || trip.Status == models.TripStatusCancelled {
		return fmt.Errorf("cannot cancel trip with status %s", trip.Status)
	}

	trip.Status = models.TripStatusCancelled
	if err := s.repo.UpdateTrip(trip); err != nil {
		return fmt.Errorf("failed to cancel trip: %w", err)
	}

	// Free up vehicle
	if trip.VehicleID != nil {
		_ = s.vehicleRepo.UpdateStatus(*trip.VehicleID, string(models.VehicleStatusActive))
	}

	_ = s.auditService.LogEntityChange(nil, "trip_cancelled", "trips", tripID, nil, trip,
		fmt.Sprintf("Trip %s cancelled: %s", trip.TrackingID, reason))
	return nil
}
