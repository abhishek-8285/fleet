package models

import (
	"time"

	"gorm.io/gorm"
)

// TokenRevocation represents a revoked refresh token
type TokenRevocation struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Token     string         `json:"token" gorm:"uniqueIndex;not null"` // Hashed token
	UserID    uint           `json:"user_id" gorm:"index"`
	RevokedAt time.Time      `json:"revoked_at" gorm:"not null"`
	Reason    string         `json:"reason"`                           // "logout", "security", "expired"
	ExpiresAt time.Time      `json:"expires_at" gorm:"not null;index"` // When this revocation record can be deleted
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// IsRevoked checks if a token is in the blacklist
func IsTokenRevoked(db *gorm.DB, tokenHash string) bool {
	var count int64
	db.Model(&TokenRevocation{}).Where("token = ? AND expires_at > ?", tokenHash, time.Now()).Count(&count)
	return count > 0
}
