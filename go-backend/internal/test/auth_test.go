package test

import (
	"fmt"
	"testing"
	"time"

	"github.com/fleetflow/backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAuthenticationAPI(t *testing.T) {
	tf, err := NewTestFramework()
	require.NoError(t, err)
	defer tf.CleanDatabase()

	// Test cases for authentication endpoints
	testCases := []struct {
		name     string
		testFunc func(*testing.T, *TestFramework)
	}{
		{"Send OTP - Valid Phone", testSendOTPValid},
		{"Send OTP - Invalid Phone", testSendOTPInvalid},
		{"Send OTP - Missing Phone", testSendOTPMissing},
		{"Send OTP - Rate Limiting", testSendOTPRateLimit},
		{"Verify OTP - Valid", testVerifyOTPValid},
		{"Verify OTP - Invalid OTP", testVerifyOTPInvalid},
		{"Verify OTP - Expired OTP", testVerifyOTPExpired},
		{"Verify OTP - Max Attempts", testVerifyOTPMaxAttempts},
		{"Refresh Token - Valid", testRefreshTokenValid},
		{"Refresh Token - Invalid", testRefreshTokenInvalid},
		{"Refresh Token - Expired", testRefreshTokenExpired},
		{"Logout - Valid Token", testLogoutValid},
		{"Logout - Invalid Token", testLogoutInvalid},
		{"Get Profile - Valid Token", testGetProfileValid},
		{"Get Profile - No Token", testGetProfileNoToken},
		{"Update Profile - Valid", testUpdateProfileValid},
		{"Update Profile - Unauthorized", testUpdateProfileUnauthorized},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			tf.CleanDatabase() // Clean state for each test
			tc.testFunc(t, tf)
		})
	}
}

// Test: Send OTP with valid phone number
func testSendOTPValid(t *testing.T, tf *TestFramework) {
	testCase := APITestCase{
		Name:   "Send OTP - Valid Phone",
		Method: "POST",
		URL:    "/api/v1/auth/otp/send",
		RequestBody: map[string]string{
			"phone": TestDriverPhone,
		},
		ExpectedStatus: 200,
		ExpectedBody: map[string]interface{}{
			"message": "OTP sent successfully to +919999999991",
		},
	}

	tf.RunAPITest(t, testCase)

	// Verify OTP was stored in database
	var otp models.OTPVerification
	err := tf.DB.Where("phone = ?", TestDriverPhone).First(&otp).Error
	assert.NoError(t, err, "OTP should be stored in database")
	assert.False(t, otp.IsExpired(), "OTP should not be expired")
}

// Test: Send OTP with invalid phone format
func testSendOTPInvalid(t *testing.T, tf *TestFramework) {
	testCase := APITestCase{
		Name:   "Send OTP - Invalid Phone",
		Method: "POST",
		URL:    "/api/v1/auth/otp/send",
		RequestBody: map[string]string{
			"phone": "invalid-phone",
		},
		ExpectedStatus: 400,
		ExpectedBody: map[string]interface{}{
			"error": "validation_failed",
		},
	}

	tf.RunAPITest(t, testCase)
}

// Test: Send OTP with missing phone
func testSendOTPMissing(t *testing.T, tf *TestFramework) {
	testCase := APITestCase{
		Name:           "Send OTP - Missing Phone",
		Method:         "POST",
		URL:            "/api/v1/auth/otp/send",
		RequestBody:    map[string]string{},
		ExpectedStatus: 400,
	}

	tf.RunAPITest(t, testCase)
}

// Test: Rate limiting for OTP requests
func testSendOTPRateLimit(t *testing.T, tf *TestFramework) {
	// Send multiple OTP requests rapidly
	for i := 0; i < 5; i++ {
		testCase := APITestCase{
			Name:   fmt.Sprintf("Send OTP - Rate Limit Test %d", i+1),
			Method: "POST",
			URL:    "/api/v1/auth/otp/send",
			RequestBody: map[string]string{
				"phone": TestDriverPhone,
			},
			ExpectedStatus: func() int {
				if i < 3 {
					return 200 // First 3 should succeed
				}
				return 429 // 4th and 5th should be rate limited
			}(),
		}

		tf.RunAPITest(t, testCase)
	}
}

// Test: Verify OTP with valid credentials
func testVerifyOTPValid(t *testing.T, tf *TestFramework) {
	// Setup: Create OTP in database
	setup := func(tf *TestFramework) {
		driver, _ := tf.CreateTestDriver("Test Driver", TestDriverPhone, TestDriverLicense)
		user, _ := tf.CreateTestUser(TestDriverPhone, models.RoleDriver)
		user.DriverID = &driver.ID
		tf.DB.Save(user)

		otp := &models.OTPVerification{
			Phone:     TestDriverPhone,
			OTP:       TestOTP,
			ExpiresAt: time.Now().Add(5 * time.Minute),
			Verified:  false,
		}
		tf.DB.Create(otp)
	}

	testCase := APITestCase{
		Name:   "Verify OTP - Valid",
		Method: "POST",
		URL:    "/api/v1/auth/otp/verify",
		RequestBody: map[string]string{
			"phone": TestDriverPhone,
			"otp":   TestOTP,
		},
		ExpectedStatus: 200,
		Setup:          setup,
	}

	tf.RunAPITest(t, testCase)
}

// Test: Verify OTP with invalid code
func testVerifyOTPInvalid(t *testing.T, tf *TestFramework) {
	setup := func(tf *TestFramework) {
		otp := &models.OTPVerification{
			Phone:     TestDriverPhone,
			OTP:       TestOTP,
			ExpiresAt: time.Now().Add(5 * time.Minute),
		}
		tf.DB.Create(otp)
	}

	testCase := APITestCase{
		Name:   "Verify OTP - Invalid",
		Method: "POST",
		URL:    "/api/v1/auth/otp/verify",
		RequestBody: map[string]string{
			"phone": TestDriverPhone,
			"otp":   "wrong-otp",
		},
		ExpectedStatus: 401,
		Setup:          setup,
	}

	tf.RunAPITest(t, testCase)
}

// Test: Verify expired OTP
func testVerifyOTPExpired(t *testing.T, tf *TestFramework) {
	setup := func(tf *TestFramework) {
		otp := &models.OTPVerification{
			Phone:     TestDriverPhone,
			OTP:       TestOTP,
			ExpiresAt: time.Now().Add(-1 * time.Minute), // Expired
		}
		tf.DB.Create(otp)
	}

	testCase := APITestCase{
		Name:   "Verify OTP - Expired",
		Method: "POST",
		URL:    "/api/v1/auth/otp/verify",
		RequestBody: map[string]string{
			"phone": TestDriverPhone,
			"otp":   TestOTP,
		},
		ExpectedStatus: 401,
		Setup:          setup,
	}

	tf.RunAPITest(t, testCase)
}

// Test: Max OTP attempts
func testVerifyOTPMaxAttempts(t *testing.T, tf *TestFramework) {
	setup := func(tf *TestFramework) {
		otp := &models.OTPVerification{
			Phone:     TestDriverPhone,
			OTP:       TestOTP,
			ExpiresAt: time.Now().Add(5 * time.Minute),
			Attempts:  3, // Max attempts reached
		}
		tf.DB.Create(otp)
	}

	testCase := APITestCase{
		Name:   "Verify OTP - Max Attempts",
		Method: "POST",
		URL:    "/api/v1/auth/otp/verify",
		RequestBody: map[string]string{
			"phone": TestDriverPhone,
			"otp":   TestOTP,
		},
		ExpectedStatus: 429,
		Setup:          setup,
	}

	tf.RunAPITest(t, testCase)
}

// Test: Refresh token with valid token
func testRefreshTokenValid(t *testing.T, tf *TestFramework) {
	var refreshToken string

	setup := func(tf *TestFramework) {
		user, _ := tf.CreateTestUser(TestDriverPhone, models.RoleDriver)
		rt, _ := tf.Services.JWTService.GenerateRefreshToken(user.ID)
		refreshToken = rt.Token
	}

	testCase := APITestCase{
		Name:   "Refresh Token - Valid",
		Method: "POST",
		URL:    "/api/v1/auth/refresh",
		RequestBody: map[string]string{
			"refresh_token": refreshToken,
		},
		ExpectedStatus: 200,
		Setup:          setup,
	}

	tf.RunAPITest(t, testCase)
}

// Test: Refresh token with invalid token
func testRefreshTokenInvalid(t *testing.T, tf *TestFramework) {
	testCase := APITestCase{
		Name:   "Refresh Token - Invalid",
		Method: "POST",
		URL:    "/api/v1/auth/refresh",
		RequestBody: map[string]string{
			"refresh_token": "invalid-token",
		},
		ExpectedStatus: 401,
	}

	tf.RunAPITest(t, testCase)
}

// Test: Refresh token with expired token
func testRefreshTokenExpired(t *testing.T, tf *TestFramework) {
	setup := func(tf *TestFramework) {
		user, _ := tf.CreateTestUser(TestDriverPhone, models.RoleDriver)

		// Create expired refresh token
		expiredToken := &models.RefreshToken{
			Token:     "expired-refresh-token",
			UserID:    user.ID,
			ExpiresAt: time.Now().Add(-1 * time.Hour),
		}
		tf.DB.Create(expiredToken)
	}

	testCase := APITestCase{
		Name:   "Refresh Token - Expired",
		Method: "POST",
		URL:    "/api/v1/auth/refresh",
		RequestBody: map[string]string{
			"refresh_token": "expired-refresh-token",
		},
		ExpectedStatus: 401,
		Setup:          setup,
	}

	tf.RunAPITest(t, testCase)
}

// Test: Logout with valid token
func testLogoutValid(t *testing.T, tf *TestFramework) {
	var accessToken string

	setup := func(tf *TestFramework) {
		user, _ := tf.CreateTestUser(TestDriverPhone, models.RoleDriver)
		token, _ := tf.GenerateJWTToken(user)
		accessToken = token
	}

	testCase := APITestCase{
		Name:   "Logout - Valid Token",
		Method: "POST",
		URL:    "/api/v1/auth/logout",
		Headers: map[string]string{
			"Authorization": "Bearer " + accessToken,
		},
		RequestBody:    map[string]string{},
		ExpectedStatus: 200,
		Setup:          setup,
	}

	tf.RunAPITest(t, testCase)
}

// Test: Logout with invalid token
func testLogoutInvalid(t *testing.T, tf *TestFramework) {
	testCase := APITestCase{
		Name:   "Logout - Invalid Token",
		Method: "POST",
		URL:    "/api/v1/auth/logout",
		Headers: map[string]string{
			"Authorization": "Bearer invalid-token",
		},
		ExpectedStatus: 401,
	}

	tf.RunAPITest(t, testCase)
}

// Test: Get profile with valid token
func testGetProfileValid(t *testing.T, tf *TestFramework) {
	var accessToken string

	setup := func(tf *TestFramework) {
		user, _ := tf.CreateTestUser(TestDriverPhone, models.RoleDriver)
		token, _ := tf.GenerateJWTToken(user)
		accessToken = token
	}

	testCase := APITestCase{
		Name:   "Get Profile - Valid Token",
		Method: "GET",
		URL:    "/api/v1/auth/profile",
		Headers: map[string]string{
			"Authorization": "Bearer " + accessToken,
		},
		ExpectedStatus: 200,
		Setup:          setup,
	}

	tf.RunAPITest(t, testCase)
}

// Test: Get profile without token
func testGetProfileNoToken(t *testing.T, tf *TestFramework) {
	testCase := APITestCase{
		Name:           "Get Profile - No Token",
		Method:         "GET",
		URL:            "/api/v1/auth/profile",
		ExpectedStatus: 401,
	}

	tf.RunAPITest(t, testCase)
}

// Test: Update profile with valid token
func testUpdateProfileValid(t *testing.T, tf *TestFramework) {
	var accessToken string

	setup := func(tf *TestFramework) {
		user, _ := tf.CreateTestUser(TestDriverPhone, models.RoleDriver)
		token, _ := tf.GenerateJWTToken(user)
		accessToken = token
	}

	testCase := APITestCase{
		Name:   "Update Profile - Valid",
		Method: "PUT",
		URL:    "/api/v1/auth/profile",
		Headers: map[string]string{
			"Authorization": "Bearer " + accessToken,
		},
		RequestBody: map[string]string{
			"name":  "Updated Driver Name",
			"email": "driver@example.com",
		},
		ExpectedStatus: 200,
		Setup:          setup,
	}

	tf.RunAPITest(t, testCase)
}

// Test: Update profile without authorization
func testUpdateProfileUnauthorized(t *testing.T, tf *TestFramework) {
	testCase := APITestCase{
		Name:   "Update Profile - Unauthorized",
		Method: "PUT",
		URL:    "/api/v1/auth/profile",
		RequestBody: map[string]string{
			"name": "Hacker",
		},
		ExpectedStatus: 401,
	}

	tf.RunAPITest(t, testCase)
}

// Benchmark test for authentication performance
func BenchmarkAuthEndpoints(b *testing.B) {
	tf, _ := NewTestFramework()
	defer tf.CleanDatabase()

	// Setup test user
	user, _ := tf.CreateTestUser(TestDriverPhone, models.RoleDriver)
	accessToken, _ := tf.GenerateJWTToken(user)

	b.ResetTimer()

	b.Run("SendOTP", func(b *testing.B) {
		for i := 0; i < b.N; i++ {
			testCase := APITestCase{
				Method: "POST",
				URL:    "/api/v1/auth/otp/send",
				RequestBody: map[string]string{
					"phone": fmt.Sprintf("+9199999%05d", i),
				},
				ExpectedStatus: 200,
			}
			tf.RunAPITest(&testing.T{}, testCase)
		}
	})

	b.Run("VerifyToken", func(b *testing.B) {
		for i := 0; i < b.N; i++ {
			testCase := APITestCase{
				Method: "GET",
				URL:    "/api/v1/auth/profile",
				Headers: map[string]string{
					"Authorization": "Bearer " + accessToken,
				},
				ExpectedStatus: 200,
			}
			tf.RunAPITest(&testing.T{}, testCase)
		}
	})
}
