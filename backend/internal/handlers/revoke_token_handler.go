package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/fleetflow/backend/internal/dto"
	"github.com/fleetflow/backend/internal/models"
	"github.com/fleetflow/backend/internal/services"
	"github.com/gin-gonic/gin"
)

// RevokeTokenRequest represents token revocation request
type RevokeTokenRequest struct {
	Token string `json:"token" binding:"required"`
}

// RevokeTokenHandler handles token revocation
type RevokeTokenHandler struct {
	services *services.Container
}

// NewRevokeTokenHandler creates a new revoke token handler
func NewRevokeTokenHandler(services *services.Container) *RevokeTokenHandler {
	return &RevokeTokenHandler{services: services}
}

// RevokeToken revokes a refresh token
// @Summary Revoke Token
// @Description Revoke a refresh token (add to blacklist)
// @Tags auth
// @Accept json
// @Produce json
// @Param request body RevokeTokenRequest true "Token to revoke"
// @Success 200 {object} map[string]interface{}
// @Security BearerAuth
// @Router /auth/revoke [post]
func (h *RevokeTokenHandler) RevokeToken(c *gin.Context) {
	var req RevokeTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIError{
			Error:   "invalid_request",
			Message: "Invalid request payload",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Hash the token for storage (don't store plain tokens)
	hash := sha256.Sum256([]byte(req.Token))
	tokenHash := hex.EncodeToString(hash[:])

	// Create revocation record
	revocation := models.TokenRevocation{
		Token:     tokenHash,
		RevokedAt: time.Now(),
		Reason:    "user_request",
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour), // Keep for 7 days (typical refresh token TTL)
	}

	if err := h.services.DB.Create(&revocation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIError{
			Error:   "revocation_failed",
			Message: "Failed to revoke token",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Token revoked successfully",
	})
}
