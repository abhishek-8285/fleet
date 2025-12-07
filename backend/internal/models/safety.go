package models

import (
	"time"

	"gorm.io/gorm"
)

// SafetyEventType represents the type of safety event
type SafetyEventType string

const (
	SafetyEventHarshBraking     SafetyEventType = "HARSH_BRAKING"
	SafetyEventHarshAcceleration SafetyEventType = "HARSH_ACCELERATION"
	SafetyEventHarshCornering   SafetyEventType = "HARSH_CORNERING"
	SafetyEventSpeeding         SafetyEventType = "SPEEDING"
	SafetyEventGeofenceEntry    SafetyEventType = "GEOFENCE_ENTRY"
	SafetyEventGeofenceExit     SafetyEventType = "GEOFENCE_EXIT"
	SafetyEventImpact           SafetyEventType = "IMPACT"
)

// SafetyEventSeverity represents the severity of the event
type SafetyEventSeverity string

const (
	SeverityLow      SafetyEventSeverity = "LOW"
	SeverityMedium   SafetyEventSeverity = "MEDIUM"
	SeverityHigh     SafetyEventSeverity = "HIGH"
	SeverityCritical SafetyEventSeverity = "CRITICAL"
)

// SafetyEvent records a safety-related incident
type SafetyEvent struct {
	ID        uint                `json:"id" gorm:"primaryKey"`
	VehicleID uint                `json:"vehicle_id" gorm:"index"`
	DriverID  *uint               `json:"driver_id,omitempty" gorm:"index"`
	TripID    *uint               `json:"trip_id,omitempty" gorm:"index"`
	Type      SafetyEventType     `json:"type" gorm:"type:varchar(50);not null"`
	Severity  SafetyEventSeverity `json:"severity" gorm:"type:varchar(20);not null"`
	Value     float64             `json:"value"`               // The measured value (e.g., speed, g-force)
	Threshold float64             `json:"threshold,omitempty"` // The threshold that was breached
	Unit      string              `json:"unit,omitempty"`      // km/h, m/s^2, etc.
	Latitude  float64             `json:"latitude" gorm:"type:decimal(10,8);not null"`
	Longitude float64             `json:"longitude" gorm:"type:decimal(11,8);not null"`
	Timestamp time.Time           `json:"timestamp" gorm:"index;not null"`
	Address   string              `json:"address,omitempty"`
	IsViewed  bool                `json:"is_viewed" gorm:"default:false"`
	CreatedAt time.Time           `json:"created_at"`
	UpdatedAt time.Time           `json:"updated_at"`
	DeletedAt gorm.DeletedAt      `json:"-" gorm:"index"`

	Vehicle *Vehicle `json:"vehicle,omitempty" gorm:"foreignKey:VehicleID"`
	Driver  *Driver  `json:"driver,omitempty" gorm:"foreignKey:DriverID"`
	Trip    *Trip    `json:"trip,omitempty" gorm:"foreignKey:TripID"`
}

// DriverScore represents the calculated safety score for a driver
type DriverScore struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	DriverID        uint      `json:"driver_id" gorm:"uniqueIndex"`
	OverallScore    int       `json:"overall_score"` // 0-100
	BrakingScore    int       `json:"braking_score"`
	AccelScore      int       `json:"accel_score"`
	CorneringScore  int       `json:"cornering_score"`
	SpeedingScore   int       `json:"speeding_score"`
	TotalDistance   float64   `json:"total_distance"` // km analyzed
	TotalDriveTime  float64   `json:"total_drive_time"` // hours analyzed
	LastCalculated  time.Time `json:"last_calculated"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `json:"-" gorm:"index"`

	Driver Driver `json:"driver" gorm:"foreignKey:DriverID"`
}
