package dto

import (
	"time"

	"github.com/fleetflow/backend/internal/models"
)

// CreateDriverRequest represents the request to create a new driver
type CreateDriverRequest struct {
	Name              string     `json:"name" binding:"required,min=2,max=100" example:"राहुल शर्मा"`
	Phone             string     `json:"phone" binding:"required" validate:"e164" example:"+919876543210"`
	LicenseNumber     string     `json:"license_number" binding:"required,min=5,max=20" example:"DL1420110012345"`
	LicenseExpiry     *time.Time `json:"license_expiry,omitempty" example:"2025-12-31T00:00:00Z"`
	MedicalCertExpiry *time.Time `json:"medical_cert_expiry,omitempty" example:"2024-06-30T00:00:00Z"`
	Address           string     `json:"address,omitempty" example:"123 Main Street, New Delhi"`
	DateOfBirth       *time.Time `json:"date_of_birth,omitempty" example:"1985-01-15T00:00:00Z"`
	EmergencyName     string     `json:"emergency_name,omitempty" example:"प्रिया शर्मा"`
	EmergencyPhone    string     `json:"emergency_phone,omitempty" example:"+919876543211"`
	HiredAt           *time.Time `json:"hired_at,omitempty" example:"2024-01-01T00:00:00Z"`
}

// UpdateDriverRequest represents the request to update driver information
type UpdateDriverRequest struct {
	Name              *string    `json:"name,omitempty" validate:"omitempty,min=2,max=100" example:"राहुल शर्मा"`
	LicenseNumber     *string    `json:"license_number,omitempty" validate:"omitempty,min=5,max=20" example:"DL1420110012345"`
	LicenseExpiry     *time.Time `json:"license_expiry,omitempty" example:"2025-12-31T00:00:00Z"`
	MedicalCertExpiry *time.Time `json:"medical_cert_expiry,omitempty" example:"2024-06-30T00:00:00Z"`
	Status            *string    `json:"status,omitempty" validate:"omitempty,oneof=AVAILABLE ON_TRIP ON_BREAK OFFLINE MAINTENANCE" example:"AVAILABLE"`
	Address           *string    `json:"address,omitempty" example:"123 Main Street, New Delhi"`
	DateOfBirth       *time.Time `json:"date_of_birth,omitempty" example:"1985-01-15T00:00:00Z"`
	EmergencyName     *string    `json:"emergency_name,omitempty" example:"प्रिया शर्मा"`
	EmergencyPhone    *string    `json:"emergency_phone,omitempty" example:"+919876543211"`
	IsActive          *bool      `json:"is_active,omitempty" example:"true"`
}

// UpdateDriverStatusRequest represents the request to update driver status
type UpdateDriverStatusRequest struct {
	Status models.DriverStatus `json:"status" binding:"required" validate:"required,oneof=AVAILABLE ON_TRIP ON_BREAK OFFLINE MAINTENANCE" example:"AVAILABLE"`
	Reason string              `json:"reason,omitempty" example:"Driver started break"`
}

// DriverResponse represents driver data in API responses
type DriverResponse struct {
	ID                uint                `json:"id" example:"1"`
	Name              string              `json:"name" example:"राहुल शर्मा"`
	Phone             string              `json:"phone" example:"+919876543210"`
	LicenseNumber     string              `json:"license_number" example:"DL1420110012345"`
	LicenseExpiry     *time.Time          `json:"license_expiry,omitempty" example:"2025-12-31T00:00:00Z"`
	MedicalCertExpiry *time.Time          `json:"medical_cert_expiry,omitempty" example:"2024-06-30T00:00:00Z"`
	Status            models.DriverStatus `json:"status" example:"AVAILABLE"`
	Rating            float64             `json:"rating" example:"4.8"`
	TotalTrips        int                 `json:"total_trips" example:"150"`
	IsActive          bool                `json:"is_active" example:"true"`
	HiredAt           *time.Time          `json:"hired_at,omitempty" example:"2024-01-01T00:00:00Z"`
	CreatedAt         time.Time           `json:"created_at" example:"2024-01-01T10:00:00Z"`
	UpdatedAt         time.Time           `json:"updated_at" example:"2024-01-01T10:00:00Z"`

	// Profile information
	Address        string     `json:"address,omitempty" example:"123 Main Street, New Delhi"`
	DateOfBirth    *time.Time `json:"date_of_birth,omitempty" example:"1985-01-15T00:00:00Z"`
	EmergencyName  string     `json:"emergency_name,omitempty" example:"प्रिया शर्मा"`
	EmergencyPhone string     `json:"emergency_phone,omitempty" example:"+919876543211"`

	// Performance metrics
	FuelEfficiency      float64 `json:"fuel_efficiency" example:"12.5"`
	OnTimeDeliveries    int     `json:"on_time_deliveries" example:"140"`
	CustomerRatingSum   float64 `json:"customer_rating_sum" example:"720.0"`
	CustomerRatingCount int     `json:"customer_rating_count" example:"150"`

	// Compliance status
	ComplianceStatus *DriverComplianceInfo `json:"compliance_status,omitempty"`

	// Current assignment
	CurrentTripID    *uint `json:"current_trip_id,omitempty" example:"25"`
	CurrentVehicleID *uint `json:"current_vehicle_id,omitempty" example:"5"`
}

// DriverComplianceInfo represents driver compliance status
type DriverComplianceInfo struct {
	LicenseStatus          string  `json:"license_status" example:"VALID"`
	LicenseExpiryDays      *int    `json:"license_expiry_days,omitempty" example:"365"`
	MedicalCertStatus      string  `json:"medical_cert_status" example:"EXPIRING"`
	MedicalCertExpiryDays  *int    `json:"medical_cert_expiry_days,omitempty" example:"30"`
	OverallComplianceScore float64 `json:"overall_compliance_score" example:"85.5"`
}

// DriverPerformanceResponse represents driver performance metrics
type DriverPerformanceResponse struct {
	DriverID              uint    `json:"driver_id" example:"1"`
	Name                  string  `json:"name" example:"राहुल शर्मा"`
	Rating                float64 `json:"rating" example:"4.8"`
	TotalTrips            int     `json:"total_trips" example:"150"`
	CompletedTrips        int     `json:"completed_trips" example:"145"`
	OnTimePercentage      float64 `json:"on_time_percentage" example:"93.3"`
	FuelEfficiency        float64 `json:"fuel_efficiency" example:"12.5"`
	AverageCustomerRating float64 `json:"average_customer_rating" example:"4.8"`
	MonthlyKilometers     float64 `json:"monthly_kilometers" example:"2500.0"`
	SafetyScore           float64 `json:"safety_score" example:"95.0"`

	// Period-specific metrics
	Period    string    `json:"period" example:"MONTHLY"`
	StartDate time.Time `json:"start_date" example:"2024-01-01T00:00:00Z"`
	EndDate   time.Time `json:"end_date" example:"2024-01-31T23:59:59Z"`

	// Performance trends
	PerformanceTrend     string  `json:"performance_trend" example:"IMPROVING"`
	PreviousPeriodRating float64 `json:"previous_period_rating" example:"4.6"`
	RatingChange         float64 `json:"rating_change" example:"0.2"`
}

// DriversListResponse represents paginated list of drivers
type DriversListResponse struct {
	Drivers    []DriverResponse `json:"drivers"`
	Total      int64            `json:"total" example:"50"`
	Page       int              `json:"page" example:"1"`
	Limit      int              `json:"limit" example:"20"`
	TotalPages int              `json:"total_pages" example:"3"`
}

// DriverFilterParams represents driver filtering parameters
type DriverFilterParams struct {
	PaginationParams
	Status        string `form:"status" example:"AVAILABLE"`
	IsActive      *bool  `form:"is_active" example:"true"`
	LicenseExpiry *bool  `form:"license_expiry" example:"true"` // true = expiring soon
	Search        string `form:"search" example:"राहुल"`
	SortBy        string `form:"sort_by,default=name" example:"rating"`
	SortDesc      bool   `form:"sort_desc,default=false" example:"true"`
}

// DriverSummaryStats represents driver statistics summary
type DriverSummaryStats struct {
	TotalDrivers     int `json:"total_drivers" example:"50"`
	ActiveDrivers    int `json:"active_drivers" example:"45"`
	AvailableDrivers int `json:"available_drivers" example:"20"`
	OnTripDrivers    int `json:"on_trip_drivers" example:"15"`
	OnBreakDrivers   int `json:"on_break_drivers" example:"5"`
	OfflineDrivers   int `json:"offline_drivers" example:"5"`

	// Compliance warnings
	LicenseExpiringSoon int `json:"license_expiring_soon" example:"3"`
	MedicalCertExpiring int `json:"medical_cert_expiring" example:"2"`

	// Performance stats
	AverageRating      float64 `json:"average_rating" example:"4.7"`
	TopPerformerID     *uint   `json:"top_performer_id,omitempty" example:"5"`
	TopPerformerName   string  `json:"top_performer_name,omitempty" example:"अमित कुमार"`
	TopPerformerRating float64 `json:"top_performer_rating,omitempty" example:"4.9"`
}

// DriverAvailabilityResponse represents driver availability for trip assignment
type DriverAvailabilityResponse struct {
	DriverID        uint          `json:"driver_id" example:"1"`
	Name            string        `json:"name" example:"राहुल शर्मा"`
	Status          string        `json:"status" example:"AVAILABLE"`
	Rating          float64       `json:"rating" example:"4.8"`
	CurrentLocation *LocationInfo `json:"current_location,omitempty"`
	DistanceKm      *float64      `json:"distance_km,omitempty" example:"5.2"`
	EstimatedETA    *int          `json:"estimated_eta_minutes,omitempty" example:"15"`
	CanBeAssigned   bool          `json:"can_be_assigned" example:"true"`
	ReasonIfNot     string        `json:"reason_if_not,omitempty" example:"License expiring soon"`
}

// LocationInfo represents location information
type LocationInfo struct {
	Latitude  float64   `json:"latitude" example:"28.6139"`
	Longitude float64   `json:"longitude" example:"77.2090"`
	Address   string    `json:"address,omitempty" example:"Connaught Place, New Delhi"`
	Timestamp time.Time `json:"timestamp" example:"2024-01-01T12:00:00Z"`
}

// DriverActivityRequest represents driver activity logging
type DriverActivityRequest struct {
	ActivityType string                 `json:"activity_type" binding:"required" example:"BREAK_START"`
	Location     *LocationInfo          `json:"location,omitempty"`
	Notes        string                 `json:"notes,omitempty" example:"Taking lunch break"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
}

// DriverActivityResponse represents driver activity log entry
type DriverActivityResponse struct {
	ID           uint                   `json:"id" example:"123"`
	DriverID     uint                   `json:"driver_id" example:"1"`
	ActivityType string                 `json:"activity_type" example:"BREAK_START"`
	Location     *LocationInfo          `json:"location,omitempty"`
	Notes        string                 `json:"notes,omitempty" example:"Taking lunch break"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt    time.Time              `json:"created_at" example:"2024-01-01T12:00:00Z"`
}

// DriverLeaderboardResponse represents driver leaderboard
type DriverLeaderboardResponse struct {
	Rank             int     `json:"rank" example:"1"`
	DriverID         uint    `json:"driver_id" example:"1"`
	Name             string  `json:"name" example:"राहुल शर्मा"`
	Rating           float64 `json:"rating" example:"4.8"`
	TotalTrips       int     `json:"total_trips" example:"150"`
	OnTimePercentage float64 `json:"on_time_percentage" example:"93.3"`
	CustomerRating   float64 `json:"customer_rating" example:"4.8"`
	FuelEfficiency   float64 `json:"fuel_efficiency" example:"12.5"`
	SafetyScore      float64 `json:"safety_score" example:"95.0"`
	OverallScore     float64 `json:"overall_score" example:"92.1"`
	TrendDirection   string  `json:"trend_direction" example:"UP"`
	RankChange       int     `json:"rank_change" example:"2"`
}

// DriverWorkScheduleRequest represents driver work schedule
type DriverWorkScheduleRequest struct {
	DriverID  uint      `json:"driver_id" binding:"required" example:"1"`
	StartTime time.Time `json:"start_time" binding:"required" example:"2024-01-01T09:00:00Z"`
	EndTime   time.Time `json:"end_time" binding:"required" example:"2024-01-01T18:00:00Z"`
	ShiftType string    `json:"shift_type" binding:"required" example:"REGULAR"`
	MaxTrips  *int      `json:"max_trips,omitempty" example:"8"`
	MaxHours  *float64  `json:"max_hours,omitempty" example:"9.0"`
	Notes     string    `json:"notes,omitempty" example:"Regular day shift"`
}

// DriverDocumentRequest represents driver document upload request
type DriverDocumentRequest struct {
	DocumentType string     `json:"document_type" binding:"required" example:"LICENSE"`
	DocumentURL  string     `json:"document_url" binding:"required" example:"https://storage.com/doc123.pdf"`
	ExpiryDate   *time.Time `json:"expiry_date,omitempty" example:"2025-12-31T00:00:00Z"`
	Notes        string     `json:"notes,omitempty" example:"Updated license scan"`
}

// DriverAssignmentHistory represents driver assignment history
type DriverAssignmentHistory struct {
	TripID           uint       `json:"trip_id" example:"25"`
	VehicleID        uint       `json:"vehicle_id" example:"5"`
	VehiclePlate     string     `json:"vehicle_plate" example:"MH-12-AB-1234"`
	StartTime        time.Time  `json:"start_time" example:"2024-01-01T09:00:00Z"`
	EndTime          *time.Time `json:"end_time,omitempty" example:"2024-01-01T17:00:00Z"`
	Status           string     `json:"status" example:"COMPLETED"`
	CustomerName     string     `json:"customer_name" example:"ABC Company"`
	Route            string     `json:"route" example:"Delhi to Mumbai"`
	Distance         float64    `json:"distance" example:"1400.5"`
	Revenue          float64    `json:"revenue" example:"25000.00"`
	Rating           *float64   `json:"rating,omitempty" example:"4.8"`
	CustomerFeedback string     `json:"customer_feedback,omitempty" example:"Excellent service"`
}

// DriverStatsResponse represents driver statistics for mobile app
type DriverStatsResponse struct {
	Rating           float64 `json:"rating" example:"4.8"`
	TotalTrips       int     `json:"totalTrips" example:"127"`
	TodayEarnings    float64 `json:"todayEarnings" example:"850.0"`
	FuelEfficiency   float64 `json:"fuelEfficiency" example:"12.5"`
	OnTimeDeliveries int     `json:"onTimeDeliveries" example:"95"`
	CustomerRating   float64 `json:"customerRating" example:"4.7"`
}
