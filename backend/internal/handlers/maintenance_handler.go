package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/fleetflow/backend/internal/models"
	"github.com/fleetflow/backend/internal/services"
	"github.com/gin-gonic/gin"
)

// MaintenanceHandler handles maintenance-related requests
type MaintenanceHandler struct {
	maintenanceService *services.MaintenanceService
}

// NewMaintenanceHandler creates a new maintenance handler
func NewMaintenanceHandler(maintenanceService *services.MaintenanceService) *MaintenanceHandler {
	return &MaintenanceHandler{
		maintenanceService: maintenanceService,
	}
}

// SubmitDVIR handles DVIR submission
// @Summary Submit a Driver Vehicle Inspection Report
// @Description Drivers submit pre-trip or post-trip inspection reports
// @Tags maintenance
// @Accept json
// @Produce json
// @Param dvir body models.DVIR true "DVIR Data"
// @Success 201 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Router /maintenance/dvir [post]
func (h *MaintenanceHandler) SubmitDVIR(c *gin.Context) {
	var dvir models.DVIR
	if err := c.ShouldBindJSON(&dvir); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set metadata
	dvir.CreatedAt = time.Now()
	
	// In a real app, we'd get DriverID from the JWT token
	// dvir.DriverID = c.GetUint("userID")

	if err := h.maintenanceService.SubmitDVIR(c.Request.Context(), &dvir); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit DVIR: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "DVIR submitted successfully", "status": dvir.Status})
}

// GetMaintenanceDue handles listing vehicles due for maintenance
// @Summary Get vehicles due for maintenance
// @Description Returns a list of service schedules that are due
// @Tags maintenance
// @Produce json
// @Success 200 {array} models.ServiceSchedule
// @Router /maintenance/due [get]
func (h *MaintenanceHandler) GetMaintenanceDue(c *gin.Context) {
	dueSchedules, err := h.maintenanceService.CheckMaintenanceDue(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check maintenance due: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, dueSchedules)
}

// CreateWorkOrder handles creating a new work order
// @Summary Create a maintenance work order
// @Description Manually create a work order for a vehicle
// @Tags maintenance
// @Accept json
// @Produce json
// @Param work_order body models.WorkOrder true "Work Order Data"
// @Success 201 {object} map[string]string
// @Router /maintenance/work-order [post]
func (h *MaintenanceHandler) CreateWorkOrder(c *gin.Context) {
	var workOrder models.WorkOrder
	if err := c.ShouldBindJSON(&workOrder); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	workOrder.CreatedAt = time.Now()
	workOrder.Status = "OPEN"

	if err := h.maintenanceService.CreateWorkOrder(c.Request.Context(), &workOrder); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create work order: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Work order created successfully", "id": workOrder.ID})
}

// ResolveWorkOrder handles completing a work order
// @Summary Resolve a work order
// @Description Mark a work order as completed and record costs
// @Tags maintenance
// @Accept json
// @Produce json
// @Param id path int true "Work Order ID"
// @Param resolution body struct{Notes string; CostParts float64; CostLabor float64} true "Resolution Data"
// @Success 200 {object} map[string]string
// @Router /maintenance/work-order/{id}/resolve [post]
func (h *MaintenanceHandler) ResolveWorkOrder(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req struct {
		Notes     string  `json:"notes"`
		CostParts float64 `json:"cost_parts"`
		CostLabor float64 `json:"cost_labor"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.maintenanceService.ResolveWorkOrder(c.Request.Context(), uint(id), req.Notes, req.CostParts, req.CostLabor); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to resolve work order: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Work order resolved successfully"})
}
