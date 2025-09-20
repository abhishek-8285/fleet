package models

import (
	"time"

	"gorm.io/gorm"
)

// SystemSettings represents system-wide configuration settings
type SystemSettings struct {
	ID                   uint                  `json:"id" gorm:"primaryKey"`
	CompanyName          string                `json:"company_name" gorm:"not null"`
	CompanyAddress       string                `json:"company_address"`
	CompanyPhone         string                `json:"company_phone"`
	CompanyEmail         string                `json:"company_email"`
	TimeZone             string                `json:"time_zone" gorm:"default:'UTC'"`
	Currency             string                `json:"currency" gorm:"default:'INR'"`
	DateFormat           string                `json:"date_format" gorm:"default:'DD/MM/YYYY'"`
	DistanceUnit         string                `json:"distance_unit" gorm:"default:'KM'"`
	FuelUnit             string                `json:"fuel_unit" gorm:"default:'LITERS'"`
	DefaultLanguage      string                `json:"default_language" gorm:"default:'en'"`
	AlertSettings        *AlertSettings        `json:"alert_settings" gorm:"type:json"`
	NotificationSettings *NotificationSettings `json:"notification_settings" gorm:"type:json"`
	SecuritySettings     *SecuritySettings     `json:"security_settings" gorm:"type:json"`
	MaintenanceReminders bool                  `json:"maintenance_reminders" gorm:"default:true"`
	ComplianceReminders  bool                  `json:"compliance_reminders" gorm:"default:true"`
	AutoBackup           bool                  `json:"auto_backup" gorm:"default:true"`
	CreatedAt            time.Time             `json:"created_at"`
	UpdatedAt            time.Time             `json:"updated_at"`
	DeletedAt            gorm.DeletedAt        `json:"-" gorm:"index"`
}

// AlertSettings represents alert configuration
type AlertSettings struct {
	FuelTheftAlert      bool `json:"fuel_theft_alert"`
	SpeedingAlert       bool `json:"speeding_alert"`
	RouteDeviationAlert bool `json:"route_deviation_alert"`
	MaintenanceAlert    bool `json:"maintenance_alert"`
	ComplianceAlert     bool `json:"compliance_alert"`
	GeofenceAlert       bool `json:"geofence_alert"`
}

// NotificationSettings represents notification preferences
type NotificationSettings struct {
	EmailNotifications    bool `json:"email_notifications"`
	SMSNotifications      bool `json:"sms_notifications"`
	PushNotifications     bool `json:"push_notifications"`
	WhatsappNotifications bool `json:"whatsapp_notifications"`
}

// SecuritySettings represents security configuration
type SecuritySettings struct {
	PasswordMinLength     int  `json:"password_min_length"`
	PasswordRequireUpper  bool `json:"password_require_upper"`
	PasswordRequireLower  bool `json:"password_require_lower"`
	PasswordRequireDigit  bool `json:"password_require_digit"`
	PasswordRequireSymbol bool `json:"password_require_symbol"`
	SessionTimeoutMinutes int  `json:"session_timeout_minutes"`
	MaxLoginAttempts      int  `json:"max_login_attempts"`
	TwoFactorEnabled      bool `json:"two_factor_enabled"`
}
