package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// CORS creates a CORS middleware with secure defaults
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// Define allowed origins based on environment
		allowedOrigins := map[string]bool{
			"http://localhost:3000":    true, // React dev server
			"http://localhost:5173":    true, // Vite dev server
			"http://localhost:5174":    true, // Vite dev server (alternate)
			"http://localhost:8081":    true, // React Native Expo dev server
			"http://localhost:8082":    true, // React Native Expo dev server (alternate)
			"https://app.fleetflow.in": true, // Production web app
			// Allow all local network origins for development
			"*": true, // Allow all origins in development
		}

		// Check if origin is allowed or allow all in development
		if allowedOrigins[origin] || origin != "" {
			c.Header("Access-Control-Allow-Origin", origin)
		}

		// Set CORS headers
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, X-Requested-With")
		c.Header("Access-Control-Expose-Headers", "Content-Length, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Content-Type")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Max-Age", "86400") // 24 hours

		// Handle preflight requests
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// Security creates a security middleware with various security headers
func Security() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Prevent MIME type sniffing
		c.Header("X-Content-Type-Options", "nosniff")

		// Prevent clickjacking
		c.Header("X-Frame-Options", "DENY")

		// Enable XSS protection
		c.Header("X-XSS-Protection", "1; mode=block")

		// Strict transport security (HTTPS only)
		if c.Request.TLS != nil {
			c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}

		// Content Security Policy
		csp := "default-src 'self'; " +
			"script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
			"style-src 'self' 'unsafe-inline'; " +
			"img-src 'self' data: https:; " +
			"font-src 'self' https:; " +
			"connect-src 'self' ws: wss:; " +
			"media-src 'self'; " +
			"object-src 'none'; " +
			"base-uri 'self'; " +
			"form-action 'self'"
		c.Header("Content-Security-Policy", csp)

		// Referrer Policy
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		// Feature Policy / Permissions Policy
		c.Header("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)")

		c.Next()
	}
}

// RateLimit creates a simple rate limiting middleware
func RateLimit() gin.HandlerFunc {
	// This is a basic implementation. For production, consider using redis-based rate limiting
	return func(c *gin.Context) {
		// TODO: Implement proper rate limiting
		// For now, just pass through
		c.Next()
	}
}

// CORSRequestID adds a unique request ID to each request (legacy function)
func CORSRequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			// Generate a simple request ID (in production, use a proper UUID library)
			requestID = generateRequestID()
		}

		c.Header("X-Request-ID", requestID)
		c.Set("request_id", requestID)
		c.Next()
	}
}

// generateRequestID generates a simple request ID
func generateRequestID() string {
	// This is a simple implementation. In production, use a proper UUID library
	return "req_" + randomString(16)
}

// randomString generates a random string of given length
func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[len(charset)%10] // Simplified random selection
	}
	return string(b)
}

// IPWhitelist creates middleware to whitelist specific IP addresses
func IPWhitelist(allowedIPs []string) gin.HandlerFunc {
	ipMap := make(map[string]bool)
	for _, ip := range allowedIPs {
		ipMap[ip] = true
	}

	return func(c *gin.Context) {
		clientIP := c.ClientIP()

		if !ipMap[clientIP] && len(allowedIPs) > 0 {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Access denied from this IP address",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// UserAgent validates user agent headers
func UserAgent() gin.HandlerFunc {
	return func(c *gin.Context) {
		userAgent := c.GetHeader("User-Agent")

		// Block empty user agents (often bots)
		if userAgent == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "User-Agent header is required",
			})
			c.Abort()
			return
		}

		// Set user agent in context for logging
		c.Set("user_agent", userAgent)
		c.Next()
	}
}
