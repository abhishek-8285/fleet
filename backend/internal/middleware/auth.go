package middleware

import (
	"log"
	"net/http"
	"strings"

	"github.com/fleetflow/backend/internal/models"
	"github.com/fleetflow/backend/internal/services"
	"github.com/gin-gonic/gin"
)

// JWTMiddleware creates a JWT authentication middleware
func JWTMiddleware(jwtService *services.JWTService) gin.HandlerFunc {
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
			log.Printf("⚠️ JWT Validation failed for token %s...: %v", tokenString[:10], err)
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
func OptionalAuth(jwtService *services.JWTService) gin.HandlerFunc {
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
