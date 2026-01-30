package services

import (
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"time"

	"github.com/fleetflow/backend/internal/config"
	"github.com/fleetflow/backend/internal/models"
	"github.com/fleetflow/backend/internal/repositories"
	"golang.org/x/crypto/bcrypt"
)

// Error constants
var (
	ErrInvalidOTP   = errors.New("invalid or expired OTP")
	ErrInvalidToken = errors.New("invalid or expired token")
)

// AuthService handles authentication operations
type AuthService struct {
	repo         repositories.AuthRepository
	config       *config.Config
	auditService *AuditService
}

// NewAuthService creates a new auth service
func NewAuthService(repo repositories.AuthRepository, cfg *config.Config, auditService *AuditService) *AuthService {
	return &AuthService{
		repo:         repo,
		config:       cfg,
		auditService: auditService,
	}
}

// SendOTPRequest represents a request to send OTP
type SendOTPRequest struct {
	Phone string `json:"phone" binding:"required"`
}

// VerifyOTPRequest represents a request to verify OTP
type VerifyOTPRequest struct {
	Phone string `json:"phone" binding:"required"`
	OTP   string `json:"otp" binding:"required"`
}

// SendOTP sends an OTP to the provided phone number
func (s *AuthService) SendOTP(phone, ipAddress, userAgent string) (*models.OTPVerification, error) {
	// Clean up old OTP records for this phone
	_ = s.repo.DeleteOldOTPs(phone)

	// Check if there's a recent OTP request
	_, err := s.repo.GetRecentOTP(phone)
	if err == nil {
		return nil, errors.New("OTP already sent recently. Please wait before requesting again")
	}

	// Generate OTP
	otp, err := s.generateOTP()
	if err != nil {
		return nil, fmt.Errorf("failed to generate OTP: %w", err)
	}

	// In development, use fixed OTP for testing
	if s.config.IsDevelopment() {
		otp = "111111"
	}

	// Create OTP verification record
	otpVerification := &models.OTPVerification{
		Phone:     phone,
		OTP:       otp,
		ExpiresAt: time.Now().Add(5 * time.Minute), // OTP expires in 5 minutes
		IPAddress: ipAddress,
		UserAgent: userAgent,
	}

	if err := s.repo.CreateOTP(otpVerification); err != nil {
		return nil, fmt.Errorf("failed to save OTP: %w", err)
	}

	// TODO: Send OTP via SMS service
	// For now, log the OTP in development
	if s.config.IsDevelopment() {
		fmt.Printf("📱 OTP for %s: %s\n", phone, otp)
	}

	// Log audit event
	_ = s.auditService.LogAction(models.AuditActionUserLogin, models.AuditSeverityInfo,
		fmt.Sprintf("OTP sent to phone %s", phone), nil, nil, &models.AuditContext{
			IPAddress: ipAddress,
			UserAgent: userAgent,
		})

	return otpVerification, nil
}

// VerifyOTP verifies the provided OTP and returns a user token
func (s *AuthService) VerifyOTP(phone, otp, ipAddress, userAgent string) (*models.UserAccount, error) {
	// Find the OTP verification record
	otpVerification, err := s.repo.GetOTPForVerification(phone, otp)
	if err != nil {
		// Log failed attempt
		_ = s.auditService.LogAction(models.AuditActionLoginFailed, models.AuditSeverityWarning,
			fmt.Sprintf("Failed OTP verification for phone %s", phone), nil, nil, &models.AuditContext{
				IPAddress: ipAddress,
				UserAgent: userAgent,
			})

		return nil, errors.New("invalid OTP")
	}

	// Check if OTP is expired
	if otpVerification.IsExpired() {
		return nil, errors.New("OTP has expired")
	}

	// Check attempt limit
	if !otpVerification.CanAttempt() {
		return nil, errors.New("too many OTP attempts")
	}

	// Mark OTP as verified
	otpVerification.Verified = true
	if err := s.repo.UpdateOTP(otpVerification); err != nil {
		return nil, fmt.Errorf("failed to update OTP: %w", err)
	}

	// Find or create user account
	user, err := s.repo.GetUserByPhone(phone)
	if err != nil {
		// Create new user account
		newUser := &models.UserAccount{
			Phone:    phone,
			Role:     models.RoleDriver, // Default role
			IsActive: true,
		}

		if err := s.repo.CreateUser(newUser); err != nil {
			return nil, fmt.Errorf("failed to create user account: %w", err)
		}
		user = newUser

		// Log audit event for new user
		_ = s.auditService.LogAction(models.AuditActionUserCreated, models.AuditSeverityInfo,
			fmt.Sprintf("New user account created for phone %s", phone), nil, user, &models.AuditContext{
				IPAddress: ipAddress,
				UserAgent: userAgent,
				UserID:    &user.ID,
			})
	}

	// Check if user account is active
	if !user.IsActive {
		return nil, errors.New("user account is deactivated")
	}

	// Update last login time
	now := time.Now()
	user.LastLogin = &now
	if err := s.repo.UpdateUser(user); err != nil {
		return nil, fmt.Errorf("failed to update user login: %w", err)
	}

	// Since repo methods might not preload, use GetByID to be sure if needed
	// But GetUserByPhone logic in repo doesn't preload driver currently.
	// Let's rely on standard flow.
	// Optionally reload:
	user, _ = s.repo.GetUserByID(user.ID)

	// Log successful login
	_ = s.auditService.LogAction(models.AuditActionUserLogin, models.AuditSeverityInfo,
		fmt.Sprintf("Successful OTP verification for phone %s", phone), nil, nil, &models.AuditContext{
			IPAddress: ipAddress,
			UserAgent: userAgent,
			UserID:    &user.ID,
		})

	return user, nil
}

// GetUserByID retrieves a user by ID
func (s *AuthService) GetUserByID(userID uint) (*models.UserAccount, error) {
	return s.repo.GetUserByID(userID)
}

// UpdateUserProfile updates user profile information
func (s *AuthService) UpdateUserProfile(userID uint, updates map[string]interface{}) (*models.UserAccount, error) {
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	// Store old values for audit
	oldValues := *user

	// Update user
	if err := s.repo.UpdateUserFields(userID, updates); err != nil {
		return nil, err
	}

	// Reload user with associations
	updatedUser, err := s.repo.GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	// Log audit event
	_ = s.auditService.LogAction(models.AuditActionUserUpdated, models.AuditSeverityInfo,
		fmt.Sprintf("User profile updated for user ID %d", userID), &oldValues, updatedUser, &models.AuditContext{
			UserID: &userID,
		})

	return updatedUser, nil
}

// ChangePassword changes user password (if password auth is implemented)
func (s *AuthService) ChangePassword(userID uint, oldPassword, newPassword string) error {
	// This is a placeholder for password-based authentication
	// Currently, the system uses OTP-based auth only
	return errors.New("password authentication not implemented")
}

// DeactivateUser deactivates a user account
func (s *AuthService) DeactivateUser(userID, deactivatedBy uint) error {
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return err
	}

	oldValues := *user
	user.IsActive = false

	if err := s.repo.UpdateUser(user); err != nil {
		return err
	}

	// Log audit event
	_ = s.auditService.LogAction(models.AuditActionUserDeleted, models.AuditSeverityWarning,
		fmt.Sprintf("User account deactivated for user ID %d", userID), &oldValues, user, &models.AuditContext{
			UserID: &deactivatedBy,
		})

	return nil
}

// CreateAdminUser creates an admin user account
func (s *AuthService) CreateAdminUser(phone string, createdBy uint) (*models.UserAccount, error) {
	// Check if user already exists
	if _, err := s.repo.GetUserByPhone(phone); err == nil {
		return nil, errors.New("user with this phone number already exists")
	}

	// Create admin user
	user := &models.UserAccount{
		Phone:    phone,
		Role:     models.RoleAdmin,
		IsActive: true,
	}

	if err := s.repo.CreateUser(user); err != nil {
		return nil, fmt.Errorf("failed to create admin user: %w", err)
	}

	// Log audit event
	_ = s.auditService.LogAction(models.AuditActionUserCreated, models.AuditSeverityInfo,
		fmt.Sprintf("Admin user created for phone %s", phone), nil, user, &models.AuditContext{
			UserID: &createdBy,
		})

	return user, nil
}

// generateOTP generates a 4-digit OTP
func (s *AuthService) generateOTP() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(10000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%04d", n.Int64()), nil
}

// HashPassword hashes a password using bcrypt
func (s *AuthService) HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPassword verifies a password against a hash
func (s *AuthService) CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// models.AuditContext represents audit context information
type AuditContext = models.AuditContext

// Add this to models/audit.go if not already present
func init() {
	// This ensures the AuditContext type is available
}
