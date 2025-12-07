package models

import (
	"time"

	"gorm.io/gorm"
)

// AssetType represents the type of asset
type AssetType string

const (
	AssetTypeTrailer   AssetType = "TRAILER"
	AssetTypeContainer AssetType = "CONTAINER"
	AssetTypeEquipment AssetType = "EQUIPMENT" // Generators, Cranes
	AssetTypePallet    AssetType = "PALLET"
)

// AssetStatus represents the current status of the asset
type AssetStatus string

const (
	AssetStatusAvailable   AssetStatus = "AVAILABLE"
	AssetStatusInUse       AssetStatus = "IN_USE"
	AssetStatusMaintenance AssetStatus = "MAINTENANCE"
	AssetStatusLost        AssetStatus = "LOST"
)

// Asset represents a trackable item (Trailer, Container, Equipment)
type Asset struct {
	ID            uint           `json:"id" gorm:"primaryKey"`
	Name          string         `json:"name" gorm:"type:varchar(100);not null"`
	Type          AssetType      `json:"type" gorm:"type:varchar(50);not null"`
	Status        AssetStatus    `json:"status" gorm:"type:varchar(50);default:'AVAILABLE'"`
	SerialNumber  string         `json:"serial_number" gorm:"uniqueIndex"`
	BLEBeaconID   string         `json:"ble_beacon_id" gorm:"index"` // MAC address or UUID
	CurrentYardID *uint          `json:"current_yard_id" gorm:"index"`
	LastLatitude  float64        `json:"last_latitude" gorm:"type:decimal(10,8)"`
	LastLongitude float64        `json:"last_longitude" gorm:"type:decimal(11,8)"`
	LastSeenAt    time.Time      `json:"last_seen_at"`
	BatteryLevel  *int           `json:"battery_level,omitempty"` // Percentage
	Temperature   *float64       `json:"temperature,omitempty"`   // For Reefers
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`

	CurrentYard *Yard `json:"current_yard,omitempty" gorm:"foreignKey:CurrentYardID"`
}

// Yard represents a physical location (Warehouse, Depot, Job Site)
type Yard struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Name      string         `json:"name" gorm:"type:varchar(100);not null"`
	Latitude  float64        `json:"latitude" gorm:"type:decimal(10,8);not null"`
	Longitude float64        `json:"longitude" gorm:"type:decimal(11,8);not null"`
	Radius    float64        `json:"radius" gorm:"default:100"` // Geofence radius in meters
	Capacity  int            `json:"capacity"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// YardEvent records check-in/check-out events
type YardEvent struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	AssetID   uint      `json:"asset_id" gorm:"index;not null"`
	YardID    uint      `json:"yard_id" gorm:"index;not null"`
	EventType string    `json:"event_type" gorm:"type:varchar(20);not null"` // CHECK_IN, CHECK_OUT
	Timestamp time.Time `json:"timestamp" gorm:"index;not null"`
	GateID    *string   `json:"gate_id,omitempty"`
	CreatedAt time.Time `json:"created_at"`

	Asset Asset `json:"asset" gorm:"foreignKey:AssetID"`
	Yard  Yard  `json:"yard" gorm:"foreignKey:YardID"`
}

// InventoryItem represents parts or goods in inventory
type InventoryItem struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"type:varchar(100);not null"`
	SKU         string         `json:"sku" gorm:"uniqueIndex;not null"`
	Category    string         `json:"category"`
	Quantity    int            `json:"quantity" gorm:"default:0"`
	MinQuantity int            `json:"min_quantity" gorm:"default:10"`
	UnitCost    float64        `json:"unit_cost"`
	Location    string         `json:"location"` // Shelf/Bin location
	YardID      *uint          `json:"yard_id" gorm:"index"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	Yard *Yard `json:"yard,omitempty" gorm:"foreignKey:YardID"`
}
