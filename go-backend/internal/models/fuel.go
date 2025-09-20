package models

import (
	"time"

	"gorm.io/gorm"
)

// Alert related types
type FuelAlertType string
type AlertSeverity string

const (
	FuelAlertTypeFraudDetected     FuelAlertType = "FRAUD_DETECTED"
	FuelAlertTypeTheftSuspected    FuelAlertType = "THEFT_SUSPECTED"
	FuelAlertTypeEfficiencyAnomaly FuelAlertType = "EFFICIENCY_ANOMALY"
	FuelAlertTypePriceAnomaly      FuelAlertType = "PRICE_ANOMALY"

	AlertSeverityLow      AlertSeverity = "LOW"
	AlertSeverityMedium   AlertSeverity = "MEDIUM"
	AlertSeverityHigh     AlertSeverity = "HIGH"
	AlertSeverityCritical AlertSeverity = "CRITICAL"
)

// FuelEventStatus represents the verification status of a fuel event
type FuelEventStatus string

const (
	FuelEventStatusPending    FuelEventStatus = "PENDING"
	FuelEventStatusVerified   FuelEventStatus = "VERIFIED"
	FuelEventStatusSuspicious FuelEventStatus = "SUSPICIOUS"
	FuelEventStatusRejected   FuelEventStatus = "REJECTED"
)

// FuelEvent represents a fuel purchase/consumption event
type FuelEvent struct {
	ID            uint            `json:"id" gorm:"primaryKey"`
	Liters        float64         `json:"liters" gorm:"type:decimal(8,2);not null"`
	AmountINR     float64         `json:"amount_inr" gorm:"type:decimal(10,2);not null"`
	PricePerLiter float64         `json:"price_per_liter" gorm:"type:decimal(8,2)"`
	OdometerKm    float64         `json:"odometer_km" gorm:"type:decimal(10,2)"`
	FuelType      string          `json:"fuel_type" gorm:"default:'DIESEL'"`
	Status        FuelEventStatus `json:"status" gorm:"type:varchar(20);default:'PENDING'"`

	// Location information
	Location  string   `json:"location,omitempty"`
	Latitude  *float64 `json:"latitude,omitempty" gorm:"type:decimal(10,8)"`
	Longitude *float64 `json:"longitude,omitempty" gorm:"type:decimal(11,8)"`

	// Station information
	StationName  string `json:"station_name,omitempty"`
	StationBrand string `json:"station_brand,omitempty"` // HP, BPCL, IOC, etc.
	StationID    string `json:"station_id,omitempty"`

	// Receipt information
	ReceiptNumber   string `json:"receipt_number,omitempty"`
	ReceiptPhotoURL string `json:"receipt_photo_url,omitempty"`

	// Verification
	VerifiedBy        *uint      `json:"verified_by,omitempty" gorm:"index"`
	VerifiedAt        *time.Time `json:"verified_at,omitempty"`
	VerificationNotes string     `json:"verification_notes,omitempty"`

	// Fraud detection
	IsAuthorized bool    `json:"is_authorized" gorm:"default:true"`
	FraudScore   float64 `json:"fraud_score" gorm:"type:decimal(5,2);default:0"`
	FraudReason  string  `json:"fraud_reason,omitempty"`

	// Audit fields
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Foreign keys
	DriverID  *uint `json:"driver_id,omitempty" gorm:"index"`
	VehicleID uint  `json:"vehicle_id" gorm:"not null;index"`
	TripID    *uint `json:"trip_id,omitempty" gorm:"index"`

	// Associations
	Driver         *Driver      `json:"driver,omitempty" gorm:"foreignKey:DriverID"`
	Vehicle        *Vehicle     `json:"vehicle,omitempty" gorm:"foreignKey:VehicleID"`
	Trip           *Trip        `json:"trip,omitempty" gorm:"foreignKey:TripID"`
	VerifiedByUser *UserAccount `json:"verified_by_user,omitempty" gorm:"foreignKey:VerifiedBy"`

	// Computed/derived fields for API responses
	DriverName   string `json:"driver_name,omitempty" gorm:"-"`
	VehiclePlate string `json:"vehicle_plate,omitempty" gorm:"-"`
}

// FuelAlert represents an alert for suspicious fuel activity
type FuelAlert struct {
	ID          uint          `json:"id" gorm:"primaryKey"`
	AlertType   FuelAlertType `json:"alert_type" gorm:"not null"` // THEFT_SUSPECTED, UNAUTHORIZED_STOP, EXCESS_CONSUMPTION, GEOFENCE_VIOLATION
	Severity    AlertSeverity `json:"severity" gorm:"not null"`   // LOW, MEDIUM, HIGH, CRITICAL
	Title       string        `json:"title" gorm:"not null"`
	Description string        `json:"description"`
	Message     string        `json:"message"` // Added for service compatibility

	// Alert details
	DetectedAt     time.Time `json:"detected_at" gorm:"not null"`
	ExpectedValue  *float64  `json:"expected_value,omitempty" gorm:"type:decimal(10,2)"`
	ActualValue    *float64  `json:"actual_value,omitempty" gorm:"type:decimal(10,2)"`
	Variance       *float64  `json:"variance,omitempty" gorm:"type:decimal(8,2)"`
	ThresholdValue *float64  `json:"threshold_value,omitempty" gorm:"type:decimal(8,2)"`

	// Location
	Latitude  *float64 `json:"latitude,omitempty" gorm:"type:decimal(10,8)"`
	Longitude *float64 `json:"longitude,omitempty" gorm:"type:decimal(11,8)"`
	Location  string   `json:"location,omitempty"`

	// Resolution
	IsResolved      bool       `json:"is_resolved" gorm:"default:false"`
	ResolvedAt      *time.Time `json:"resolved_at,omitempty"`
	ResolvedBy      *uint      `json:"resolved_by,omitempty" gorm:"index"`
	ResolutionNotes string     `json:"resolution_notes,omitempty"`

	// Notifications
	IsNotified       bool       `json:"is_notified" gorm:"default:false"`
	NotificationSent *time.Time `json:"notification_sent,omitempty"`
	EscalationLevel  int        `json:"escalation_level" gorm:"default:0"`
	LastEscalatedAt  *time.Time `json:"last_escalated_at,omitempty"`

	// Audit fields
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Foreign keys
	VehicleID   uint  `json:"vehicle_id" gorm:"not null;index"`
	DriverID    *uint `json:"driver_id,omitempty" gorm:"index"`
	TripID      *uint `json:"trip_id,omitempty" gorm:"index"`
	FuelEventID *uint `json:"fuel_event_id,omitempty" gorm:"index"`

	// Associations
	Vehicle        *Vehicle     `json:"vehicle,omitempty" gorm:"foreignKey:VehicleID"`
	Driver         *Driver      `json:"driver,omitempty" gorm:"foreignKey:DriverID"`
	Trip           *Trip        `json:"trip,omitempty" gorm:"foreignKey:TripID"`
	FuelEvent      *FuelEvent   `json:"fuel_event,omitempty" gorm:"foreignKey:FuelEventID"`
	ResolvedByUser *UserAccount `json:"resolved_by_user,omitempty" gorm:"foreignKey:ResolvedBy"`
}

// FuelThreshold represents configurable thresholds for fuel monitoring
type FuelThreshold struct {
	ID            uint           `json:"id" gorm:"primaryKey"`
	VehicleID     *uint          `json:"vehicle_id,omitempty" gorm:"index"` // NULL means global threshold
	ThresholdType string         `json:"threshold_type" gorm:"not null"`    // CONSUMPTION_VARIANCE, EFFICIENCY_DROP, REFUEL_FREQUENCY
	Value         float64        `json:"value" gorm:"type:decimal(10,2);not null"`
	Unit          string         `json:"unit" gorm:"not null"` // PERCENTAGE, LITERS, KM_PER_LITER
	IsActive      bool           `json:"is_active" gorm:"default:true"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`

	// Associations
	Vehicle *Vehicle `json:"vehicle,omitempty" gorm:"foreignKey:VehicleID"`
}

// FuelStation represents a known fuel station
type FuelStation struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Name      string         `json:"name" gorm:"not null"`
	Brand     string         `json:"brand"` // HP, BPCL, IOC, Shell, etc.
	Address   string         `json:"address"`
	City      string         `json:"city"`
	State     string         `json:"state"`
	Pincode   string         `json:"pincode"`
	Latitude  float64        `json:"latitude" gorm:"type:decimal(10,8);not null"`
	Longitude float64        `json:"longitude" gorm:"type:decimal(11,8);not null"`
	IsActive  bool           `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// FuelAnalytics represents fuel consumption analytics
type FuelAnalytics struct {
	VehicleID               uint             `json:"vehicle_id"`
	LicensePlate            string           `json:"license_plate"`
	Period                  string           `json:"period"` // DAILY, WEEKLY, MONTHLY
	StartDate               time.Time        `json:"start_date"`
	EndDate                 time.Time        `json:"end_date"`
	TotalFuelConsumed       float64          `json:"total_fuel_consumed"`
	TotalDistance           float64          `json:"total_distance"`
	AverageFuelEfficiency   float64          `json:"average_fuel_efficiency"`
	AverageEfficiency       float64          `json:"average_efficiency"` // Alias for compatibility
	ExpectedFuelConsumption float64          `json:"expected_fuel_consumption"`
	ActualFuelConsumption   float64          `json:"actual_fuel_consumption"`
	FuelVariance            float64          `json:"fuel_variance"`
	TotalFuelCost           float64          `json:"total_fuel_cost"`
	CostPerKilometer        float64          `json:"cost_per_kilometer"`
	NumberOfRefuels         int              `json:"number_of_refuels"`
	TotalEvents             int              `json:"total_events"` // Added for service compatibility
	SuspiciousEvents        int              `json:"suspicious_events"`
	FraudAlertsCount        int              `json:"fraud_alerts_count"` // Added for service compatibility
	TheftSavings            float64          `json:"theft_savings"`
	CostSavings             float64          `json:"cost_savings"` // Alias for theft_savings
	TopEfficientVehicles    []TopPerformer   `json:"top_efficient_vehicles"`
	DailyTrends             []DailyFuelTrend `json:"daily_trends"`
}

// DailyFuelTrend represents daily fuel consumption trend
type DailyFuelTrend struct {
	Date         time.Time `json:"date"`
	FuelConsumed float64   `json:"fuel_consumed"`
	Distance     float64   `json:"distance"`
	Cost         float64   `json:"cost"`
	Efficiency   float64   `json:"efficiency"`
	EventsCount  int       `json:"events_count"`
}

// IsVerified checks if the fuel event is verified
func (fe *FuelEvent) IsVerified() bool {
	return fe.Status == FuelEventStatusVerified
}

// IsSuspicious checks if the fuel event is suspicious
func (fe *FuelEvent) IsSuspicious() bool {
	return fe.Status == FuelEventStatusSuspicious
}

// IsPending checks if the fuel event is pending verification
func (fe *FuelEvent) IsPending() bool {
	return fe.Status == FuelEventStatusPending
}

// CalculateEfficiency calculates fuel efficiency for this event
func (fe *FuelEvent) CalculateEfficiency(distanceTraveled float64) float64 {
	if fe.Liters == 0 {
		return 0
	}
	return distanceTraveled / fe.Liters
}

// MarkAsVerified marks the fuel event as verified
func (fe *FuelEvent) MarkAsVerified(verifiedBy uint, notes string) {
	fe.Status = FuelEventStatusVerified
	fe.VerifiedBy = &verifiedBy
	now := time.Now()
	fe.VerifiedAt = &now
	fe.VerificationNotes = notes
}

// MarkAsSuspicious marks the fuel event as suspicious
func (fe *FuelEvent) MarkAsSuspicious(verifiedBy uint, reason string) {
	fe.Status = FuelEventStatusSuspicious
	fe.VerifiedBy = &verifiedBy
	now := time.Now()
	fe.VerifiedAt = &now
	fe.FraudReason = reason
}

// IsHighSeverity checks if the alert is high severity
func (fa *FuelAlert) IsHighSeverity() bool {
	return fa.Severity == "HIGH" || fa.Severity == "CRITICAL"
}

// IsCritical checks if the alert is critical
func (fa *FuelAlert) IsCritical() bool {
	return fa.Severity == "CRITICAL"
}

// Resolve resolves the alert
func (fa *FuelAlert) Resolve(resolvedBy uint, notes string) {
	fa.IsResolved = true
	fa.ResolvedBy = &resolvedBy
	now := time.Now()
	fa.ResolvedAt = &now
	fa.ResolutionNotes = notes
}

// ShouldEscalate checks if the alert should be escalated
func (fa *FuelAlert) ShouldEscalate(escalationTimeoutMinutes int) bool {
	if fa.IsResolved {
		return false
	}

	if fa.LastEscalatedAt == nil {
		// First escalation after timeout from creation
		return time.Since(fa.CreatedAt) > time.Duration(escalationTimeoutMinutes)*time.Minute
	}

	// Subsequent escalations
	return time.Since(*fa.LastEscalatedAt) > time.Duration(escalationTimeoutMinutes)*time.Minute
}

// Escalate escalates the alert to the next level
func (fa *FuelAlert) Escalate() {
	fa.EscalationLevel++
	now := time.Now()
	fa.LastEscalatedAt = &now

	// Increase severity on escalation
	switch fa.Severity {
	case "LOW":
		fa.Severity = "MEDIUM"
	case "MEDIUM":
		fa.Severity = "HIGH"
	case "HIGH":
		fa.Severity = "CRITICAL"
	}
}
