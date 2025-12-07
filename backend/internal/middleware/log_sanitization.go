package middleware

import (
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
)

// SanitizePhoneNumber redacts phone numbers in strings
func SanitizePhoneNumber(s string) string {
	// Match Indian phone numbers (+91XXXXXXXXXX or 10-digit numbers)
	phoneRegex := regexp.MustCompile(`(\+91[\d]{10}|[\d]{10})`)
	return phoneRegex.ReplaceAllString(s, "[PHONE_REDACTED]")
}

// SanitizeEmail redacts email addresses
func SanitizeEmail(s string) string {
	emailRegex := regexp.MustCompile(`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`)
	return emailRegex.ReplaceAllString(s, "[EMAIL_REDACTED]")
}

// SanitizePII redacts all personally identifiable information
func SanitizePII(s string) string {
	s = SanitizePhoneNumber(s)
	s = SanitizeEmail(s)
	return s
}

// LogSanitizationMiddleware sanitizes sensitive data in logs
func LogSanitizationMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Intercept the path for logging
		path := c.Request.URL.Path
		sanitizedPath := SanitizePII(path)

		// Store sanitized path for logger
		c.Set("sanitized_path", sanitizedPath)

		c.Next()
	}
}

// SanitizeLogMessage sanitizes a log message before writing
func SanitizeLogMessage(message string) string {
	// Redact phone numbers
	message = SanitizePhoneNumber(message)

	// Redact emails
	message = SanitizeEmail(message)

	// Redact common PII patterns
	patterns := map[string]string{
		// OTP codes (6 digits)
		`"otp"\s*:\s*"[\d]{6}"`:    `"otp":"[REDACTED]"`,
		`"password"\s*:\s*"[^"]*"`: `"password":"[REDACTED]"`,
		`"token"\s*:\s*"[^"]*"`:    `"token":"[REDACTED]"`,
		`"secret"\s*:\s*"[^"]*"`:   `"secret":"[REDACTED]"`,
		// WhatsApp message bodies
		`"body"\s*:\s*"[^"]*"`:    `"body":"[REDACTED]"`,
		`"message"\s*:\s*"[^"]*"`: `"message":"[REDACTED]"`,
	}

	for pattern, replacement := range patterns {
		re := regexp.MustCompile(pattern)
		message = re.ReplaceAllString(message, replacement)
	}

	return message
}

// SanitizedLogger wraps gin.Logger to sanitize logs
func SanitizedLogger() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		// Sanitize path
		path := SanitizePII(param.Path)

		// Build log message
		message := "[" + param.TimeStamp.Format("2006-01-02 15:04:05") + "] " +
			param.ClientIP + " " +
			param.Method + " " +
			path + " " +
			"Status:" + strings.TrimSpace(param.StatusCodeColor()+" "+string(rune(param.StatusCode))+" "+param.ResetColor()) + " " +
			"Latency:" + param.Latency.String() + " " +
			"UserAgent:\"" + SanitizePII(param.Request.UserAgent()) + "\"\n"

		// Additional sanitization
		message = SanitizeLogMessage(message)

		return message
	})
}
