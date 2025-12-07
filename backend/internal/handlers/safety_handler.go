package handlers

import (
	"net/http"
	"strconv"

	"github.com/fleetflow/backend/internal/models"
	"github.com/fleetflow/backend/internal/services"
	"github.com/gin-gonic/gin"
)

// SafetyHandler handles safety-related requests
type SafetyHandler struct {
	safetyService *services.SafetyService
	db            interface{} // Placeholder for DB access if needed directly
}

// NewSafetyHandler creates a new safety handler
func NewSafetyHandler(safetyService *services.SafetyService) *SafetyHandler {
	return &SafetyHandler{
		safetyService: safetyService,
	}
}

// GetSafetyEvents handles fetching safety events
// @Summary Get safety events
// @Description List safety events with optional filtering
// @Tags safety
// @Produce json
// @Param vehicle_id query int false "Vehicle ID"
// @Param type query string false "Event Type"
// @Param start_date query string false "Start Date (RFC3339)"
// @Param end_date query string false "End Date (RFC3339)"
// @Success 200 {array} models.SafetyEvent
// @Router /safety/events [get]
func (h *SafetyHandler) GetSafetyEvents(c *gin.Context) {
	// This would typically call a service method to query DB with filters
	// For now, we'll return a mock response or implement basic DB query if service exposed it
	// In a real implementation, we'd add a GetEvents method to SafetyService
	
	c.JSON(http.StatusOK, []models.SafetyEvent{})
}

// GetDriverScore handles fetching driver safety score
// @Summary Get driver safety score
// @Description Get calculated safety score for a driver
// @Tags safety
// @Produce json
// @Param driver_id query int true "Driver ID"
// @Success 200 {object} models.DriverScore
// @Router /safety/score [get]
func (h *SafetyHandler) GetDriverScore(c *gin.Context) {
	driverIDStr := c.Query("driver_id")
	_, err := strconv.ParseUint(driverIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Driver ID"})
		return
	}

	// Mock response for now
	score := models.DriverScore{
		OverallScore: 95,
		BrakingScore: 98,
		AccelScore:   92,
		SpeedingScore: 95,
	}

	c.JSON(http.StatusOK, score)
}
