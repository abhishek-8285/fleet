package models

import (
	"time"

	"gorm.io/gorm"
)

// SubscriptionStatus represents the status of an organization's subscription
type SubscriptionStatus string

const (
	SubscriptionActive    SubscriptionStatus = "ACTIVE"
	SubscriptionInactive  SubscriptionStatus = "INACTIVE"
	SubscriptionPastDue   SubscriptionStatus = "PAST_DUE"
	SubscriptionTrial     SubscriptionStatus = "TRIAL"
	SubscriptionCancelled SubscriptionStatus = "CANCELLED"
)

// Organization represents a tenant in the system
type Organization struct {
	ID           uint   `json:"id" gorm:"primaryKey"`
	Name         string `json:"name" gorm:"not null"`
	Code         string `json:"code" gorm:"uniqueIndex;not null"` // Unique identifier for the org (e.g. slug)
	Address      string `json:"address"`
	ContactName  string `json:"contact_name"`
	ContactPhone string `json:"contact_phone"`
	ContactEmail string `json:"contact_email"`

	// Billing & Subscription
	SubscriptionStatus SubscriptionStatus `json:"subscription_status" gorm:"default:'TRIAL'"`
	StripeCustomerID   string             `json:"stripe_customer_id,omitempty"`
	SubscriptionPlan   string             `json:"subscription_plan" gorm:"default:'FREE'"`
	TrialEndsAt        *time.Time         `json:"trial_ends_at,omitempty"`

	// Settings
	Timezone string `json:"timezone" gorm:"default:'UTC'"`
	Locale   string `json:"locale" gorm:"default:'en-US'"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Associations
	Fleets []Fleet       `json:"fleets,omitempty" gorm:"foreignKey:OrganizationID"`
	Users  []UserAccount `json:"users,omitempty" gorm:"foreignKey:OrganizationID"`
}
