package services

import (
	"fmt"
	"log"

	"github.com/fleetflow/backend/internal/config"
)

// NotificationService handles notifications and alerts
type NotificationService struct {
	config *config.Config
	sms    SMSProvider
}

// NewNotificationService creates a new notification service
func NewNotificationService(cfg *config.Config) *NotificationService {
	var sms SMSProvider
	if cfg.IsDevelopment() {
		sms = NewDevSMSService()
	} else {
		sms = NewTwilioSMSService(cfg)
	}

	return &NotificationService{
		config: cfg,
		sms:    sms,
	}
}

// SendSMS sends an SMS notification
func (s *NotificationService) SendSMS(to, message string) error {
	log.Printf("📱 Sending SMS to %s: %s", to, message)
	return s.sms.SendSMS(to, message)
}

// SendFuelTheftAlert sends a fuel theft alert
func (s *NotificationService) SendFuelTheftAlert(vehicleID uint, driverPhone string, details string) error {
	message := fmt.Sprintf("🚨 FUEL THEFT ALERT: Vehicle ID %d. %s. Please investigate immediately.", vehicleID, details)
	return s.SendSMS(driverPhone, message)
}

// SendGeofenceViolationAlert sends a geofence violation alert
func (s *NotificationService) SendGeofenceViolationAlert(vehicleID uint, driverPhone string, geofenceName string) error {
	message := fmt.Sprintf("⚠️ GEOFENCE VIOLATION: Vehicle ID %d has violated geofence '%s'", vehicleID, geofenceName)
	return s.SendSMS(driverPhone, message)
}

// SendMaintenanceReminder sends a maintenance reminder
func (s *NotificationService) SendMaintenanceReminder(vehicleID uint, driverPhone string, maintenanceType string) error {
	message := fmt.Sprintf("🔧 MAINTENANCE REMINDER: Vehicle ID %d requires %s maintenance", vehicleID, maintenanceType)
	return s.SendSMS(driverPhone, message)
}

// SendComplianceAlert sends a compliance alert
func (s *NotificationService) SendComplianceAlert(driverPhone string, alertType string, expiryDays int) error {
	message := fmt.Sprintf("📋 COMPLIANCE ALERT: Your %s expires in %d days. Please renew immediately.", alertType, expiryDays)
	return s.SendSMS(driverPhone, message)
}

// SendTripAssignmentNotification sends trip assignment notification
func (s *NotificationService) SendTripAssignmentNotification(driverPhone string, tripID uint, pickupLocation string) error {
	message := fmt.Sprintf("🚛 NEW TRIP ASSIGNED: Trip ID %d. Pickup: %s. Check your app for details.", tripID, pickupLocation)
	return s.SendSMS(driverPhone, message)
}

// SendEmergencyAlert sends an emergency alert
func (s *NotificationService) SendEmergencyAlert(driverPhone string, vehicleID uint, location string) error {
	message := fmt.Sprintf("🆘 EMERGENCY ALERT: Vehicle ID %d at %s. Immediate assistance required!", vehicleID, location)
	return s.SendSMS(driverPhone, message)
}
