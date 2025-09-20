package models

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// DriverChangeRequest represents a request by a driver to change their profile information
type DriverChangeRequest struct {
	ID               uint           `json:"id" gorm:"primaryKey"`
	DriverID         uint           `json:"driver_id" gorm:"not null;index"`
	RequestType      string         `json:"request_type" gorm:"not null"` // PROFILE_UPDATE, DOCUMENT_UPDATE, EMERGENCY_CONTACT, BANK_DETAILS
	RequestedChanges datatypes.JSON `json:"requested_changes" gorm:"type:jsonb"`
	CurrentData      datatypes.JSON `json:"current_data" gorm:"type:jsonb"`
	Status           string         `json:"status" gorm:"default:'PENDING'"`  // PENDING, APPROVED, REJECTED, CANCELLED
	Priority         string         `json:"priority" gorm:"default:'NORMAL'"` // LOW, NORMAL, HIGH, URGENT
	Reason           string         `json:"reason"`
	SubmittedAt      time.Time      `json:"submitted_at" gorm:"not null"`
	ReviewedAt       *time.Time     `json:"reviewed_at,omitempty"`
	ReviewedBy       *uint          `json:"reviewed_by,omitempty" gorm:"index"`
	AdminComments    string         `json:"admin_comments"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `json:"-" gorm:"index"`

	// Associations
	Driver *Driver `json:"driver,omitempty" gorm:"foreignKey:DriverID"`
}

// TableName returns the table name for DriverChangeRequest
func (DriverChangeRequest) TableName() string {
	return "driver_change_requests"
}

// BeforeCreate sets the submitted timestamp
func (dcr *DriverChangeRequest) BeforeCreate(tx *gorm.DB) error {
	if dcr.SubmittedAt.IsZero() {
		dcr.SubmittedAt = time.Now()
	}
	return nil
}

// IsExpired checks if the change request has expired (older than 30 days)
func (dcr *DriverChangeRequest) IsExpired() bool {
	return time.Since(dcr.SubmittedAt) > 30*24*time.Hour
}

// CanBeCancelled checks if the request can be cancelled
func (dcr *DriverChangeRequest) CanBeCancelled() bool {
	return dcr.Status == "PENDING" && !dcr.IsExpired()
}

// GetPriorityLevel returns numeric priority for sorting
func (dcr *DriverChangeRequest) GetPriorityLevel() int {
	switch dcr.Priority {
	case "URGENT":
		return 4
	case "HIGH":
		return 3
	case "NORMAL":
		return 2
	case "LOW":
		return 1
	default:
		return 2
	}
}
