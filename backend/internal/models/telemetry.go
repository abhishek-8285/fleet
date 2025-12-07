package models

import (
	"time"

	"gorm.io/gorm"
)

// TelemetryLog stores vehicle sensor data snapshots
type TelemetryLog struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	VehicleID uint           `json:"vehicle_id" gorm:"not null;index"`
	Timestamp time.Time      `json:"timestamp" gorm:"not null;index"`
	
	// Engine Data
	EngineRPM      *int     `json:"engine_rpm,omitempty"`
	Speed          *float64 `json:"speed,omitempty"`          // OBD speed (can differ from GPS)
	CoolantTemp    *float64 `json:"coolant_temp,omitempty"`   // Celsius
	EngineLoad     *float64 `json:"engine_load,omitempty"`    // Percentage
	ThrottlePos    *float64 `json:"throttle_pos,omitempty"`   // Percentage
	FuelLevel      *float64 `json:"fuel_level,omitempty"`     // Percentage
	BatteryVoltage *float64 `json:"battery_voltage,omitempty"` // Volts
	
	// Usage Data
	Odometer    *float64 `json:"odometer,omitempty"`     // km
	EngineHours *float64 `json:"engine_hours,omitempty"` // hours
	FuelUsed    *float64 `json:"fuel_used,omitempty"`    // Liters since reset

	// Metadata
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	Vehicle *Vehicle `json:"vehicle,omitempty" gorm:"foreignKey:VehicleID"`
}

// DiagnosticCodeSeverity represents the severity of a DTC
type DiagnosticCodeSeverity string

const (
	DTCSeverityLow      DiagnosticCodeSeverity = "LOW"
	DTCSeverityMedium   DiagnosticCodeSeverity = "MEDIUM"
	DTCSeverityHigh     DiagnosticCodeSeverity = "HIGH"
	DTCSeverityCritical DiagnosticCodeSeverity = "CRITICAL"
)

// DiagnosticCode represents a Diagnostic Trouble Code (DTC) from OBD-II/J1939
type DiagnosticCode struct {
	ID          uint                   `json:"id" gorm:"primaryKey"`
	VehicleID   uint                   `json:"vehicle_id" gorm:"not null;index"`
	Code        string                 `json:"code" gorm:"type:varchar(20);not null;index"` // e.g., P0300
	Description string                 `json:"description,omitempty"`
	Severity    DiagnosticCodeSeverity `json:"severity" gorm:"default:'MEDIUM'"`
	
	// Status
	IsActive   bool      `json:"is_active" gorm:"default:true"`
	FirstSeen  time.Time `json:"first_seen"`
	LastSeen   time.Time `json:"last_seen"`
	ClearTime  *time.Time `json:"clear_time,omitempty"`
	
	// Metadata
	Source    string         `json:"source,omitempty"` // OBDII, J1939, OEM
	RawData   string         `json:"raw_data,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	Vehicle *Vehicle `json:"vehicle,omitempty" gorm:"foreignKey:VehicleID"`
}
