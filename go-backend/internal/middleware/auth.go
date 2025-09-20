package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/fleetflow/backend/internal/config"
	"github.com/fleetflow/backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

// JWTClaims represents the JWT token claims
type JWTClaims struct {
	UserID   uint        `json:"user_id"`
	Phone    string      `json:"phone"`
	Role     models.Role `json:"role"`
	DriverID *uint       `json:"driver_id,omitempty"`
	jwt.RegisteredClaims
}

// JWTService handles JWT operations
type JWTService struct {
	config *config.Config
	db     *gorm.DB
}

// NewJWTService creates a new JWT service
func NewJWTService(cfg *config.Config, db *gorm.DB) *JWTService {
	return &JWTService{
		config: cfg,
		db:     db,
	}
}

// GenerateToken generates a new JWT token for a user
func (j *JWTService) GenerateToken(user *models.UserAccount) (string, error) {
	claims := JWTClaims{
		UserID:   user.ID,
		Phone:    user.Phone,
		Role:     user.Role,
		DriverID: user.DriverID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(j.config.JWTExpirationTime)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "fleetflow",
			Subject:   user.Phone,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.config.JWTSecret))
}

// GenerateRefreshToken generates a refresh token
func (j *JWTService) GenerateRefreshToken(userID uint) (*models.RefreshToken, error) {
	// Generate a random token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(j.config.RefreshTokenExpiry)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		Issuer:    "fleetflow-refresh",
	})

	tokenString, err := token.SignedString([]byte(j.config.JWTSecret))
	if err != nil {
		return nil, err
	}

	refreshToken := &models.RefreshToken{
		Token:     tokenString,
		UserID:    userID,
		ExpiresAt: time.Now().Add(j.config.RefreshTokenExpiry),
		Revoked:   false,
	}

	// Save to database
	if err := j.db.Create(refreshToken).Error; err != nil {
		return nil, err
	}

	return refreshToken, nil
}

// ValidateToken validates a JWT token and returns the claims
func (j *JWTService) ValidateToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(j.config.JWTSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, jwt.ErrSignatureInvalid
}

// RefreshToken refreshes an access token using a refresh token
func (j *JWTService) RefreshToken(refreshTokenString string) (string, *models.RefreshToken, error) {
	// Find refresh token in database
	var refreshToken models.RefreshToken
	if err := j.db.Where("token = ? AND revoked = false", refreshTokenString).First(&refreshToken).Error; err != nil {
		return "", nil, err
	}

	// Check if refresh token is expired
	if time.Now().After(refreshToken.ExpiresAt) {
		return "", nil, jwt.ErrTokenExpired
	}

	// Get user
	var user models.UserAccount
	if err := j.db.First(&user, refreshToken.UserID).Error; err != nil {
		return "", nil, err
	}

	// Generate new access token
	accessToken, err := j.GenerateToken(&user)
	if err != nil {
		return "", nil, err
	}

	// Generate new refresh token and revoke old one
	refreshToken.Revoked = true
	j.db.Save(&refreshToken)

	newRefreshToken, err := j.GenerateRefreshToken(user.ID)
	if err != nil {
		return "", nil, err
	}

	return accessToken, newRefreshToken, nil
}

// RevokeRefreshToken revokes a refresh token
func (j *JWTService) RevokeRefreshToken(tokenString string) error {
	return j.db.Model(&models.RefreshToken{}).
		Where("token = ?", tokenString).
		Update("revoked", true).Error
}

// RevokeAllUserTokens revokes all refresh tokens for a user
func (j *JWTService) RevokeAllUserTokens(userID uint) error {
	return j.db.Model(&models.RefreshToken{}).
		Where("user_id = ?", userID).
		Update("revoked", true).Error
}

// JWTMiddleware creates a JWT authentication middleware
func JWTMiddleware(jwtService *JWTService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Check if header starts with "Bearer "
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		tokenString := tokenParts[1]
		claims, err := jwtService.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Set user information in context
		c.Set("user_id", claims.UserID)
		c.Set("phone", claims.Phone)
		c.Set("role", claims.Role)
		c.Set("driver_id", claims.DriverID)
		c.Set("claims", claims)

		c.Next()
	}
}

// RequireRole creates a middleware that requires specific roles
func RequireRole(roles ...models.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User role not found"})
			c.Abort()
			return
		}

		role, ok := userRole.(models.Role)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user role"})
			c.Abort()
			return
		}

		// Check if user has any of the required roles
		hasRole := false
		for _, requiredRole := range roles {
			if role == requiredRole {
				hasRole = true
				break
			}
		}

		if !hasRole {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireAdmin creates a middleware that requires admin role
func RequireAdmin() gin.HandlerFunc {
	return RequireRole(models.RoleAdmin)
}

// RequireDriver creates a middleware that requires driver role
func RequireDriver() gin.HandlerFunc {
	return RequireRole(models.RoleDriver)
}

// RequireAdminOrDriver creates a middleware that requires admin or driver role
func RequireAdminOrDriver() gin.HandlerFunc {
	return RequireRole(models.RoleAdmin, models.RoleDriver)
}

// OptionalAuth creates a middleware for optional authentication
func OptionalAuth(jwtService *JWTService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) == 2 && tokenParts[0] == "Bearer" {
			tokenString := tokenParts[1]
			if claims, err := jwtService.ValidateToken(tokenString); err == nil {
				c.Set("user_id", claims.UserID)
				c.Set("phone", claims.Phone)
				c.Set("role", claims.Role)
				c.Set("driver_id", claims.DriverID)
				c.Set("claims", claims)
			}
		}

		c.Next()
	}
}

// GetCurrentUserID gets the current user ID from context
func GetCurrentUserID(c *gin.Context) (uint, bool) {
	if userID, exists := c.Get("user_id"); exists {
		if id, ok := userID.(uint); ok {
			return id, true
		}
	}
	return 0, false
}

// GetCurrentUserRole gets the current user role from context
func GetCurrentUserRole(c *gin.Context) (models.Role, bool) {
	if role, exists := c.Get("role"); exists {
		if r, ok := role.(models.Role); ok {
			return r, true
		}
	}
	return "", false
}

// GetCurrentDriverID gets the current driver ID from context
func GetCurrentDriverID(c *gin.Context) (uint, bool) {
	if driverID, exists := c.Get("driver_id"); exists {
		if id, ok := driverID.(*uint); ok && id != nil {
			return *id, true
		}
	}
	return 0, false
}

// IsAdmin checks if the current user is an admin
func IsAdmin(c *gin.Context) bool {
	role, exists := GetCurrentUserRole(c)
	return exists && role == models.RoleAdmin
}

// IsDriver checks if the current user is a driver
func IsDriver(c *gin.Context) bool {
	role, exists := GetCurrentUserRole(c)
	return exists && role == models.RoleDriver
}
