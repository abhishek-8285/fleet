package middleware

import (
	"encoding/json"
	"io"
	"net/http"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
)

// ValidationMiddleware provides input validation and sanitization
func ValidationMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the raw request body for validation
		if c.Request.Method == "POST" || c.Request.Method == "PUT" || c.Request.Method == "PATCH" {
			// Read body for security validation
			bodyBytes, err := io.ReadAll(c.Request.Body)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"error":   "request_read_error",
					"message": "Cannot read request body",
					"code":    400,
				})
				c.Abort()
				return
			}

			// Restore body for downstream handlers
			c.Request.Body = io.NopCloser(strings.NewReader(string(bodyBytes)))

			// Check for security threats
			bodyStr := strings.ToLower(string(bodyBytes))
			if containsSecurityThreats(bodyStr) {
				c.JSON(http.StatusBadRequest, gin.H{
					"error":   "security_validation_failed",
					"message": "Request contains potentially malicious content",
					"code":    400,
				})
				c.Abort()
				return
			}
		}
		c.Next()
	}
}

// containsSecurityThreats checks for common attack patterns
func containsSecurityThreats(bodyStr string) bool {
	// SQL Injection and XSS patterns
	threatPatterns := []string{
		"'or 1=1",
		"'; drop table",
		"union select",
		"<script",
		"</script>",
		"javascript:",
		"vbscript:",
		"onload=",
		"onerror=",
		"eval(",
		"exec(",
		"system(",
		"rm -rf",
		"../../../",
		"<img src=",
		"onclick=",
		"onfocus=",
	}

	for _, pattern := range threatPatterns {
		if strings.Contains(bodyStr, pattern) {
			return true
		}
	}

	return false
}

// PhoneValidationMiddleware validates Indian phone number format
func PhoneValidationMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Apply to endpoints with phone fields
		if c.Request.Method == "POST" && (strings.Contains(c.FullPath(), "otp") || strings.Contains(c.FullPath(), "driver") || strings.Contains(c.FullPath(), "user")) {
			// Read and restore body for downstream processing
			bodyBytes, err := io.ReadAll(c.Request.Body)
			if err == nil {
				c.Request.Body = io.NopCloser(strings.NewReader(string(bodyBytes)))

				var request map[string]interface{}
				if err := json.Unmarshal(bodyBytes, &request); err == nil {
					if phone, exists := request["phone"]; exists {
						phoneStr, ok := phone.(string)
						if ok && phoneStr != "" && !isValidIndianPhone(phoneStr) {
							c.JSON(http.StatusBadRequest, gin.H{
								"error":   "validation_failed",
								"message": "Invalid Indian phone number format. Expected +91XXXXXXXXXX",
								"code":    400,
								"details": map[string]string{"phone": phoneStr},
							})
							c.Abort()
							return
						}
					}
				}
			}
		}
		c.Next()
	}
}

// isValidIndianPhone validates Indian phone number format
func isValidIndianPhone(phone string) bool {
	// Indian phone number regex: +91 followed by 10 digits
	pattern := `^\+91[6-9]\d{9}$`
	matched, _ := regexp.MatchString(pattern, phone)
	return matched
}

// InputSanitizationMiddleware sanitizes user input
func InputSanitizationMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Add custom sanitization logic here
		c.Next()
	}
}

// RequiredFieldsMiddleware validates required fields per endpoint
func RequiredFieldsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Add endpoint-specific required field validation
		c.Next()
	}
}
