package test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/fleetflow/backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

func TestOrganizationRegistration(t *testing.T) {
	tf, err := NewTestFramework()
	require.NoError(t, err)
	defer tf.CleanDatabase()

	t.Run("Successful Registration", func(t *testing.T) {
		payload := map[string]interface{}{
			"name":           "Acme Logistics",
			"code":           "acme-logistics",
			"admin_phone":    "+15550001111",
			"admin_email":    "admin@acme.com",
			"admin_password": "SecurePassword123!",
		}
		body, _ := json.Marshal(payload)
		req, _ := http.NewRequest("POST", "/api/v1/organizations/register", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		tf.Router.ServeHTTP(w, req)

		// 1. Verify Response
		assert.Equal(t, http.StatusCreated, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.NotZero(t, response["organization_id"])
		assert.NotZero(t, response["admin_user_id"])

		// 2. Verify Database - Organization
		var org models.Organization
		err = tf.DB.Where("code = ?", "acme-logistics").First(&org).Error
		assert.NoError(t, err)
		assert.Equal(t, "Acme Logistics", org.Name)

		// 3. Verify Database - User
		var user models.UserAccount
		err = tf.DB.Where("email = ?", "admin@acme.com").First(&user).Error
		assert.NoError(t, err)
		assert.Equal(t, "+15550001111", user.Phone)
		assert.Equal(t, models.RoleOrgAdmin, user.Role)
		assert.Equal(t, org.ID, *user.OrganizationID)

		// 4. Verify Password Hashing
		err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte("SecurePassword123!"))
		assert.NoError(t, err, "Password should be hashed correctly")
		assert.NotEqual(t, "SecurePassword123!", user.Password, "Password should not be stored in plain text")

		// 5. Verify Database - Default Fleet
		var fleet models.Fleet
		err = tf.DB.Where("organization_id = ?", org.ID).First(&fleet).Error
		assert.NoError(t, err)
		assert.Equal(t, "Default Fleet", fleet.Name)
	})

	t.Run("Duplicate Registration Failure", func(t *testing.T) {
		// Try to register with same code
		payload := map[string]interface{}{
			"name":           "Acme Duplicate",
			"code":           "acme-logistics", // Duplicate code
			"admin_phone":    "+15550002222",
			"admin_email":    "admin2@acme.com",
			"admin_password": "password",
		}
		body, _ := json.Marshal(payload)
		req, _ := http.NewRequest("POST", "/api/v1/organizations/register", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		tf.Router.ServeHTTP(w, req)

		assert.NotEqual(t, http.StatusCreated, w.Code)
	})
}
