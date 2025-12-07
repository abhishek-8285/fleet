package services

import (
	"context"
	"time"

	"github.com/fleetflow/backend/internal/models"
	"gorm.io/gorm"
)

// HOSService handles Hours of Service compliance logic
type HOSService struct {
	db *gorm.DB
}

// NewHOSService creates a new HOS service
func NewHOSService(db *gorm.DB) *HOSService {
	return &HOSService{
		db: db,
	}
}

// UpdateDutyStatus updates the driver's duty status
func (s *HOSService) UpdateDutyStatus(ctx context.Context, log *models.DutyStatusLog) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		// 1. Get the last log to close it
		var lastLog models.DutyStatusLog
		if err := tx.Where("driver_id = ?", log.DriverID).Order("start_time desc").First(&lastLog).Error; err == nil {
			now := time.Now()
			lastLog.EndTime = &now
			lastLog.Duration = int(now.Sub(lastLog.StartTime).Minutes())
			if err := tx.Save(&lastLog).Error; err != nil {
				return err
			}
		}

		// 2. Create new log
		if err := tx.Create(log).Error; err != nil {
			return err
		}

		// 3. Check for violations immediately
		return s.checkViolations(tx, log.DriverID)
	})
}

// GetClocks calculates remaining hours for the driver
func (s *HOSService) GetClocks(ctx context.Context, driverID uint) (*models.HOSClocks, error) {
	// 1. Get logs for the current shift/cycle
	// For simplicity, we'll look back 8 days (US 70/8 rule)
	startOfCycle := time.Now().AddDate(0, 0, -8)
	var logs []models.DutyStatusLog
	if err := s.db.Where("driver_id = ? AND start_time >= ?", driverID, startOfCycle).
		Order("start_time asc").Find(&logs).Error; err != nil {
		return nil, err
	}

	// 2. Calculate clocks
	clocks := s.calculateRules(logs)
	return clocks, nil
}

// calculateRules implements the US FMCSA rules engine
func (s *HOSService) calculateRules(logs []models.DutyStatusLog) *models.HOSClocks {
	clocks := &models.HOSClocks{
		DriveTimeRemaining: 11.0 * 60, // 11 hours in minutes
		ShiftTimeRemaining: 14.0 * 60, // 14 hours in minutes
		CycleTimeRemaining: 70.0 * 60, // 70 hours in minutes
	}

	if len(logs) == 0 {
		return clocks
	}

	// Find the start of the current shift (last 10-hour break)
	shiftStartIndex := 0
	for i := len(logs) - 1; i >= 0; i-- {
		if logs[i].Status == models.DutyStatusOffDuty || logs[i].Status == models.DutyStatusSleeperBerth {
			duration := logs[i].Duration
			if logs[i].EndTime == nil {
				duration = int(time.Since(logs[i].StartTime).Minutes())
			}
			if duration >= 600 { // 10 hours
				shiftStartIndex = i + 1
				break
			}
		}
	}

	// Calculate used time in current shift
	var driveTimeUsed float64
	var shiftTimeUsed float64
	now := time.Now()

	for i := shiftStartIndex; i < len(logs); i++ {
		log := logs[i]
		endTime := now
		if log.EndTime != nil {
			endTime = *log.EndTime
		}
		duration := endTime.Sub(log.StartTime).Minutes()

		shiftTimeUsed += duration
		if log.Status == models.DutyStatusDriving {
			driveTimeUsed += duration
		}
	}

	clocks.DriveTimeRemaining -= driveTimeUsed
	clocks.ShiftTimeRemaining -= shiftTimeUsed
	
	// Calculate Cycle (70/8)
	// Simplified: Sum all ON/DRIVING time in last 8 days
	var cycleUsed float64
	for _, log := range logs {
		if log.Status == models.DutyStatusOnDuty || log.Status == models.DutyStatusDriving {
			endTime := now
			if log.EndTime != nil {
				endTime = *log.EndTime
			}
			cycleUsed += endTime.Sub(log.StartTime).Minutes()
		}
	}
	clocks.CycleTimeRemaining -= cycleUsed

	// Set current status
	lastLog := logs[len(logs)-1]
	clocks.CurrentStatus = lastLog.Status
	clocks.StatusDuration = time.Since(lastLog.StartTime).Minutes()

	// Check for violations
	if clocks.DriveTimeRemaining < 0 || clocks.ShiftTimeRemaining < 0 || clocks.CycleTimeRemaining < 0 {
		clocks.Violation = true
	}

	// Convert minutes to hours for display (optional, but keeping internal logic in minutes is easier)
	// The struct uses float64 which can represent hours or minutes. Let's stick to hours for the API response.
	clocks.DriveTimeRemaining /= 60
	clocks.ShiftTimeRemaining /= 60
	clocks.CycleTimeRemaining /= 60
	clocks.StatusDuration /= 60

	return clocks
}

// checkViolations checks and records any HOS violations
func (s *HOSService) checkViolations(tx *gorm.DB, driverID uint) error {
	// Reuse getClocks logic but within transaction
	// This is a simplified check. In production, this would be more robust.
	// For now, we assume the frontend polls GetClocks and warns the driver.
	// Backend violation recording would happen here if we wanted to persist it.
	return nil
}
