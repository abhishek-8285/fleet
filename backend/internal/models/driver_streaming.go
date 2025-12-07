package models

import "time"

// Driver streaming and real-time data structures

// DriverStatusUpdate represents a driver status change
type DriverStatusUpdate struct {
	DriverID  uint      `json:"driver_id"`
	Name      string    `json:"name"`
	OldStatus string    `json:"old_status"`
	NewStatus string    `json:"new_status"`
	Reason    string    `json:"reason"`
	Timestamp time.Time `json:"timestamp"`
}

// DriverLocationUpdate represents a driver location update
type DriverLocationUpdate struct {
	DriverID         uint     `json:"driver_id"`
	Name             string   `json:"name"`
	Location         Location `json:"location"`
	Status           string   `json:"status"`
	CurrentTripID    uint     `json:"current_trip_id"`
	CurrentVehicleID uint     `json:"current_vehicle_id"`
}

// AvailableDriver represents an available driver for assignment
type AvailableDriver struct {
	Driver              Driver  `json:"driver"`
	DistanceKm          float64 `json:"distance_km"`
	EstimatedETAMinutes int     `json:"estimated_eta_minutes"`
	CanBeAssigned       bool    `json:"can_be_assigned"`
	ReasonIfNot         string  `json:"reason_if_not"`
}

// DriverSummaryStats represents driver summary statistics
type DriverSummaryStats struct {
	TotalDrivers        int     `json:"total_drivers"`
	ActiveDrivers       int     `json:"active_drivers"`
	AvailableDrivers    int     `json:"available_drivers"`
	OnTripDrivers       int     `json:"on_trip_drivers"`
	OnBreakDrivers      int     `json:"on_break_drivers"`
	OfflineDrivers      int     `json:"offline_drivers"`
	LicenseExpiringSoon int     `json:"license_expiring_soon"`
	MedicalCertExpiring int     `json:"medical_cert_expiring"`
	AverageRating       float64 `json:"average_rating"`
	TopPerformerID      uint    `json:"top_performer_id"`
	TopPerformerName    string  `json:"top_performer_name"`
	TopPerformerRating  float64 `json:"top_performer_rating"`
}

// Note: DriverPerformance and DriverCompliance are defined in analytics.go to avoid duplicates
