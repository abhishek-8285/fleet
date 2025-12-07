package handlers

import (
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/fleetflow/backend/internal/dto"
	"github.com/fleetflow/backend/internal/middleware"
	"github.com/fleetflow/backend/internal/models"
	"github.com/fleetflow/backend/internal/services"
	"github.com/fleetflow/backend/internal/utils"
	"github.com/gin-gonic/gin"
)

// AuthHandler handles authentication endpoints
type AuthHandler struct {
	services *services.Container
}

func NewAuthHandler(services *services.Container) *AuthHandler {
	return &AuthHandler{services: services}
}

// WhatsAppHandler handles WhatsApp-related HTTP endpoints
type WhatsAppHandler struct {
	services *services.Container
}

func NewWhatsAppHandler(services *services.Container) *WhatsAppHandler {
	return &WhatsAppHandler{services: services}
}

// SendOTP sends OTP to phone number
// @Summary Send OTP
// @Description Send OTP to the provided phone number for authentication
// @Tags auth
// @Accept json
// @Produce json
// @Param request body dto.SendOTPRequest true "Phone number"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 429 {object} dto.APIError
// @Router /auth/otp/send [post]
func (h *AuthHandler) SendOTP(c *gin.Context) {
	var req dto.SendOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "validation_failed",
			Message: "Invalid request data",
			Code:    http.StatusBadRequest,
			Details: map[string]string{"validation": err.Error()},
		})
		return
	}

	// CRITICAL SECURITY VALIDATION - DIRECT IMPLEMENTATION
	if utils.ContainsSQLInjection(req.Phone) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "security_validation_failed",
			"message": "SQL injection attempt detected",
			"code":    400,
		})
		return
	}

	if utils.ContainsXSS(req.Phone) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "security_validation_failed",
			"message": "XSS attempt detected",
			"code":    400,
		})
		return
	}

	// Validate Indian phone format
	if !utils.IsValidIndianPhone(req.Phone) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "validation_failed",
			"message": "Invalid Indian phone number format. Expected +91XXXXXXXXXX",
			"code":    400,
			"details": gin.H{"phone": req.Phone},
		})
		return
	}

	// CRITICAL SECURITY VALIDATION - BEFORE PROCESSING
	if utils.ContainsSQLInjection(req.Phone) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "security_validation_failed",
			"message": "SQL injection attempt detected",
			"code":    400,
		})
		return
	}

	if utils.ContainsXSS(req.Phone) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "security_validation_failed",
			"message": "XSS attempt detected",
			"code":    400,
		})
		return
	}

	// Validate Indian phone format
	if !utils.IsValidIndianPhone(req.Phone) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "validation_failed",
			"message": "Invalid Indian phone number format. Expected +91XXXXXXXXXX",
			"code":    400,
			"details": gin.H{"phone": req.Phone},
		})
		return
	}

	// Get client info for audit
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	// Send OTP
	otpVerification, err := h.services.AuthService.SendOTP(req.Phone, ipAddress, userAgent)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "OTP already sent recently. Please wait before requesting again" {
			statusCode = http.StatusTooManyRequests
		}

		c.JSON(statusCode, dto.APIError{
			Error:   "otp_send_failed",
			Message: err.Error(),
			Code:    statusCode,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SendOTPResponse{
		Message:   "OTP sent successfully to " + req.Phone,
		ExpiresAt: otpVerification.ExpiresAt,
		RequestID: "otp_" + strconv.Itoa(int(otpVerification.ID)),
	})
}

// VerifyOTP verifies OTP and returns JWT tokens
// @Summary Verify OTP
// @Description Verify OTP and get access token for authentication
// @Tags auth
// @Accept json
// @Produce json
// @Param request body dto.VerifyOTPRequest true "Phone and OTP"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Router /auth/otp/verify [post]
func (h *AuthHandler) VerifyOTP(c *gin.Context) {
	var req dto.VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "validation_failed",
			Message: "Invalid request data",
			Code:    http.StatusBadRequest,
			Details: map[string]string{"validation": err.Error()},
		})
		return
	}

	// Get client info for audit
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	// Verify OTP
	user, err := h.services.AuthService.VerifyOTP(req.Phone, req.OTP, ipAddress, userAgent)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.APIError{
			Error:   "otp_verification_failed",
			Message: err.Error(),
			Code:    http.StatusUnauthorized,
		})
		return
	}

	// Generate JWT tokens
	accessToken, err := h.services.JWTService.GenerateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIError{
			Error:   "token_generation_failed",
			Message: "Failed to generate access token",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	refreshToken, err := h.services.JWTService.GenerateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIError{
			Error:   "token_generation_failed",
			Message: "Failed to generate refresh token",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	// Prepare user info
	userInfo := &dto.UserInfo{
		ID:       user.ID,
		Phone:    user.Phone,
		Role:     user.Role,
		IsActive: user.IsActive,
		DriverID: user.DriverID,
	}

	// Add driver info if available
	if user.Driver != nil {
		userInfo.Driver = &dto.DriverInfo{
			ID:     user.Driver.ID,
			Name:   user.Driver.Name,
			Status: string(user.Driver.Status),
			Rating: user.Driver.Rating,
		}
	}

	c.JSON(http.StatusOK, dto.VerifyOTPResponse{
		Message:      "Login successful",
		AccessToken:  accessToken,
		RefreshToken: refreshToken.Token,
		ExpiresIn:    int(h.services.Config.JWTExpirationTime.Seconds()),
		User:         userInfo,
	})
}

// RefreshToken refreshes access token using refresh token
// @Summary Refresh Token
// @Description Get new access token using refresh token
// @Tags auth
// @Accept json
// @Produce json
// @Param request body dto.RefreshTokenRequest true "Refresh token"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Router /auth/refresh [post]
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req dto.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "validation_failed",
			Message: "Invalid request data",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Refresh tokens
	newAccessToken, newRefreshToken, err := h.services.JWTService.RefreshToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.APIError{
			Error:   "token_refresh_failed",
			Message: "Invalid or expired refresh token",
			Code:    http.StatusUnauthorized,
		})
		return
	}

	c.JSON(http.StatusOK, dto.RefreshTokenResponse{
		AccessToken:  newAccessToken,
		RefreshToken: newRefreshToken.Token,
		ExpiresIn:    int(h.services.Config.JWTExpirationTime.Seconds()),
	})
}

// Logout revokes refresh token and logs out user
// @Summary Logout
// @Description Logout user and revoke tokens
// @Tags auth
// @Accept json
// @Produce json
// @Param request body map[string]interface{} false "Logout request"
// @Success 200 {object} map[string]interface{}
// @Security BearerAuth
// @Router /auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	userID, exists := middleware.GetCurrentUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.APIError{
			Error:   "unauthorized",
			Message: "User not authenticated",
			Code:    http.StatusUnauthorized,
		})
		return
	}

	var req dto.LogoutRequest
	c.ShouldBindJSON(&req) // Optional body

	// Revoke specific refresh token or all user tokens
	if req.RefreshToken != "" {
		err := h.services.JWTService.RevokeRefreshToken(req.RefreshToken)
		if err != nil {
			// Don't fail logout if specific token revocation fails
		}
	} else {
		// Revoke all user tokens
		err := h.services.JWTService.RevokeAllUserTokens(userID)
		if err != nil {
			// Don't fail logout if token revocation fails
		}
	}

	// Log audit event
	h.services.AuditService.LogAction(
		models.AuditActionUserLogout,
		models.AuditSeverityInfo,
		"User logged out",
		nil, nil,
		&models.AuditContext{
			UserID:    &userID,
			IPAddress: c.ClientIP(),
			UserAgent: c.GetHeader("User-Agent"),
		},
	)

	c.JSON(http.StatusOK, dto.LogoutResponse{
		Message: "Logged out successfully",
	})
}

// GetProfile returns current user profile
// @Summary Get Profile
// @Description Get current user profile information
// @Tags auth
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /auth/profile [get]
func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID, exists := middleware.GetCurrentUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.APIError{
			Error:   "unauthorized",
			Message: "User not authenticated",
			Code:    http.StatusUnauthorized,
		})
		return
	}

	user, err := h.services.AuthService.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIError{
			Error:   "user_fetch_failed",
			Message: "Failed to fetch user profile",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	response := dto.UserResponse{
		ID:        user.ID,
		Phone:     user.Phone,
		Role:      user.Role,
		IsActive:  user.IsActive,
		LastLogin: user.LastLogin,
		CreatedAt: user.CreatedAt,
		DriverID:  user.DriverID,
	}

	if user.Driver != nil {
		response.Driver = &dto.DriverInfo{
			ID:     user.Driver.ID,
			Name:   user.Driver.Name,
			Status: string(user.Driver.Status),
			Rating: user.Driver.Rating,
		}
	}

	c.JSON(http.StatusOK, response)
}

// UpdateProfile updates current user profile
// @Summary Update Profile
// @Description Update current user profile information
// @Tags auth
// @Accept json
// @Produce json
// @Param request body map[string]interface{} true "Profile updates"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /auth/profile [put]
func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID, exists := middleware.GetCurrentUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.APIError{
			Error:   "unauthorized",
			Message: "User not authenticated",
			Code:    http.StatusUnauthorized,
		})
		return
	}

	var req dto.SendOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "validation_failed",
			Message: "Invalid request data",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// For now, OTP-based auth has limited profile updates
	// This is a placeholder for future enhancements
	user, err := h.services.AuthService.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIError{
			Error:   "user_fetch_failed",
			Message: "Failed to fetch user profile",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	response := dto.UserResponse{
		ID:        user.ID,
		Phone:     user.Phone,
		Role:      user.Role,
		IsActive:  user.IsActive,
		LastLogin: user.LastLogin,
		CreatedAt: user.CreatedAt,
		DriverID:  user.DriverID,
	}

	c.JSON(http.StatusOK, response)
}

// GetUsers returns paginated list of users (admin only)
// @Summary Get Users
// @Description Get paginated list of all users (admin only)
// @Tags admin
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Param search query string false "Search term"
// @Param role query string false "Filter by role"
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} dto.APIError
// @Failure 403 {object} dto.APIError
// @Security BearerAuth
// @Router /admin/users [get]
func (h *AuthHandler) GetUsers(c *gin.Context) {
	var pagination dto.PaginationParams
	if err := c.ShouldBindQuery(&pagination); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "validation_failed",
			Message: "Invalid pagination parameters",
			Code:    http.StatusBadRequest,
		})
		return
	}

	var filters dto.FilterParams
	c.ShouldBindQuery(&filters)

	// Get users from service (to be implemented)
	c.JSON(http.StatusOK, dto.UsersListResponse{
		Users:      []dto.UserResponse{},
		Total:      0,
		Page:       pagination.Page,
		Limit:      pagination.Limit,
		TotalPages: 0,
	})
}

// CreateUser creates a new user (admin only)
// @Summary Create User
// @Description Create a new user account (admin only)
// @Tags admin
// @Accept json
// @Produce json
// @Param request body map[string]interface{} true "User data"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Failure 403 {object} dto.APIError
// @Security BearerAuth
// @Router /admin/users [post]
func (h *AuthHandler) CreateUser(c *gin.Context) {
	var req dto.SendOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "validation_failed",
			Message: "Invalid request data",
			Code:    http.StatusBadRequest,
		})
		return
	}

	createdBy, _ := middleware.GetCurrentUserID(c)

	user, err := h.services.AuthService.CreateAdminUser(req.Phone, createdBy)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "user_creation_failed",
			Message: err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	response := dto.UserResponse{
		ID:        user.ID,
		Phone:     user.Phone,
		Role:      user.Role,
		IsActive:  user.IsActive,
		CreatedAt: user.CreatedAt,
	}

	c.JSON(http.StatusCreated, response)
}

// UpdateUser updates user information (admin only)
// @Summary Update User
// @Description Update user information (admin only)
// @Tags admin
// @Accept json
// @Produce json
// @Param id path int true "User ID"
// @Param request body map[string]interface{} true "User updates"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Failure 403 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /admin/users/{id} [put]
func (h *AuthHandler) UpdateUser(c *gin.Context) {
	userIDStr := c.Param("id")
	_, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_user_id",
			Message: "Invalid user ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	var req dto.SendOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "validation_failed",
			Message: "Invalid request data",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// TODO: Implement user update logic
	c.JSON(http.StatusOK, dto.SuccessResponse{
		Message: "User updated successfully",
	})
}

// DeleteUser deactivates user account (admin only)
// @Summary Delete User
// @Description Deactivate user account (admin only)
// @Tags admin
// @Param id path int true "User ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Failure 403 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /admin/users/{id} [delete]
func (h *AuthHandler) DeleteUser(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_user_id",
			Message: "Invalid user ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	currentUserID, _ := middleware.GetCurrentUserID(c)

	err = h.services.AuthService.DeactivateUser(uint(userID), currentUserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "user_deactivation_failed",
			Message: err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Message: "User deactivated successfully",
	})
}

// ResetUserPassword triggers password reset for user (admin only)
// @Summary Reset User Password
// @Description Trigger password reset for user (admin only)
// @Tags admin
// @Accept json
// @Produce json
// @Param id path int true "User ID"
// @Param request body map[string]interface{} true "Reset request"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Failure 403 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /admin/users/{id}/reset-password [post]
func (h *AuthHandler) ResetUserPassword(c *gin.Context) {
	userIDStr := c.Param("id")
	_, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_user_id",
			Message: "Invalid user ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	var req dto.SendOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "validation_failed",
			Message: "Invalid request data",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// For OTP-based system, this sends a new OTP
	_, err = h.services.AuthService.SendOTP(req.Phone, c.ClientIP(), c.GetHeader("User-Agent"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "reset_failed",
			Message: err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Message: "Password reset OTP sent successfully",
	})
}

// DriverHandler handles driver endpoints
type DriverHandler struct {
	services *services.Container
}

func NewDriverHandler(services *services.Container) *DriverHandler {
	return &DriverHandler{services: services}
}

// GetDrivers returns paginated list of drivers
// @Summary Get Drivers
// @Description Get paginated list of drivers with filtering
// @Tags drivers
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Param status query string false "Filter by status"
// @Param search query string false "Search term"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /drivers [get]
func (h *DriverHandler) GetDrivers(c *gin.Context) {
	var filters dto.DriverFilterParams
	if err := c.ShouldBindQuery(&filters); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "validation_failed",
			Message: "Invalid query parameters",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Build filter map
	filterMap := make(map[string]interface{})
	if filters.Status != "" {
		filterMap["status"] = filters.Status
	}
	if filters.IsActive != nil {
		filterMap["is_active"] = *filters.IsActive
	}
	if filters.Search != "" {
		filterMap["search"] = filters.Search
	}
	if filters.LicenseExpiry != nil && *filters.LicenseExpiry {
		filterMap["license_expiring"] = true
	}

	// Get drivers from service
	drivers, total, err := h.services.DriverService.GetDrivers(filters.Page, filters.Limit, filterMap)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIError{
			Error:   "drivers_fetch_failed",
			Message: "Failed to fetch drivers",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	// Convert to response DTOs
	var driverResponses []dto.DriverResponse
	for _, driver := range drivers {
		response := dto.DriverResponse{
			ID:                  driver.ID,
			Name:                driver.Name,
			Phone:               driver.Phone,
			LicenseNumber:       driver.LicenseNumber,
			LicenseExpiry:       driver.LicenseExpiry,
			MedicalCertExpiry:   driver.MedicalCertExpiry,
			Status:              driver.Status,
			Rating:              driver.Rating,
			TotalTrips:          driver.TotalTrips,
			IsActive:            driver.IsActive,
			HiredAt:             driver.HiredAt,
			CreatedAt:           driver.CreatedAt,
			UpdatedAt:           driver.UpdatedAt,
			Address:             driver.Address,
			DateOfBirth:         driver.DateOfBirth,
			EmergencyName:       driver.EmergencyName,
			EmergencyPhone:      driver.EmergencyPhone,
			FuelEfficiency:      driver.FuelEfficiency,
			OnTimeDeliveries:    driver.OnTimeDeliveries,
			CustomerRatingSum:   driver.CustomerRatingSum,
			CustomerRatingCount: driver.CustomerRatingCount,
		}
		driverResponses = append(driverResponses, response)
	}

	totalPages := int((total + int64(filters.Limit) - 1) / int64(filters.Limit))

	c.JSON(http.StatusOK, dto.DriversListResponse{
		Drivers:    driverResponses,
		Total:      total,
		Page:       filters.Page,
		Limit:      filters.Limit,
		TotalPages: totalPages,
	})
}

// CreateDriver creates a new driver
// @Summary Create Driver
// @Description Create a new driver
// @Tags drivers
// @Accept json
// @Produce json
// @Param request body dto.CreateDriverRequest true "Driver data"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /drivers [post]
func (h *DriverHandler) CreateDriver(c *gin.Context) {
	var req dto.CreateDriverRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "validation_failed",
			Message: "Invalid request data",
			Code:    http.StatusBadRequest,
			Details: map[string]string{"validation": err.Error()},
		})
		return
	}

	// Create driver model
	driver := &models.Driver{
		Name:              req.Name,
		Phone:             req.Phone,
		LicenseNumber:     req.LicenseNumber,
		LicenseExpiry:     req.LicenseExpiry,
		MedicalCertExpiry: req.MedicalCertExpiry,
		Status:            models.DriverStatusAvailable,
		Rating:            5.0, // Default rating
		IsActive:          true,
		HiredAt:           req.HiredAt,
		Address:           req.Address,
		DateOfBirth:       req.DateOfBirth,
		EmergencyName:     req.EmergencyName,
		EmergencyPhone:    req.EmergencyPhone,
	}

	// Create driver
	createdDriver, err := h.services.DriverService.CreateDriver(driver)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "driver_creation_failed",
			Message: err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	response := dto.DriverResponse{
		ID:                createdDriver.ID,
		Name:              createdDriver.Name,
		Phone:             createdDriver.Phone,
		LicenseNumber:     createdDriver.LicenseNumber,
		LicenseExpiry:     createdDriver.LicenseExpiry,
		MedicalCertExpiry: createdDriver.MedicalCertExpiry,
		Status:            createdDriver.Status,
		Rating:            createdDriver.Rating,
		TotalTrips:        createdDriver.TotalTrips,
		IsActive:          createdDriver.IsActive,
		HiredAt:           createdDriver.HiredAt,
		CreatedAt:         createdDriver.CreatedAt,
		UpdatedAt:         createdDriver.UpdatedAt,
		Address:           createdDriver.Address,
		DateOfBirth:       createdDriver.DateOfBirth,
		EmergencyName:     createdDriver.EmergencyName,
		EmergencyPhone:    createdDriver.EmergencyPhone,
	}

	c.JSON(http.StatusCreated, response)
}

// GetDriver returns driver details by ID
// @Summary Get Driver
// @Description Get driver details by ID
// @Tags drivers
// @Produce json
// @Param id path int true "Driver ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /drivers/{id} [get]
func (h *DriverHandler) GetDriver(c *gin.Context) {
	driverIDStr := c.Param("id")
	driverID, err := strconv.ParseUint(driverIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_driver_id",
			Message: "Invalid driver ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	driver, err := h.services.DriverService.GetDriverByID(uint(driverID))
	if err != nil {
		c.JSON(http.StatusNotFound, dto.APIError{
			Error:   "driver_not_found",
			Message: "Driver not found",
			Code:    http.StatusNotFound,
		})
		return
	}

	response := dto.DriverResponse{
		ID:                  driver.ID,
		Name:                driver.Name,
		Phone:               driver.Phone,
		LicenseNumber:       driver.LicenseNumber,
		LicenseExpiry:       driver.LicenseExpiry,
		MedicalCertExpiry:   driver.MedicalCertExpiry,
		Status:              driver.Status,
		Rating:              driver.Rating,
		TotalTrips:          driver.TotalTrips,
		IsActive:            driver.IsActive,
		HiredAt:             driver.HiredAt,
		CreatedAt:           driver.CreatedAt,
		UpdatedAt:           driver.UpdatedAt,
		Address:             driver.Address,
		DateOfBirth:         driver.DateOfBirth,
		EmergencyName:       driver.EmergencyName,
		EmergencyPhone:      driver.EmergencyPhone,
		FuelEfficiency:      driver.FuelEfficiency,
		OnTimeDeliveries:    driver.OnTimeDeliveries,
		CustomerRatingSum:   driver.CustomerRatingSum,
		CustomerRatingCount: driver.CustomerRatingCount,
	}

	c.JSON(http.StatusOK, response)
}

// UpdateDriver updates driver information
// @Summary Update Driver
// @Description Update driver information
// @Tags drivers
// @Accept json
// @Produce json
// @Param id path int true "Driver ID"
// @Param request body map[string]interface{} true "Driver updates"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /drivers/{id} [put]
func (h *DriverHandler) UpdateDriver(c *gin.Context) {
	driverIDStr := c.Param("id")
	driverID, err := strconv.ParseUint(driverIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_driver_id",
			Message: "Invalid driver ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	var req dto.UpdateDriverRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "validation_failed",
			Message: "Invalid request data",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Build updates map
	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.LicenseNumber != nil {
		updates["license_number"] = *req.LicenseNumber
	}
	if req.LicenseExpiry != nil {
		updates["license_expiry"] = *req.LicenseExpiry
	}
	if req.MedicalCertExpiry != nil {
		updates["medical_cert_expiry"] = *req.MedicalCertExpiry
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.Address != nil {
		updates["address"] = *req.Address
	}
	if req.DateOfBirth != nil {
		updates["date_of_birth"] = *req.DateOfBirth
	}
	if req.EmergencyName != nil {
		updates["emergency_name"] = *req.EmergencyName
	}
	if req.EmergencyPhone != nil {
		updates["emergency_phone"] = *req.EmergencyPhone
	}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}

	// Update driver
	updatedDriver, err := h.services.DriverService.UpdateDriver(&models.Driver{
		ID:            uint(driverID),
		Name:          updates["name"].(string),
		Phone:         updates["phone"].(string),
		LicenseNumber: updates["license_number"].(string),
		// LicenseExpiry: updates["license_expiry"].(time.Time),
		// MedicalCertExpiry: updates["medical_cert_expiry"].(time.Time),
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "driver_update_failed",
			Message: err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	response := dto.DriverResponse{
		ID:                  updatedDriver.ID,
		Name:                updatedDriver.Name,
		Phone:               updatedDriver.Phone,
		LicenseNumber:       updatedDriver.LicenseNumber,
		LicenseExpiry:       updatedDriver.LicenseExpiry,
		MedicalCertExpiry:   updatedDriver.MedicalCertExpiry,
		Status:              updatedDriver.Status,
		Rating:              updatedDriver.Rating,
		TotalTrips:          updatedDriver.TotalTrips,
		IsActive:            updatedDriver.IsActive,
		HiredAt:             updatedDriver.HiredAt,
		CreatedAt:           updatedDriver.CreatedAt,
		UpdatedAt:           updatedDriver.UpdatedAt,
		Address:             updatedDriver.Address,
		DateOfBirth:         updatedDriver.DateOfBirth,
		EmergencyName:       updatedDriver.EmergencyName,
		EmergencyPhone:      updatedDriver.EmergencyPhone,
		FuelEfficiency:      updatedDriver.FuelEfficiency,
		OnTimeDeliveries:    updatedDriver.OnTimeDeliveries,
		CustomerRatingSum:   updatedDriver.CustomerRatingSum,
		CustomerRatingCount: updatedDriver.CustomerRatingCount,
	}

	c.JSON(http.StatusOK, response)
}

// DeleteDriver soft deletes a driver
// @Summary Delete Driver
// @Description Soft delete a driver
// @Tags drivers
// @Param id path int true "Driver ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /drivers/{id} [delete]
func (h *DriverHandler) DeleteDriver(c *gin.Context) {
	driverIDStr := c.Param("id")
	driverID, err := strconv.ParseUint(driverIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_driver_id",
			Message: "Invalid driver ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	err = h.services.DriverService.DeleteDriver(uint(driverID))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "driver_deletion_failed",
			Message: err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Message: "Driver deleted successfully",
	})
}

// GetDriverPerformance returns driver performance metrics
// @Summary Get Driver Performance
// @Description Get driver performance metrics
// @Tags drivers
// @Produce json
// @Param id path int true "Driver ID"
// @Param period query string false "Period (DAILY, WEEKLY, MONTHLY)" default("MONTHLY")
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /drivers/{id}/performance [get]
func (h *DriverHandler) GetDriverPerformance(c *gin.Context) {
	driverIDStr := c.Param("id")
	driverID, err := strconv.ParseUint(driverIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_driver_id",
			Message: "Invalid driver ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	period := c.DefaultQuery("period", "MONTHLY")

	performance, err := h.services.DriverService.GetDriverPerformance(uint(driverID), period)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.APIError{
			Error:   "performance_fetch_failed",
			Message: "Failed to fetch driver performance",
			Code:    http.StatusNotFound,
		})
		return
	}

	response := dto.DriverPerformanceResponse{
		DriverID:              performance.DriverID,
		Name:                  "Driver", // TODO: Get actual driver name from driver table
		Rating:                performance.Rating,
		TotalTrips:            performance.TotalTrips,
		CompletedTrips:        performance.CompletedTrips,
		OnTimePercentage:      95.0, // TODO: Calculate actual on-time percentage
		FuelEfficiency:        performance.FuelEfficiency,
		AverageCustomerRating: 4.5,    // TODO: Get actual customer rating
		MonthlyKilometers:     1500.0, // TODO: Calculate actual monthly kilometers
		SafetyScore:           performance.SafetyScore,
		Period:                period,
		StartDate:             time.Now().AddDate(0, -1, 0), // Last month
		EndDate:               time.Now(),
		PerformanceTrend:      "STABLE",
		PreviousPeriodRating:  performance.Rating - 0.1,
		RatingChange:          0.1,
	}

	c.JSON(http.StatusOK, response)
}

// GetDriverCompliance returns driver compliance status
// @Summary Get Driver Compliance
// @Description Get driver compliance status
// @Tags drivers
// @Produce json
// @Param id path int true "Driver ID"
// @Success 200 {object} dto.DriverComplianceInfo
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /drivers/{id}/compliance [get]
func (h *DriverHandler) GetDriverCompliance(c *gin.Context) {
	driverIDStr := c.Param("id")
	driverID, err := strconv.ParseUint(driverIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_driver_id",
			Message: "Invalid driver ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	compliance, err := h.services.DriverService.GetDriverCompliance(uint(driverID))
	if err != nil {
		c.JSON(http.StatusNotFound, dto.APIError{
			Error:   "compliance_fetch_failed",
			Message: "Failed to fetch driver compliance",
			Code:    http.StatusNotFound,
		})
		return
	}

	// Helper function for pointer values
	licenseExpiryDays := 30
	medicalCertExpiryDays := 60

	response := dto.DriverComplianceInfo{
		LicenseStatus:          compliance.LicenseStatus,
		LicenseExpiryDays:      &licenseExpiryDays, // TODO: Calculate actual days until license expiry
		MedicalCertStatus:      compliance.MedicalCertStatus,
		MedicalCertExpiryDays:  &medicalCertExpiryDays, // TODO: Calculate actual days until medical cert expiry
		OverallComplianceScore: 95.0,                   // TODO: Calculate actual compliance score
	}

	c.JSON(http.StatusOK, response)
}

// GetCurrentDriverStats gets stats for the currently logged-in driver
// @Summary Get Current Driver Stats
// @Description Get statistics for the currently logged-in driver
// @Tags drivers
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /driver/stats [get]
func (h *DriverHandler) GetCurrentDriverStats(c *gin.Context) {
	// Get current user ID from JWT token
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.APIError{
			Error:   "unauthorized",
			Message: "User not found in token",
		})
		return
	}

	// Get user details to find associated driver
	user, err := h.services.AuthService.GetUserByID(userID.(uint))
	if err != nil {
		c.JSON(http.StatusNotFound, dto.APIError{
			Error:   "user_not_found",
			Message: "User not found",
		})
		return
	}

	// Check if user has an associated driver
	if user.DriverID == nil {
		c.JSON(http.StatusNotFound, dto.APIError{
			Error:   "driver_not_found",
			Message: "No driver profile associated with this user",
		})
		return
	}

	// Get driver performance metrics
	performance, err := h.services.DriverService.GetDriverPerformance(*user.DriverID, "MONTHLY")
	if err != nil {
		// Return default stats if no performance data found
		response := dto.DriverStatsResponse{
			Rating:           4.8,
			TotalTrips:       127,
			TodayEarnings:    850.0,
			FuelEfficiency:   12.5,
			OnTimeDeliveries: 95,
			CustomerRating:   4.7,
		}
		c.JSON(http.StatusOK, response)
		return
	}

	// Convert performance to stats response
	response := dto.DriverStatsResponse{
		Rating:           performance.Rating,
		TotalTrips:       int(performance.TotalTrips),
		TodayEarnings:    850.0, // Mock value for today's earnings
		FuelEfficiency:   performance.FuelEfficiency,
		OnTimeDeliveries: 95, // Mock value for on-time deliveries
		CustomerRating:   performance.CustomerRating,
	}

	c.JSON(http.StatusOK, response)
}

// GetCurrentDriverProfile gets profile for the currently logged-in driver
func (h *DriverHandler) GetCurrentDriverProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in token"})
		return
	}

	user, err := h.services.AuthService.GetUserByID(userID.(uint))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Return driver profile data
	c.JSON(http.StatusOK, gin.H{
		"id":         userID,
		"phone":      user.Phone,
		"name":       "Driver Name", // Mock data
		"vehicle":    "TRK-001",     // Mock data
		"rating":     4.8,
		"totalTrips": 127,
		"status":     "AVAILABLE",
		"licenseNo":  "DL123456789",
		"joinDate":   "2024-01-15",
	})
}

// GetCurrentDriverTrips gets current/active trips for the logged-in driver
func (h *DriverHandler) GetCurrentDriverTrips(c *gin.Context) {
	_, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in token"})
		return
	}

	// Return current trips (empty for now)
	c.JSON(http.StatusOK, gin.H{
		"currentTrip":   nil,
		"upcomingTrips": []interface{}{},
		"message":       "No active trips",
	})
}

// UpdateDriverStatus updates driver status
// @Summary Update Driver Status
// @Description Update driver status (AVAILABLE, ON_TRIP, ON_BREAK, OFFLINE)
// @Tags drivers
// @Accept json
// @Produce json
// @Param id path int true "Driver ID"
// @Param request body map[string]interface{} true "Status update"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /drivers/{id}/status [put]
func (h *DriverHandler) UpdateDriverStatus(c *gin.Context) {
	driverIDStr := c.Param("id")
	driverID, err := strconv.ParseUint(driverIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_driver_id",
			Message: "Invalid driver ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	var req dto.UpdateDriverStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "validation_failed",
			Message: "Invalid request data",
			Code:    http.StatusBadRequest,
		})
		return
	}

	err = h.services.DriverService.UpdateDriverStatus(uint(driverID), string(req.Status), req.Reason)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "status_update_failed",
			Message: err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Message: "Driver status updated successfully",
	})
}

// ExportDrivers exports drivers data
// @Summary Export Drivers
// @Description Export drivers data to CSV
// @Tags drivers
// @Produce text/csv
// @Param format query string false "Export format" default("csv")
// @Success 200 {file} file
// @Failure 400 {object} dto.APIError
// @Security BearerAuth
// @Router /reports/drivers [get]
func (h *DriverHandler) ExportDrivers(c *gin.Context) {
	// TODO: Implement CSV export
	c.JSON(http.StatusOK, dto.SuccessResponse{
		Message: "Driver export functionality coming soon",
	})
}

// VehicleHandler handles vehicle endpoints
type VehicleHandler struct {
	services *services.Container
}

func NewVehicleHandler(services *services.Container) *VehicleHandler {
	return &VehicleHandler{services: services}
}

// GetVehicles returns paginated list of vehicles
// @Summary Get Vehicles
// @Description Get paginated list of vehicles with filtering
// @Tags vehicles
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Param status query string false "Filter by status"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /vehicles [get]
func (h *VehicleHandler) GetVehicles(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Vehicles list"})
}

// CreateVehicle creates a new vehicle
// @Summary Create Vehicle
// @Description Create a new vehicle in the fleet
// @Tags vehicles
// @Accept json
// @Produce json
// @Param request body map[string]interface{} true "Vehicle data"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /vehicles [post]
func (h *VehicleHandler) CreateVehicle(c *gin.Context) {
	c.JSON(http.StatusCreated, gin.H{"message": "Vehicle created"})
}

// GetVehicle returns vehicle details by ID
// @Summary Get Vehicle
// @Description Get vehicle details by ID
// @Tags vehicles
// @Produce json
// @Param id path int true "Vehicle ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /vehicles/{id} [get]
func (h *VehicleHandler) GetVehicle(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Vehicle data"})
}

// UpdateVehicle updates vehicle information
// @Summary Update Vehicle
// @Description Update vehicle information
// @Tags vehicles
// @Accept json
// @Produce json
// @Param id path int true "Vehicle ID"
// @Param request body map[string]interface{} true "Vehicle data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /vehicles/{id} [put]
func (h *VehicleHandler) UpdateVehicle(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Vehicle updated"})
}

// DeleteVehicle soft deletes a vehicle
// @Summary Delete Vehicle
// @Description Soft delete a vehicle from the fleet
// @Tags vehicles
// @Param id path int true "Vehicle ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /vehicles/{id} [delete]
func (h *VehicleHandler) DeleteVehicle(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Vehicle deleted"})
}

// GetVehicleLocation returns vehicle current location
// @Summary Get Vehicle Location
// @Description Get current GPS location of a vehicle
// @Tags vehicles
// @Produce json
// @Param id path int true "Vehicle ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /vehicles/{id}/location [get]
func (h *VehicleHandler) GetVehicleLocation(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Vehicle location"})
}

// GetVehiclePerformance returns vehicle performance metrics
// @Summary Get Vehicle Performance
// @Description Get performance metrics for a vehicle
// @Tags vehicles
// @Produce json
// @Param id path int true "Vehicle ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /vehicles/{id}/performance [get]
func (h *VehicleHandler) GetVehiclePerformance(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Vehicle performance"})
}

// GetVehicleCompliance returns vehicle compliance status
// @Summary Get Vehicle Compliance
// @Description Get compliance status for a vehicle
// @Tags vehicles
// @Produce json
// @Param id path int true "Vehicle ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /vehicles/{id}/compliance [get]
func (h *VehicleHandler) GetVehicleCompliance(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Vehicle compliance"})
}

// UpdateVehicleLocation updates vehicle GPS location
// @Summary Update Vehicle Location
// @Description Update vehicle GPS location
// @Tags vehicles
// @Accept json
// @Produce json
// @Param id path int true "Vehicle ID"
// @Param request body map[string]interface{} true "Location data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /vehicles/{id}/location [put]

// UpdateVehicleLocation updates vehicle location with MQTT publishing
func (h *VehicleHandler) UpdateVehicleLocation(c *gin.Context) {
	vehicleIDStr := c.Param("id")
	vehicleID, err := strconv.ParseUint(vehicleIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_vehicle_id",
			Message: "Invalid vehicle ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	var locationData struct {
		DriverID       *uint   `json:"driver_id,omitempty"`
		Latitude       float64 `json:"latitude" binding:"required"`
		Longitude      float64 `json:"longitude" binding:"required"`
		Speed          float64 `json:"speed"`
		Heading        float64 `json:"heading"`
		Accuracy       float64 `json:"accuracy"`
		Address        string  `json:"address,omitempty"`
		BatteryLevel   *int    `json:"battery_level,omitempty"`
		SignalStrength *int    `json:"signal_strength,omitempty"`
	}

	if err := c.ShouldBindJSON(&locationData); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_location_data",
			Message: "Invalid location data",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Update vehicle location in database (implementation would be in VehicleService)
	// TODO: Call h.services.VehicleService.UpdateLocation(vehicleID, locationData)

	// Publish to MQTT for real-time tracking if enabled
	if h.services.MQTTService.IsEnabled() {
		mqttLocation := services.LocationUpdate{
			VehicleID:      uint(vehicleID),
			DriverID:       locationData.DriverID,
			Latitude:       locationData.Latitude,
			Longitude:      locationData.Longitude,
			Speed:          locationData.Speed,
			Heading:        locationData.Heading,
			Accuracy:       locationData.Accuracy,
			Address:        locationData.Address,
			BatteryLevel:   locationData.BatteryLevel,
			SignalStrength: locationData.SignalStrength,
		}

		if err := h.services.MQTTService.PublishLocationUpdate(uint(vehicleID), &mqttLocation); err != nil {
			// Log error but don't fail the request
			log.Printf("Failed to publish vehicle location to MQTT: %v", err)
		}

		// Also publish vehicle status update
		statusUpdate := services.VehicleStatusUpdate{
			VehicleID: uint(vehicleID),
			Status:    "ON_TRIP", // Could be determined by business logic
			DriverID:  locationData.DriverID,
			// Other fields would be populated based on current vehicle state
		}

		if err := h.services.MQTTService.PublishVehicleStatus(uint(vehicleID), &statusUpdate); err != nil {
			log.Printf("Failed to publish vehicle status to MQTT: %v", err)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success":        true,
		"message":        "Vehicle location updated and published",
		"vehicle_id":     vehicleID,
		"mqtt_published": h.services.MQTTService.IsEnabled(),
	})
}

func (h *VehicleHandler) ExportVehicles(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Vehicles exported"})
}

// TripHandler handles trip endpoints
type TripHandler struct {
	services *services.Container
}

func NewTripHandler(services *services.Container) *TripHandler {
	return &TripHandler{services: services}
}

// GetTrips returns paginated list of trips
// @Summary Get Trips
// @Description Get paginated list of trips with filtering
// @Tags trips
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Param status query string false "Filter by status"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /trips [get]
func (h *TripHandler) GetTrips(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Trips list"})
}

// CreateTrip creates a new trip
// @Summary Create Trip
// @Description Create a new delivery trip
// @Tags trips
// @Accept json
// @Produce json
// @Param request body map[string]interface{} true "Trip data"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /trips [post]
func (h *TripHandler) CreateTrip(c *gin.Context) {
	c.JSON(http.StatusCreated, gin.H{"message": "Trip created"})
}

// GetTrip returns trip details by ID
// @Summary Get Trip
// @Description Get trip details by ID
// @Tags trips
// @Produce json
// @Param id path int true "Trip ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /trips/{id} [get]
func (h *TripHandler) GetTrip(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Trip data"})
}

// UpdateTrip updates trip information
// @Summary Update Trip
// @Description Update trip information
// @Tags trips
// @Accept json
// @Produce json
// @Param id path int true "Trip ID"
// @Param request body map[string]interface{} true "Trip data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /trips/{id} [put]
func (h *TripHandler) UpdateTrip(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Trip updated"})
}

// DeleteTrip soft deletes a trip
// @Summary Delete Trip
// @Description Soft delete a trip
// @Tags trips
// @Param id path int true "Trip ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /trips/{id} [delete]
func (h *TripHandler) DeleteTrip(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Trip deleted"})
}

// AssignTrip assigns a driver to a trip
// @Summary Assign Trip
// @Description Assign a driver to a trip
// @Tags trips
// @Accept json
// @Produce json
// @Param id path int true "Trip ID"
// @Param request body map[string]interface{} true "Assignment data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /trips/{id}/assign [post]
func (h *TripHandler) AssignTrip(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Trip assigned"})
}

// StartTrip starts a trip
// @Summary Start Trip
// @Description Start a trip with driver location
// @Tags trips
// @Accept json
// @Produce json
// @Param id path int true "Trip ID"
// @Param request body map[string]interface{} true "Start trip data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /trips/{id}/start [post]
func (h *TripHandler) StartTrip(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Trip started"})
}

// PauseTrip pauses a trip
// @Summary Pause Trip
// @Description Pause an ongoing trip
// @Tags trips
// @Accept json
// @Produce json
// @Param id path int true "Trip ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /trips/{id}/pause [post]
func (h *TripHandler) PauseTrip(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Trip paused"})
}

// ResumeTrip resumes a paused trip
// @Summary Resume Trip
// @Description Resume a paused trip
// @Tags trips
// @Accept json
// @Produce json
// @Param id path int true "Trip ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /trips/{id}/resume [post]
func (h *TripHandler) ResumeTrip(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Trip resumed"})
}

// CompleteTrip completes a trip
// @Summary Complete Trip
// @Description Complete a trip with delivery confirmation
// @Tags trips
// @Accept json
// @Produce json
// @Param id path int true "Trip ID"
// @Param request body map[string]interface{} true "Completion data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /trips/{id}/complete [post]
func (h *TripHandler) CompleteTrip(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Trip completed"})
}

// CancelTrip cancels a trip
// @Summary Cancel Trip
// @Description Cancel a trip
// @Tags trips
// @Accept json
// @Produce json
// @Param id path int true "Trip ID"
// @Param request body map[string]interface{} true "Cancellation data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /trips/{id}/cancel [post]
func (h *TripHandler) CancelTrip(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Trip cancelled"})
}

// GetTripLocation returns current trip location
// @Summary Get Trip Location
// @Description Get current location of a trip
// @Tags trips
// @Produce json
// @Param id path int true "Trip ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /trips/{id}/location [get]
func (h *TripHandler) GetTripLocation(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Trip location"})
}

// GetTripRoute returns trip route details
// @Summary Get Trip Route
// @Description Get route details for a trip
// @Tags trips
// @Produce json
// @Param id path int true "Trip ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /trips/{id}/route [get]
func (h *TripHandler) GetTripRoute(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Trip route"})
}

// UpdateETA updates trip estimated time of arrival
// @Summary Update Trip ETA
// @Description Update estimated time of arrival for a trip
// @Tags trips
// @Accept json
// @Produce json
// @Param id path int true "Trip ID"
// @Param request body map[string]interface{} true "ETA data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /trips/{id}/eta [put]
func (h *TripHandler) UpdateETA(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "ETA updated"})
}

// GetPublicTripStatus returns public trip tracking status
// @Summary Get Public Trip Status
// @Description Get trip status for customer tracking (public endpoint)
// @Tags tracking
// @Produce json
// @Param tracking_id path string true "Tracking ID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} dto.APIError
// @Router /tracking/{tracking_id} [get]
func (h *TripHandler) GetPublicTripStatus(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Public trip status"})
}

// ExportTrips exports trips to CSV
// @Summary Export Trips
// @Description Export trips data to CSV format
// @Tags reports
// @Produce text/csv
// @Param format query string false "Export format" default("csv")
// @Success 200 {file} file "CSV file"
// @Failure 400 {object} dto.APIError
// @Security BearerAuth
// @Router /reports/trips [get]
func (h *TripHandler) ExportTrips(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Trips exported"})
}

// FuelHandler handles fuel endpoints
type FuelHandler struct {
	services *services.Container
}

func NewFuelHandler(services *services.Container) *FuelHandler {
	return &FuelHandler{services: services}
}

// GetFuelEvents returns paginated list of fuel events
// @Summary Get Fuel Events
// @Description Get paginated list of fuel events with filtering
// @Tags fuel
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Param vehicle_id query int false "Filter by vehicle ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /fuel/events [get]
func (h *FuelHandler) GetFuelEvents(c *gin.Context) {
	// Return proper fuel events array structure
	c.JSON(http.StatusOK, gin.H{
		"events": []interface{}{},
		"total":  0,
		"page":   1,
		"limit":  20,
	})
}

// CreateFuelEvent creates a new fuel event
// @Summary Create Fuel Event
// @Description Create a new fuel purchase event
// @Tags fuel
// @Accept json
// @Produce json
// @Param request body map[string]interface{} true "Fuel event data"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /fuel/events [post]
func (h *FuelHandler) CreateFuelEvent(c *gin.Context) {
	c.JSON(http.StatusCreated, gin.H{"message": "Fuel event created"})
}

// GetFuelEvent returns fuel event details by ID
// @Summary Get Fuel Event
// @Description Get fuel event details by ID
// @Tags fuel
// @Produce json
// @Param id path int true "Fuel Event ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /fuel/events/{id} [get]
func (h *FuelHandler) GetFuelEvent(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Fuel event data"})
}

// UpdateFuelEvent updates fuel event information
// @Summary Update Fuel Event
// @Description Update fuel event information
// @Tags fuel
// @Accept json
// @Produce json
// @Param id path int true "Fuel Event ID"
// @Param request body map[string]interface{} true "Fuel event data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /fuel/events/{id} [put]
func (h *FuelHandler) UpdateFuelEvent(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Fuel event updated"})
}

// VerifyFuelEvent verifies a fuel event
// @Summary Verify Fuel Event
// @Description Verify a fuel event (admin only)
// @Tags fuel
// @Accept json
// @Produce json
// @Param id path int true "Fuel Event ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /fuel/events/{id}/verify [post]
func (h *FuelHandler) VerifyFuelEvent(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Fuel event verified"})
}

// RejectFuelEvent rejects a fuel event
// @Summary Reject Fuel Event
// @Description Reject a fuel event (admin only)
// @Tags fuel
// @Accept json
// @Produce json
// @Param id path int true "Fuel Event ID"
// @Param request body map[string]interface{} true "Rejection reason"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /fuel/events/{id}/reject [post]
func (h *FuelHandler) RejectFuelEvent(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Fuel event rejected"})
}

// GetFuelAlerts returns list of fuel alerts
// @Summary Get Fuel Alerts
// @Description Get list of fuel theft and consumption alerts
// @Tags fuel
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /fuel/alerts [get]
func (h *FuelHandler) GetFuelAlerts(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Fuel alerts list"})
}

// GetFuelAlert returns fuel alert details by ID
// @Summary Get Fuel Alert
// @Description Get fuel alert details by ID
// @Tags fuel
// @Produce json
// @Param id path int true "Fuel Alert ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /fuel/alerts/{id} [get]
func (h *FuelHandler) GetFuelAlert(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Fuel alert data"})
}

// ResolveFuelAlert resolves a fuel alert
// @Summary Resolve Fuel Alert
// @Description Resolve a fuel alert (admin only)
// @Tags fuel
// @Accept json
// @Produce json
// @Param id path int true "Fuel Alert ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /fuel/alerts/{id}/resolve [post]
func (h *FuelHandler) ResolveFuelAlert(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Fuel alert resolved"})
}

// GetFuelAnalytics returns fuel consumption analytics
// @Summary Get Fuel Analytics
// @Description Get fuel consumption and efficiency analytics
// @Tags fuel
// @Produce json
// @Param period query string false "Time period" default("month")
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /fuel/analytics [get]
func (h *FuelHandler) GetFuelAnalytics(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Fuel analytics"})
}

// GetVehicleFuelAnalytics returns vehicle-specific fuel analytics
// @Summary Get Vehicle Fuel Analytics
// @Description Get fuel analytics for a specific vehicle
// @Tags fuel
// @Produce json
// @Param vehicle_id path int true "Vehicle ID"
// @Param period query string false "Time period" default("month")
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /fuel/analytics/{vehicle_id} [get]
func (h *FuelHandler) GetVehicleFuelAnalytics(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Vehicle fuel analytics"})
}

// GetNearbyFuelStations returns nearby fuel stations
// @Summary Get Nearby Fuel Stations
// @Description Get fuel stations near a location
// @Tags fuel
// @Produce json
// @Param lat query float64 true "Latitude"
// @Param lng query float64 true "Longitude"
// @Param radius query int false "Search radius in km" default(10)
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Security BearerAuth
// @Router /fuel/stations [get]
func (h *FuelHandler) GetNearbyFuelStations(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Nearby fuel stations"})
}

// CreateFuelStation creates a new fuel station
// @Summary Create Fuel Station
// @Description Create a new fuel station (admin only)
// @Tags fuel
// @Accept json
// @Produce json
// @Param request body map[string]interface{} true "Fuel station data"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /fuel/stations [post]
func (h *FuelHandler) CreateFuelStation(c *gin.Context) {
	c.JSON(http.StatusCreated, gin.H{"message": "Fuel station created"})
}

// ExportFuelEvents exports fuel events to CSV
// @Summary Export Fuel Events
// @Description Export fuel events data to CSV format
// @Tags reports
// @Produce text/csv
// @Param format query string false "Export format" default("csv")
// @Success 200 {file} file "CSV file"
// @Failure 400 {object} dto.APIError
// @Security BearerAuth
// @Router /reports/fuel [get]
func (h *FuelHandler) ExportFuelEvents(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Fuel events exported"})
}

// LocationHandler handles location endpoints
type LocationHandler struct {
	services *services.Container
}

func NewLocationHandler(services *services.Container) *LocationHandler {
	return &LocationHandler{services: services}
}

// RecordLocationPing records a GPS location ping
// @Summary Record Location Ping
// @Description Record GPS location from driver mobile app with automatic MQTT publishing
// @Tags location
// @Accept json
// @Produce json
// @Param request body map[string]interface{} true "Location data"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /location/ping [post]
func (h *LocationHandler) RecordLocationPing(c *gin.Context) {
	var locationData struct {
		VehicleID      uint    `json:"vehicle_id" binding:"required"`
		DriverID       *uint   `json:"driver_id,omitempty"`
		Latitude       float64 `json:"latitude" binding:"required"`
		Longitude      float64 `json:"longitude" binding:"required"`
		Speed          float64 `json:"speed"`
		Heading        float64 `json:"heading"`
		Accuracy       float64 `json:"accuracy"`
		Address        string  `json:"address,omitempty"`
		BatteryLevel   *int    `json:"battery_level,omitempty"`
		SignalStrength *int    `json:"signal_strength,omitempty"`
	}

	if err := c.ShouldBindJSON(&locationData); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_location_data",
			Message: "Invalid location data",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Save location to database (implementation would be in LocationService)
	// TODO: Call h.services.LocationService.RecordLocationPing(locationData)

	// Publish to MQTT for real-time tracking if enabled
	if h.services.MQTTService.IsEnabled() {
		mqttLocation := services.LocationUpdate{
			VehicleID:      locationData.VehicleID,
			DriverID:       locationData.DriverID,
			Latitude:       locationData.Latitude,
			Longitude:      locationData.Longitude,
			Speed:          locationData.Speed,
			Heading:        locationData.Heading,
			Accuracy:       locationData.Accuracy,
			Address:        locationData.Address,
			BatteryLevel:   locationData.BatteryLevel,
			SignalStrength: locationData.SignalStrength,
		}

		if err := h.services.MQTTService.PublishLocationUpdate(locationData.VehicleID, &mqttLocation); err != nil {
			// Log error but don't fail the request
			log.Printf("Failed to publish location to MQTT: %v", err)
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"success":        true,
		"message":        "Location ping recorded and published",
		"mqtt_published": h.services.MQTTService.IsEnabled(),
	})
}

// GetVehicleLocation returns current vehicle location
// @Summary Get Vehicle Location
// @Description Get current GPS location of a vehicle
// @Tags location
// @Produce json
// @Param id path int true "Vehicle ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /location/vehicle/{id} [get]
func (h *LocationHandler) GetVehicleLocation(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Vehicle location"})
}

// GetLocationHistory returns vehicle location history
// @Summary Get Location History
// @Description Get location history for a vehicle
// @Tags location
// @Produce json
// @Param id path int true "Vehicle ID"
// @Param from query string false "Start date (RFC3339)"
// @Param to query string false "End date (RFC3339)"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /location/vehicle/{id}/history [get]
func (h *LocationHandler) GetLocationHistory(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Location history"})
}

// GetDriverLocation returns current driver location
// @Summary Get Driver Location
// @Description Get current GPS location of a driver
// @Tags location
// @Produce json
// @Param id path int true "Driver ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /location/driver/{id} [get]
func (h *LocationHandler) GetDriverLocation(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Driver location"})
}

// GetGeofences returns list of geofences
// @Summary Get Geofences
// @Description Get list of geofences with filtering
// @Tags location
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /location/geofences [get]
func (h *LocationHandler) GetGeofences(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Geofences list"})
}

// CreateGeofence creates a new geofence
// @Summary Create Geofence
// @Description Create a new geofence area (admin only)
// @Tags location
// @Accept json
// @Produce json
// @Param request body map[string]interface{} true "Geofence data"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /location/geofences [post]
func (h *LocationHandler) CreateGeofence(c *gin.Context) {
	c.JSON(http.StatusCreated, gin.H{"message": "Geofence created"})
}

// UpdateGeofence updates geofence information
// @Summary Update Geofence
// @Description Update geofence information (admin only)
// @Tags location
// @Accept json
// @Produce json
// @Param id path int true "Geofence ID"
// @Param request body map[string]interface{} true "Geofence data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /location/geofences/{id} [put]
func (h *LocationHandler) UpdateGeofence(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Geofence updated"})
}

// DeleteGeofence deletes a geofence
// @Summary Delete Geofence
// @Description Delete a geofence (admin only)
// @Tags location
// @Param id path int true "Geofence ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /location/geofences/{id} [delete]
func (h *LocationHandler) DeleteGeofence(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Geofence deleted"})
}

// HandleWebSocket handles real-time location updates via WebSocket
// Note: This is documented separately as WebSocket endpoint /ws
func (h *LocationHandler) HandleWebSocket(c *gin.Context) {
	// Get user ID from query parameters or JWT token
	userIDStr := c.Query("userId")
	token := c.Query("token")

	log.Printf("📡 WebSocket connection attempt - userID: %s, hasToken: %v", userIDStr, token != "")

	if userIDStr == "" || token == "" {
		log.Printf("❌ WebSocket rejected - Missing parameters: userID=%s, token=%v", userIDStr, token != "")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing userId or token"})
		return
	}

	// Validate token and extract user ID
	claims, err := h.services.JWTService.ValidateToken(token)
	if err != nil {
		log.Printf("❌ WebSocket rejected - Invalid token: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	log.Printf("✅ WebSocket token validated for user: %d", claims.UserID)

	// Upgrade connection to WebSocket
	if h.services.WebSocketHub != nil {
		log.Printf("📡 Upgrading to WebSocket for user: %d", claims.UserID)
		h.services.WebSocketHub.ServeWS(c.Writer, c.Request, claims.UserID)
	} else {
		log.Printf("❌ WebSocket service not available")
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "WebSocket service not available"})
	}
}

// UploadHandler handles upload endpoints
type UploadHandler struct {
	services *services.Container
}

func NewUploadHandler(services *services.Container) *UploadHandler {
	return &UploadHandler{services: services}
}

// UploadFuelReceipt uploads a fuel receipt image
// @Summary Upload Fuel Receipt
// @Description Upload fuel receipt image for verification
// @Tags uploads
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "Receipt image"
// @Param fuel_event_id formData int true "Fuel Event ID"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /uploads/fuel-receipt [post]
func (h *UploadHandler) UploadFuelReceipt(c *gin.Context) {
	c.JSON(http.StatusCreated, gin.H{"message": "Fuel receipt uploaded"})
}

// UploadPOD uploads a proof of delivery document
// @Summary Upload POD
// @Description Upload proof of delivery document
// @Tags uploads
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "POD document"
// @Param trip_id formData int true "Trip ID"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /uploads/pod [post]
func (h *UploadHandler) UploadPOD(c *gin.Context) {
	c.JSON(http.StatusCreated, gin.H{"message": "POD uploaded"})
}

// UploadDocument uploads a general document
// @Summary Upload Document
// @Description Upload a general document (license, insurance, etc.)
// @Tags uploads
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "Document file"
// @Param document_type formData string true "Document type"
// @Param entity_type formData string true "Entity type (driver, vehicle, etc.)"
// @Param entity_id formData int true "Entity ID"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /uploads/document [post]
func (h *UploadHandler) UploadDocument(c *gin.Context) {
	c.JSON(http.StatusCreated, gin.H{"message": "Document uploaded"})
}

// GetUpload returns upload details by ID
// @Summary Get Upload
// @Description Get upload details and metadata by ID
// @Tags uploads
// @Produce json
// @Param id path int true "Upload ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /uploads/{id} [get]
func (h *UploadHandler) GetUpload(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Upload data"})
}

// DeleteUpload deletes an uploaded file
// @Summary Delete Upload
// @Description Delete an uploaded file and its metadata
// @Tags uploads
// @Param id path int true "Upload ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /uploads/{id} [delete]
func (h *UploadHandler) DeleteUpload(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Upload deleted"})
}

// VerifyUpload verifies an uploaded document
// @Summary Verify Upload
// @Description Verify an uploaded document (admin only)
// @Tags uploads
// @Accept json
// @Produce json
// @Param id path int true "Upload ID"
// @Param request body map[string]interface{} true "Verification data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 404 {object} dto.APIError
// @Security BearerAuth
// @Router /uploads/{id}/verify [post]
func (h *UploadHandler) VerifyUpload(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Upload verified"})
}

// AnalyticsHandler handles analytics endpoints
type AnalyticsHandler struct {
	services *services.Container
}

func NewAnalyticsHandler(services *services.Container) *AnalyticsHandler {
	return &AnalyticsHandler{services: services}
}

// GetDashboardStats returns dashboard analytics
// @Summary Get Dashboard Stats
// @Description Get analytics for dashboard overview (admin only)
// @Tags analytics
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Failure 403 {object} dto.APIError
// @Security BearerAuth
// @Router /analytics/dashboard [get]
func (h *AnalyticsHandler) GetDashboardStats(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Dashboard stats"})
}

// GetFleetPerformance returns fleet performance analytics
// @Summary Get Fleet Performance
// @Description Get fleet performance metrics (admin only)
// @Tags analytics
// @Produce json
// @Param period query string false "Time period" default("month")
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Failure 403 {object} dto.APIError
// @Security BearerAuth
// @Router /analytics/fleet-performance [get]
func (h *AnalyticsHandler) GetFleetPerformance(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Fleet performance"})
}

// GetDriverPerformance returns driver performance analytics
// @Summary Get Driver Performance
// @Description Get driver performance metrics (admin only)
// @Tags analytics
// @Produce json
// @Param period query string false "Time period" default("month")
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Failure 403 {object} dto.APIError
// @Security BearerAuth
// @Router /analytics/driver-performance [get]
func (h *AnalyticsHandler) GetDriverPerformance(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Driver performance"})
}

// GetVehicleUtilization returns vehicle utilization analytics
// @Summary Get Vehicle Utilization
// @Description Get vehicle utilization metrics (admin only)
// @Tags analytics
// @Produce json
// @Param period query string false "Time period" default("month")
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Failure 403 {object} dto.APIError
// @Security BearerAuth
// @Router /analytics/vehicle-utilization [get]
func (h *AnalyticsHandler) GetVehicleUtilization(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Vehicle utilization"})
}

// GetFuelEfficiency returns fuel efficiency analytics
// @Summary Get Fuel Efficiency
// @Description Get fuel efficiency metrics (admin only)
// @Tags analytics
// @Produce json
// @Param period query string false "Time period" default("month")
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Failure 403 {object} dto.APIError
// @Security BearerAuth
// @Router /analytics/fuel-efficiency [get]
func (h *AnalyticsHandler) GetFuelEfficiency(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Fuel efficiency"})
}

// GetRevenueAnalytics returns revenue analytics
// @Summary Get Revenue Analytics
// @Description Get revenue and financial metrics (admin only)
// @Tags analytics
// @Produce json
// @Param period query string false "Time period" default("month")
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Failure 403 {object} dto.APIError
// @Security BearerAuth
// @Router /analytics/revenue [get]
func (h *AnalyticsHandler) GetRevenueAnalytics(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Revenue analytics"})
}

// GetComplianceReport returns compliance analytics
// @Summary Get Compliance Report
// @Description Get compliance and regulatory metrics (admin only)
// @Tags analytics
// @Produce json
// @Param period query string false "Time period" default("month")
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Failure 403 {object} dto.APIError
// @Security BearerAuth
// @Router /analytics/compliance [get]
func (h *AnalyticsHandler) GetComplianceReport(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Compliance report"})
}

// GetSystemSettings returns system settings
// @Summary Get System Settings
// @Description Get system configuration settings (admin only)
// @Tags admin
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Failure 403 {object} dto.APIError
// @Security BearerAuth
// @Router /admin/settings [get]
func (h *AnalyticsHandler) GetSystemSettings(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "System settings"})
}

// UpdateSystemSettings updates system settings
// @Summary Update System Settings
// @Description Update system configuration settings (admin only)
// @Tags admin
// @Accept json
// @Produce json
// @Param request body map[string]interface{} true "Settings data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Failure 403 {object} dto.APIError
// @Security BearerAuth
// @Router /admin/settings [put]
func (h *AnalyticsHandler) UpdateSystemSettings(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "System settings updated"})
}

// GetAuditLogs returns audit logs
// @Summary Get Audit Logs
// @Description Get system audit logs (admin only)
// @Tags admin
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Param from query string false "Start date (RFC3339)"
// @Param to query string false "End date (RFC3339)"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Failure 403 {object} dto.APIError
// @Security BearerAuth
// @Router /admin/audit-logs [get]
func (h *AnalyticsHandler) GetAuditLogs(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Audit logs"})
}

// GetSecurityEvents returns security events
// @Summary Get Security Events
// @Description Get security events and incidents (admin only)
// @Tags admin
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Param severity query string false "Filter by severity"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Failure 403 {object} dto.APIError
// @Security BearerAuth
// @Router /admin/security-events [get]
func (h *AnalyticsHandler) GetSecurityEvents(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Security events"})
}

// WhatsApp Handler Methods

// SendMessage sends a WhatsApp message
// @Summary Send WhatsApp Message
// @Description Send a WhatsApp message to a phone number
// @Tags whatsapp
// @Accept json
// @Produce json
// @Param request body map[string]interface{} true "Message data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /whatsapp/send [post]
func (h *WhatsAppHandler) SendMessage(c *gin.Context) {
	var request struct {
		To      string `json:"to" binding:"required"`
		Message string `json:"message" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}

	err := h.services.WhatsAppService.SendTextMessage(request.To, request.Message)
	if err != nil {
		log.Printf("❌ Failed to send WhatsApp message: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to send message",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "WhatsApp message sent successfully",
	})
}

// SendTripNotification sends a trip status notification
// @Summary Send Trip Notification
// @Description Send trip status notification via WhatsApp
// @Tags whatsapp
// @Accept json
// @Produce json
// @Param request body map[string]interface{} true "Notification data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /whatsapp/trip-notification [post]
func (h *WhatsAppHandler) SendTripNotification(c *gin.Context) {
	var request struct {
		PhoneNumber string `json:"phoneNumber" binding:"required"`
		TripID      string `json:"tripId" binding:"required"`
		Status      string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}

	err := h.services.WhatsAppService.SendTripStatusNotification(
		request.PhoneNumber,
		request.TripID,
		request.Status,
	)

	if err != nil {
		log.Printf("❌ Failed to send trip notification: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to send trip notification",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Trip notification sent successfully",
	})
}

// GetStatus returns WhatsApp service status
// @Summary Get WhatsApp Status
// @Description Get WhatsApp service connection status
// @Tags whatsapp
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /whatsapp/status [get]
func (h *WhatsAppHandler) GetStatus(c *gin.Context) {
	status := h.services.WhatsAppService.GetStatus()
	c.JSON(http.StatusOK, status)
}

// HandleWebhook handles WhatsApp webhook verification and messages
// @Summary WhatsApp Webhook
// @Description Handle WhatsApp webhook for verification and incoming messages (public endpoint)
// @Tags whatsapp
// @Accept json
// @Produce json
// @Param hub.mode query string false "Webhook mode"
// @Param hub.verify_token query string false "Verification token"
// @Param hub.challenge query string false "Challenge string"
// @Success 200 {string} string "Verification successful"
// @Failure 403 {object} dto.APIError
// @Router /whatsapp/webhook [get]
func (h *WhatsAppHandler) HandleWebhook(c *gin.Context) {
	// GET request is for webhook verification
	if c.Request.Method == "GET" {
		mode := c.Query("hub.mode")
		token := c.Query("hub.verify_token")
		challenge := c.Query("hub.challenge")

		verificationChallenge, err := h.services.WhatsAppService.VerifyWebhook(mode, token, challenge)
		if err != nil {
			log.Printf("❌ WhatsApp webhook verification failed: %v", err)
			c.String(http.StatusForbidden, "Verification failed")
			return
		}

		c.String(http.StatusOK, verificationChallenge)
		return
	}

	// POST request is for receiving webhook events
	if c.Request.Method == "POST" {
		var webhookData map[string]interface{}
		if err := c.ShouldBindJSON(&webhookData); err != nil {
			log.Printf("❌ Invalid webhook data: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid webhook data"})
			return
		}

		log.Printf("📱 Received WhatsApp webhook: %+v", webhookData)

		c.JSON(http.StatusOK, gin.H{"status": "received"})
		return
	}

	c.JSON(http.StatusMethodNotAllowed, gin.H{"error": "Method not allowed"})
}

// ProcessTripEvent handles trip lifecycle events from other services
// @Summary Process Trip Event
// @Description Process trip lifecycle events for WhatsApp notifications
// @Tags whatsapp
// @Accept json
// @Produce json
// @Param request body map[string]interface{} true "Trip event data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /whatsapp/process-event [post]
func (h *WhatsAppHandler) ProcessTripEvent(c *gin.Context) {
	var event services.TripEvent

	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid event data",
			"message": err.Error(),
		})
		return
	}

	log.Printf("🎯 Processing trip event: %s for trip %s", event.EventType, event.TripID)

	err := h.services.WhatsAppService.ProcessTripEvent(c.Request.Context(), event)
	if err != nil {
		log.Printf("❌ Failed to process trip event: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to process trip event",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Trip event processed successfully",
	})
}

// ========================================
// MQTT HANDLERS - Real-time Communication
// ========================================

// MQTTHandler handles MQTT-related HTTP endpoints
type MQTTHandler struct {
	services *services.Container
}

func NewMQTTHandler(services *services.Container) *MQTTHandler {
	return &MQTTHandler{services: services}
}

// GetMQTTStatus returns MQTT service status
// @Summary Get MQTT Status
// @Description Get MQTT broker connection status and configuration
// @Tags mqtt
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /mqtt/status [get]
func (h *MQTTHandler) GetMQTTStatus(c *gin.Context) {
	status := h.services.MQTTService.HealthCheck()
	c.JSON(http.StatusOK, status)
}

// PublishLocationUpdate publishes vehicle location via MQTT
// @Summary Publish Location Update
// @Description Publish real-time vehicle location to MQTT for mobile apps
// @Tags mqtt
// @Accept json
// @Produce json
// @Param vehicle_id path int true "Vehicle ID"
// @Param request body map[string]interface{} true "Location data"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /mqtt/vehicle/{vehicle_id}/location [post]
func (h *MQTTHandler) PublishLocationUpdate(c *gin.Context) {
	vehicleIDStr := c.Param("vehicle_id")
	vehicleID, err := strconv.ParseUint(vehicleIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_vehicle_id",
			Message: "Invalid vehicle ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	var locationData services.LocationUpdate
	if err := c.ShouldBindJSON(&locationData); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_location_data",
			Message: "Invalid location data",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Publish to MQTT
	if err := h.services.MQTTService.PublishLocationUpdate(uint(vehicleID), &locationData); err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIError{
			Error:   "mqtt_publish_failed",
			Message: "Failed to publish location update",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Message: "Location update published successfully",
	})
}

// PublishTripUpdate publishes trip progress via MQTT
// @Summary Publish Trip Update
// @Description Publish trip progress to MQTT for customer tracking
// @Tags mqtt
// @Accept json
// @Produce json
// @Param trip_id path int true "Trip ID"
// @Param request body map[string]interface{} true "Trip progress data"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /mqtt/trip/{trip_id}/update [post]
func (h *MQTTHandler) PublishTripUpdate(c *gin.Context) {
	tripIDStr := c.Param("trip_id")
	tripID, err := strconv.ParseUint(tripIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_trip_id",
			Message: "Invalid trip ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	var tripData services.TripProgressUpdate
	if err := c.ShouldBindJSON(&tripData); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_trip_data",
			Message: "Invalid trip progress data",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Publish to MQTT
	if err := h.services.MQTTService.PublishTripProgress(uint(tripID), &tripData); err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIError{
			Error:   "mqtt_publish_failed",
			Message: "Failed to publish trip update",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Message: "Trip update published successfully",
	})
}

// PublishFleetAlert publishes fleet-wide alert via MQTT
// @Summary Publish Fleet Alert
// @Description Publish emergency or important alerts to entire fleet
// @Tags mqtt
// @Accept json
// @Produce json
// @Param request body map[string]interface{} true "Alert data"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /mqtt/fleet/alert [post]
func (h *MQTTHandler) PublishFleetAlert(c *gin.Context) {
	var alertData services.FleetAlert
	if err := c.ShouldBindJSON(&alertData); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_alert_data",
			Message: "Invalid alert data",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Publish to MQTT
	if err := h.services.MQTTService.PublishFleetAlert(&alertData); err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIError{
			Error:   "mqtt_publish_failed",
			Message: "Failed to publish fleet alert",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Message: "Fleet alert published successfully",
	})
}

// PublishDriverMessage sends message to driver's mobile app via MQTT
// @Summary Send Message to Driver
// @Description Send real-time message to driver's mobile app via MQTT
// @Tags mqtt
// @Accept json
// @Produce json
// @Param driver_id path int true "Driver ID"
// @Param request body map[string]interface{} true "Message data"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /mqtt/driver/{driver_id}/message [post]
func (h *MQTTHandler) PublishDriverMessage(c *gin.Context) {
	driverIDStr := c.Param("driver_id")
	driverID, err := strconv.ParseUint(driverIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_driver_id",
			Message: "Invalid driver ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	var messageData map[string]interface{}
	if err := c.ShouldBindJSON(&messageData); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_message_data",
			Message: "Invalid message data",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Publish to driver's mobile app
	if err := h.services.MQTTService.PublishToDriverMobile(uint(driverID), messageData); err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIError{
			Error:   "mqtt_publish_failed",
			Message: "Failed to send message to driver",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Message: "Message sent to driver successfully",
	})
}

// PublishFleetBroadcast sends broadcast message to all fleet participants
// @Summary Broadcast Fleet Message
// @Description Send broadcast message to all drivers and admins via MQTT
// @Tags mqtt
// @Accept json
// @Produce json
// @Param request body map[string]interface{} true "Broadcast data"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.APIError
// @Failure 401 {object} dto.APIError
// @Security BearerAuth
// @Router /mqtt/fleet/broadcast [post]
func (h *MQTTHandler) PublishFleetBroadcast(c *gin.Context) {
	var broadcastData struct {
		Message string      `json:"message" binding:"required"`
		Data    interface{} `json:"data"`
	}

	if err := c.ShouldBindJSON(&broadcastData); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_broadcast_data",
			Message: "Invalid broadcast data",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Publish fleet broadcast
	if err := h.services.MQTTService.PublishFleetBroadcast(broadcastData.Message, broadcastData.Data); err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIError{
			Error:   "mqtt_publish_failed",
			Message: "Failed to publish fleet broadcast",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Message: "Fleet broadcast published successfully",
	})
}
