package repositories

import (
	"time"

	"github.com/fleetflow/backend/internal/models"
	"gorm.io/gorm"
)

// PostgresAuthRepository implements AuthRepository using GORM
type PostgresAuthRepository struct {
	db *gorm.DB
}

// NewPostgresAuthRepository creates a new instance
func NewPostgresAuthRepository(db *gorm.DB) *PostgresAuthRepository {
	return &PostgresAuthRepository{
		db: db,
	}
}

// Ensure PostgresAuthRepository implements AuthRepository
var _ AuthRepository = &PostgresAuthRepository{}

// --- OTP Operations ---

func (r *PostgresAuthRepository) DeleteOldOTPs(phone string) error {
	return r.db.Where("phone = ? AND created_at < ?", phone, time.Now().Add(-time.Hour)).Delete(&models.OTPVerification{}).Error
}

func (r *PostgresAuthRepository) GetRecentOTP(phone string) (*models.OTPVerification, error) {
	var otp models.OTPVerification
	err := r.db.Where("phone = ? AND created_at > ?", phone, time.Now().Add(-time.Minute)).First(&otp).Error
	if err != nil {
		return nil, err
	}
	return &otp, nil
}

func (r *PostgresAuthRepository) CreateOTP(otp *models.OTPVerification) error {
	return r.db.Create(otp).Error
}

func (r *PostgresAuthRepository) GetOTPForVerification(phone, otp string) (*models.OTPVerification, error) {
	var otpVerification models.OTPVerification
	if err := r.db.Where("phone = ? AND otp = ? AND verified = false", phone, otp).First(&otpVerification).Error; err != nil {
		return nil, err
	}
	return &otpVerification, nil
}

func (r *PostgresAuthRepository) UpdateOTP(otp *models.OTPVerification) error {
	return r.db.Save(otp).Error
}

// --- User Operations ---

func (r *PostgresAuthRepository) GetUserByPhone(phone string) (*models.UserAccount, error) {
	var user models.UserAccount
	if err := r.db.Where("phone = ?", phone).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *PostgresAuthRepository) CreateUser(user *models.UserAccount) error {
	return r.db.Create(user).Error
}

func (r *PostgresAuthRepository) UpdateUser(user *models.UserAccount) error {
	return r.db.Save(user).Error
}

func (r *PostgresAuthRepository) GetUserByID(id uint) (*models.UserAccount, error) {
	var user models.UserAccount
	if err := r.db.Preload("Driver").First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *PostgresAuthRepository) UpdateUserFields(userID uint, updates map[string]interface{}) error {
	return r.db.Model(&models.UserAccount{}).Where("id = ?", userID).Updates(updates).Error
}
