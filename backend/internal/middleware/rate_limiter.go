package middleware

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// RateLimiter creates a rate limiting middleware using token bucket algorithm
func RateLimiter(requestsPerMinute int) gin.HandlerFunc {
	type client struct {
		tokens     float64
		lastUpdate time.Time
		mu         sync.Mutex
	}

	clients := make(map[string]*client)
	var clientsMu sync.RWMutex

	// Cleanup old clients every 5 minutes
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			clientsMu.Lock()
			now := time.Now()
			for ip, c := range clients {
				c.mu.Lock()
				if now.Sub(c.lastUpdate) > 10*time.Minute {
					delete(clients, ip)
				}
				c.mu.Unlock()
			}
			clientsMu.Unlock()
		}
	}()

	tokensPerSecond := float64(requestsPerMinute) / 60.0
	maxTokens := float64(requestsPerMinute)

	return func(c *gin.Context) {
		clientIP := c.ClientIP()

		clientsMu.Lock()
		cl, exists := clients[clientIP]
		if !exists {
			cl = &client{
				tokens:     maxTokens,
				lastUpdate: time.Now(),
			}
			clients[clientIP] = cl
		}
		clientsMu.Unlock()

		cl.mu.Lock()
		defer cl.mu.Unlock()

		now := time.Now()
		elapsed := now.Sub(cl.lastUpdate).Seconds()
		cl.tokens += elapsed * tokensPerSecond
		if cl.tokens > maxTokens {
			cl.tokens = maxTokens
		}
		cl.lastUpdate = now

		if cl.tokens >= 1 {
			cl.tokens--
			c.Next()
		} else {
			c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", requestsPerMinute))
			c.Header("X-RateLimit-Remaining", "0")
			c.Header("X-RateLimit-Reset", fmt.Sprintf("%d", int(now.Add(time.Minute).Unix())))
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Rate limit exceeded. Please try again later.",
			})
			c.Abort()
		}
	}
}

// PublicRateLimiter creates a rate limiter for public endpoints (60 req/min, 1000 in test)
func AuthRateLimiter() gin.HandlerFunc {
	limit := 10
	if gin.Mode() == gin.TestMode {
		limit = 1000000 // Effectively infinite for tests to avoid interference
	}
	return RateLimiter(limit)
}
func PublicRateLimiter() gin.HandlerFunc {
	limit := 60
	if gin.Mode() == gin.TestMode {
		limit = 1000000
	}
	return RateLimiter(limit)
}
