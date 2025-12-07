package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/fleetflow/backend/internal/models"
	"github.com/fleetflow/backend/internal/services"
	"github.com/gin-gonic/gin"
)

// ELDHandler handles ELD-related requests
type ELDHandler struct {
	hosService *services.HOSService
}

// NewELDHandler creates a new ELD handler
func NewELDHandler(hosService *services.HOSService) *ELDHandler {
	return &ELDHandler{
		hosService: hosService,
	}
}

// UpdateDutyStatus handles duty status updates
// @Summary Update driver duty status
// @Description Driver changes status (OFF, SB, D, ON)
// @Tags eld
// @Accept json
// @Produce json
// @Param status body models.DutyStatusLog true "Duty Status Data"
// @Success 201 {object} map[string]string
// @Router /eld/status [post]
func (h *ELDHandler) UpdateDutyStatus(c *gin.Context) {
	var log models.DutyStatusLog
	if err := c.ShouldBindJSON(&log); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set metadata
	log.StartTime = time.Now()
	
	// In a real app, we'd get DriverID from the JWT token
	// log.DriverID = c.GetUint("userID")

	if err := h.hosService.UpdateDutyStatus(c.Request.Context(), &log); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update duty status: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Duty status updated successfully", "status": log.Status})
}

// GetClocks handles fetching HOS clocks
// @Summary Get HOS clocks
// @Description Returns remaining drive, shift, and cycle time
// @Tags eld
// @Produce json
// @Param driver_id query int true "Driver ID"
// @Success 200 {object} models.HOSClocks
// @Router /eld/clocks [get]
func (h *ELDHandler) GetClocks(c *gin.Context) {
	driverIDStr := c.Query("driver_id")
	driverID, err := strconv.ParseUint(driverIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Driver ID"})
		return
	}

	clocks, err := h.hosService.GetClocks(c.Request.Context(), uint(driverID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get clocks: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, clocks)
}
