package handlers

import (
	"net/http"
	"strconv"

	"github.com/fleetflow/backend/internal/models"
	"github.com/fleetflow/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type TelemetryHandler struct {
	telemetryService *services.TelemetryService
}

// NewTelemetryHandler creates a new telemetry handler
func NewTelemetryHandler(telemetryService *services.TelemetryService) *TelemetryHandler {
	return &TelemetryHandler{
		telemetryService: telemetryService,
	}
}

// GetLatestTelemetry handles fetching the latest telemetry for a vehicle
// @Summary Get latest telemetry
// @Description Get the most recent sensor data for a vehicle
// @Tags telemetry
// @Produce json
// @Param vehicle_id query int true "Vehicle ID"
// @Success 200 {object} models.TelemetryLog
// @Router /telemetry/latest [get]
func (h *TelemetryHandler) GetLatestTelemetry(c *gin.Context) {
	vehicleIDStr := c.Query("vehicle_id")
	_, err := strconv.ParseUint(vehicleIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Vehicle ID"})
		return
	}

	// In a real implementation, we'd call h.telemetryService.GetLatest(vehicleID)
	// For now, returning a mock or empty response to satisfy the interface
	c.JSON(http.StatusOK, models.TelemetryLog{})
}

// GetActiveDTCs handles fetching active diagnostic trouble codes
// @Summary Get active DTCs
// @Description Get list of active fault codes for a vehicle
// @Tags telemetry
// @Produce json
// @Param vehicle_id query int true "Vehicle ID"
// @Success 200 {array} models.DiagnosticCode
// @Router /telemetry/dtc [get]
func (h *TelemetryHandler) GetActiveDTCs(c *gin.Context) {
	vehicleIDStr := c.Query("vehicle_id")
	_, err := strconv.ParseUint(vehicleIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Vehicle ID"})
		return
	}

	// Mock response
	c.JSON(http.StatusOK, []models.DiagnosticCode{})
}
