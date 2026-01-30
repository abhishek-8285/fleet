package dto

import (
	"time"

	"github.com/fleetflow/backend/internal/models"
)

// SendOTPRequest represents the request to send OTP
type SendOTPRequest struct {
	Phone string `json:"phone" binding:"required" validate:"required,e164" example:"+919876543210"`
}

// SendOTPResponse represents the response after sending OTP
type SendOTPResponse struct {
	Message   string    `json:"message" example:"OTP sent successfully"`
	ExpiresAt time.Time `json:"expires_at" example:"2024-01-01T12:05:00Z"`
	RequestID string    `json:"request_id" example:"otp_123456"`
}

// VerifyOTPRequest represents the request to verify OTP
type VerifyOTPRequest struct {
	Phone string `json:"phone" binding:"required" validate:"required,e164" example:"+919876543210"`
	OTP   string `json:"otp" binding:"required,len=6" validate:"required,numeric,len=6" example:"123456"`
}

// VerifyOTPResponse represents the response after successful OTP verification
type VerifyOTPResponse struct {
	Message      string    `json:"message" example:"Login successful"`
	AccessToken  string    `json:"access_token" example:"eyJhbGciOiJIUzI1NiIs..."`
	RefreshToken string    `json:"refresh_token" example:"eyJhbGciOiJIUzI1NiIs..."`
	ExpiresIn    int       `json:"expires_in" example:"86400"`
	User         *UserInfo `json:"user"`
}

// RefreshTokenRequest represents the request to refresh access token
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required" example:"eyJhbGciOiJIUzI1NiIs..."`
}

// RefreshTokenResponse represents the response after token refresh
type RefreshTokenResponse struct {
	AccessToken  string `json:"access_token" example:"eyJhbGciOiJIUzI1NiIs..."`
	RefreshToken string `json:"refresh_token" example:"eyJhbGciOiJIUzI1NiIs..."`
	ExpiresIn    int    `json:"expires_in" example:"86400"`
}

// UserInfo represents user information in responses
type UserInfo struct {
	ID       uint        `json:"id" example:"1"`
	Phone    string      `json:"phone" example:"+919876543210"`
	Role     models.Role `json:"role" example:"DRIVER"`
	IsActive bool        `json:"is_active" example:"true"`
	DriverID *uint       `json:"driver_id,omitempty" example:"123"`
	Driver   *DriverInfo `json:"driver,omitempty"`
}

// DriverInfo represents driver information in user responses
type DriverInfo struct {
	ID     uint    `json:"id" example:"123"`
	Name   string  `json:"name" example:"राहुल शर्मा"`
	Status string  `json:"status" example:"AVAILABLE"`
	Rating float64 `json:"rating" example:"4.8"`
}

// UpdateProfileRequest represents the request to update user profile
type UpdateProfileRequest struct {
	Name  string `json:"name,omitempty" example:"राहुल शर्मा"`
	Email string `json:"email,omitempty" example:"rahul@example.com"`
}

// LogoutRequest represents the logout request
type LogoutRequest struct {
	RefreshToken string `json:"refresh_token,omitempty"`
}

// LogoutResponse represents the logout response
type LogoutResponse struct {
	Message string `json:"message" example:"Logged out successfully"`
}

// CreateUserRequest represents admin request to create user
type CreateUserRequest struct {
	Phone string      `json:"phone" binding:"required" validate:"required,e164" example:"+919876543210"`
	Role  models.Role `json:"role" binding:"required" validate:"required,oneof=ADMIN DRIVER" example:"DRIVER"`
}

// UserResponse represents user data in admin responses
type UserResponse struct {
	ID        uint        `json:"id" example:"1"`
	Phone     string      `json:"phone" example:"+919876543210"`
	Role      models.Role `json:"role" example:"DRIVER"`
	IsActive  bool        `json:"is_active" example:"true"`
	LastLogin *time.Time  `json:"last_login,omitempty" example:"2024-01-01T12:00:00Z"`
	CreatedAt time.Time   `json:"created_at" example:"2024-01-01T10:00:00Z"`
	DriverID  *uint       `json:"driver_id,omitempty" example:"123"`
	Driver    *DriverInfo `json:"driver,omitempty"`
}

// UsersListResponse represents paginated list of users
type UsersListResponse struct {
	Users      []UserResponse `json:"users"`
	Total      int64          `json:"total" example:"150"`
	Page       int            `json:"page" example:"1"`
	Limit      int            `json:"limit" example:"20"`
	TotalPages int            `json:"total_pages" example:"8"`
}

// UpdateUserRequest represents admin request to update user
type UpdateUserRequest struct {
	Role     *models.Role `json:"role,omitempty" validate:"omitempty,oneof=ADMIN DRIVER" example:"ADMIN"`
	IsActive *bool        `json:"is_active,omitempty" example:"false"`
}

// ResetPasswordRequest represents admin request to reset user password
type ResetPasswordRequest struct {
	// For OTP-based system, this would trigger sending new OTP
	Phone string `json:"phone" binding:"required" validate:"required,e164" example:"+919876543210"`
}

// APIError represents standardized error response
type APIError struct {
	Error   string            `json:"error" example:"validation_failed"`
	Message string            `json:"message" example:"Invalid input data"`
	Code    int               `json:"code" example:"400"`
	Details map[string]string `json:"details,omitempty"`
}

// SuccessResponse represents generic success response
type SuccessResponse struct {
	Message string      `json:"message" example:"Operation completed successfully"`
	Data    interface{} `json:"data,omitempty"`
}

// PaginationParams represents common pagination parameters
type PaginationParams struct {
	Page  int `form:"page,default=1" validate:"min=1" example:"1"`
	Limit int `form:"limit,default=20" validate:"min=1,max=100" example:"20"`
}

// DateRangeParams represents date range filtering
type DateRangeParams struct {
	StartDate *time.Time `form:"start_date" example:"2024-01-01T00:00:00Z"`
	EndDate   *time.Time `form:"end_date" example:"2024-01-31T23:59:59Z"`
}

// FilterParams represents common filtering parameters
type FilterParams struct {
	Search   string `form:"search" example:"search term"`
	Status   string `form:"status" example:"ACTIVE"`
	SortBy   string `form:"sort_by,default=created_at" example:"name"`
	SortDesc bool   `form:"sort_desc,default=true" example:"true"`
}
