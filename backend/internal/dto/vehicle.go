package dto

import (
	"time"

	"github.com/fleetflow/backend/internal/models"
)

// CreateVehicleRequest represents the request to create a new vehicle
type CreateVehicleRequest struct {
	LicensePlate string             `json:"license_plate" binding:"required,min=4,max=15" example:"MH01AB1234"`
	Make         string             `json:"make" binding:"required" example:"Tata"`
	Model        string             `json:"model" binding:"required" example:"Prima"`
	Year         *int               `json:"year,omitempty" example:"2023"`
	VehicleType  models.VehicleType `json:"vehicle_type" binding:"required,oneof=TRUCK VAN BIKE PICKUP TRAILER" example:"TRUCK"`
	FuelType     string             `json:"fuel_type,omitempty" example:"DIESEL"`
	FuelCapacity float64            `json:"fuel_capacity" example:"400"`
	LoadCapacity float64            `json:"load_capacity" example:"15000"`
}

// VehicleResponse represents vehicle data in API responses
type VehicleResponse struct {
	ID               uint                 `json:"id" example:"1"`
	LicensePlate     string               `json:"license_plate" example:"MH01AB1234"`
	Make             string               `json:"make" example:"Tata"`
	Model            string               `json:"model" example:"Prima"`
	Year             *int                 `json:"year,omitempty" example:"2023"`
	VehicleType      models.VehicleType   `json:"vehicle_type" example:"TRUCK"`
	Status           models.VehicleStatus `json:"status" example:"ACTIVE"`
	FuelType         string               `json:"fuel_type" example:"DIESEL"`
	FuelCapacity     float64              `json:"fuel_capacity" example:"400"`
	CurrentFuelLevel float64              `json:"current_fuel_level" example:"85.5"`
	Mileage          float64              `json:"mileage" example:"12500.5"`
	IsActive         bool                 `json:"is_active" example:"true"`
	CreatedAt        time.Time            `json:"created_at" example:"2024-01-01T10:00:00Z"`
	UpdatedAt        time.Time            `json:"updated_at" example:"2024-01-01T10:00:00Z"`
	LoadCapacity     float64              `json:"load_capacity" example:"15000"`
}
