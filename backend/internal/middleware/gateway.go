package middleware

import (
	"net/http"
)

// GatewaySecurity returns a middleware that adds security headers and sanitizes URL
func GatewaySecurity(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. Security Headers
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")

		// 2. Input Sanitization (Query Params)
		queryParams := r.URL.Query()
		modified := false
		for key, values := range queryParams {
			for i, v := range values {
				sanitized := sanitizeString(v)
				if sanitized != v {
					queryParams[key][i] = sanitized
					modified = true
				}
			}
		}
		if modified {
			r.URL.RawQuery = queryParams.Encode()
		}

		next.ServeHTTP(w, r)
	})
}
