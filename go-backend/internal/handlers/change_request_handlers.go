package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/fleetflow/backend/internal/dto"
	"github.com/fleetflow/backend/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/datatypes"
)

// SubmitChangeRequest allows drivers to submit change requests for admin approval
// @Summary Submit Driver Change Request
// @Description Submit a change request for driver profile updates
// @Tags driver
// @Accept json
// @Produce json
// @Param request body object{driver_id=uint,request_type=string,requested_changes=object,reason=string,priority=string} true "Change Request Data"
// @Success 201 {object} object{message=string,request_id=uint,status=string}
// @Failure 400 {object} dto.APIError
// @Failure 403 {object} dto.APIError
// @Failure 500 {object} dto.APIError
// @Security BearerAuth
// @Router /driver/change-request [post]
func (h *DriverHandler) SubmitChangeRequest(c *gin.Context) {
	var requestData struct {
		DriverID         uint                   `json:"driver_id" binding:"required"`
		RequestType      string                 `json:"request_type" binding:"required"`
		RequestedChanges map[string]interface{} `json:"requested_changes" binding:"required"`
		Reason           string                 `json:"reason"`
		Priority         string                 `json:"priority"`
	}

	if err := c.ShouldBindJSON(&requestData); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_request_data",
			Message: "Invalid change request data",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Get current user from JWT
	userID := c.GetUint("user_id")

	// Verify driver can only submit requests for themselves
	if requestData.DriverID != userID {
		c.JSON(http.StatusForbidden, dto.APIError{
			Error:   "insufficient_permissions",
			Message: "Can only submit requests for your own profile",
			Code:    http.StatusForbidden,
		})
		return
	}

	// Get current driver data for comparison
	var currentDriver models.Driver
	if err := h.services.DB.First(&currentDriver, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, dto.APIError{
			Error:   "driver_not_found",
			Message: "Driver not found",
			Code:    http.StatusNotFound,
		})
		return
	}

	// Set default priority if not provided
	if requestData.Priority == "" {
		requestData.Priority = "NORMAL"
	}

	// Validate priority
	validPriorities := []string{"LOW", "NORMAL", "HIGH", "URGENT"}
	isValidPriority := false
	for _, p := range validPriorities {
		if requestData.Priority == p {
			isValidPriority = true
			break
		}
	}
	if !isValidPriority {
		requestData.Priority = "NORMAL"
	}

	// Convert data for JSON storage
	requestedChangesJSON, _ := json.Marshal(requestData.RequestedChanges)
	currentDataJSON, _ := json.Marshal(currentDriver)

	// Create change request
	changeRequest := models.DriverChangeRequest{
		DriverID:         requestData.DriverID,
		RequestType:      requestData.RequestType,
		RequestedChanges: datatypes.JSON(requestedChangesJSON),
		CurrentData:      datatypes.JSON(currentDataJSON),
		Status:           "PENDING",
		Priority:         requestData.Priority,
		Reason:           requestData.Reason,
		SubmittedAt:      time.Now(),
	}

	if err := h.services.DB.Create(&changeRequest).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIError{
			Error:   "database_error",
			Message: "Failed to create change request",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    "Change request submitted successfully",
		"request_id": changeRequest.ID,
		"status":     "PENDING",
		"priority":   changeRequest.Priority,
	})
}

// GetDriverChangeRequests gets all change requests for the current driver
// @Summary Get Driver Change Requests
// @Description Get all change requests submitted by the current driver
// @Tags driver
// @Produce json
// @Success 200 {array} models.DriverChangeRequest
// @Failure 500 {object} dto.APIError
// @Security BearerAuth
// @Router /driver/change-requests [get]
func (h *DriverHandler) GetDriverChangeRequests(c *gin.Context) {
	userID := c.GetUint("user_id")

	var requests []models.DriverChangeRequest
	if err := h.services.DB.Where("driver_id = ?", userID).
		Order("submitted_at DESC").
		Find(&requests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIError{
			Error:   "database_error",
			Message: "Failed to fetch change requests",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, requests)
}

// CancelChangeRequest allows drivers to cancel their pending change requests
// @Summary Cancel Change Request
// @Description Cancel a pending change request
// @Tags driver
// @Param id path int true "Change Request ID"
// @Success 200 {object} object{message=string,status=string}
// @Failure 400 {object} dto.APIError
// @Failure 403 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /driver/change-request/{id}/cancel [put]
func (h *DriverHandler) CancelChangeRequest(c *gin.Context) {
	requestID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_request_id",
			Message: "Invalid change request ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	userID := c.GetUint("user_id")

	// Get the change request
	var changeRequest models.DriverChangeRequest
	if err := h.services.DB.Where("id = ? AND driver_id = ?", requestID, userID).
		First(&changeRequest).Error; err != nil {
		c.JSON(http.StatusNotFound, dto.APIError{
			Error:   "request_not_found",
			Message: "Change request not found",
			Code:    http.StatusNotFound,
		})
		return
	}

	// Check if request can be cancelled
	if !changeRequest.CanBeCancelled() {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "cannot_cancel",
			Message: "Request cannot be cancelled (already processed or expired)",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Update status to cancelled
	changeRequest.Status = "CANCELLED"
	changeRequest.ReviewedAt = &time.Time{}
	*changeRequest.ReviewedAt = time.Now()
	changeRequest.AdminComments = "Cancelled by driver"

	if err := h.services.DB.Save(&changeRequest).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIError{
			Error:   "database_error",
			Message: "Failed to cancel change request",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Change request cancelled successfully",
		"status":  "CANCELLED",
	})
}

// Admin handlers for managing change requests

// GetAllChangeRequests gets all change requests for admin review
// @Summary Get All Change Requests (Admin)
// @Description Get all change requests for admin review
// @Tags admin
// @Produce json
// @Param status query string false "Filter by status (PENDING, APPROVED, REJECTED)"
// @Param priority query string false "Filter by priority (LOW, NORMAL, HIGH, URGENT)"
// @Success 200 {array} models.DriverChangeRequest
// @Failure 500 {object} dto.APIError
// @Security BearerAuth
// @Router /admin/change-requests [get]
func (h *DriverHandler) GetAllChangeRequests(c *gin.Context) {
	query := h.services.DB.Preload("Driver").Order("priority DESC, submitted_at DESC")

	// Apply filters
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if priority := c.Query("priority"); priority != "" {
		query = query.Where("priority = ?", priority)
	}

	var requests []models.DriverChangeRequest
	if err := query.Find(&requests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIError{
			Error:   "database_error",
			Message: "Failed to fetch change requests",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, requests)
}

// ApproveChangeRequest approves a change request and applies the changes
// @Summary Approve Change Request (Admin)
// @Description Approve a change request and apply changes to driver profile
// @Tags admin
// @Param id path int true "Change Request ID"
// @Param request body object{admin_comments=string} false "Admin Comments"
// @Success 200 {object} object{message=string,status=string}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Failure 500 {object} dto.APIError
// @Security BearerAuth
// @Router /admin/change-request/{id}/approve [put]
func (h *DriverHandler) ApproveChangeRequest(c *gin.Context) {
	requestID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_request_id",
			Message: "Invalid change request ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	var requestBody struct {
		AdminComments string `json:"admin_comments"`
	}
	c.ShouldBindJSON(&requestBody)

	adminID := c.GetUint("user_id")

	// Get the change request
	var changeRequest models.DriverChangeRequest
	if err := h.services.DB.Preload("Driver").Where("id = ?", requestID).
		First(&changeRequest).Error; err != nil {
		c.JSON(http.StatusNotFound, dto.APIError{
			Error:   "request_not_found",
			Message: "Change request not found",
			Code:    http.StatusNotFound,
		})
		return
	}

	if changeRequest.Status != "PENDING" {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "already_processed",
			Message: "Change request has already been processed",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Apply changes to driver profile
	var driver models.Driver
	if err := h.services.DB.First(&driver, changeRequest.DriverID).Error; err != nil {
		c.JSON(http.StatusNotFound, dto.APIError{
			Error:   "driver_not_found",
			Message: "Driver not found",
			Code:    http.StatusNotFound,
		})
		return
	}

	// Apply requested changes (simplified - in production, you'd validate each field)
	var requestedChanges map[string]interface{}
	if err := json.Unmarshal(changeRequest.RequestedChanges, &requestedChanges); err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIError{
			Error:   "invalid_changes_data",
			Message: "Failed to parse requested changes",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	if name, ok := requestedChanges["name"].(string); ok && name != "" {
		driver.Name = name
	}
	// Note: Driver model doesn't have Email field - would need to be added
	// if email, ok := requestedChanges["email"].(string); ok {
	//     driver.Email = &email
	// }
	// Note: Driver model doesn't have Address field - would need to be added
	// if address, ok := requestedChanges["address"].(string); ok {
	//     driver.Address = &address
	// }

	// Save updated driver
	if err := h.services.DB.Save(&driver).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIError{
			Error:   "update_failed",
			Message: "Failed to apply changes to driver profile",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	// Update change request status
	now := time.Now()
	changeRequest.Status = "APPROVED"
	changeRequest.ReviewedAt = &now
	changeRequest.ReviewedBy = &adminID
	changeRequest.AdminComments = requestBody.AdminComments

	if err := h.services.DB.Save(&changeRequest).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIError{
			Error:   "database_error",
			Message: "Failed to update change request status",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Change request approved and changes applied successfully",
		"status":  "APPROVED",
	})
}

// RejectChangeRequest rejects a change request
// @Summary Reject Change Request (Admin)
// @Description Reject a change request with admin comments
// @Tags admin
// @Param id path int true "Change Request ID"
// @Param request body object{admin_comments=string} true "Admin Comments"
// @Success 200 {object} object{message=string,status=string}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Failure 500 {object} dto.APIError
// @Security BearerAuth
// @Router /admin/change-request/{id}/reject [put]
func (h *DriverHandler) RejectChangeRequest(c *gin.Context) {
	requestID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_request_id",
			Message: "Invalid change request ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	var requestBody struct {
		AdminComments string `json:"admin_comments" binding:"required"`
	}
	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "missing_comments",
			Message: "Admin comments are required for rejection",
			Code:    http.StatusBadRequest,
		})
		return
	}

	adminID := c.GetUint("user_id")

	// Get the change request
	var changeRequest models.DriverChangeRequest
	if err := h.services.DB.Where("id = ?", requestID).First(&changeRequest).Error; err != nil {
		c.JSON(http.StatusNotFound, dto.APIError{
			Error:   "request_not_found",
			Message: "Change request not found",
			Code:    http.StatusNotFound,
		})
		return
	}

	if changeRequest.Status != "PENDING" {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "already_processed",
			Message: "Change request has already been processed",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Update change request status
	now := time.Now()
	changeRequest.Status = "REJECTED"
	changeRequest.ReviewedAt = &now
	changeRequest.ReviewedBy = &adminID
	changeRequest.AdminComments = requestBody.AdminComments

	if err := h.services.DB.Save(&changeRequest).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIError{
			Error:   "database_error",
			Message: "Failed to update change request status",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Change request rejected",
		"status":  "REJECTED",
	})
}
