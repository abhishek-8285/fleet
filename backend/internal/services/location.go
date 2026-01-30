package services

import (
	"fmt"
	"log"
	"math"
	"time"

	"github.com/fleetflow/backend/internal/models"
	"gorm.io/gorm"
)

// LocationService handles location tracking and real-time updates
type LocationService struct {
	db           *gorm.DB
	auditService *AuditService
}

// NewLocationService creates a new location service
func NewLocationService(db *gorm.DB, auditService *AuditService) *LocationService {
	return &LocationService{
		db:           db,
		auditService: auditService,
	}
}

// SaveLocationPing saves a location ping with validation and processing
func (s *LocationService) SaveLocationPing(ping *models.LocationPing) error {
	// Validate coordinates
	if ping.Latitude < -90 || ping.Latitude > 90 || ping.Longitude < -180 || ping.Longitude > 180 {
		return fmt.Errorf("invalid coordinates: lat=%.6f, lon=%.6f", ping.Latitude, ping.Longitude)
	}

	// Set timestamp if not provided
	if ping.CreatedAt.IsZero() {
		ping.CreatedAt = time.Now()
	}

	// Save to database
	if err := s.db.Create(ping).Error; err != nil {
		return fmt.Errorf("failed to save location ping: %w", err)
	}

	log.Printf("📍 Location ping saved: Vehicle %d at (%.6f, %.6f)",
		ping.VehicleID, ping.Latitude, ping.Longitude)

	return nil
}

// GetVehicleLocation gets current vehicle location with enriched data
func (s *LocationService) GetVehicleLocation(vehicleID uint) (*models.VehicleLocationResponse, error) {
	// Get latest location ping
	var ping models.LocationPing
	err := s.db.Where("vehicle_id = ?", vehicleID).
		Order("created_at DESC").
		First(&ping).Error

	if err != nil {
		return nil, fmt.Errorf("no location found for vehicle %d: %w", vehicleID, err)
	}

	// Get vehicle details
	var vehicle models.Vehicle
	_ = s.db.First(&vehicle, vehicleID)

	// Calculate additional metrics
	isMoving := false
	if ping.Speed != nil && *ping.Speed > 5.0 {
		isMoving = true
	}

	// Get driver info if available
	var driverName string
	if ping.DriverID != nil {
		var driver models.Driver
		if s.db.First(&driver, *ping.DriverID).Error == nil {
			driverName = driver.Name
		}
	}

	// Calculate time since last update
	lastSeen := time.Since(ping.CreatedAt)
	isOnline := lastSeen < 5*time.Minute

	return &models.VehicleLocationResponse{
		VehicleID:      vehicleID,
		LicensePlate:   vehicle.LicensePlate,
		LatestPing:     &ping,
		IsOnline:       isOnline,
		IsMoving:       isMoving,
		LastSeen:       lastSeen,
		DriverName:     driverName,
		SignalStrength: "GOOD", // Mock - would be calculated from ping data
	}, nil
}

// GetDriverLocation gets current driver location
func (s *LocationService) GetDriverLocation(driverID uint) (*models.DriverLocation, error) {
	// Get latest location ping for this driver
	var ping models.LocationPing
	err := s.db.Where("driver_id = ?", driverID).
		Order("created_at DESC").
		First(&ping).Error

	if err != nil {
		return nil, fmt.Errorf("no location found for driver %d: %w", driverID, err)
	}

	// Get driver details
	var driver models.Driver
	_ = s.db.First(&driver, driverID)

	// Get current vehicle info if available
	var vehiclePlate string
	if ping.VehicleID != nil {
		var vehicle models.Vehicle
		if s.db.First(&vehicle, *ping.VehicleID).Error == nil {
			vehiclePlate = vehicle.LicensePlate
		}
	}

	return &models.DriverLocation{
		DriverID:     driverID,
		DriverName:   driver.Name,
		Latitude:     ping.Latitude,
		Longitude:    ping.Longitude,
		LastUpdated:  ping.CreatedAt,
		Status:       string(driver.Status),
		VehicleID:    ping.VehicleID,
		VehiclePlate: vehiclePlate,
		// TripID: // Not in LocationEvent struct        ping.TripID,
		// Speed: // Not in LocationEvent struct         ping.Speed,
		// Heading: // Not in LocationEvent struct       ping.Heading,
		Accuracy: &ping.Accuracy,
	}, nil
}

// GetLocationHistory gets location history for a vehicle with analytics
func (s *LocationService) GetLocationHistory(vehicleID uint, startTime, endTime time.Time, limit int) (*models.LocationHistory, error) {
	var pings []models.LocationPing

	query := s.db.Where("vehicle_id = ? AND created_at BETWEEN ? AND ?", vehicleID, startTime, endTime).
		Order("created_at ASC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	if err := query.Find(&pings).Error; err != nil {
		return nil, fmt.Errorf("failed to get location history: %w", err)
	}

	// Calculate analytics
	totalDistance := 0.0
	maxSpeed := 0.0
	avgSpeed := 0.0
	speedSum := 0.0
	speedCount := 0

	for i := 1; i < len(pings); i++ {
		// Calculate distance between consecutive points
		distance := s.calculateDistance(
			pings[i-1].Latitude, pings[i-1].Longitude,
			pings[i].Latitude, pings[i].Longitude,
		)
		totalDistance += distance

		// Track speed metrics
		if pings[i].Speed != nil {
			speed := *pings[i].Speed
			speedSum += speed
			speedCount++
			if speed > maxSpeed {
				maxSpeed = speed
			}
		}
	}

	if speedCount > 0 {
		avgSpeed = speedSum / float64(speedCount)
	}

	// Calculate driving time (when vehicle was moving)
	var drivingTime time.Duration
	for _, ping := range pings {
		if ping.Speed != nil && *ping.Speed > 5.0 { // Consider >5 km/h as moving
			drivingTime += time.Minute // Rough approximation
		}
	}

	return &models.LocationHistory{
		VehicleID:     vehicleID,
		StartTime:     startTime,
		EndTime:       endTime,
		Pings:         pings,
		TotalDistance: totalDistance,
		MaxSpeed:      maxSpeed,
		AverageSpeed:  avgSpeed,
		DrivingTime:   drivingTime,
		TotalPings:    len(pings),
	}, nil
}

// GetFleetLocations gets current fleet locations with status
func (s *LocationService) GetFleetLocations(vehicleIDs []uint32, includeOffline bool) ([]*models.FleetLocation, error) {
	var locations []*models.FleetLocation

	for _, vehicleID := range vehicleIDs {
		// Get latest ping for each vehicle
		var ping models.LocationPing
		err := s.db.Where("vehicle_id = ?", vehicleID).
			Order("created_at DESC").
			First(&ping).Error

		if err != nil && !includeOffline {
			continue // Skip vehicles with no recent pings
		}

		// Get vehicle details
		var vehicle models.Vehicle
		_ = s.db.First(&vehicle, vehicleID)

		// Determine online status
		lastSeen := time.Since(ping.CreatedAt)
		isOnline := lastSeen < 5*time.Minute

		if !isOnline && !includeOffline {
			continue
		}

		// Get driver info if available
		var driverName string
		if ping.DriverID != nil {
			var driver models.Driver
			if s.db.First(&driver, *ping.DriverID).Error == nil {
				driverName = driver.Name
			}
		}

		location := &models.FleetLocation{
			VehicleID:    uint(vehicleID),
			LicensePlate: vehicle.LicensePlate,
			Location: models.Location{
				Latitude:  ping.Latitude,
				Longitude: ping.Longitude,
				Accuracy:  ping.Accuracy,
				Timestamp: ping.CreatedAt,
			},
			Status: string(vehicle.Status),
			Speed: func() float64 {
				if ping.Speed != nil {
					return *ping.Speed
				} else {
					return 0
				}
			}(),
			Heading: func() float64 {
				if ping.Heading != nil {
					return *ping.Heading
				} else {
					return 0
				}
			}(),
			CurrentDriverID: func() uint {
				if ping.DriverID != nil {
					return *ping.DriverID
				} else {
					return 0
				}
			}(),
			DriverName: driverName,
			CurrentTripID: func() uint {
				if ping.TripID != nil {
					return *ping.TripID
				} else {
					return 0
				}
			}(),
			LastUpdate: ping.CreatedAt,
		}

		locations = append(locations, location)
	}

	return locations, nil
}

// GetRecentFleetUpdates gets recent fleet location updates since a timestamp
func (s *LocationService) GetRecentFleetUpdates(vehicleIDs []uint32, since time.Time) ([]*models.FleetLocationUpdate, error) {
	var updates []*models.FleetLocationUpdate

	// Convert to []interface{} for GORM IN clause
	vehicleIDsInterface := make([]interface{}, len(vehicleIDs))
	for i, v := range vehicleIDs {
		vehicleIDsInterface[i] = v
	}

	// Get recent pings for all vehicles
	var pings []models.LocationPing
	err := s.db.Where("vehicle_id IN ? AND created_at > ?", vehicleIDsInterface, since).
		Order("created_at DESC").
		Find(&pings).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get recent fleet updates: %w", err)
	}

	// Group pings by vehicle and get the latest for each
	vehiclePings := make(map[uint]models.LocationPing)
	for _, ping := range pings {
		if existing, exists := vehiclePings[*ping.VehicleID]; !exists || ping.CreatedAt.After(existing.CreatedAt) {
			vehiclePings[*ping.VehicleID] = ping
		}
	}

	// Convert to FleetLocationUpdate format
	for vehicleID, ping := range vehiclePings {
		var vehicle models.Vehicle
		_ = s.db.First(&vehicle, vehicleID)

		update := &models.FleetLocationUpdate{
			VehicleID:    vehicleID,
			LicensePlate: vehicle.LicensePlate,
			Location: models.Location{
				Latitude:  ping.Latitude,
				Longitude: ping.Longitude,
				Accuracy:  ping.Accuracy,
				Timestamp: ping.CreatedAt,
			},
			// Speed: // Not in LocationEvent struct       ping.Speed,
			// Heading: // Not in LocationEvent struct     ping.Heading,
			LastUpdated: ping.CreatedAt,
			UpdateType:  "LOCATION_UPDATE",
		}

		updates = append(updates, update)
	}

	return updates, nil
}

// ProcessLocationUpdate processes a location update for real-time analysis
func (s *LocationService) ProcessLocationUpdate(ping *models.LocationPing) {
	log.Printf("📍 Processing location update for vehicle %d at (%.6f, %.6f)",
		ping.VehicleID, ping.Latitude, ping.Longitude)

	// Save the location ping to database
	if err := s.SaveLocationPing(ping); err != nil {
		log.Printf("❌ Failed to save location ping: %v", err)
		return
	}

	// Run geofence analysis
	s.checkGeofenceViolations(ping)

	// Run route deviation analysis
	s.checkRouteDeviations(ping)

	// Run speed analysis
	s.checkSpeedViolations(ping)

	// Run idle time analysis
	s.checkIdleTimeViolations(ping)

	// Update fleet location cache
	s.updateFleetLocationCache(ping)
}

// checkGeofenceViolations checks if location violates any geofences
func (s *LocationService) checkGeofenceViolations(ping *models.LocationPing) {
	// Get all geofences for this vehicle
	var geofences []models.Geofence
	s.db.Where("vehicle_id = ? OR vehicle_id IS NULL", ping.VehicleID).Find(&geofences)

	for _, geofence := range geofences {
		isInside := s.isPointInGeofence(ping.Latitude, ping.Longitude, &geofence)

		// Check for violations based on geofence type
		violation := false
		alertType := ""

		switch geofence.Type {
		case models.GeofenceType("INCLUSION"):
			// Vehicle should be inside this zone
			if !isInside {
				violation = true
				alertType = "EXIT_VIOLATION"
			}
		case models.GeofenceType("EXCLUSION"):
			// Vehicle should NOT be inside this zone
			if isInside {
				violation = true
				alertType = "ENTRY_VIOLATION"
			}
		case models.GeofenceType("TIME_RESTRICTED"):
			// Check time restrictions
			if isInside && !s.isAllowedTime(&geofence) {
				violation = true
				alertType = "TIME_VIOLATION"
			}
		}

		if violation {
			s.createGeofenceAlert(ping, &geofence, alertType)
		}
	}
}

// checkRouteDeviations checks if vehicle has deviated from planned route
func (s *LocationService) checkRouteDeviations(ping *models.LocationPing) {
	if ping.TripID == nil {
		return // No active trip
	}

	// Get current trip information
	var trip models.Trip
	if err := s.db.First(&trip, *ping.TripID).Error; err != nil {
		return
	}

	// Calculate deviation from planned route
	deviation := s.calculateRouteDeviation(ping, &trip)

	// Check if deviation exceeds threshold
	maxAllowedDeviation := 1000.0 // 1km threshold
	if deviation > maxAllowedDeviation {
		s.createRouteDeviationAlert(ping, &trip, deviation)
	}
}

// checkSpeedViolations checks for speed violations
func (s *LocationService) checkSpeedViolations(ping *models.LocationPing) {
	if ping.Speed == nil {
		return
	}

	speed := *ping.Speed

	// Get speed limits for this area (mock implementation)
	speedLimit := s.getSpeedLimitForLocation(ping.Latitude, ping.Longitude)

	if speed > speedLimit {
		s.createSpeedViolationAlert(ping, speed, speedLimit)
	}
}

// checkIdleTimeViolations checks for excessive idle time
func (s *LocationService) checkIdleTimeViolations(ping *models.LocationPing) {
	// Get last location ping for this vehicle
	var lastPing models.LocationPing
	err := s.db.Where("vehicle_id = ? AND created_at < ?", ping.VehicleID, ping.CreatedAt).
		Order("created_at DESC").
		First(&lastPing).Error

	if err != nil {
		return // No previous ping
	}

	// Calculate distance moved
	distance := s.calculateDistance(lastPing.Latitude, lastPing.Longitude, ping.Latitude, ping.Longitude)
	timeDiff := ping.CreatedAt.Sub(lastPing.CreatedAt)

	// If vehicle hasn't moved much in a long time, it might be idling
	minMovement := 50.0 // 50 meters
	maxIdleTime := 30 * time.Minute

	if distance < minMovement && timeDiff > maxIdleTime {
		s.createIdleTimeAlert(ping, timeDiff)
	}
}

// Geofence geometry calculations
func (s *LocationService) isPointInGeofence(lat, lon float64, geofence *models.Geofence) bool {
	switch geofence.ShapeType {
	case models.GeofenceShapeType("CIRCLE"):
		return s.isPointInCircle(lat, lon, geofence)
	case models.GeofenceShapeType("POLYGON"):
		return s.isPointInPolygon(lat, lon, geofence)
	case models.GeofenceShapeType("RECTANGLE"):
		return s.isPointInRectangle(lat, lon, geofence)
	default:
		return false
	}
}

func (s *LocationService) isPointInCircle(lat, lon float64, geofence *models.Geofence) bool {
	// For circle: coordinates should contain center lat, center lon, radius
	if len(geofence.Coordinates) < 3 {
		return false
	}

	centerLat := geofence.Coordinates[0]
	centerLon := geofence.Coordinates[1]
	radius := geofence.Coordinates[2] // in meters

	distance := s.calculateDistance(lat, lon, centerLat, centerLon)
	return distance <= radius
}

func (s *LocationService) isPointInPolygon(lat, lon float64, geofence *models.Geofence) bool {
	// Ray casting algorithm for point-in-polygon test
	coordinates := geofence.Coordinates
	if len(coordinates) < 6 { // Need at least 3 points (6 coordinates)
		return false
	}

	inside := false
	j := len(coordinates) - 2

	for i := 0; i < len(coordinates); i += 2 {
		if (coordinates[i+1] > lon) != (coordinates[j+1] > lon) &&
			lat < (coordinates[j]-coordinates[i])*(lon-coordinates[i+1])/(coordinates[j+1]-coordinates[i+1])+coordinates[i] {
			inside = !inside
		}
		j = i
	}

	return inside
}

func (s *LocationService) isPointInRectangle(lat, lon float64, geofence *models.Geofence) bool {
	// For rectangle: coordinates should contain min lat, min lon, max lat, max lon
	if len(geofence.Coordinates) < 4 {
		return false
	}

	minLat := geofence.Coordinates[0]
	minLon := geofence.Coordinates[1]
	maxLat := geofence.Coordinates[2]
	maxLon := geofence.Coordinates[3]

	return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon
}

// Calculate distance between two points using Haversine formula
func (s *LocationService) calculateDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371000 // Earth's radius in meters

	dLat := (lat2 - lat1) * math.Pi / 180
	dLon := (lon2 - lon1) * math.Pi / 180

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLon/2)*math.Sin(dLon/2)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return R * c
}

// Alert creation functions
func (s *LocationService) createGeofenceAlert(ping *models.LocationPing, geofence *models.Geofence, alertType string) {
	vehicleID := uint(0)
	if ping.VehicleID != nil {
		vehicleID = *ping.VehicleID
	}

	driverID := uint(0)
	if ping.DriverID != nil {
		driverID = *ping.DriverID
	}

	// TripID is now handled inline in the struct literal

	alert := &models.GeofenceAlert{
		VehicleID: vehicleID,
		DriverID:  driverID,
		TripID: func() uint {
			if ping.TripID != nil {
				return *ping.TripID
			} else {
				return 0
			}
		}(),
		GeofenceID:   geofence.ID,
		GeofenceName: geofence.Name,
		EventType:    alertType,
		Location: models.Location{
			Latitude:  ping.Latitude,
			Longitude: ping.Longitude,
			Accuracy:  ping.Accuracy,
			Timestamp: ping.CreatedAt,
		},
		Severity:    "HIGH",
		Description: fmt.Sprintf("Geofence %s: %s", alertType, geofence.Name),
		Timestamp:   ping.CreatedAt,
	}

	if err := s.db.Create(alert).Error; err != nil {
		log.Printf("❌ Failed to create geofence alert: %v", err)
	} else {
		log.Printf("🚨 Geofence alert created: %s for vehicle %d", alertType, vehicleID)
	}
}

func (s *LocationService) createRouteDeviationAlert(ping *models.LocationPing, trip *models.Trip, deviation float64) {
	vehicleID := uint(0)
	if ping.VehicleID != nil {
		vehicleID = *ping.VehicleID
	}

	driverID := uint(0)
	if ping.DriverID != nil {
		driverID = *ping.DriverID
	}

	alert := &models.RouteDeviation{
		// TripID: // Not in LocationEvent struct            trip.ID,
		VehicleID:         vehicleID,
		DriverID:          driverID,
		DeviationDistance: deviation,
		StartLatitude:     ping.Latitude,
		StartLongitude:    ping.Longitude,
		StartTime:         ping.CreatedAt,
		Reason:            "ROUTE_DEVIATION",
		IsResolved:        false,
	}

	if err := s.db.Create(alert).Error; err != nil {
		log.Printf("❌ Failed to create route deviation alert: %v", err)
	} else {
		log.Printf("🛣️ Route deviation alert: %.0fm deviation for trip %d", deviation, trip.ID)
	}
}

func (s *LocationService) createSpeedViolationAlert(ping *models.LocationPing, speed, speedLimit float64) {
	// Create speed violation record
	log.Printf("🚗💨 Speed violation: %.1f km/h (limit: %.1f km/h) for vehicle %d",
		speed, speedLimit, ping.VehicleID)

	// In production, would create formal alert record and notify stakeholders
}

func (s *LocationService) createIdleTimeAlert(ping *models.LocationPing, idleTime time.Duration) {
	log.Printf("⏰ Excessive idle time: %.0f minutes for vehicle %d",
		idleTime.Minutes(), ping.VehicleID)

	// In production, would create formal alert record
}

// Helper functions
func (s *LocationService) isAllowedTime(geofence *models.Geofence) bool {
	// Mock implementation - in production would check time restrictions
	now := time.Now()
	hour := now.Hour()

	// Example: Restricted during night hours (22:00 - 06:00)
	if hour >= 22 || hour <= 6 {
		return false
	}

	return true
}

func (s *LocationService) calculateRouteDeviation(ping *models.LocationPing, trip *models.Trip) float64 {
	// Mock implementation - in production would calculate actual deviation from planned route
	// For now, calculate distance from dropoff location as rough approximation

	return s.calculateDistance(ping.Latitude, ping.Longitude,
		trip.DropoffLatitude, trip.DropoffLongitude)
}

func (s *LocationService) getSpeedLimitForLocation(lat, lon float64) float64 {
	// Mock implementation - in production would query speed limit database
	// Return 60 km/h as default speed limit
	return 60.0
}

func (s *LocationService) updateFleetLocationCache(ping *models.LocationPing) {
	// In production, would update Redis cache or similar for real-time fleet tracking
	log.Printf("📡 Updated fleet location cache for vehicle %d", ping.VehicleID)
}

// Streaming subscription functions for real-time features
func (s *LocationService) SubscribeToGeofenceAlerts(vehicleIDs, geofenceIDs []uint32, alertChan chan *models.GeofenceAlert) func() {
	stopChan := make(chan bool)

	go func() {
		ticker := time.NewTicker(30 * time.Second) // Check every 30 seconds
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				// Check for new geofence alerts
				s.checkGeofenceAlertsForSubscription(vehicleIDs, geofenceIDs, alertChan)
			case <-stopChan:
				close(alertChan)
				return
			}
		}
	}()

	return func() {
		stopChan <- true
	}
}

func (s *LocationService) SubscribeToRouteDeviations(tripIDs []uint32, maxDeviation float64, deviationChan chan *models.RouteDeviation) func() {
	stopChan := make(chan bool)

	go func() {
		ticker := time.NewTicker(60 * time.Second) // Check every minute
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				// Check for route deviations
				s.checkRouteDeviationsForSubscription(tripIDs, maxDeviation, deviationChan)
			case <-stopChan:
				close(deviationChan)
				return
			}
		}
	}()

	return func() {
		stopChan <- true
	}
}

func (s *LocationService) SubscribeToLocationEvents(vehicleIDs []uint32, eventTypes []string, eventChan chan *models.LocationEvent) func() {
	stopChan := make(chan bool)

	go func() {
		ticker := time.NewTicker(15 * time.Second) // Check every 15 seconds for real-time events
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				// Check for various location events
				s.checkLocationEventsForSubscription(vehicleIDs, eventTypes, eventChan)
			case <-stopChan:
				close(eventChan)
				return
			}
		}
	}()

	return func() {
		stopChan <- true
	}
}

// Helper functions for streaming subscriptions
func (s *LocationService) checkGeofenceAlertsForSubscription(vehicleIDs, geofenceIDs []uint32, alertChan chan *models.GeofenceAlert) {
	// Get recent geofence alerts (last 5 minutes)
	fiveMinutesAgo := time.Now().Add(-5 * time.Minute)

	var alerts []models.GeofenceAlert
	query := s.db.Where("created_at >= ? AND is_resolved = false", fiveMinutesAgo)

	if len(vehicleIDs) > 0 {
		vehicleIDsInterface := make([]interface{}, len(vehicleIDs))
		for i, v := range vehicleIDs {
			vehicleIDsInterface[i] = v
		}
		query = query.Where("vehicle_id IN ?", vehicleIDsInterface)
	}

	if len(geofenceIDs) > 0 {
		geofenceIDsInterface := make([]interface{}, len(geofenceIDs))
		for i, v := range geofenceIDs {
			geofenceIDsInterface[i] = v
		}
		query = query.Where("geofence_id IN ?", geofenceIDsInterface)
	}

	_ = query.Find(&alerts)

	// Send alerts to channel
	for _, alert := range alerts {
		select {
		case alertChan <- &alert:
			log.Printf("🚨 Geofence alert sent: Vehicle %d, Geofence %d", alert.VehicleID, alert.GeofenceID)
		default:
			// Channel is full, skip this alert
		}
	}
}

func (s *LocationService) checkRouteDeviationsForSubscription(tripIDs []uint32, maxDeviation float64, deviationChan chan *models.RouteDeviation) {
	// Get recent route deviations
	fiveMinutesAgo := time.Now().Add(-5 * time.Minute)

	var deviations []models.RouteDeviation
	query := s.db.Where("detected_at >= ? AND is_resolved = false", fiveMinutesAgo)

	if len(tripIDs) > 0 {
		tripIDsInterface := make([]interface{}, len(tripIDs))
		for i, v := range tripIDs {
			tripIDsInterface[i] = v
		}
		query = query.Where("trip_id IN ?", tripIDsInterface)
	}

	if maxDeviation > 0 {
		query = query.Where("deviation_distance >= ?", maxDeviation)
	}

	_ = query.Find(&deviations)

	// Send deviations to channel
	for _, deviation := range deviations {
		select {
		case deviationChan <- &deviation:
			log.Printf("🛣️ Route deviation sent: Trip %d, Deviation %.0fm", deviation.TripID, deviation.DeviationDistance)
		default:
			// Channel is full, skip this deviation
		}
	}
}

func (s *LocationService) checkLocationEventsForSubscription(vehicleIDs []uint32, eventTypes []string, eventChan chan *models.LocationEvent) {
	// Get recent location pings for analysis
	twoMinutesAgo := time.Now().Add(-2 * time.Minute)

	var pings []models.LocationPing
	query := s.db.Where("created_at >= ?", twoMinutesAgo)

	if len(vehicleIDs) > 0 {
		vehicleIDsInterface := make([]interface{}, len(vehicleIDs))
		for i, v := range vehicleIDs {
			vehicleIDsInterface[i] = v
		}
		query = query.Where("vehicle_id IN ?", vehicleIDsInterface)
	}

	_ = query.Find(&pings)

	// Analyze pings for events
	for _, ping := range pings {
		events := s.analyzeLocationPingForEvents(&ping, eventTypes)

		for _, event := range events {
			select {
			case eventChan <- event:
				log.Printf("📍 Location event sent: %s for vehicle %d", event.EventType, event.VehicleID)
			default:
				// Channel is full, skip this event
			}
		}
	}
}

// analyzeLocationPingForEvents analyzes a location ping for various events
func (s *LocationService) analyzeLocationPingForEvents(ping *models.LocationPing, eventTypes []string) []*models.LocationEvent {
	var events []*models.LocationEvent

	// Check for different event types
	for _, eventType := range eventTypes {
		switch eventType {
		case "SPEED_VIOLATION":
			if event := s.checkSpeedViolationEvent(ping); event != nil {
				events = append(events, event)
			}
		case "HARSH_BRAKING":
			if event := s.checkHarshBrakingEvent(ping); event != nil {
				events = append(events, event)
			}
		case "HARSH_ACCELERATION":
			if event := s.checkHarshAccelerationEvent(ping); event != nil {
				events = append(events, event)
			}
		case "SUDDEN_STOP":
			if event := s.checkSuddenStopEvent(ping); event != nil {
				events = append(events, event)
			}
		case "LONG_IDLE":
			if event := s.checkLongIdleEvent(ping); event != nil {
				events = append(events, event)
			}
		case "LOCATION_UPDATE":
			// Always create location update events
			vehicleID := uint(0)
			if ping.VehicleID != nil {
				vehicleID = *ping.VehicleID
			}

			driverID := uint(0)
			if ping.DriverID != nil {
				driverID = *ping.DriverID
			}

			event := &models.LocationEvent{
				VehicleID:   vehicleID,
				DriverID:    driverID,
				EventType:   "LOCATION_UPDATE",
				Location:    models.Location{Latitude: ping.Latitude, Longitude: ping.Longitude, Timestamp: ping.CreatedAt},
				Timestamp:   ping.CreatedAt,
				Severity:    "INFO",
				Description: "Vehicle location updated",
			}
			events = append(events, event)
		}
	}

	return events
}

// Event detection functions
func (s *LocationService) checkSpeedViolationEvent(ping *models.LocationPing) *models.LocationEvent {
	if ping.Speed == nil {
		return nil
	}

	speedLimit := s.getSpeedLimitForLocation(ping.Latitude, ping.Longitude)
	if *ping.Speed > speedLimit {
		vehicleID := uint(0)
		if ping.VehicleID != nil {
			vehicleID = *ping.VehicleID
		}

		driverID := uint(0)
		if ping.DriverID != nil {
			driverID = *ping.DriverID
		}

		return &models.LocationEvent{
			VehicleID:   vehicleID,
			DriverID:    driverID,
			EventType:   "SPEED_VIOLATION",
			Location:    models.Location{Latitude: ping.Latitude, Longitude: ping.Longitude, Timestamp: ping.CreatedAt},
			Timestamp:   ping.CreatedAt,
			Severity:    s.getSpeedViolationSeverity(*ping.Speed, speedLimit),
			Description: fmt.Sprintf("Speed violation: %.1f km/h (limit: %.1f km/h)", *ping.Speed, speedLimit),
		}
	}

	return nil
}

func (s *LocationService) checkHarshBrakingEvent(ping *models.LocationPing) *models.LocationEvent {
	// Get previous ping to calculate deceleration
	var prevPing models.LocationPing
	err := s.db.Where("vehicle_id = ? AND created_at < ?", ping.VehicleID, ping.CreatedAt).
		Order("created_at DESC").
		First(&prevPing).Error

	if err != nil || ping.Speed == nil || prevPing.Speed == nil {
		return nil
	}

	timeDiff := ping.CreatedAt.Sub(prevPing.CreatedAt).Seconds()
	if timeDiff <= 0 {
		return nil
	}

	// Calculate deceleration (negative acceleration)
	speedDiff := *ping.Speed - *prevPing.Speed

	// Convert to m/s² for standard units
	decelerationMps := (speedDiff * 1000 / 3600) / timeDiff

	// Harsh braking threshold: > 3.5 m/s² deceleration
	if decelerationMps < -3.5 {
		return &models.LocationEvent{
			VehicleID: func() uint {
				if ping.VehicleID != nil {
					return *ping.VehicleID
				} else {
					return 0
				}
			}(),
			DriverID: func() uint {
				if ping.DriverID != nil {
					return *ping.DriverID
				} else {
					return 0
				}
			}(),
			// TripID: // Not in LocationEvent struct      ping.TripID,
			EventType: "HARSH_BRAKING",
			Location:  models.Location{Latitude: ping.Latitude, Longitude: ping.Longitude, Timestamp: ping.CreatedAt},
			// Speed: // Not in LocationEvent struct       ping.Speed,
			Timestamp:   ping.CreatedAt,
			Severity:    "MEDIUM",
			Description: fmt.Sprintf("Harsh braking detected: %.1f m/s² deceleration", decelerationMps),
		}
	}

	return nil
}

func (s *LocationService) checkHarshAccelerationEvent(ping *models.LocationPing) *models.LocationEvent {
	// Similar to harsh braking but for acceleration
	var prevPing models.LocationPing
	err := s.db.Where("vehicle_id = ? AND created_at < ?", ping.VehicleID, ping.CreatedAt).
		Order("created_at DESC").
		First(&prevPing).Error

	if err != nil || ping.Speed == nil || prevPing.Speed == nil {
		return nil
	}

	timeDiff := ping.CreatedAt.Sub(prevPing.CreatedAt).Seconds()
	if timeDiff <= 0 {
		return nil
	}

	// Calculate acceleration
	speedDiff := *ping.Speed - *prevPing.Speed
	accelerationMps := (speedDiff * 1000 / 3600) / timeDiff

	// Harsh acceleration threshold: > 2.5 m/s² acceleration
	if accelerationMps > 2.5 {
		return &models.LocationEvent{
			VehicleID: func() uint {
				if ping.VehicleID != nil {
					return *ping.VehicleID
				} else {
					return 0
				}
			}(),
			DriverID: func() uint {
				if ping.DriverID != nil {
					return *ping.DriverID
				} else {
					return 0
				}
			}(),
			// TripID: // Not in LocationEvent struct      ping.TripID,
			EventType: "HARSH_ACCELERATION",
			Location:  models.Location{Latitude: ping.Latitude, Longitude: ping.Longitude, Timestamp: ping.CreatedAt},
			// Speed: // Not in LocationEvent struct       ping.Speed,
			Timestamp:   ping.CreatedAt,
			Severity:    "MEDIUM",
			Description: fmt.Sprintf("Harsh acceleration detected: %.1f m/s² acceleration", accelerationMps),
		}
	}

	return nil
}

func (s *LocationService) checkSuddenStopEvent(ping *models.LocationPing) *models.LocationEvent {
	if ping.Speed == nil || *ping.Speed > 1.0 { // Not stopped
		return nil
	}

	// Check if vehicle was moving recently
	var recentPing models.LocationPing
	twoMinutesAgo := ping.CreatedAt.Add(-2 * time.Minute)
	err := s.db.Where("vehicle_id = ? AND created_at >= ? AND created_at < ?",
		ping.VehicleID, twoMinutesAgo, ping.CreatedAt).
		Where("speed > ?", 10.0). // Was moving > 10 km/h
		Order("created_at DESC").
		First(&recentPing).Error

	if err == nil {
		return &models.LocationEvent{
			VehicleID: func() uint {
				if ping.VehicleID != nil {
					return *ping.VehicleID
				} else {
					return 0
				}
			}(),
			DriverID: func() uint {
				if ping.DriverID != nil {
					return *ping.DriverID
				} else {
					return 0
				}
			}(),
			// TripID: // Not in LocationEvent struct      ping.TripID,
			EventType: "SUDDEN_STOP",
			Location:  models.Location{Latitude: ping.Latitude, Longitude: ping.Longitude, Timestamp: ping.CreatedAt},
			// Speed: // Not in LocationEvent struct       ping.Speed,
			Timestamp:   ping.CreatedAt,
			Severity:    "HIGH",
			Description: "Vehicle stopped suddenly",
		}
	}

	return nil
}

func (s *LocationService) checkLongIdleEvent(ping *models.LocationPing) *models.LocationEvent {
	if ping.Speed == nil || *ping.Speed > 1.0 { // Not idle
		return nil
	}

	// Check how long vehicle has been idle
	var firstIdlePing models.LocationPing
	thirtyMinutesAgo := ping.CreatedAt.Add(-30 * time.Minute)
	err := s.db.Where("vehicle_id = ? AND created_at >= ? AND created_at <= ? AND speed <= ?",
		ping.VehicleID, thirtyMinutesAgo, ping.CreatedAt, 1.0).
		Order("created_at ASC").
		First(&firstIdlePing).Error

	if err == nil {
		idleDuration := ping.CreatedAt.Sub(firstIdlePing.CreatedAt)
		if idleDuration > 30*time.Minute {
			return &models.LocationEvent{
				VehicleID: func() uint {
					if ping.VehicleID != nil {
						return *ping.VehicleID
					} else {
						return 0
					}
				}(),
				DriverID: func() uint {
					if ping.DriverID != nil {
						return *ping.DriverID
					} else {
						return 0
					}
				}(),
				// TripID: // Not in LocationEvent struct      ping.TripID,
				EventType: "LONG_IDLE",
				Location:  models.Location{Latitude: ping.Latitude, Longitude: ping.Longitude, Timestamp: ping.CreatedAt},
				// Speed: // Not in LocationEvent struct       ping.Speed,
				Timestamp:   ping.CreatedAt,
				Severity:    "MEDIUM",
				Description: fmt.Sprintf("Vehicle idle for %.0f minutes", idleDuration.Minutes()),
			}
		}
	}

	return nil
}

// Helper function for speed violation severity
func (s *LocationService) getSpeedViolationSeverity(speed, limit float64) string {
	excess := speed - limit
	if excess > 20 {
		return "CRITICAL"
	} else if excess > 10 {
		return "HIGH"
	} else if excess > 5 {
		return "MEDIUM"
	}
	return "LOW"
}
