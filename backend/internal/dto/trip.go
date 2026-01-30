package dto

import (
	"time"

	"github.com/fleetflow/backend/internal/models"
)

// CreateTripRequest represents the request to create a new trip
type CreateTripRequest struct {
	CustomerName   string  `json:"customer_name" binding:"required,min=2,max=100" example:"Rajesh Kumar"`
	CustomerPhone  string  `json:"customer_phone" binding:"required" validate:"e164" example:"+919876543210"`
	CustomerEmail  string  `json:"customer_email,omitempty" validate:"omitempty,email" example:"rajesh@example.com"`
	PickupAddress  string  `json:"pickup_address" binding:"required" example:"Mumbai Port, Sector 5"`
	DropoffAddress string  `json:"dropoff_address" binding:"required" example:"Delhi Warehouse, Okhla"`
	CargoWeight    float64 `json:"cargo_weight" binding:"required,min=1,max=100000" example:"5000"`
	CargoValue     float64 `json:"cargo_value,omitempty" example:"150000"`
	Description    string  `json:"cargo_description,omitempty" example:"Electronic goods"`
	BasePrice      float64 `json:"base_price,omitempty" example:"25000"`
}

// TripResponse represents trip data in API responses
type TripResponse struct {
	ID             uint              `json:"id" example:"1"`
	TrackingID     string            `json:"tracking_id" example:"RTC2401001"`
	CustomerName   string            `json:"customer_name" example:"Rajesh Kumar"`
	Status         models.TripStatus `json:"status" example:"SCHEDULED"`
	PickupAddress  string            `json:"pickup_address" example:"Mumbai Port"`
	DropoffAddress string            `json:"dropoff_address" example:"Delhi Warehouse"`
	CreatedAt      time.Time         `json:"created_at" example:"2024-01-01T12:00:00Z"`
}
