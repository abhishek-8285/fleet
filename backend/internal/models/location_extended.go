package models

import (
	"time"
)

// VehicleLocationResponse represents enriched vehicle location data
type VehicleLocationResponse struct {
	VehicleID      uint          `json:"vehicle_id"`
	LicensePlate   string        `json:"license_plate"`
	LatestPing     *LocationPing `json:"latest_ping"`
	IsOnline       bool          `json:"is_online"`
	IsMoving       bool          `json:"is_moving"`
	LastSeen       time.Duration `json:"last_seen"`
	DriverName     string        `json:"driver_name,omitempty"`
	SignalStrength string        `json:"signal_strength"`
}

// FleetLocationUpdate represents real-time fleet location updates
type FleetLocationUpdate struct {
	VehicleID    uint      `json:"vehicle_id"`
	LicensePlate string    `json:"license_plate"`
	Location     Location  `json:"location"`
	Speed        *float64  `json:"speed,omitempty"`
	Heading      *float64  `json:"heading,omitempty"`
	LastUpdated  time.Time `json:"last_updated"`
	UpdateType   string    `json:"update_type"`
}

// DriverLocation represents current driver location
type DriverLocation struct {
	DriverID     uint      `json:"driver_id"`
	DriverName   string    `json:"driver_name"`
	Latitude     float64   `json:"latitude"`
	Longitude    float64   `json:"longitude"`
	LastUpdated  time.Time `json:"last_updated"`
	Status       string    `json:"status"`
	VehicleID    *uint     `json:"vehicle_id,omitempty"`
	VehiclePlate string    `json:"vehicle_plate,omitempty"`
	TripID       *uint     `json:"trip_id,omitempty"`
	Speed        *float64  `json:"speed,omitempty"`
	Heading      *float64  `json:"heading,omitempty"`
	Accuracy     *float64  `json:"accuracy,omitempty"`
}

// LocationHistory represents historical location data with analytics
type LocationHistory struct {
	VehicleID     uint           `json:"vehicle_id"`
	StartTime     time.Time      `json:"start_time"`
	EndTime       time.Time      `json:"end_time"`
	Pings         []LocationPing `json:"pings"`
	TotalDistance float64        `json:"total_distance"`
	MaxSpeed      float64        `json:"max_speed"`
	AverageSpeed  float64        `json:"average_speed"`
	DrivingTime   time.Duration  `json:"driving_time"`
	TotalPings    int            `json:"total_pings"`
}
