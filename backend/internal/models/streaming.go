package models

import "time"

// Location represents a simple GPS coordinate (for streaming APIs)
type Location struct {
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	Accuracy  float64   `json:"accuracy"`
	Timestamp time.Time `json:"timestamp"`
}

// GeofenceAlert represents a geofence violation alert
type GeofenceAlert struct {
	VehicleID    uint      `json:"vehicle_id"`
	LicensePlate string    `json:"license_plate"`
	GeofenceID   uint      `json:"geofence_id"`
	GeofenceName string    `json:"geofence_name"`
	EventType    string    `json:"event_type"` // enter, exit, dwell
	Location     Location  `json:"location"`
	Severity     string    `json:"severity"`
	Description  string    `json:"description"`
	Timestamp    time.Time `json:"timestamp"`
	DriverID     uint      `json:"driver_id"`
	DriverName   string    `json:"driver_name"`
	TripID       uint      `json:"trip_id"`
}

// StreamingRouteDeviation represents a route deviation event for streaming
type StreamingRouteDeviation struct {
	TripID            uint      `json:"trip_id"`
	TrackingID        string    `json:"tracking_id"`
	VehicleID         uint      `json:"vehicle_id"`
	LicensePlate      string    `json:"license_plate"`
	DriverID          uint      `json:"driver_id"`
	DriverName        string    `json:"driver_name"`
	DeviationDistance float64   `json:"deviation_distance"`
	DeviationDuration int       `json:"deviation_duration"`
	DeviationStart    Location  `json:"deviation_start"`
	CurrentLocation   Location  `json:"current_location"`
	Reason            string    `json:"reason"`
	Severity          string    `json:"severity"`
	StartTime         time.Time `json:"start_time"`
	Timestamp         time.Time `json:"timestamp"`
}

// LocationEvent represents a comprehensive location event
type LocationEvent struct {
	EventID      string                   `json:"event_id"`
	EventType    string                   `json:"event_type"`
	VehicleID    uint                     `json:"vehicle_id"`
	LicensePlate string                   `json:"license_plate"`
	DriverID     uint                     `json:"driver_id"`
	DriverName   string                   `json:"driver_name"`
	Location     Location                 `json:"location"`
	Severity     string                   `json:"severity"`
	Description  string                   `json:"description"`
	Metadata     map[string]string        `json:"metadata"`
	Timestamp    time.Time                `json:"timestamp"`
	GeofenceData *GeofenceAlert           `json:"geofence_data,omitempty"`
	RouteData    *StreamingRouteDeviation `json:"route_data,omitempty"`
}

// FleetLocation represents a vehicle's current location in fleet context
type FleetLocation struct {
	VehicleID       uint      `json:"vehicle_id"`
	LicensePlate    string    `json:"license_plate"`
	Location        Location  `json:"location"`
	Status          string    `json:"status"`
	Speed           float64   `json:"speed"`
	Heading         float64   `json:"heading"`
	CurrentDriverID uint      `json:"current_driver_id"`
	DriverName      string    `json:"driver_name"`
	DriverStatus    string    `json:"driver_status"`
	CurrentTripID   uint      `json:"current_trip_id"`
	TripStatus      string    `json:"trip_status"`
	FuelLevel       float64   `json:"fuel_level"`
	LastUpdate      time.Time `json:"last_update"`
}

// VehicleLocation represents vehicle location with context
type VehicleLocation struct {
	LatestPing      LocationPing `json:"latest_ping"`
	Status          string       `json:"status"`
	CurrentDriverID uint         `json:"current_driver_id"`
	DriverName      string       `json:"driver_name"`
	CurrentTripID   uint         `json:"current_trip_id"`
	LastUpdate      time.Time    `json:"last_update"`
}

// Note: DriverLocation, LocationHistory, FuelTheftAlert, FuelAnomaly, and FuelEfficiencyUpdate
// are now defined in location_extended.go and ml.go to avoid duplicates

// StreamingFuelAnalytics represents fuel analytics data for streaming
type StreamingFuelAnalytics struct {
	Period                  string               `json:"period"`
	StartDate               time.Time            `json:"start_date"`
	EndDate                 time.Time            `json:"end_date"`
	TotalFuelConsumed       float64              `json:"total_fuel_consumed"`
	TotalFuelCost           float64              `json:"total_fuel_cost"`
	AverageFuelEfficiency   float64              `json:"average_fuel_efficiency"`
	CostPerKilometer        float64              `json:"cost_per_kilometer"`
	NumberOfRefuels         int                  `json:"number_of_refuels"`
	SuspiciousEvents        int                  `json:"suspicious_events"`
	TheftSavings            float64              `json:"theft_savings"`
	TopEfficientVehicles    []VehicleFuelSummary `json:"top_efficient_vehicles"`
	WorstPerformingVehicles []VehicleFuelSummary `json:"worst_performing_vehicles"`
	DailyTrends             []DailyFuelSummary   `json:"daily_trends"`
}

// VehicleFuelSummary represents vehicle fuel summary
type VehicleFuelSummary struct {
	VehicleID        uint    `json:"vehicle_id"`
	LicensePlate     string  `json:"license_plate"`
	FuelEfficiency   float64 `json:"fuel_efficiency"`
	TotalCost        float64 `json:"total_cost"`
	SuspiciousEvents int     `json:"suspicious_events"`
}

// DailyFuelSummary represents daily fuel summary
type DailyFuelSummary struct {
	Date              time.Time `json:"date"`
	TotalFuel         float64   `json:"total_fuel"`
	TotalCost         float64   `json:"total_cost"`
	AverageEfficiency float64   `json:"average_efficiency"`
	EventsCount       int       `json:"events_count"`
}
