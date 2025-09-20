package models

import (
	"time"

	"gorm.io/gorm"
)

// Role represents user roles in the system
type Role string

const (
	RoleAdmin  Role = "ADMIN"
	RoleDriver Role = "DRIVER"
)

// UserAccount represents a user in the system
type UserAccount struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Phone     string         `json:"phone" gorm:"uniqueIndex;not null"`
	Role      Role           `json:"role" gorm:"type:varchar(20);not null;default:'DRIVER'"`
	IsActive  bool           `json:"is_active" gorm:"default:true"`
	LastLogin *time.Time     `json:"last_login,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Associations
	DriverID *uint   `json:"driver_id,omitempty" gorm:"index"`
	Driver   *Driver `json:"driver,omitempty" gorm:"foreignKey:DriverID"`

	RefreshTokens []RefreshToken `json:"-" gorm:"foreignKey:UserID"`
	AuditLogs     []AuditLog     `json:"-" gorm:"foreignKey:UserID"`
}

// RefreshToken represents a JWT refresh token
type RefreshToken struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Token     string         `json:"token" gorm:"uniqueIndex;not null"`
	UserID    uint           `json:"user_id" gorm:"not null;index"`
	ExpiresAt time.Time      `json:"expires_at" gorm:"not null"`
	Revoked   bool           `json:"revoked" gorm:"default:false"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Associations
	User UserAccount `json:"-" gorm:"foreignKey:UserID"`
}

// OTPVerification represents OTP verification attempts
type OTPVerification struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Phone     string         `json:"phone" gorm:"not null;index"`
	OTP       string         `json:"otp" gorm:"not null"`
	ExpiresAt time.Time      `json:"expires_at" gorm:"not null"`
	Verified  bool           `json:"verified" gorm:"default:false"`
	Attempts  int            `json:"attempts" gorm:"default:0"`
	IPAddress string         `json:"ip_address,omitempty"`
	UserAgent string         `json:"user_agent,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// IsExpired checks if the OTP has expired
func (o *OTPVerification) IsExpired() bool {
	return time.Now().After(o.ExpiresAt)
}

// CanAttempt checks if more OTP attempts are allowed
func (o *OTPVerification) CanAttempt() bool {
	return o.Attempts < 3 && !o.IsExpired()
}

// HasRole checks if user has the specified role
func (u *UserAccount) HasRole(role Role) bool {
	return u.Role == role
}

// IsAdmin checks if user is an admin
func (u *UserAccount) IsAdmin() bool {
	return u.Role == RoleAdmin
}

// IsDriver checks if user is a driver
func (u *UserAccount) IsDriver() bool {
	return u.Role == RoleDriver
}
