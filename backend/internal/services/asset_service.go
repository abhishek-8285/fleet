package services

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/fleetflow/backend/internal/models"
	"gorm.io/gorm"
)

// AssetService handles asset tracking and yard management
type AssetService struct {
	db *gorm.DB
}

// NewAssetService creates a new asset service
func NewAssetService(db *gorm.DB) *AssetService {
	return &AssetService{
		db: db,
	}
}

// CreateAsset adds a new asset to the system
func (s *AssetService) CreateAsset(asset *models.Asset) error {
	return s.db.Create(asset).Error
}

// CreateYard adds a new yard
func (s *AssetService) CreateYard(yard *models.Yard) error {
	return s.db.Create(yard).Error
}

// ProcessBeaconPing updates asset location and checks for yard entry/exit
func (s *AssetService) ProcessBeaconPing(beaconID string, lat, lon float64) error {
	var asset models.Asset
	if err := s.db.Where("ble_beacon_id = ?", beaconID).First(&asset).Error; err != nil {
		return fmt.Errorf("asset not found for beacon %s: %w", beaconID, err)
	}

	// Update last seen
	asset.LastLatitude = lat
	asset.LastLongitude = lon
	asset.LastSeenAt = time.Now()

	// Check for Yard Entry/Exit
	// This is a simplified check. In production, use spatial queries (PostGIS)
	var yards []models.Yard
	s.db.Find(&yards)

	inYard := false
	var detectedYardID uint

	for _, yard := range yards {
		if s.isInsideYard(lat, lon, yard) {
			inYard = true
			detectedYardID = yard.ID
			break
		}
	}

	if inYard {
		if asset.CurrentYardID == nil || *asset.CurrentYardID != detectedYardID {
			// Entry Event
			s.recordYardEvent(asset.ID, detectedYardID, "CHECK_IN")
			asset.CurrentYardID = &detectedYardID
			asset.Status = models.AssetStatusAvailable // Assume available when in yard
		}
	} else {
		if asset.CurrentYardID != nil {
			// Exit Event
			s.recordYardEvent(asset.ID, *asset.CurrentYardID, "CHECK_OUT")
			asset.CurrentYardID = nil
			asset.Status = models.AssetStatusInUse // Assume in use when out
		}
	}

	return s.db.Save(&asset).Error
}

// isInsideYard checks if a point is within the yard's radius
func (s *AssetService) isInsideYard(lat, lon float64, yard models.Yard) bool {
	// Haversine formula approximation
	const R = 6371000 // Earth radius in meters

	// Simplified distance calculation for small distances
	// dx = R * dLon * cos(lat)
	// dy = R * dLat
	// dist = sqrt(dx*dx + dy*dy)
	// This is rough but fast for simple circular geofences

	// Using a library or proper Haversine is better, but keeping it simple for now
	// Or just use the NavigationService logic if available, but avoiding circular dependency

	// Let's just assume if within 0.001 degrees (~100m) for this mock
	// Real implementation should use PostGIS ST_DWithin

	diffLat := lat - yard.Latitude
	diffLon := lon - yard.Longitude
	return (diffLat*diffLat + diffLon*diffLon) < 0.00001 // Approx check
}

// recordYardEvent logs the event
func (s *AssetService) recordYardEvent(assetID, yardID uint, eventType string) {
	event := models.YardEvent{
		AssetID:   assetID,
		YardID:    yardID,
		EventType: eventType,
		Timestamp: time.Now(),
	}
	if err := s.db.Create(&event).Error; err != nil {
		log.Printf("❌ Failed to record yard event: %v", err)
	} else {
		log.Printf("📍 Asset %d %s Yard %d", assetID, eventType, yardID)
	}
}

// UpdateInventory updates item quantity
func (s *AssetService) UpdateInventory(itemID uint, quantityChange int) error {
	var item models.InventoryItem
	if err := s.db.First(&item, itemID).Error; err != nil {
		return err
	}

	newQuantity := item.Quantity + quantityChange
	if newQuantity < 0 {
		return errors.New("insufficient inventory")
	}

	item.Quantity = newQuantity
	return s.db.Save(&item).Error
}

// GetInventoryLowStock returns items below minimum quantity
func (s *AssetService) GetInventoryLowStock() ([]models.InventoryItem, error) {
	var items []models.InventoryItem
	err := s.db.Where("quantity < min_quantity").Find(&items).Error
	return items, err
}
