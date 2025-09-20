package models

import (
	"time"

	"gorm.io/gorm"
)

// DriverStatus represents the current status of a driver
type DriverStatus string

const (
	DriverStatusAvailable   DriverStatus = "AVAILABLE"
	DriverStatusOnTrip      DriverStatus = "ON_TRIP"
	DriverStatusOnBreak     DriverStatus = "ON_BREAK"
	DriverStatusOffline     DriverStatus = "OFFLINE"
	DriverStatusMaintenance DriverStatus = "MAINTENANCE"
)

// Driver represents a driver in the fleet
type Driver struct {
	ID                uint           `json:"id" gorm:"primaryKey"`
	Name              string         `json:"name" gorm:"not null"`
	Phone             string         `json:"phone" gorm:"uniqueIndex;not null"`
	LicenseNumber     string         `json:"license_number" gorm:"uniqueIndex"`
	LicenseExpiry     *time.Time     `json:"license_expiry,omitempty"`
	MedicalCertExpiry *time.Time     `json:"medical_cert_expiry,omitempty"`
	Status            DriverStatus   `json:"status" gorm:"type:varchar(20);default:'AVAILABLE'"`
	Rating            float64        `json:"rating" gorm:"type:decimal(3,2);default:5.0"`
	TotalTrips        int            `json:"total_trips" gorm:"default:0"`
	IsActive          bool           `json:"is_active" gorm:"default:true"`
	HiredAt           *time.Time     `json:"hired_at,omitempty"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `json:"-" gorm:"index"`

	// Profile information
	Address        string     `json:"address,omitempty"`
	DateOfBirth    *time.Time `json:"date_of_birth,omitempty"`
	EmergencyName  string     `json:"emergency_name,omitempty"`
	EmergencyPhone string     `json:"emergency_phone,omitempty"`

	// Performance metrics
	FuelEfficiency      float64 `json:"fuel_efficiency" gorm:"type:decimal(5,2);default:0"`
	OnTimeDeliveries    int     `json:"on_time_deliveries" gorm:"default:0"`
	CustomerRatingSum   float64 `json:"customer_rating_sum" gorm:"type:decimal(10,2);default:0"`
	CustomerRatingCount int     `json:"customer_rating_count" gorm:"default:0"`

	// Associations
	UserAccount   *UserAccount   `json:"user_account,omitempty" gorm:"foreignKey:DriverID"`
	Trips         []Trip         `json:"trips,omitempty" gorm:"foreignKey:DriverID"`
	LocationPings []LocationPing `json:"location_pings,omitempty" gorm:"foreignKey:DriverID"`
	FuelEvents    []FuelEvent    `json:"fuel_events,omitempty" gorm:"foreignKey:DriverID"`
	AuditLogs     []AuditLog     `json:"-" gorm:"foreignKey:DriverID"`
}

// DriverPerformance represents calculated performance metrics
type DriverPerformance struct {
	DriverID              uint    `json:"driver_id"`
	Name                  string  `json:"name"`
	Rating                float64 `json:"rating"`
	TotalTrips            int     `json:"total_trips"`
	CompletedTrips        int     `json:"completed_trips"`
	OnTimePercentage      float64 `json:"on_time_percentage"`
	FuelEfficiency        float64 `json:"fuel_efficiency"`
	AverageCustomerRating float64 `json:"average_customer_rating"`
	MonthlyKilometers     float64 `json:"monthly_kilometers"`
	SafetyScore           float64 `json:"safety_score"`
}

// Note: DriverCompliance is defined in analytics.go

// IsLicenseExpiring checks if license expires within given days
func (d *Driver) IsLicenseExpiring(days int) bool {
	if d.LicenseExpiry == nil {
		return false
	}
	return time.Until(*d.LicenseExpiry) <= time.Duration(days)*24*time.Hour
}

// IsMedicalCertExpiring checks if medical certificate expires within given days
func (d *Driver) IsMedicalCertExpiring(days int) bool {
	if d.MedicalCertExpiry == nil {
		return false
	}
	return time.Until(*d.MedicalCertExpiry) <= time.Duration(days)*24*time.Hour
}

// CalculateAverageRating calculates the average customer rating
func (d *Driver) CalculateAverageRating() float64 {
	if d.CustomerRatingCount == 0 {
		return 0
	}
	return d.CustomerRatingSum / float64(d.CustomerRatingCount)
}

// IsAvailable checks if driver is available for assignment
func (d *Driver) IsAvailable() bool {
	return d.IsActive && d.Status == DriverStatusAvailable
}

// CanBeAssigned checks if driver can be assigned to a trip
func (d *Driver) CanBeAssigned() bool {
	return d.IsAvailable() && !d.IsLicenseExpiring(7) && !d.IsMedicalCertExpiring(7)
}
