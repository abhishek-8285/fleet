package middleware

import (
	"log"
	"net/http"

	"github.com/fleetflow/backend/internal/platform/errors"
	"github.com/gin-gonic/gin"
)

// ErrorHandler middleware for handling application errors gracefully
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// Process errors after request handling
		if len(c.Errors) > 0 {
			err := c.Errors.Last()

			// Log the error
			log.Printf("🔴 API Error: %v", err.Error())
			log.Printf("   Path: %s %s", c.Request.Method, c.Request.URL.Path)
			log.Printf("   Client: %s", c.ClientIP())

			// Don't override response if already sent
			if c.Writer.Written() {
				return
			}

			// Handle AppError
			if appErr, ok := err.Err.(*errors.AppError); ok {
				c.JSON(appErr.Status, gin.H{
					"error":   appErr.Message,
					"code":    appErr.Code,
					"details": err.Meta,
				})
				return
			}

			// Handle other GIN errors
			switch err.Type {
			case gin.ErrorTypePrivate:
				log.Printf("   Private Error Details: %v", err.Meta)
				c.JSON(http.StatusInternalServerError, gin.H{
					"error":      "Internal server error",
					"message":    "Something went wrong. Please try again later.",
					"request_id": c.GetHeader("X-Request-ID"),
				})
			case gin.ErrorTypePublic:
				c.JSON(http.StatusBadRequest, gin.H{
					"error":      "Bad request",
					"message":    err.Error(),
					"request_id": c.GetHeader("X-Request-ID"),
				})
			case gin.ErrorTypeBind:
				c.JSON(http.StatusBadRequest, gin.H{
					"error":      "Invalid request format",
					"message":    "Please check your request format and try again.",
					"request_id": c.GetHeader("X-Request-ID"),
				})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{
					"error":      "Unknown error",
					"message":    "An unexpected error occurred.",
					"request_id": c.GetHeader("X-Request-ID"),
				})
			}
		}
	}
}
