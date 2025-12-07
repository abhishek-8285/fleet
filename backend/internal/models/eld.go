package models

import (
	"time"

	"gorm.io/gorm"
)

// DutyStatus represents the driver's current state
type DutyStatus string

const (
	DutyStatusOffDuty      DutyStatus = "OFF"
	DutyStatusSleeperBerth DutyStatus = "SB"
	DutyStatusDriving      DutyStatus = "D"
	DutyStatusOnDuty       DutyStatus = "ON"
)

// DutyStatusLog records a change in duty status
type DutyStatusLog struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	DriverID  uint           `json:"driver_id" gorm:"index"`
	VehicleID *uint          `json:"vehicle_id,omitempty" gorm:"index"`
	Status    DutyStatus     `json:"status" gorm:"type:varchar(5);not null"`
	StartTime time.Time      `json:"start_time" gorm:"index;not null"`
	EndTime   *time.Time     `json:"end_time,omitempty"`
	Duration  int            `json:"duration,omitempty"` // in minutes
	Location  string         `json:"location"`
	Odometer  int            `json:"odometer"`
	EngineHours float64      `json:"engine_hours"`
	Notes     string         `json:"notes,omitempty"`
	Signature string         `json:"signature,omitempty"` // Driver signature
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	Driver  Driver   `json:"driver" gorm:"foreignKey:DriverID"`
	Vehicle *Vehicle `json:"vehicle,omitempty" gorm:"foreignKey:VehicleID"`
}

// HOSCycle tracks the driver's current cycle (e.g., 70 hours in 8 days)
type HOSCycle struct {
	ID             uint           `json:"id" gorm:"primaryKey"`
	DriverID       uint           `json:"driver_id" gorm:"uniqueIndex"`
	CycleType      string         `json:"cycle_type" gorm:"default:'US_70_8'"` // US_70_8, US_60_7
	CycleStartTime time.Time      `json:"cycle_start_time"`
	HoursUsed      float64        `json:"hours_used"` // Hours used in current cycle
	HoursAvailable float64        `json:"hours_available"`
	LastResetAt    time.Time      `json:"last_reset_at"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`
}

// HOSViolation records a violation of HOS rules
type HOSViolation struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	DriverID    uint           `json:"driver_id" gorm:"index"`
	LogID       uint           `json:"log_id" gorm:"index"` // The log that caused the violation
	Type        string         `json:"type"`                // 11_HOUR_DRIVING, 14_HOUR_DUTY, 70_HOUR_CYCLE
	Description string         `json:"description"`
	Severity    string         `json:"severity"` // WARNING, VIOLATION
	OccurredAt  time.Time      `json:"occurred_at"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// HOSClocks represents the real-time remaining hours for a driver
type HOSClocks struct {
	DriveTimeRemaining float64 `json:"drive_time_remaining"` // Max 11 hours
	ShiftTimeRemaining float64 `json:"shift_time_remaining"` // Max 14 hours
	CycleTimeRemaining float64 `json:"cycle_time_remaining"` // Max 70 hours
	BreakTimeRemaining float64 `json:"break_time_remaining"` // Time until 8-hour break required (if applicable)
	TimeUntilReset     float64 `json:"time_until_reset"`     // Time until 10-hour break completes
	CurrentStatus      DutyStatus `json:"current_status"`
	StatusDuration     float64    `json:"status_duration"` // Duration in current status
	Violation          bool       `json:"violation"`
}
