package services

import (
	"fmt"
	"log"
	"time"

	"github.com/fleetflow/backend/internal/models"
	"gorm.io/gorm"
)

// TelemetryService handles vehicle sensor data and diagnostics
type TelemetryService struct {
	db          *gorm.DB
	mqttService *MQTTService
}

// NewTelemetryService creates a new telemetry service
func NewTelemetryService(db *gorm.DB, mqttService *MQTTService) *TelemetryService {
	return &TelemetryService{
		db:          db,
		mqttService: mqttService,
	}
}

// Start begins the telemetry monitoring process
func (s *TelemetryService) Start() error {
	// Subscribe to wildcard MQTT topic
	if err := s.mqttService.SubscribeToAllVehicleTelemetry(s.handleTelemetryUpdate); err != nil {
		return fmt.Errorf("failed to subscribe to vehicle telemetry: %w", err)
	}

	log.Println("🔧 Telemetry Service started: Monitoring engine health")
	return nil
}

// handleTelemetryUpdate processes incoming sensor data
func (s *TelemetryService) handleTelemetryUpdate(data *TelemetryUpdate) {
	// 1. Store Telemetry Log
	logEntry := &models.TelemetryLog{
		VehicleID:      data.VehicleID,
		Timestamp:      data.Timestamp,
		EngineRPM:      data.EngineRPM,
		Speed:          data.Speed,
		CoolantTemp:    data.CoolantTemp,
		EngineLoad:     data.EngineLoad,
		ThrottlePos:    data.ThrottlePos,
		FuelLevel:      data.FuelLevel,
		BatteryVoltage: data.BatteryVoltage,
		Odometer:       data.Odometer,
		EngineHours:    data.EngineHours,
		FuelUsed:       data.FuelUsed,
		CreatedAt:      time.Now(),
	}

	// Use a separate goroutine for DB writes to avoid blocking the MQTT handler
	go func() {
		if err := s.db.Create(logEntry).Error; err != nil {
			log.Printf("❌ Failed to save telemetry log: %v", err)
		}
	}()

	// 2. Process DTCs
	if len(data.DTCs) > 0 {
		go s.processDTCs(data.VehicleID, data.DTCs)
	}

	// 3. Check Thresholds
	go s.checkThresholds(data)
}

// processDTCs handles diagnostic trouble codes
func (s *TelemetryService) processDTCs(vehicleID uint, codes []string) {
	for _, code := range codes {
		// Check if active code exists
		var existing models.DiagnosticCode
		err := s.db.Where("vehicle_id = ? AND code = ? AND is_active = ?", vehicleID, code, true).First(&existing).Error

		if err == gorm.ErrRecordNotFound {
			// New Fault Code
			newCode := models.DiagnosticCode{
				VehicleID: vehicleID,
				Code:      code,
				IsActive:  true,
				FirstSeen: time.Now(),
				LastSeen:  time.Now(),
				Severity:  models.DTCSeverityMedium, // Default, should lookup in a DB
			}

			if err := s.db.Create(&newCode).Error; err == nil {
				s.sendAlert(vehicleID, "ENGINE_FAULT", fmt.Sprintf("New Fault Code Detected: %s", code), "HIGH")
			}
		} else if err == nil {
			// Update existing code
			existing.LastSeen = time.Now()
			_ = s.db.Save(&existing)
		}
	}
}

// checkThresholds monitors critical sensor values
func (s *TelemetryService) checkThresholds(data *TelemetryUpdate) {
	// Coolant Temperature Alert (> 110°C)
	if data.CoolantTemp != nil && *data.CoolantTemp > 110 {
		s.sendAlert(data.VehicleID, "ENGINE_OVERHEAT", fmt.Sprintf("Engine coolant critical: %.1f°C", *data.CoolantTemp), "CRITICAL")
	}

	// Battery Voltage Alert (< 11.5V)
	if data.BatteryVoltage != nil && *data.BatteryVoltage < 11.5 {
		s.sendAlert(data.VehicleID, "LOW_BATTERY", fmt.Sprintf("Battery voltage low: %.1fV", *data.BatteryVoltage), "MEDIUM")
	}
}

// sendAlert publishes a fleet alert
func (s *TelemetryService) sendAlert(vehicleID uint, alertType, message, severity string) {
	alert := &FleetAlert{
		Type:           alertType,
		Severity:       severity,
		VehicleID:      &vehicleID,
		Message:        message,
		Timestamp:      time.Now(),
		RequiresAction: severity == "CRITICAL",
	}

	if err := s.mqttService.PublishFleetAlert(alert); err != nil {
		log.Printf("❌ Failed to publish telemetry alert: %v", err)
	}
}
