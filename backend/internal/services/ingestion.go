package services

import (
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/fleetflow/backend/internal/models"
	"gorm.io/gorm"
)

// IngestionService handles high-frequency data ingestion
type IngestionService struct {
	db            *gorm.DB
	mqttService   *MQTTService
	locationCh    chan *LocationUpdate
	batchSize     int
	flushInterval time.Duration
	wg            sync.WaitGroup
}

// NewIngestionService creates a new ingestion service
func NewIngestionService(db *gorm.DB, mqttService *MQTTService) *IngestionService {
	return &IngestionService{
		db:            db,
		mqttService:   mqttService,
		locationCh:    make(chan *LocationUpdate, 10000), // Large buffer
		batchSize:     100,                               // Batch size for DB inserts
		flushInterval: 1 * time.Second,                   // Max time to wait before flushing
	}
}

// Start begins the ingestion process
func (s *IngestionService) Start() error {
	// 1. Subscribe to wildcard MQTT topic
	if err := s.mqttService.SubscribeToAllVehicleLocations(s.handleLocationUpdate); err != nil {
		return fmt.Errorf("failed to subscribe to vehicle locations: %w", err)
	}

	// 2. Start worker to process channel
	s.wg.Add(1)
	go s.processBuffer()

	log.Println("🚀 Ingestion Service started: Buffering 10Hz GPS data")
	return nil
}

// Stop shuts down the ingestion service gracefully
func (s *IngestionService) Stop() {
	close(s.locationCh)
	s.wg.Wait()
	log.Println("🛑 Ingestion Service stopped")
}

// handleLocationUpdate is the callback for MQTT messages
func (s *IngestionService) handleLocationUpdate(loc *LocationUpdate) {
	// Non-blocking send to avoid stalling the MQTT client
	select {
	case s.locationCh <- loc:
	default:
		log.Printf("⚠️ Ingestion buffer full! Dropping location update for vehicle %d", loc.VehicleID)
	}
}

// processBuffer reads from the channel and batches writes
func (s *IngestionService) processBuffer() {
	defer s.wg.Done()

	batch := make([]models.LocationPing, 0, s.batchSize)
	ticker := time.NewTicker(s.flushInterval)
	defer ticker.Stop()

	flush := func() {
		if len(batch) > 0 {
			if err := s.bulkInsert(batch); err != nil {
				log.Printf("❌ Failed to flush batch of %d records: %v", len(batch), err)
			} else {
				// log.Printf("💾 Flushed batch of %d location records", len(batch))
			}
			// Reset batch (keep capacity)
			batch = batch[:0]
		}
	}

	for {
		select {
		case loc, ok := <-s.locationCh:
			if !ok {
				flush() // Flush remaining items on close
				return
			}

			// Convert DTO to Model
			ping := models.LocationPing{
				VehicleID: &loc.VehicleID,
				Latitude:  loc.Latitude,
				Longitude: loc.Longitude,
				Speed:     &loc.Speed,
				Heading:   &loc.Heading,
				Accuracy:  loc.Accuracy,
				Timestamp: loc.Timestamp,
				CreatedAt: time.Now(),
				Source:    "GPS_DEVICE",
			}

			// Handle optional fields
			if loc.DriverID != nil {
				ping.DriverID = loc.DriverID
			}

			batch = append(batch, ping)

			if len(batch) >= s.batchSize {
				flush()
			}

		case <-ticker.C:
			flush()
		}
	}
}

// bulkInsert performs efficient bulk insert into PostgreSQL
func (s *IngestionService) bulkInsert(pings []models.LocationPing) error {
	return s.db.Create(&pings).Error
}
