package middleware

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"runtime/debug"
	"time"

	"github.com/gin-gonic/gin"
)

// RecoveryWithWriter creates a panic recovery middleware with custom writer
func RecoveryWithWriter() gin.HandlerFunc {
	return CustomRecovery(func(c *gin.Context, recovered interface{}) {
		if err, ok := recovered.(string); ok {
			log.Printf("🚨 PANIC RECOVERED: %s", err)
		} else {
			log.Printf("🚨 PANIC RECOVERED: %v", recovered)
		}

		// Log stack trace
		log.Printf("📍 Stack Trace:\n%s", debug.Stack())

		// Log request details
		log.Printf("🔍 Request Details:")
		log.Printf("   Method: %s", c.Request.Method)
		log.Printf("   Path: %s", c.Request.URL.Path)
		log.Printf("   IP: %s", c.ClientIP())
		log.Printf("   User-Agent: %s", c.GetHeader("User-Agent"))

		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"error":      "Internal server error",
			"message":    "An unexpected error occurred. Our team has been notified.",
			"timestamp":  time.Now().Unix(),
			"request_id": GetRequestID(c),
		})
	})
}

// CustomRecovery creates a custom recovery middleware
func CustomRecovery(handler func(c *gin.Context, recovered interface{})) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if recovered := recover(); recovered != nil {
				handler(c, recovered)
			}
		}()
		c.Next()
	}
}

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

			// Handle different error types
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

// TimeoutHandler creates a middleware that times out requests
func TimeoutHandler(timeout time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Create a context with timeout
		ctx, cancel := context.WithTimeout(c.Request.Context(), timeout)
		defer cancel()

		// Replace the request context
		c.Request = c.Request.WithContext(ctx)

		finished := make(chan struct{})
		go func() {
			defer func() {
				if recovered := recover(); recovered != nil {
					log.Printf("🚨 Handler panic in timeout middleware: %v", recovered)
					close(finished)
				}
			}()
			c.Next()
			finished <- struct{}{}
		}()

		select {
		case <-ctx.Done():
			c.Header("Connection", "close")
			c.AbortWithStatusJSON(http.StatusRequestTimeout, gin.H{
				"error":   "Request timeout",
				"message": fmt.Sprintf("Request exceeded %v timeout", timeout),
			})
		case <-finished:
			// Request completed normally
		}
	}
}

// CircuitBreakerMiddleware implements a simple circuit breaker pattern
type CircuitBreaker struct {
	maxFailures int
	resetTime   time.Duration
	failures    int
	lastFailure time.Time
	isOpen      bool
}

func NewCircuitBreaker(maxFailures int, resetTime time.Duration) *CircuitBreaker {
	return &CircuitBreaker{
		maxFailures: maxFailures,
		resetTime:   resetTime,
	}
}

func (cb *CircuitBreaker) MiddlewareFunc() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check if circuit breaker is open
		if cb.isOpen {
			if time.Since(cb.lastFailure) > cb.resetTime {
				// Reset circuit breaker
				cb.isOpen = false
				cb.failures = 0
				log.Println("🔄 Circuit breaker reset")
			} else {
				c.JSON(http.StatusServiceUnavailable, gin.H{
					"error":   "Service temporarily unavailable",
					"message": "Please try again later",
				})
				c.Abort()
				return
			}
		}

		// Process request
		c.Next()

		// Check if request failed
		if c.Writer.Status() >= 500 {
			cb.failures++
			cb.lastFailure = time.Now()

			if cb.failures >= cb.maxFailures {
				cb.isOpen = true
				log.Printf("🚨 Circuit breaker opened after %d failures", cb.failures)
			}
		} else if c.Writer.Status() < 400 {
			// Reset failure count on successful request
			cb.failures = 0
		}
	}
}

// DatabaseConnectionMiddleware checks database connectivity before processing requests
func DatabaseConnectionMiddleware(db interface{ Ping() error }) gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := db.Ping(); err != nil {
			log.Printf("🔴 Database connection lost: %v", err)
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error":   "Service temporarily unavailable",
				"message": "Database connection issue. Please try again.",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
