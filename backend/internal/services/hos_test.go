package services

import (
	"testing"
	"time"

	"github.com/fleetflow/backend/internal/models"
	"github.com/stretchr/testify/assert"
)

// TestHOSRules tests the calculateRules logic
func TestHOSRules(t *testing.T) {
	service := &HOSService{}

	now := time.Now()
	
	// Case 1: Fresh shift, no driving
	logs := []models.DutyStatusLog{
		{Status: models.DutyStatusOffDuty, StartTime: now.Add(-12 * time.Hour), Duration: 720}, // 12h break
		{Status: models.DutyStatusOnDuty, StartTime: now.Add(-1 * time.Hour)},                  // 1h ON
	}

	clocks := service.calculateRules(logs)
	
	assert.Equal(t, 11.0, clocks.DriveTimeRemaining, "Should have full 11h driving")
	assert.InDelta(t, 13.0, clocks.ShiftTimeRemaining, 0.1, "Should have 13h shift remaining (14 - 1)")

	// Case 2: Driving for 5 hours
	logs = append(logs, models.DutyStatusLog{
		Status: models.DutyStatusDriving, 
		StartTime: now.Add(-5 * time.Hour),
		EndTime: &now,
	})
	// Adjust previous log end time for continuity in test data
	logs[1].EndTime = &logs[2].StartTime

	// Re-run with driving log
	// Note: In a real scenario, logs are ordered. Let's reconstruct a clean sequence.
	cleanLogs := []models.DutyStatusLog{
		{Status: models.DutyStatusOffDuty, StartTime: now.Add(-15 * time.Hour), EndTime: timePtr(now.Add(-5 * time.Hour)), Duration: 600},
		{Status: models.DutyStatusDriving, StartTime: now.Add(-5 * time.Hour), EndTime: nil}, // Driving for 5h
	}
	
	clocks = service.calculateRules(cleanLogs)
	
	// 11 - 5 = 6h driving left
	// 14 - 5 = 9h shift left
	assert.InDelta(t, 6.0, clocks.DriveTimeRemaining, 0.1)
	assert.InDelta(t, 9.0, clocks.ShiftTimeRemaining, 0.1)
}

func timePtr(t time.Time) *time.Time {
	return &t
}
