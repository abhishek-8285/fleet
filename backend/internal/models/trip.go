package models

import (
	"time"

	"gorm.io/gorm"
)

// TripStatus represents the current status of a trip
type TripStatus string

const (
	TripStatusScheduled  TripStatus = "SCHEDULED"
	TripStatusAssigned   TripStatus = "ASSIGNED"
	TripStatusInProgress TripStatus = "IN_PROGRESS"
	TripStatusPaused     TripStatus = "PAUSED"
	TripStatusCompleted  TripStatus = "COMPLETED"
	TripStatusCancelled  TripStatus = "CANCELLED"
	TripStatusDelayed    TripStatus = "DELAYED"
)

// Trip represents a trip/delivery in the system
type Trip struct {
	ID            uint   `json:"id" gorm:"primaryKey"`
	TrackingID    string `json:"tracking_id" gorm:"uniqueIndex;not null"`
	CustomerName  string `json:"customer_name" gorm:"not null"`
	CustomerPhone string `json:"customer_phone"`
	CustomerEmail string `json:"customer_email,omitempty"`

	// Route information
	PickupAddress    string  `json:"pickup_address" gorm:"not null"`
	PickupLatitude   float64 `json:"pickup_latitude" gorm:"type:decimal(10,8)"`
	PickupLongitude  float64 `json:"pickup_longitude" gorm:"type:decimal(11,8)"`
	DropoffAddress   string  `json:"dropoff_address" gorm:"not null"`
	DropoffLatitude  float64 `json:"dropoff_latitude" gorm:"type:decimal(10,8)"`
	DropoffLongitude float64 `json:"dropoff_longitude" gorm:"type:decimal(11,8)"`

	// Route details
	Waypoints            []byte `json:"waypoints" gorm:"type:jsonb"` // JSON array of ordered stops
	RoutePolyline        string `json:"route_polyline,omitempty"`    // Encoded polyline
	CurrentWaypointIndex int    `json:"current_waypoint_index" gorm:"default:0"`

	// Trip details
	Distance          float64    `json:"distance" gorm:"type:decimal(8,2)"` // in kilometers
	EstimatedDuration int        `json:"estimated_duration"`                // in minutes
	ActualDuration    *int       `json:"actual_duration,omitempty"`         // in minutes
	Status            TripStatus `json:"status" gorm:"type:varchar(20);default:'SCHEDULED'"`
	Priority          int        `json:"priority" gorm:"default:1"` // 1=Low, 2=Medium, 3=High, 4=Urgent

	// Cargo information
	CargoDescription    string  `json:"cargo_description,omitempty"`
	CargoWeight         float64 `json:"cargo_weight" gorm:"type:decimal(8,2)"` // in kg
	CargoValue          float64 `json:"cargo_value" gorm:"type:decimal(12,2)"` // in INR
	SpecialInstructions string  `json:"special_instructions,omitempty"`

	// Pricing
	BasePrice     float64 `json:"base_price" gorm:"type:decimal(10,2)"`
	FuelSurcharge float64 `json:"fuel_surcharge" gorm:"type:decimal(8,2);default:0"`
	TollCharges   float64 `json:"toll_charges" gorm:"type:decimal(8,2);default:0"`
	TotalAmount   float64 `json:"total_amount" gorm:"type:decimal(12,2)"`
	PaymentStatus string  `json:"payment_status" gorm:"default:'PENDING'"` // PENDING, PAID, FAILED

	// Timing
	ScheduledPickupTime *time.Time `json:"scheduled_pickup_time,omitempty"`
	ActualPickupTime    *time.Time `json:"actual_pickup_time,omitempty"`
	EstimatedArrival    *time.Time `json:"estimated_arrival,omitempty"`
	ActualArrival       *time.Time `json:"actual_arrival,omitempty"`

	// Performance metrics
	CustomerRating   *float64 `json:"customer_rating,omitempty" gorm:"type:decimal(3,2)"`
	CustomerFeedback string   `json:"customer_feedback,omitempty"`
	OnTimeDelivery   bool     `json:"on_time_delivery" gorm:"default:false"`

	// Audit fields
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Foreign keys
	DriverID  *uint `json:"driver_id,omitempty" gorm:"index"`
	VehicleID *uint `json:"vehicle_id,omitempty" gorm:"index"`

	// Associations
	Driver        *Driver        `json:"driver,omitempty" gorm:"foreignKey:DriverID"`
	Vehicle       *Vehicle       `json:"vehicle,omitempty" gorm:"foreignKey:VehicleID"`
	LocationPings []LocationPing `json:"location_pings,omitempty" gorm:"foreignKey:TripID"`
	FuelEvents    []FuelEvent    `json:"fuel_events,omitempty" gorm:"foreignKey:TripID"`
	Uploads       []Upload       `json:"uploads,omitempty" gorm:"foreignKey:TripID"`
	AuditLogs     []AuditLog     `json:"-" gorm:"foreignKey:TripID"`
}

// TripAnalytics represents analytics data for a trip
type TripAnalytics struct {
	TripID             uint     `json:"trip_id"`
	TrackingID         string   `json:"tracking_id"`
	CustomerName       string   `json:"customer_name"`
	Distance           float64  `json:"distance"`
	EstimatedDuration  int      `json:"estimated_duration"`
	ActualDuration     *int     `json:"actual_duration,omitempty"`
	DelayMinutes       *int     `json:"delay_minutes,omitempty"`
	FuelEfficiency     float64  `json:"fuel_efficiency"`
	FuelCost           float64  `json:"fuel_cost"`
	TotalRevenue       float64  `json:"total_revenue"`
	ProfitMargin       float64  `json:"profit_margin"`
	CustomerRating     *float64 `json:"customer_rating,omitempty"`
	OnTimeDelivery     bool     `json:"on_time_delivery"`
	DriverPerformance  float64  `json:"driver_performance"`
	VehicleUtilization float64  `json:"vehicle_utilization"`
}

// TripSummary represents a summary of trip statistics
type TripSummary struct {
	TotalTrips     int     `json:"total_trips"`
	CompletedTrips int     `json:"completed_trips"`
	ActiveTrips    int     `json:"active_trips"`
	CancelledTrips int     `json:"cancelled_trips"`
	TotalDistance  float64 `json:"total_distance"`
	TotalRevenue   float64 `json:"total_revenue"`
	AverageRating  float64 `json:"average_rating"`
	OnTimeRate     float64 `json:"on_time_rate"`
	CompletionRate float64 `json:"completion_rate"`
}

// IsInProgress checks if the trip is currently in progress
func (t *Trip) IsInProgress() bool {
	return t.Status == TripStatusInProgress
}

// IsCompleted checks if the trip is completed
func (t *Trip) IsCompleted() bool {
	return t.Status == TripStatusCompleted
}

// IsCancelled checks if the trip is cancelled
func (t *Trip) IsCancelled() bool {
	return t.Status == TripStatusCancelled
}

// IsScheduled checks if the trip is scheduled
func (t *Trip) IsScheduled() bool {
	return t.Status == TripStatusScheduled
}

// CanBeStarted checks if the trip can be started
func (t *Trip) CanBeStarted() bool {
	return (t.Status == TripStatusScheduled || t.Status == TripStatusAssigned) &&
		t.DriverID != nil && t.VehicleID != nil
}

// CanBePaused checks if the trip can be paused
func (t *Trip) CanBePaused() bool {
	return t.Status == TripStatusInProgress
}

// CanBeResumed checks if the trip can be resumed
func (t *Trip) CanBeResumed() bool {
	return t.Status == TripStatusPaused
}

// CanBeCompleted checks if the trip can be completed
func (t *Trip) CanBeCompleted() bool {
	return t.Status == TripStatusInProgress
}

// CalculateDelay calculates delay in minutes if any
func (t *Trip) CalculateDelay() *int {
	if t.EstimatedArrival == nil || t.ActualArrival == nil {
		return nil
	}

	delay := int(t.ActualArrival.Sub(*t.EstimatedArrival).Minutes())
	if delay > 0 {
		return &delay
	}
	return nil
}

// IsDelayed checks if the trip is delayed
func (t *Trip) IsDelayed() bool {
	if t.EstimatedArrival == nil {
		return false
	}

	if t.ActualArrival != nil {
		return t.ActualArrival.After(*t.EstimatedArrival)
	}

	// If trip is in progress and current time is past estimated arrival
	if t.IsInProgress() {
		return time.Now().After(*t.EstimatedArrival)
	}

	return false
}

// CalculateProgress calculates trip progress percentage
func (t *Trip) CalculateProgress() float64 {
	if !t.IsInProgress() {
		if t.IsCompleted() {
			return 100.0
		}
		return 0.0
	}

	if t.ActualPickupTime == nil || t.EstimatedArrival == nil {
		return 0.0
	}

	totalDuration := t.EstimatedArrival.Sub(*t.ActualPickupTime)
	elapsedDuration := time.Since(*t.ActualPickupTime)

	if totalDuration <= 0 {
		return 0.0
	}

	progress := float64(elapsedDuration) / float64(totalDuration) * 100
	if progress > 100 {
		return 100.0
	}

	return progress
}

// UpdateETA updates the estimated arrival time
func (t *Trip) UpdateETA(newETA time.Time) {
	t.EstimatedArrival = &newETA
}

// StartTrip starts the trip
func (t *Trip) StartTrip() error {
	if !t.CanBeStarted() {
		return gorm.ErrInvalidTransaction
	}

	now := time.Now()
	t.Status = TripStatusInProgress
	t.ActualPickupTime = &now

	return nil
}

// CompleteTrip completes the trip
func (t *Trip) CompleteTrip() error {
	if !t.CanBeCompleted() {
		return gorm.ErrInvalidTransaction
	}

	now := time.Now()
	t.Status = TripStatusCompleted
	t.ActualArrival = &now

	// Calculate actual duration
	if t.ActualPickupTime != nil {
		duration := int(now.Sub(*t.ActualPickupTime).Minutes())
		t.ActualDuration = &duration
	}

	// Check if delivery was on time
	if t.EstimatedArrival != nil {
		t.OnTimeDelivery = !now.After(*t.EstimatedArrival)
	}

	return nil
}
