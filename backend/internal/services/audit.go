package services

import (
	"github.com/fleetflow/backend/internal/models"
	"gorm.io/gorm"
)

// AuditService handles audit logging operations
type AuditService struct {
	db *gorm.DB
}

// NewAuditService creates a new audit service
func NewAuditService(db *gorm.DB) *AuditService {
	return &AuditService{
		db: db,
	}
}

// LogAction logs an audit action
func (s *AuditService) LogAction(
	action models.AuditAction,
	severity models.AuditSeverity,
	description string,
	oldValues interface{},
	newValues interface{},
	context *models.AuditContext,
) error {
	auditLog := &models.AuditLog{
		Action:      action,
		Severity:    severity,
		Description: description,
	}

	// Set context information if provided
	if context != nil {
		auditLog.UserID = context.UserID
		auditLog.DriverID = context.DriverID
		auditLog.VehicleID = context.VehicleID
		auditLog.TripID = context.TripID
		auditLog.IPAddress = context.IPAddress
		auditLog.UserAgent = context.UserAgent
		auditLog.RequestID = context.RequestID
		auditLog.Endpoint = context.Endpoint
		auditLog.HTTPMethod = context.HTTPMethod
		auditLog.ResponseCode = context.ResponseCode
	}

	// Set old and new values
	if oldValues != nil {
		if err := auditLog.SetOldValues(oldValues); err != nil {
			return err
		}
	}

	if newValues != nil {
		if err := auditLog.SetNewValues(newValues); err != nil {
			return err
		}
	}

	return s.db.Create(auditLog).Error
}

// LogSecurityEvent logs a security event
func (s *AuditService) LogSecurityEvent(
	eventType, status string,
	severity models.AuditSeverity,
	description string,
	context *models.AuditContext,
) error {
	securityEvent := &models.SecurityEvent{
		EventType:   eventType,
		Status:      status,
		Severity:    severity,
		Description: description,
	}

	if context != nil {
		securityEvent.UserID = context.UserID
		securityEvent.IPAddress = context.IPAddress
		securityEvent.UserAgent = context.UserAgent

		// Try to parse additional device info from user agent
		if context.UserAgent != "" {
			securityEvent.DeviceInfo = context.UserAgent
		}
	}

	return s.db.Create(securityEvent).Error
}

// GetAuditLogs retrieves audit logs with pagination
func (s *AuditService) GetAuditLogs(page, limit int, filters map[string]interface{}) ([]models.AuditLog, int64, error) {
	var logs []models.AuditLog
	var total int64

	query := s.db.Model(&models.AuditLog{})

	// Apply filters
	for key, value := range filters {
		switch key {
		case "action":
			query = query.Where("action = ?", value)
		case "severity":
			query = query.Where("severity = ?", value)
		case "user_id":
			query = query.Where("user_id = ?", value)
		case "table_name":
			query = query.Where("table_name = ?", value)
		case "from_date":
			query = query.Where("created_at >= ?", value)
		case "to_date":
			query = query.Where("created_at <= ?", value)
		}
	}

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * limit
	if err := query.Preload("User").Preload("Driver").Preload("Vehicle").Preload("Trip").
		Order("created_at DESC").
		Offset(offset).Limit(limit).
		Find(&logs).Error; err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}

// GetSecurityEvents retrieves security events with pagination
func (s *AuditService) GetSecurityEvents(page, limit int, filters map[string]interface{}) ([]models.SecurityEvent, int64, error) {
	var events []models.SecurityEvent
	var total int64

	query := s.db.Model(&models.SecurityEvent{})

	// Apply filters
	for key, value := range filters {
		switch key {
		case "event_type":
			query = query.Where("event_type = ?", value)
		case "status":
			query = query.Where("status = ?", value)
		case "severity":
			query = query.Where("severity = ?", value)
		case "user_id":
			query = query.Where("user_id = ?", value)
		case "is_investigated":
			query = query.Where("is_investigated = ?", value)
		case "from_date":
			query = query.Where("created_at >= ?", value)
		case "to_date":
			query = query.Where("created_at <= ?", value)
		}
	}

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * limit
	if err := query.Preload("User").Preload("InvestigatedByUser").
		Order("created_at DESC").
		Offset(offset).Limit(limit).
		Find(&events).Error; err != nil {
		return nil, 0, err
	}

	return events, total, nil
}

// GetAuditSummary gets audit statistics summary
func (s *AuditService) GetAuditSummary() ([]models.AuditLogSummary, error) {
	var summary []models.AuditLogSummary

	err := s.db.Model(&models.AuditLog{}).
		Select("action, severity, COUNT(*) as count, MAX(created_at) as last_seen").
		Group("action, severity").
		Order("count DESC").
		Find(&summary).Error

	return summary, err
}

// LogUserAction is a convenience method for logging user actions
func (s *AuditService) LogUserAction(userID uint, action models.AuditAction, description string, metadata map[string]interface{}) error {
	auditLog := &models.AuditLog{
		Action:      action,
		Severity:    models.AuditSeverityInfo,
		Description: description,
		UserID:      &userID,
	}

	if metadata != nil {
		if err := auditLog.SetMetadata(metadata); err != nil {
			return err
		}
	}

	return s.db.Create(auditLog).Error
}

// LogSystemAction logs system-level actions
func (s *AuditService) LogSystemAction(action models.AuditAction, description string, metadata map[string]interface{}) error {
	auditLog := &models.AuditLog{
		Action:      action,
		Severity:    models.AuditSeverityInfo,
		Description: description,
	}

	if metadata != nil {
		if err := auditLog.SetMetadata(metadata); err != nil {
			return err
		}
	}

	return s.db.Create(auditLog).Error
}

// LogEntityChange logs changes to database entities
func (s *AuditService) LogEntityChange(
	userID *uint,
	action models.AuditAction,
	tableName string,
	recordID uint,
	oldValues, newValues interface{},
	description string,
) error {
	auditLog := &models.AuditLog{
		Action:      action,
		Severity:    models.AuditSeverityInfo,
		Description: description,
		TableName:   tableName,
		RecordID:    &recordID,
		UserID:      userID,
	}

	if oldValues != nil {
		if err := auditLog.SetOldValues(oldValues); err != nil {
			return err
		}
	}

	if newValues != nil {
		if err := auditLog.SetNewValues(newValues); err != nil {
			return err
		}
	}

	return s.db.Create(auditLog).Error
}

// CleanupOldAuditLogs removes audit logs older than specified days
func (s *AuditService) CleanupOldAuditLogs(daysToKeep int) error {
	// This should be run as a scheduled job
	cutoffDate := func() string {
		// Calculate cutoff date
		return "30 days ago" // Placeholder
	}()

	return s.db.Where("created_at < ?", cutoffDate).Delete(&models.AuditLog{}).Error
}

// GetUserActivitySummary gets activity summary for a specific user
func (s *AuditService) GetUserActivitySummary(userID uint, days int) (map[string]interface{}, error) {
	var result map[string]interface{}

	// This would contain various statistics about user activity
	// Implementation depends on specific requirements

	return result, nil
}
