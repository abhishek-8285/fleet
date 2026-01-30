package test

import (
	"testing"

	"github.com/fleetflow/backend/internal/models"
)

// Missing fuel test functions
func testCreateFuelEventUnauthorized(t *testing.T, tf *TestFramework) {
	testCase := APITestCase{
		Name:   "Create Fuel Event - Unauthorized",
		Method: "POST",
		URL:    "/api/v1/fuel/events",
		RequestBody: map[string]interface{}{
			"vehicle_id": 1,
			"liters":     50.0,
			"amount_inr": 3750.0,
		},
		ExpectedStatus: 401,
	}
	tf.RunAPITest(t, testCase)
}

func testGetFuelEventsAdmin(t *testing.T, tf *TestFramework) {
	var adminToken string

	setup := func(tf *TestFramework) {
		admin, _ := tf.CreateTestUser(TestAdminPhone, models.RoleAdmin)
		token, _ := tf.GenerateJWTToken(admin)
		adminToken = token
	}

	testCase := APITestCase{
		Name:   "Get Fuel Events - Admin",
		Method: "GET",
		URL:    "/api/v1/fuel/events",
		Headers: map[string]string{
			"Authorization": "Bearer " + adminToken,
		},
		ExpectedStatus: 200,
		Setup:          setup,
	}
	tf.RunAPITest(t, testCase)
}

/*
// Missing trip test functions
func testGetTripValid(t *testing.T, tf *TestFramework) {
...
}
*/
