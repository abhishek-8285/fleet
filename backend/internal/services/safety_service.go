package services

import (
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/fleetflow/backend/internal/models"
	"gorm.io/gorm"
)

// SafetyService handles real-time safety analysis
type SafetyService struct {
	db          *gorm.DB
	mqttService *MQTTService

	// State cache for calculating deltas (VehicleID -> Last Location)
	vehicleState map[uint]*models.LocationPing

	// Geofence cache (GeofenceID -> Geofence)
	geofences []models.Geofence

	stateMu sync.RWMutex
}

// NewSafetyService creates a new safety service
func NewSafetyService(db *gorm.DB, mqttService *MQTTService) *SafetyService {
	s := &SafetyService{
		db:           db,
		mqttService:  mqttService,
		vehicleState: make(map[uint]*models.LocationPing),
	}

	// Load initial geofences
	s.loadGeofences()

	// Start periodic reload
	go s.periodicGeofenceReload()

	return s
}

// Start begins the safety monitoring process
func (s *SafetyService) Start() error {
	// Subscribe to wildcard MQTT topic (Parallel to Ingestion)
	if err := s.mqttService.SubscribeToAllVehicleLocations(s.handleLocationUpdate); err != nil {
		return fmt.Errorf("failed to subscribe to vehicle locations: %w", err)
	}

	log.Println("🛡️ Safety Service started: Monitoring driving behavior")
	return nil
}

// handleLocationUpdate processes incoming GPS points for safety events
func (s *SafetyService) handleLocationUpdate(loc *LocationUpdate) {
	// 1. Convert to model for easier handling
	currentPing := &models.LocationPing{
		VehicleID: &loc.VehicleID,
		Latitude:  loc.Latitude,
		Longitude: loc.Longitude,
		Speed:     &loc.Speed,
		Timestamp: loc.Timestamp,
	}

	// 2. Get previous state
	s.stateMu.RLock()
	lastPing, exists := s.vehicleState[loc.VehicleID]
	s.stateMu.RUnlock()

	// 3. Update state
	s.stateMu.Lock()
	s.vehicleState[loc.VehicleID] = currentPing
	s.stateMu.Unlock()

	if !exists {
		return // Need at least 2 points to calculate deltas
	}

	// 4. Run Detectors
	go s.detectHarshDriving(currentPing, lastPing)
	go s.detectSpeeding(currentPing)
	go s.detectGeofence(currentPing, lastPing)
}

// detectHarshDriving checks for rapid acceleration or deceleration
func (s *SafetyService) detectHarshDriving(current, last *models.LocationPing) {
	timeDelta := current.Timestamp.Sub(last.Timestamp).Seconds()
	if timeDelta <= 0 || timeDelta > 5 {
		return // Ignore invalid or too far apart points
	}

	// Calculate acceleration in km/h per second
	speedDelta := *current.Speed - *last.Speed
	acceleration := speedDelta / timeDelta

	var eventType models.SafetyEventType
	var threshold float64

	// Thresholds (km/h per second)
	const harshBrakingThreshold = -12.0
	const harshAccelThreshold = 12.0

	if acceleration <= harshBrakingThreshold {
		eventType = models.SafetyEventHarshBraking
		threshold = harshBrakingThreshold
	} else if acceleration >= harshAccelThreshold {
		eventType = models.SafetyEventHarshAcceleration
		threshold = harshAccelThreshold
	} else {
		return
	}

	// Create Safety Event
	event := &models.SafetyEvent{
		VehicleID: *current.VehicleID,
		Type:      eventType,
		Severity:  models.SeverityHigh,
		Value:     acceleration,
		Threshold: threshold,
		Unit:      "km/h/s",
		Latitude:  current.Latitude,
		Longitude: current.Longitude,
		Timestamp: current.Timestamp,
	}

	s.recordEvent(event)
}

// detectSpeeding checks for absolute speed violations
func (s *SafetyService) detectSpeeding(current *models.LocationPing) {
	const speedLimit = 80.0 // Hardcoded for now, should be per-vehicle or per-road

	if *current.Speed > speedLimit {
		event := &models.SafetyEvent{
			VehicleID: *current.VehicleID,
			Type:      models.SafetyEventSpeeding,
			Severity:  models.SeverityMedium,
			Value:     *current.Speed,
			Threshold: speedLimit,
			Unit:      "km/h",
			Latitude:  current.Latitude,
			Longitude: current.Longitude,
			Timestamp: current.Timestamp,
		}

		if *current.Speed > 100 {
			event.Severity = models.SeverityHigh
		}
		if *current.Speed > 120 {
			event.Severity = models.SeverityCritical
		}

		s.recordEvent(event)
	}
}

// detectGeofence checks for entry/exit events
func (s *SafetyService) detectGeofence(current, last *models.LocationPing) {
	s.stateMu.RLock()
	geofences := s.geofences
	s.stateMu.RUnlock()

	for _, gf := range geofences {
		wasInside := gf.IsInGeofence(last.Latitude, last.Longitude)
		isInside := gf.IsInGeofence(current.Latitude, current.Longitude)

		if !wasInside && isInside {
			// Entry Event
			event := &models.SafetyEvent{
				VehicleID: *current.VehicleID,
				Type:      models.SafetyEventGeofenceEntry,
				Severity:  models.SeverityLow,
				Value:     1.0,
				Unit:      "entry",
				Latitude:  current.Latitude,
				Longitude: current.Longitude,
				Timestamp: current.Timestamp,
				Address:   gf.Name, // Use geofence name as address
			}
			s.recordEvent(event)
		} else if wasInside && !isInside {
			// Exit Event
			event := &models.SafetyEvent{
				VehicleID: *current.VehicleID,
				Type:      models.SafetyEventGeofenceExit,
				Severity:  models.SeverityLow,
				Value:     1.0,
				Unit:      "exit",
				Latitude:  current.Latitude,
				Longitude: current.Longitude,
				Timestamp: current.Timestamp,
				Address:   gf.Name,
			}
			s.recordEvent(event)
		}
	}
}

// loadGeofences loads active geofences from DB
func (s *SafetyService) loadGeofences() {
	var geofences []models.Geofence
	if err := s.db.Where("is_active = ?", true).Find(&geofences).Error; err != nil {
		log.Printf("❌ Failed to load geofences: %v", err)
		return
	}

	s.stateMu.Lock()
	s.geofences = geofences
	s.stateMu.Unlock()

	log.Printf("📍 Loaded %d active geofences", len(geofences))
}

// periodicGeofenceReload refreshes geofence cache every minute
func (s *SafetyService) periodicGeofenceReload() {
	ticker := time.NewTicker(1 * time.Minute)
	for range ticker.C {
		s.loadGeofences()
	}
}

// recordEvent saves the event to DB and publishes an alert
func (s *SafetyService) recordEvent(event *models.SafetyEvent) {
	// 1. Save to DB
	if err := s.db.Create(event).Error; err != nil {
		log.Printf("❌ Failed to save safety event: %v", err)
		return
	}

	// 2. Publish Alert via MQTT
	alert := &FleetAlert{
		Type:           string(event.Type),
		Severity:       string(event.Severity),
		VehicleID:      &event.VehicleID,
		Message:        fmt.Sprintf("%s detected: %.2f %s", event.Type, event.Value, event.Unit),
		Timestamp:      event.Timestamp,
		RequiresAction: event.Severity == models.SeverityCritical,
	}

	if err := s.mqttService.PublishFleetAlert(alert); err != nil {
		log.Printf("❌ Failed to publish safety alert: %v", err)
	}

	log.Printf("⚠️ Safety Event Recorded: %s for Vehicle %d (Value: %.2f)", event.Type, event.VehicleID, event.Value)
}
