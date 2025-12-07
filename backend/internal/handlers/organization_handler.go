package handlers

import (
	"net/http"
	"strconv"

	"github.com/fleetflow/backend/internal/models"
	"github.com/fleetflow/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type OrganizationHandler struct {
	service     *services.OrganizationService
	authService *services.AuthService
}

func NewOrganizationHandler(service *services.OrganizationService, authService *services.AuthService) *OrganizationHandler {
	return &OrganizationHandler{
		service:     service,
		authService: authService,
	}
}

// CreateOrganizationRequest DTO
type CreateOrganizationRequest struct {
	Name          string `json:"name" binding:"required"`
	Code          string `json:"code" binding:"required"`
	AdminPhone    string `json:"admin_phone" binding:"required"`
	AdminEmail    string `json:"admin_email" binding:"required,email"`
	AdminPassword string `json:"admin_password" binding:"required,min=8"`
}

// RegisterOrganization handles new tenant signup
func (h *OrganizationHandler) RegisterOrganization(c *gin.Context) {
	var req CreateOrganizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	org := models.Organization{
		Name:         req.Name,
		Code:         req.Code,
		ContactEmail: req.AdminEmail,
		ContactPhone: req.AdminPhone,
	}

	// Hash the admin password using bcrypt
	hashedPassword, err := h.authService.HashPassword(req.AdminPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to secure admin password"})
		return
	}

	// Create admin user account
	adminUser := models.UserAccount{
		Phone:    req.AdminPhone,
		Email:    req.AdminEmail,
		Password: hashedPassword,
		Role:     models.RoleAdmin,
		IsActive: true,
	}

	if err := h.service.CreateOrganization(&org, &adminUser); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create organization: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":         "Organization created successfully",
		"organization_id": org.ID,
		"admin_user_id":   adminUser.ID,
	})
}

// GetMyOrganization returns the current user's organization
func (h *OrganizationHandler) GetMyOrganization(c *gin.Context) {
	// TODO: Extract OrgID from JWT context
	// orgID, _ := c.Get("organization_id")
	// For now, we'll take it from param for testing until Auth middleware is updated
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	org, err := h.service.GetOrganizationByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
		return
	}

	c.JSON(http.StatusOK, org)
}
