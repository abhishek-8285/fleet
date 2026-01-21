package repositories

import (
	"github.com/fleetflow/backend/internal/models"
)

// AuthRepository defines the interface for authentication-related data operations
type AuthRepository interface {
	// OTP Operations
	DeleteOldOTPs(phone string) error
	GetRecentOTP(phone string) (*models.OTPVerification, error)
	CreateOTP(otp *models.OTPVerification) error
	GetOTPForVerification(phone, otp string) (*models.OTPVerification, error)
	UpdateOTP(otp *models.OTPVerification) error

	// User Operations
	GetUserByPhone(phone string) (*models.UserAccount, error)
	CreateUser(user *models.UserAccount) error
	UpdateUser(user *models.UserAccount) error
	GetUserByID(id uint) (*models.UserAccount, error)
	UpdateUserFields(userID uint, updates map[string]interface{}) error
}

// DriverRepository defines the interface for driver-related data operations
type DriverRepository interface {
	CreateDriver(driver *models.Driver) error
	GetDriverByPhone(phone string) (*models.Driver, error)
	GetDriverByID(id uint) (*models.Driver, error)
	GetDrivers(page, limit int, filters map[string]interface{}) ([]models.Driver, int64, error)
	UpdateDriver(driver *models.Driver) error
	DeleteDriver(id uint) error
	UpdateDriverStatus(id uint, status string) error
	GetDriversByStatus(status string, isActive bool) ([]models.Driver, error)
	CountDrivers(filters map[string]interface{}) (int64, error)
}

// VehicleRepository defines the interface for vehicle-related data operations
type VehicleRepository interface {
	CreateVehicle(vehicle *models.Vehicle) error
	GetVehicleByLicensePlate(plate string) (*models.Vehicle, error)
	GetVehicleByID(id uint) (*models.Vehicle, error)
	GetVehicles(page, limit int, filters map[string]interface{}) ([]models.Vehicle, int64, error)
	UpdateVehicle(vehicle *models.Vehicle) error
	DeleteVehicle(vehicle *models.Vehicle) error
	UpdateStatus(id uint, status string) error
	GetLatestLocation(vehicleID uint) (*models.LocationPing, error)
}

// TripRepository defines the interface for trip-related data operations
type TripRepository interface {
	CreateTrip(trip *models.Trip) error
	GetTripByID(id uint) (*models.Trip, error)
	GetTrips(page, limit int, filters map[string]interface{}) ([]models.Trip, int64, error)
	UpdateTrip(trip *models.Trip) error
	DeleteTrip(trip *models.Trip) error
	AssignTrip(tripID, driverID, vehicleID uint) (*models.Trip, error)
}

// UploadRepository defines the interface for upload-related data operations
type UploadRepository interface {
	CountUploads(filters map[string]interface{}) (int64, error)
}
