package test

import (
	"fmt"
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

// Missing trip test functions
func testGetTripValid(t *testing.T, tf *TestFramework) {
	var tripID uint
	var token string

	setup := func(tf *TestFramework) {
		driver, _ := tf.CreateTestDriver("Get Driver", TestDriverPhone, TestDriverLicense)
		vehicle, _ := tf.CreateTestVehicle(TestVehicleReg, "TRUCK")
		trip, _ := tf.CreateTestTrip("Mumbai", "Delhi", driver.ID, vehicle.ID)
		tripID = trip.ID

		user, _ := tf.CreateTestUser(TestDriverPhone, models.RoleDriver)
		accessToken, _ := tf.GenerateJWTToken(user)
		token = accessToken
	}

	testCase := APITestCase{
		Name:   "Get Trip - Valid ID",
		Method: "GET",
		URL:    fmt.Sprintf("/api/v1/trips/%d", tripID),
		Headers: map[string]string{
			"Authorization": "Bearer " + token,
		},
		ExpectedStatus: 200,
		Setup:          setup,
	}
	tf.RunAPITest(t, testCase)
}

func testGetTripInvalid(t *testing.T, tf *TestFramework) {
	var token string

	setup := func(tf *TestFramework) {
		user, _ := tf.CreateTestUser(TestDriverPhone, models.RoleDriver)
		accessToken, _ := tf.GenerateJWTToken(user)
		token = accessToken
	}

	testCase := APITestCase{
		Name:   "Get Trip - Invalid ID",
		Method: "GET",
		URL:    "/api/v1/trips/99999",
		Headers: map[string]string{
			"Authorization": "Bearer " + token,
		},
		ExpectedStatus: 404,
		Setup:          setup,
	}
	tf.RunAPITest(t, testCase)
}

func testUpdateTripValid(t *testing.T, tf *TestFramework) {
	var tripID uint
	var adminToken string

	setup := func(tf *TestFramework) {
		admin, _ := tf.CreateTestUser(TestAdminPhone, models.RoleAdmin)
		token, _ := tf.GenerateJWTToken(admin)
		adminToken = token

		driver, _ := tf.CreateTestDriver("Update Driver", TestDriverPhone, TestDriverLicense)
		vehicle, _ := tf.CreateTestVehicle(TestVehicleReg, "TRUCK")
		trip, _ := tf.CreateTestTrip("Mumbai", "Delhi", driver.ID, vehicle.ID)
		tripID = trip.ID
	}

	testCase := APITestCase{
		Name:   "Update Trip - Valid",
		Method: "PUT",
		URL:    fmt.Sprintf("/api/v1/trips/%d", tripID),
		Headers: map[string]string{
			"Authorization": "Bearer " + adminToken,
		},
		RequestBody: map[string]interface{}{
			"customer_name": "Updated Customer",
			"cargo_weight":  1500,
		},
		ExpectedStatus: 200,
		Setup:          setup,
	}
	tf.RunAPITest(t, testCase)
}

func testDeleteTripValid(t *testing.T, tf *TestFramework) {
	var tripID uint
	var adminToken string

	setup := func(tf *TestFramework) {
		admin, _ := tf.CreateTestUser(TestAdminPhone, models.RoleAdmin)
		token, _ := tf.GenerateJWTToken(admin)
		adminToken = token

		driver, _ := tf.CreateTestDriver("Delete Driver", TestDriverPhone, TestDriverLicense)
		vehicle, _ := tf.CreateTestVehicle(TestVehicleReg, "TRUCK")
		trip, _ := tf.CreateTestTrip("Mumbai", "Delhi", driver.ID, vehicle.ID)
		tripID = trip.ID
	}

	testCase := APITestCase{
		Name:   "Delete Trip - Valid",
		Method: "DELETE",
		URL:    fmt.Sprintf("/api/v1/trips/%d", tripID),
		Headers: map[string]string{
			"Authorization": "Bearer " + adminToken,
		},
		ExpectedStatus: 200,
		Setup:          setup,
	}
	tf.RunAPITest(t, testCase)
}

func testPauseTripNotStarted(t *testing.T, tf *TestFramework) {
	var tripID uint
	var driverToken string

	setup := func(tf *TestFramework) {
		driver, _ := tf.CreateTestDriver("Pause Driver", TestDriverPhone, TestDriverLicense)
		vehicle, _ := tf.CreateTestVehicle(TestVehicleReg, "TRUCK")
		user, _ := tf.CreateTestUser(TestDriverPhone, models.RoleDriver)
		user.DriverID = &driver.ID
		tf.DB.Save(user)
		token, _ := tf.GenerateJWTToken(user)
		driverToken = token

		trip, _ := tf.CreateTestTrip("Mumbai", "Delhi", driver.ID, vehicle.ID)
		tripID = trip.ID
		trip.Status = models.TripStatusAssigned
		tf.DB.Save(trip)
	}

	testCase := APITestCase{
		Name:   "Pause Trip - Not Started",
		Method: "POST",
		URL:    fmt.Sprintf("/api/v1/trips/%d/pause", tripID),
		Headers: map[string]string{
			"Authorization": "Bearer " + driverToken,
		},
		RequestBody: map[string]interface{}{
			"reason": "BREAK",
		},
		ExpectedStatus: 409,
		Setup:          setup,
	}
	tf.RunAPITest(t, testCase)
}

func testResumeTripValid(t *testing.T, tf *TestFramework) {
	var tripID uint
	var driverToken string

	setup := func(tf *TestFramework) {
		driver, _ := tf.CreateTestDriver("Resume Driver", TestDriverPhone, TestDriverLicense)
		vehicle, _ := tf.CreateTestVehicle(TestVehicleReg, "TRUCK")
		user, _ := tf.CreateTestUser(TestDriverPhone, models.RoleDriver)
		user.DriverID = &driver.ID
		tf.DB.Save(user)
		token, _ := tf.GenerateJWTToken(user)
		driverToken = token

		trip, _ := tf.CreateTestTrip("Mumbai", "Delhi", driver.ID, vehicle.ID)
		tripID = trip.ID
		trip.Status = models.TripStatusPaused
		tf.DB.Save(trip)
	}

	testCase := APITestCase{
		Name:   "Resume Trip - Valid",
		Method: "POST",
		URL:    fmt.Sprintf("/api/v1/trips/%d/resume", tripID),
		Headers: map[string]string{
			"Authorization": "Bearer " + driverToken,
		},
		RequestBody: map[string]interface{}{
			"location": map[string]float64{
				"lat": 20.0000,
				"lng": 73.0000,
			},
		},
		ExpectedStatus: 200,
		Setup:          setup,
	}
	tf.RunAPITest(t, testCase)
}

func testResumeTripNotPaused(t *testing.T, tf *TestFramework) {
	var tripID uint
	var driverToken string

	setup := func(tf *TestFramework) {
		driver, _ := tf.CreateTestDriver("Resume Driver", TestDriverPhone, TestDriverLicense)
		vehicle, _ := tf.CreateTestVehicle(TestVehicleReg, "TRUCK")
		user, _ := tf.CreateTestUser(TestDriverPhone, models.RoleDriver)
		user.DriverID = &driver.ID
		tf.DB.Save(user)
		token, _ := tf.GenerateJWTToken(user)
		driverToken = token

		trip, _ := tf.CreateTestTrip("Mumbai", "Delhi", driver.ID, vehicle.ID)
		tripID = trip.ID
		trip.Status = models.TripStatusInProgress
		tf.DB.Save(trip)
	}

	testCase := APITestCase{
		Name:   "Resume Trip - Not Paused",
		Method: "POST",
		URL:    fmt.Sprintf("/api/v1/trips/%d/resume", tripID),
		Headers: map[string]string{
			"Authorization": "Bearer " + driverToken,
		},
		RequestBody: map[string]interface{}{
			"location": map[string]float64{
				"lat": 20.0000,
				"lng": 73.0000,
			},
		},
		ExpectedStatus: 409,
		Setup:          setup,
	}
	tf.RunAPITest(t, testCase)
}

func testCompleteTripNotStarted(t *testing.T, tf *TestFramework) {
	var tripID uint
	var driverToken string

	setup := func(tf *TestFramework) {
		driver, _ := tf.CreateTestDriver("Complete Driver", TestDriverPhone, TestDriverLicense)
		vehicle, _ := tf.CreateTestVehicle(TestVehicleReg, "TRUCK")
		user, _ := tf.CreateTestUser(TestDriverPhone, models.RoleDriver)
		user.DriverID = &driver.ID
		tf.DB.Save(user)
		token, _ := tf.GenerateJWTToken(user)
		driverToken = token

		trip, _ := tf.CreateTestTrip("Mumbai", "Delhi", driver.ID, vehicle.ID)
		tripID = trip.ID
		trip.Status = models.TripStatusAssigned
		tf.DB.Save(trip)
	}

	testCase := APITestCase{
		Name:   "Complete Trip - Not Started",
		Method: "POST",
		URL:    fmt.Sprintf("/api/v1/trips/%d/complete", tripID),
		Headers: map[string]string{
			"Authorization": "Bearer " + driverToken,
		},
		RequestBody: map[string]interface{}{
			"location": map[string]float64{
				"lat": 28.6139,
				"lng": 77.2090,
			},
		},
		ExpectedStatus: 409,
		Setup:          setup,
	}
	tf.RunAPITest(t, testCase)
}
