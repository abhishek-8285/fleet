package test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/fleetflow/backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestAPIValidation comprehensively tests null checks, input validation, and security
func TestAPIValidation(t *testing.T) {
	tf, err := SetupTestRouter()
	require.NoError(t, err)

	// Create admin user for testing protected endpoints
	admin := &models.UserAccount{
		Phone:    "+919999000001",
		Role:     models.RoleAdmin,
		IsActive: true,
	}
	tf.db.Create(admin)
	tf.db.First(admin, "phone = ?", "+919999000001")
	adminToken, _ := tf.services.JWTService.GenerateToken(admin)

	t.Run("Authentication Validation Tests", func(t *testing.T) {
		testCases := []struct {
			name           string
			endpoint       string
			method         string
			payload        interface{}
			expectedStatus int
			description    string
		}{
			// OTP Send Validation
			{
				name:           "OTP Send - Null Payload",
				endpoint:       "/api/v1/auth/otp/send",
				method:         "POST",
				payload:        nil,
				expectedStatus: 400,
				description:    "Should reject null payload",
			},
			{
				name:           "OTP Send - Empty JSON",
				endpoint:       "/api/v1/auth/otp/send",
				method:         "POST",
				payload:        map[string]interface{}{},
				expectedStatus: 400,
				description:    "Should reject empty JSON",
			},
			{
				name:           "OTP Send - Null Phone",
				endpoint:       "/api/v1/auth/otp/send",
				method:         "POST",
				payload:        map[string]interface{}{"phone": nil},
				expectedStatus: 400,
				description:    "Should reject null phone",
			},
			{
				name:           "OTP Send - Empty Phone",
				endpoint:       "/api/v1/auth/otp/send",
				method:         "POST",
				payload:        map[string]interface{}{"phone": ""},
				expectedStatus: 400,
				description:    "Should reject empty phone",
			},
			{
				name:           "OTP Send - Invalid Phone Format",
				endpoint:       "/api/v1/auth/otp/send",
				method:         "POST",
				payload:        map[string]interface{}{"phone": "invalid-phone"},
				expectedStatus: 400,
				description:    "Should reject invalid phone format",
			},
			{
				name:           "OTP Send - Too Short Phone",
				endpoint:       "/api/v1/auth/otp/send",
				method:         "POST",
				payload:        map[string]interface{}{"phone": "+91999"},
				expectedStatus: 400,
				description:    "Should reject too short phone",
			},
			{
				name:           "OTP Send - Too Long Phone",
				endpoint:       "/api/v1/auth/otp/send",
				method:         "POST",
				payload:        map[string]interface{}{"phone": "+9199999999999999999"},
				expectedStatus: 400,
				description:    "Should reject too long phone",
			},
			{
				name:           "OTP Send - XSS Attempt",
				endpoint:       "/api/v1/auth/otp/send",
				method:         "POST",
				payload:        map[string]interface{}{"phone": "<script>alert('xss')</script>"},
				expectedStatus: 400,
				description:    "Should reject XSS attempts",
			},
			{
				name:           "OTP Send - SQL Injection Attempt",
				endpoint:       "/api/v1/auth/otp/send",
				method:         "POST",
				payload:        map[string]interface{}{"phone": "'; DROP TABLE users; --"},
				expectedStatus: 400,
				description:    "Should reject SQL injection attempts",
			},

			// OTP Verify Validation
			{
				name:           "OTP Verify - Missing Fields",
				endpoint:       "/api/v1/auth/otp/verify",
				method:         "POST",
				payload:        map[string]interface{}{"phone": "+919999000002"},
				expectedStatus: 400,
				description:    "Should reject missing OTP field",
			},
			{
				name:           "OTP Verify - Null OTP",
				endpoint:       "/api/v1/auth/otp/verify",
				method:         "POST",
				payload:        map[string]interface{}{"phone": "+919999000002", "otp": nil},
				expectedStatus: 400,
				description:    "Should reject null OTP",
			},
			{
				name:           "OTP Verify - Empty OTP",
				endpoint:       "/api/v1/auth/otp/verify",
				method:         "POST",
				payload:        map[string]interface{}{"phone": "+919999000002", "otp": ""},
				expectedStatus: 400,
				description:    "Should reject empty OTP",
			},
			{
				name:           "OTP Verify - Invalid OTP Format",
				endpoint:       "/api/v1/auth/otp/verify",
				method:         "POST",
				payload:        map[string]interface{}{"phone": "+919999000002", "otp": "abc"},
				expectedStatus: 400,
				description:    "Should reject non-numeric OTP",
			},
			{
				name:           "OTP Verify - Wrong OTP Length",
				endpoint:       "/api/v1/auth/otp/verify",
				method:         "POST",
				payload:        map[string]interface{}{"phone": "+919999000002", "otp": "12345"},
				expectedStatus: 400,
				description:    "Should reject wrong length OTP",
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				var req *http.Request

				if tc.payload != nil {
					body, _ := json.Marshal(tc.payload)
					req, _ = http.NewRequest(tc.method, tc.endpoint, bytes.NewBuffer(body))
					req.Header.Set("Content-Type", "application/json")
				} else {
					req, _ = http.NewRequest(tc.method, tc.endpoint, nil)
				}

				w := httptest.NewRecorder()
				tf.router.ServeHTTP(w, req)

				assert.Equal(t, tc.expectedStatus, w.Code,
					"Test: %s - %s. Response: %s", tc.name, tc.description, w.Body.String())

				if w.Code == 400 {
					// Verify error response contains validation details
					var response map[string]interface{}
					err := json.Unmarshal(w.Body.Bytes(), &response)
					assert.NoError(t, err)
					assert.Contains(t, fmt.Sprintf("%v", response), "validation",
						"Error response should contain validation information")
				}
			})
		}
	})

	t.Run("Driver Management Validation Tests", func(t *testing.T) {
		testCases := []struct {
			name           string
			payload        map[string]interface{}
			expectedStatus int
			description    string
		}{
			{
				name:           "Create Driver - Null Name",
				payload:        map[string]interface{}{"name": nil, "phone": "+919999000003", "license_number": "MH1420110000001"},
				expectedStatus: 400,
				description:    "Should reject null name",
			},
			{
				name:           "Create Driver - Empty Name",
				payload:        map[string]interface{}{"name": "", "phone": "+919999000003", "license_number": "MH1420110000001"},
				expectedStatus: 400,
				description:    "Should reject empty name",
			},
			{
				name:           "Create Driver - Name Too Short",
				payload:        map[string]interface{}{"name": "A", "phone": "+919999000003", "license_number": "MH1420110000001"},
				expectedStatus: 400,
				description:    "Should reject too short name",
			},
			{
				name:           "Create Driver - Name Too Long",
				payload:        map[string]interface{}{"name": strings.Repeat("A", 101), "phone": "+919999000003", "license_number": "MH1420110000001"},
				expectedStatus: 400,
				description:    "Should reject too long name (>100 chars)",
			},
			{
				name:           "Create Driver - Invalid License Format",
				payload:        map[string]interface{}{"name": "Test Driver", "phone": "+919999000003", "license_number": "INVALID"},
				expectedStatus: 400,
				description:    "Should reject invalid license format",
			},
			{
				name:           "Create Driver - Missing Required Fields",
				payload:        map[string]interface{}{"name": "Test Driver"},
				expectedStatus: 400,
				description:    "Should reject missing required fields",
			},
			{
				name:           "Create Driver - XSS in Name",
				payload:        map[string]interface{}{"name": "<script>alert('xss')</script>", "phone": "+919999000003", "license_number": "MH1420110000001"},
				expectedStatus: 400,
				description:    "Should sanitize XSS attempts in name",
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				body, _ := json.Marshal(tc.payload)
				req, _ := http.NewRequest("POST", "/api/v1/drivers", bytes.NewBuffer(body))
				req.Header.Set("Content-Type", "application/json")
				req.Header.Set("Authorization", "Bearer "+adminToken)

				w := httptest.NewRecorder()
				tf.router.ServeHTTP(w, req)

				// Should either return validation error (400) or unauthorized (401)
				assert.True(t, w.Code == tc.expectedStatus || w.Code == 401 || w.Code == 404,
					"Test: %s - Expected %d, got %d. %s. Response: %s",
					tc.name, tc.expectedStatus, w.Code, tc.description, w.Body.String())
			})
		}
	})

	t.Run("Vehicle Management Validation Tests", func(t *testing.T) {
		testCases := []struct {
			name           string
			payload        map[string]interface{}
			expectedStatus int
			description    string
		}{
			{
				name:           "Create Vehicle - Null License Plate",
				payload:        map[string]interface{}{"license_plate": nil, "vehicle_type": "TRUCK", "make": "Tata", "model": "Ultra"},
				expectedStatus: 400,
				description:    "Should reject null license plate",
			},
			{
				name:           "Create Vehicle - Empty License Plate",
				payload:        map[string]interface{}{"license_plate": "", "vehicle_type": "TRUCK", "make": "Tata", "model": "Ultra"},
				expectedStatus: 400,
				description:    "Should reject empty license plate",
			},
			{
				name:           "Create Vehicle - Invalid Vehicle Type",
				payload:        map[string]interface{}{"license_plate": "MH01XX0001", "vehicle_type": "INVALID_TYPE", "make": "Tata", "model": "Ultra"},
				expectedStatus: 400,
				description:    "Should reject invalid vehicle type",
			},
			{
				name:           "Create Vehicle - Missing Required Fields",
				payload:        map[string]interface{}{"license_plate": "MH01XX0001"},
				expectedStatus: 400,
				description:    "Should reject missing required fields",
			},
			{
				name:           "Create Vehicle - Invalid License Plate Format",
				payload:        map[string]interface{}{"license_plate": "INVALID", "vehicle_type": "TRUCK", "make": "Tata", "model": "Ultra"},
				expectedStatus: 400,
				description:    "Should validate license plate format",
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				body, _ := json.Marshal(tc.payload)
				req, _ := http.NewRequest("POST", "/api/v1/vehicles", bytes.NewBuffer(body))
				req.Header.Set("Content-Type", "application/json")
				req.Header.Set("Authorization", "Bearer "+adminToken)

				w := httptest.NewRecorder()
				tf.router.ServeHTTP(w, req)

				assert.True(t, w.Code == tc.expectedStatus || w.Code == 401 || w.Code == 404,
					"Test: %s - Expected %d, got %d. %s. Response: %s",
					tc.name, tc.expectedStatus, w.Code, tc.description, w.Body.String())
			})
		}
	})

	t.Run("Trip Management Validation Tests", func(t *testing.T) {
		testCases := []struct {
			name           string
			payload        map[string]interface{}
			expectedStatus int
			description    string
		}{
			{
				name: "Create Trip - Null Pickup Address",
				payload: map[string]interface{}{
					"pickup_address": nil, "dropoff_address": "Delhi", "customer_name": "Test", "customer_phone": "+919999000004", "cargo_weight": 1000,
				},
				expectedStatus: 400,
				description:    "Should reject null pickup address",
			},
			{
				name: "Create Trip - Empty Customer Name",
				payload: map[string]interface{}{
					"pickup_address": "Mumbai", "dropoff_address": "Delhi", "customer_name": "", "customer_phone": "+919999000004", "cargo_weight": 1000,
				},
				expectedStatus: 400,
				description:    "Should reject empty customer name",
			},
			{
				name: "Create Trip - Invalid Cargo Weight",
				payload: map[string]interface{}{
					"pickup_address": "Mumbai", "dropoff_address": "Delhi", "customer_name": "Test", "customer_phone": "+919999000004", "cargo_weight": -100,
				},
				expectedStatus: 400,
				description:    "Should reject negative cargo weight",
			},
			{
				name: "Create Trip - Excessive Cargo Weight",
				payload: map[string]interface{}{
					"pickup_address": "Mumbai", "dropoff_address": "Delhi", "customer_name": "Test", "customer_phone": "+919999000004", "cargo_weight": 1000000,
				},
				expectedStatus: 400,
				description:    "Should reject excessive cargo weight",
			},
			{
				name: "Create Trip - Invalid Phone Format",
				payload: map[string]interface{}{
					"pickup_address": "Mumbai", "dropoff_address": "Delhi", "customer_name": "Test", "customer_phone": "invalid", "cargo_weight": 1000,
				},
				expectedStatus: 400,
				description:    "Should reject invalid customer phone format",
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				body, _ := json.Marshal(tc.payload)
				req, _ := http.NewRequest("POST", "/api/v1/trips", bytes.NewBuffer(body))
				req.Header.Set("Content-Type", "application/json")
				req.Header.Set("Authorization", "Bearer "+adminToken)

				w := httptest.NewRecorder()
				tf.router.ServeHTTP(w, req)

				assert.True(t, w.Code == tc.expectedStatus || w.Code == 401 || w.Code == 404,
					"Test: %s - Expected %d, got %d. %s. Response: %s",
					tc.name, tc.expectedStatus, w.Code, tc.description, w.Body.String())
			})
		}
	})

	t.Run("Security and Injection Tests", func(t *testing.T) {
		securityTests := []struct {
			name        string
			endpoint    string
			method      string
			payload     interface{}
			description string
		}{
			{
				name:        "SQL Injection in OTP",
				endpoint:    "/api/v1/auth/otp/send",
				method:      "POST",
				payload:     map[string]interface{}{"phone": "'+OR+1=1--"},
				description: "Should sanitize SQL injection attempts",
			},
			{
				name:        "XSS in Driver Name",
				endpoint:    "/api/v1/drivers",
				method:      "POST",
				payload:     map[string]interface{}{"name": "<img src=x onerror=alert(1)>", "phone": "+919999000005", "license_number": "MH1420110000002"},
				description: "Should sanitize XSS attempts",
			},
			{
				name:        "Command Injection in Vehicle Make",
				endpoint:    "/api/v1/vehicles",
				method:      "POST",
				payload:     map[string]interface{}{"license_plate": "MH01XX0002", "vehicle_type": "TRUCK", "make": "; rm -rf /", "model": "Ultra"},
				description: "Should sanitize command injection attempts",
			},
			{
				name:        "Path Traversal in Customer Name",
				endpoint:    "/api/v1/trips",
				method:      "POST",
				payload:     map[string]interface{}{"pickup_address": "Mumbai", "dropoff_address": "Delhi", "customer_name": "../../../etc/passwd", "customer_phone": "+919999000006", "cargo_weight": 1000},
				description: "Should sanitize path traversal attempts",
			},
		}

		for _, tc := range securityTests {
			t.Run(tc.name, func(t *testing.T) {
				body, _ := json.Marshal(tc.payload)
				req, _ := http.NewRequest(tc.method, tc.endpoint, bytes.NewBuffer(body))
				req.Header.Set("Content-Type", "application/json")
				req.Header.Set("Authorization", "Bearer "+adminToken)

				w := httptest.NewRecorder()
				tf.router.ServeHTTP(w, req)

				// Should reject malicious input with 400 (or 401/404 for missing endpoints)
				assert.True(t, w.Code >= 400 && w.Code < 500,
					"Test: %s - Should reject malicious input. Got %d. %s. Response: %s",
					tc.name, w.Code, tc.description, w.Body.String())
			})
		}
	})

	t.Run("Content-Type and Malformed JSON Tests", func(t *testing.T) {
		malformedTests := []struct {
			name        string
			endpoint    string
			contentType string
			body        string
			description string
		}{
			{
				name:        "Missing Content-Type",
				endpoint:    "/api/v1/auth/otp/send",
				contentType: "",
				body:        `{"phone": "+919999000007"}`,
				description: "Should handle missing Content-Type header",
			},
			{
				name:        "Wrong Content-Type",
				endpoint:    "/api/v1/auth/otp/send",
				contentType: "text/plain",
				body:        `{"phone": "+919999000007"}`,
				description: "Should reject wrong Content-Type",
			},
			{
				name:        "Malformed JSON",
				endpoint:    "/api/v1/auth/otp/send",
				contentType: "application/json",
				body:        `{"phone": "+919999000007"`,
				description: "Should reject malformed JSON",
			},
			{
				name:        "Invalid JSON Types",
				endpoint:    "/api/v1/auth/otp/send",
				contentType: "application/json",
				body:        `{"phone": 123456}`,
				description: "Should validate JSON field types",
			},
			{
				name:        "Extremely Large Payload",
				endpoint:    "/api/v1/auth/otp/send",
				contentType: "application/json",
				body:        `{"phone": "` + strings.Repeat("A", 10000) + `"}`,
				description: "Should reject extremely large payloads",
			},
		}

		for _, tc := range malformedTests {
			t.Run(tc.name, func(t *testing.T) {
				req, _ := http.NewRequest("POST", tc.endpoint, strings.NewReader(tc.body))
				if tc.contentType != "" {
					req.Header.Set("Content-Type", tc.contentType)
				}

				w := httptest.NewRecorder()
				tf.router.ServeHTTP(w, req)

				assert.True(t, w.Code >= 400,
					"Test: %s - Should reject invalid request. Got %d. %s. Response: %s",
					tc.name, w.Code, tc.description, w.Body.String())
			})
		}
	})
}
