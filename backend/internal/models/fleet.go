package models

import (
	"time"

	"gorm.io/gorm"
)

// Fleet represents a group of vehicles/assets within an organization
type Fleet struct {
	ID             uint   `json:"id" gorm:"primaryKey"`
	Name           string `json:"name" gorm:"not null"`
	Description    string `json:"description"`
	OrganizationID uint   `json:"organization_id" gorm:"not null;index"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Associations
	Organization Organization `json:"-" gorm:"foreignKey:OrganizationID"`
	// Vehicles     []Vehicle    `json:"vehicles,omitempty" gorm:"foreignKey:FleetID"` // To be linked later
}
