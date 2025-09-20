package models

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

// AuditAction represents the type of action performed
type AuditAction string

const (
	// User actions
	AuditActionUserLogin       AuditAction = "USER_LOGIN"
	AuditActionUserLogout      AuditAction = "USER_LOGOUT"
	AuditActionUserCreated     AuditAction = "USER_CREATED"
	AuditActionUserUpdated     AuditAction = "USER_UPDATED"
	AuditActionUserDeleted     AuditAction = "USER_DELETED"
	AuditActionPasswordChanged AuditAction = "PASSWORD_CHANGED"

	// Driver actions
	AuditActionDriverCreated AuditAction = "DRIVER_CREATED"
	AuditActionDriverUpdated AuditAction = "DRIVER_UPDATED"
	AuditActionDriverDeleted AuditAction = "DRIVER_DELETED"

	// Vehicle actions
	AuditActionVehicleCreated AuditAction = "VEHICLE_CREATED"
	AuditActionVehicleUpdated AuditAction = "VEHICLE_UPDATED"
	AuditActionVehicleDeleted AuditAction = "VEHICLE_DELETED"

	// Trip actions
	AuditActionTripCreated   AuditAction = "TRIP_CREATED"
	AuditActionTripUpdated   AuditAction = "TRIP_UPDATED"
	AuditActionTripStarted   AuditAction = "TRIP_STARTED"
	AuditActionTripPaused    AuditAction = "TRIP_PAUSED"
	AuditActionTripResumed   AuditAction = "TRIP_RESUMED"
	AuditActionTripCompleted AuditAction = "TRIP_COMPLETED"
	AuditActionTripCancelled AuditAction = "TRIP_CANCELLED"

	// Fuel actions
	AuditActionFuelEventCreated  AuditAction = "FUEL_EVENT_CREATED"
	AuditActionFuelEventVerified AuditAction = "FUEL_EVENT_VERIFIED"
	AuditActionFuelEventRejected AuditAction = "FUEL_EVENT_REJECTED"
	AuditActionFuelAlertCreated  AuditAction = "FUEL_ALERT_CREATED"
	AuditActionFuelAlertResolved AuditAction = "FUEL_ALERT_RESOLVED"

	// Upload actions
	AuditActionFileUploaded AuditAction = "FILE_UPLOADED"
	AuditActionFileDeleted  AuditAction = "FILE_DELETED"
	AuditActionFileVerified AuditAction = "FILE_VERIFIED"

	// System actions
	AuditActionSystemBackup  AuditAction = "SYSTEM_BACKUP"
	AuditActionSystemRestore AuditAction = "SYSTEM_RESTORE"
	AuditActionConfigChanged AuditAction = "CONFIG_CHANGED"

	// Security actions
	AuditActionLoginFailed        AuditAction = "LOGIN_FAILED"
	AuditActionUnauthorizedAccess AuditAction = "UNAUTHORIZED_ACCESS"
	AuditActionPasswordReset      AuditAction = "PASSWORD_RESET"
	AuditActionAccountLocked      AuditAction = "ACCOUNT_LOCKED"
)

// AuditSeverity represents the severity level of an audit event
type AuditSeverity string

const (
	AuditSeverityInfo     AuditSeverity = "INFO"
	AuditSeverityWarning  AuditSeverity = "WARNING"
	AuditSeverityError    AuditSeverity = "ERROR"
	AuditSeverityCritical AuditSeverity = "CRITICAL"
)

// AuditLog represents an audit trail entry
type AuditLog struct {
	ID          uint          `json:"id" gorm:"primaryKey"`
	Action      AuditAction   `json:"action" gorm:"type:varchar(50);not null;index"`
	Severity    AuditSeverity `json:"severity" gorm:"type:varchar(20);default:'INFO'"`
	Description string        `json:"description" gorm:"not null"`

	// Context information
	TableName string `json:"table_name,omitempty" gorm:"index"`
	RecordID  *uint  `json:"record_id,omitempty" gorm:"index"`
	OldValues string `json:"old_values,omitempty"` // JSON blob
	NewValues string `json:"new_values,omitempty"` // JSON blob

	// Request information
	IPAddress    string `json:"ip_address,omitempty"`
	UserAgent    string `json:"user_agent,omitempty"`
	RequestID    string `json:"request_id,omitempty"`
	Endpoint     string `json:"endpoint,omitempty"`
	HTTPMethod   string `json:"http_method,omitempty"`
	ResponseCode *int   `json:"response_code,omitempty"`

	// Additional metadata
	Metadata string `json:"metadata,omitempty"` // JSON blob for additional context
	Tags     string `json:"tags,omitempty"`     // Comma-separated tags

	// Timing
	CreatedAt time.Time      `json:"created_at" gorm:"index"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Foreign keys - all nullable to support various scenarios
	UserID    *uint `json:"user_id,omitempty" gorm:"index"`
	DriverID  *uint `json:"driver_id,omitempty" gorm:"index"`
	VehicleID *uint `json:"vehicle_id,omitempty" gorm:"index"`
	TripID    *uint `json:"trip_id,omitempty" gorm:"index"`

	// Associations
	User    *UserAccount `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Driver  *Driver      `json:"driver,omitempty" gorm:"foreignKey:DriverID"`
	Vehicle *Vehicle     `json:"vehicle,omitempty" gorm:"foreignKey:VehicleID"`
	Trip    *Trip        `json:"trip,omitempty" gorm:"foreignKey:TripID"`
}

// AuditLogSummary represents aggregated audit log statistics
type AuditLogSummary struct {
	Action   AuditAction   `json:"action"`
	Count    int64         `json:"count"`
	LastSeen time.Time     `json:"last_seen"`
	Severity AuditSeverity `json:"severity"`
}

// SecurityEvent represents security-related audit events
type SecurityEvent struct {
	ID          uint          `json:"id" gorm:"primaryKey"`
	EventType   string        `json:"event_type" gorm:"not null"` // LOGIN_ATTEMPT, UNAUTHORIZED_ACCESS, SUSPICIOUS_ACTIVITY
	Status      string        `json:"status" gorm:"not null"`     // SUCCESS, FAILED, BLOCKED
	Severity    AuditSeverity `json:"severity" gorm:"type:varchar(20);not null"`
	Description string        `json:"description" gorm:"not null"`

	// Location and device info
	IPAddress  string `json:"ip_address,omitempty"`
	UserAgent  string `json:"user_agent,omitempty"`
	Location   string `json:"location,omitempty"` // Derived from IP
	DeviceInfo string `json:"device_info,omitempty"`

	// Risk assessment
	RiskScore   float64 `json:"risk_score" gorm:"type:decimal(5,2);default:0"`
	RiskFactors string  `json:"risk_factors,omitempty"` // JSON array
	IsBlocked   bool    `json:"is_blocked" gorm:"default:false"`
	BlockReason string  `json:"block_reason,omitempty"`

	// Response
	IsInvestigated     bool       `json:"is_investigated" gorm:"default:false"`
	InvestigatedBy     *uint      `json:"investigated_by,omitempty" gorm:"index"`
	InvestigatedAt     *time.Time `json:"investigated_at,omitempty"`
	InvestigationNotes string     `json:"investigation_notes,omitempty"`

	// Timing
	CreatedAt time.Time      `json:"created_at" gorm:"index"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Foreign keys
	UserID *uint `json:"user_id,omitempty" gorm:"index"`

	// Associations
	User               *UserAccount `json:"user,omitempty" gorm:"foreignKey:UserID"`
	InvestigatedByUser *UserAccount `json:"investigated_by_user,omitempty" gorm:"foreignKey:InvestigatedBy"`
}

// IsInfo checks if the audit log is informational
func (al *AuditLog) IsInfo() bool {
	return al.Severity == AuditSeverityInfo
}

// IsWarning checks if the audit log is a warning
func (al *AuditLog) IsWarning() bool {
	return al.Severity == AuditSeverityWarning
}

// IsError checks if the audit log is an error
func (al *AuditLog) IsError() bool {
	return al.Severity == AuditSeverityError
}

// IsCritical checks if the audit log is critical
func (al *AuditLog) IsCritical() bool {
	return al.Severity == AuditSeverityCritical
}

// SetOldValues sets the old values as JSON
func (al *AuditLog) SetOldValues(values interface{}) error {
	jsonData, err := json.Marshal(values)
	if err != nil {
		return err
	}
	al.OldValues = string(jsonData)
	return nil
}

// SetNewValues sets the new values as JSON
func (al *AuditLog) SetNewValues(values interface{}) error {
	jsonData, err := json.Marshal(values)
	if err != nil {
		return err
	}
	al.NewValues = string(jsonData)
	return nil
}

// SetMetadata sets the metadata as JSON
func (al *AuditLog) SetMetadata(metadata interface{}) error {
	jsonData, err := json.Marshal(metadata)
	if err != nil {
		return err
	}
	al.Metadata = string(jsonData)
	return nil
}

// GetOldValues parses the old values JSON into the provided interface
func (al *AuditLog) GetOldValues(v interface{}) error {
	if al.OldValues == "" {
		return nil
	}
	return json.Unmarshal([]byte(al.OldValues), v)
}

// GetNewValues parses the new values JSON into the provided interface
func (al *AuditLog) GetNewValues(v interface{}) error {
	if al.NewValues == "" {
		return nil
	}
	return json.Unmarshal([]byte(al.NewValues), v)
}

// GetMetadata parses the metadata JSON into the provided interface
func (al *AuditLog) GetMetadata(v interface{}) error {
	if al.Metadata == "" {
		return nil
	}
	return json.Unmarshal([]byte(al.Metadata), v)
}

// IsSecurityEvent checks if this is a security-related event
func (al *AuditLog) IsSecurityEvent() bool {
	securityActions := map[AuditAction]bool{
		AuditActionUserLogin:          true,
		AuditActionUserLogout:         true,
		AuditActionLoginFailed:        true,
		AuditActionUnauthorizedAccess: true,
		AuditActionPasswordChanged:    true,
		AuditActionPasswordReset:      true,
		AuditActionAccountLocked:      true,
	}

	return securityActions[al.Action]
}

// IsHighRisk checks if the security event is high risk
func (se *SecurityEvent) IsHighRisk() bool {
	return se.RiskScore >= 70.0
}

// IsCriticalSeverity checks if the security event is critical
func (se *SecurityEvent) IsCriticalSeverity() bool {
	return se.Severity == AuditSeverityCritical
}

// ShouldBlock checks if the event should be blocked
func (se *SecurityEvent) ShouldBlock() bool {
	return se.IsHighRisk() || se.IsCriticalSeverity()
}

// Block blocks the security event
func (se *SecurityEvent) Block(reason string) {
	se.IsBlocked = true
	se.BlockReason = reason
}

// Investigate marks the security event as investigated
func (se *SecurityEvent) Investigate(investigatedBy uint, notes string) {
	se.IsInvestigated = true
	se.InvestigatedBy = &investigatedBy
	now := time.Now()
	se.InvestigatedAt = &now
	se.InvestigationNotes = notes
}

// AuditContext represents context information for audit logging
type AuditContext struct {
	UserID       *uint  `json:"user_id,omitempty"`
	DriverID     *uint  `json:"driver_id,omitempty"`
	VehicleID    *uint  `json:"vehicle_id,omitempty"`
	TripID       *uint  `json:"trip_id,omitempty"`
	IPAddress    string `json:"ip_address,omitempty"`
	UserAgent    string `json:"user_agent,omitempty"`
	RequestID    string `json:"request_id,omitempty"`
	Endpoint     string `json:"endpoint,omitempty"`
	HTTPMethod   string `json:"http_method,omitempty"`
	ResponseCode *int   `json:"response_code,omitempty"`
}
