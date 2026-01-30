package services

import (
	"fmt"
	"time"

	"github.com/fleetflow/backend/internal/config"
	"github.com/fleetflow/backend/internal/models"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// JWTClaims represents the JWT token claims
type JWTClaims struct {
	UserID   uint        `json:"user_id"`
	Phone    string      `json:"phone"`
	Role     models.Role `json:"role"`
	DriverID *uint       `json:"driver_id,omitempty"`
	jwt.RegisteredClaims
}

// JWTService handles JWT operations
type JWTService struct {
	config *config.Config
	db     *gorm.DB
}

// NewJWTService creates a new JWT service
func NewJWTService(cfg *config.Config, db *gorm.DB) *JWTService {
	return &JWTService{
		config: cfg,
		db:     db,
	}
}

// GenerateToken generates a new JWT token for a user
func (j *JWTService) GenerateToken(user *models.UserAccount) (string, error) {
	claims := JWTClaims{
		UserID:   user.ID,
		Phone:    user.Phone,
		Role:     user.Role,
		DriverID: user.DriverID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(j.config.JWTExpirationTime)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "fleetflow",
			Subject:   user.Phone,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.config.JWTSecret))
}

// GenerateRefreshToken generates a refresh token
func (j *JWTService) GenerateRefreshToken(userID uint) (*models.RefreshToken, error) {
	// Generate a random token with UUID for entropy to prevent UNIQUE constraints in fast tests
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(j.config.RefreshTokenExpiry)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		Issuer:    "fleetflow-refresh",
		ID:        uuid.New().String(), // Add unique ID to claims
	})

	tokenString, err := token.SignedString([]byte(j.config.JWTSecret))
	if err != nil {
		return nil, err
	}

	refreshToken := &models.RefreshToken{
		Token:     tokenString,
		UserID:    userID,
		ExpiresAt: time.Now().Add(j.config.RefreshTokenExpiry),
		Revoked:   false,
	}

	// Save to database
	if err := j.db.Create(refreshToken).Error; err != nil {
		return nil, err
	}

	return refreshToken, nil
}

// ValidateToken validates a JWT token and returns the claims
func (j *JWTService) ValidateToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(j.config.JWTSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, jwt.ErrSignatureInvalid
}

// RefreshToken refreshes an access token using a refresh token
func (j *JWTService) RefreshToken(refreshTokenString string) (string, *models.RefreshToken, error) {
	// Find refresh token in database
	var refreshToken models.RefreshToken
	if err := j.db.Where("token = ? AND revoked = false", refreshTokenString).First(&refreshToken).Error; err != nil {
		return "", nil, fmt.Errorf("refresh token not found or revoked: %w", err)
	}

	// Check if refresh token is expired
	if time.Now().After(refreshToken.ExpiresAt) {
		return "", nil, fmt.Errorf("refresh token expired at %v (current time %v)", refreshToken.ExpiresAt, time.Now())
	}

	// Get user
	var user models.UserAccount
	if err := j.db.First(&user, refreshToken.UserID).Error; err != nil {
		return "", nil, err
	}

	// Generate new access token
	accessToken, err := j.GenerateToken(&user)
	if err != nil {
		return "", nil, err
	}

	// Generate new refresh token and revoke old one
	refreshToken.Revoked = true
	_ = j.db.Save(&refreshToken)

	newRefreshToken, err := j.GenerateRefreshToken(user.ID)
	if err != nil {
		return "", nil, err
	}

	return accessToken, newRefreshToken, nil
}

// RevokeRefreshToken revokes a refresh token
func (j *JWTService) RevokeRefreshToken(tokenString string) error {
	return j.db.Model(&models.RefreshToken{}).
		Where("token = ?", tokenString).
		Update("revoked", true).Error
}

// RevokeAllUserTokens revokes all refresh tokens for a user
func (j *JWTService) RevokeAllUserTokens(userID uint) error {
	return j.db.Model(&models.RefreshToken{}).
		Where("user_id = ?", userID).
		Update("revoked", true).Error
}
