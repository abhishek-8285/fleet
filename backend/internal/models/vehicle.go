package models

import (
	"time"

	"gorm.io/gorm"
)

// VehicleStatus represents the current status of a vehicle
type VehicleStatus string

const (
	VehicleStatusActive      VehicleStatus = "ACTIVE"
	VehicleStatusMaintenance VehicleStatus = "MAINTENANCE"
	VehicleStatusParked      VehicleStatus = "PARKED"
	VehicleStatusInactive    VehicleStatus = "INACTIVE"
)

// VehicleType represents the type of vehicle
type VehicleType string

const (
	VehicleTypeTruck   VehicleType = "TRUCK"
	VehicleTypeVan     VehicleType = "VAN"
	VehicleTypeBike    VehicleType = "BIKE"
	VehicleTypePickup  VehicleType = "PICKUP"
	VehicleTypeTrailer VehicleType = "TRAILER"
)

// Vehicle represents a vehicle in the fleet
type Vehicle struct {
	ID               uint           `json:"id" gorm:"primaryKey"`
	LicensePlate     string         `json:"license_plate" gorm:"uniqueIndex;not null"`
	Make             string         `json:"make"`
	Model            string         `json:"model"`
	Year             *int           `json:"year,omitempty"`
	VehicleType      VehicleType    `json:"vehicle_type" gorm:"type:varchar(20);default:'TRUCK'"`
	Status           VehicleStatus  `json:"status" gorm:"type:varchar(20);default:'ACTIVE'"`
	FuelType         string         `json:"fuel_type" gorm:"default:'DIESEL'"`
	FuelCapacity     float64        `json:"fuel_capacity" gorm:"type:decimal(8,2)"`
	CurrentFuelLevel float64        `json:"current_fuel_level" gorm:"type:decimal(5,2);default:100"`
	Mileage          float64        `json:"mileage" gorm:"type:decimal(10,2);default:0"`
	IsActive         bool           `json:"is_active" gorm:"default:true"`
	PurchasedAt      *time.Time     `json:"purchased_at,omitempty"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `json:"-" gorm:"index"`

	// Compliance and documentation
	RegistrationNumber  string     `json:"registration_number,omitempty"`
	RegistrationExpiry  *time.Time `json:"registration_expiry,omitempty"`
	InsuranceNumber     string     `json:"insurance_number,omitempty"`
	InsuranceExpiry     *time.Time `json:"insurance_expiry,omitempty"`
	PollutionCertExpiry *time.Time `json:"pollution_cert_expiry,omitempty"`
	FitnessTestExpiry   *time.Time `json:"fitness_test_expiry,omitempty"`
	PermitExpiry        *time.Time `json:"permit_expiry,omitempty"`

	// Technical specifications
	EngineNumber  string  `json:"engine_number,omitempty"`
	ChassisNumber string  `json:"chassis_number,omitempty"`
	LoadCapacity  float64 `json:"load_capacity" gorm:"type:decimal(8,2)"`
	Dimensions    string  `json:"dimensions,omitempty"` // JSON string: {"length": 10, "width": 2.5, "height": 3}

	// Performance metrics
	AverageFuelEfficiency float64    `json:"average_fuel_efficiency" gorm:"type:decimal(5,2);default:0"`
	TotalTrips            int        `json:"total_trips" gorm:"default:0"`
	TotalKilometers       float64    `json:"total_kilometers" gorm:"type:decimal(12,2);default:0"`
	MaintenanceCost       float64    `json:"maintenance_cost" gorm:"type:decimal(12,2);default:0"`
	LastMaintenanceDate   *time.Time `json:"last_maintenance_date,omitempty"`
	NextMaintenanceDue    *time.Time `json:"next_maintenance_due,omitempty"`

	// GPS and tracking
	LastKnownLatitude  *float64   `json:"last_known_latitude,omitempty" gorm:"type:decimal(10,8)"`
	LastKnownLongitude *float64   `json:"last_known_longitude,omitempty" gorm:"type:decimal(11,8)"`
	LastLocationUpdate *time.Time `json:"last_location_update,omitempty"`

	// Associations
	Trips         []Trip         `json:"trips,omitempty" gorm:"foreignKey:VehicleID"`
	LocationPings []LocationPing `json:"location_pings,omitempty" gorm:"foreignKey:VehicleID"`
	FuelEvents    []FuelEvent    `json:"fuel_events,omitempty" gorm:"foreignKey:VehicleID"`
	FuelAlerts    []FuelAlert    `json:"fuel_alerts,omitempty" gorm:"foreignKey:VehicleID"`
	AuditLogs     []AuditLog     `json:"-" gorm:"foreignKey:VehicleID"`
}

// Note: VehicleCompliance is defined in analytics.go

// VehiclePerformance represents performance metrics for a vehicle
type VehiclePerformance struct {
	VehicleID             uint    `json:"vehicle_id"`
	LicensePlate          string  `json:"license_plate"`
	TotalTrips            int     `json:"total_trips"`
	TotalKilometers       float64 `json:"total_kilometers"`
	AverageFuelEfficiency float64 `json:"average_fuel_efficiency"`
	UtilizationRate       float64 `json:"utilization_rate"`
	MaintenanceCost       float64 `json:"maintenance_cost"`
	RevenueGenerated      float64 `json:"revenue_generated"`
	ProfitMargin          float64 `json:"profit_margin"`
}

// IsRegistrationExpiring checks if registration expires within given days
func (v *Vehicle) IsRegistrationExpiring(days int) bool {
	if v.RegistrationExpiry == nil {
		return false
	}
	return time.Until(*v.RegistrationExpiry) <= time.Duration(days)*24*time.Hour
}

// IsInsuranceExpiring checks if insurance expires within given days
func (v *Vehicle) IsInsuranceExpiring(days int) bool {
	if v.InsuranceExpiry == nil {
		return false
	}
	return time.Until(*v.InsuranceExpiry) <= time.Duration(days)*24*time.Hour
}

// IsPollutionCertExpiring checks if pollution certificate expires within given days
func (v *Vehicle) IsPollutionCertExpiring(days int) bool {
	if v.PollutionCertExpiry == nil {
		return false
	}
	return time.Until(*v.PollutionCertExpiry) <= time.Duration(days)*24*time.Hour
}

// IsMaintenanceDue checks if maintenance is due
func (v *Vehicle) IsMaintenanceDue() bool {
	if v.NextMaintenanceDue == nil {
		return false
	}
	return time.Now().After(*v.NextMaintenanceDue)
}

// IsFuelLow checks if fuel level is below threshold
func (v *Vehicle) IsFuelLow(threshold float64) bool {
	return v.CurrentFuelLevel < threshold
}

// IsAvailable checks if vehicle is available for assignment
func (v *Vehicle) IsAvailable() bool {
	return v.IsActive && v.Status == VehicleStatusActive && !v.IsMaintenanceDue()
}

// CanBeAssigned checks if vehicle can be assigned to a trip
func (v *Vehicle) CanBeAssigned() bool {
	return v.IsAvailable() &&
		!v.IsRegistrationExpiring(7) &&
		!v.IsInsuranceExpiring(7) &&
		!v.IsPollutionCertExpiring(7) &&
		!v.IsFuelLow(10) // At least 10% fuel
}

// UpdateLocation updates the vehicle's last known location
func (v *Vehicle) UpdateLocation(latitude, longitude float64) {
	v.LastKnownLatitude = &latitude
	v.LastKnownLongitude = &longitude
	now := time.Now()
	v.LastLocationUpdate = &now
}
