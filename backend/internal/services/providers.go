package services

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/fleetflow/backend/internal/config"
)

// SMS Providers

// SMSProvider interface for SMS services
type SMSProvider interface {
	SendSMS(to, message string) error
	Health() error
}

// DevSMSService implements SMS service for development
type DevSMSService struct{}

func NewDevSMSService() *DevSMSService {
	return &DevSMSService{}
}

func (s *DevSMSService) SendSMS(to, message string) error {
	log.Printf("📱 [DEV SMS] To: %s, Message: %s", to, message)
	return nil
}

func (s *DevSMSService) Health() error {
	return nil
}

// TwilioSMSService implements SMS service using Twilio
type TwilioSMSService struct {
	accountSID string
	authToken  string
	fromNumber string
}

func NewTwilioSMSService(cfg *config.Config) *TwilioSMSService {
	return &TwilioSMSService{
		accountSID: cfg.TwilioAccountSID,
		authToken:  cfg.TwilioAuthToken,
		fromNumber: cfg.TwilioFromNumber,
	}
}

func (s *TwilioSMSService) SendSMS(to, message string) error {
	// Implementation would use Twilio API
	log.Printf("📱 [TWILIO] Sending SMS to %s: %s", to, message)
	return nil
}

func (s *TwilioSMSService) Health() error {
	return nil
}

// Storage Providers

// StorageProvider interface for storage services
type StorageProvider interface {
	UploadFile(key string, data []byte, contentType string) (string, error)
	DownloadFile(key string) ([]byte, error)
	DeleteFile(key string) error
	GetFileURL(key string) (string, error)
	Health() error
}

// LocalStorageService implements storage service for local files
type LocalStorageService struct {
	basePath string
}

func NewLocalStorageService(cfg *config.Config) *LocalStorageService {
	basePath := cfg.LocalStoragePath
	if basePath == "" {
		basePath = "./uploads"
	}

	// Create directory if it doesn't exist
	os.MkdirAll(basePath, 0755)

	return &LocalStorageService{
		basePath: basePath,
	}
}

func (s *LocalStorageService) UploadFile(key string, data []byte, contentType string) (string, error) {
	filePath := filepath.Join(s.basePath, key)

	// Create directory if needed
	dir := filepath.Dir(filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}

	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return "", err
	}

	return fmt.Sprintf("/uploads/%s", key), nil
}

func (s *LocalStorageService) DownloadFile(key string) ([]byte, error) {
	filePath := filepath.Join(s.basePath, key)
	return os.ReadFile(filePath)
}

func (s *LocalStorageService) DeleteFile(key string) error {
	filePath := filepath.Join(s.basePath, key)
	return os.Remove(filePath)
}

func (s *LocalStorageService) GetFileURL(key string) (string, error) {
	return fmt.Sprintf("/uploads/%s", key), nil
}

func (s *LocalStorageService) Health() error {
	return nil
}

// S3StorageService implements storage service using AWS S3
type S3StorageService struct {
	bucket    string
	region    string
	accessKey string
	secretKey string
}

func NewS3StorageService(cfg *config.Config) *S3StorageService {
	return &S3StorageService{
		bucket:    cfg.S3Bucket,
		region:    cfg.S3Region,
		accessKey: cfg.S3AccessKey,
		secretKey: cfg.S3SecretKey,
	}
}

func (s *S3StorageService) UploadFile(key string, data []byte, contentType string) (string, error) {
	// Implementation would use AWS S3 SDK
	log.Printf("☁️ [S3] Uploading file: %s", key)
	return fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", s.bucket, s.region, key), nil
}

func (s *S3StorageService) DownloadFile(key string) ([]byte, error) {
	// Implementation would use AWS S3 SDK
	log.Printf("☁️ [S3] Downloading file: %s", key)
	return nil, nil
}

func (s *S3StorageService) DeleteFile(key string) error {
	// Implementation would use AWS S3 SDK
	log.Printf("☁️ [S3] Deleting file: %s", key)
	return nil
}

func (s *S3StorageService) GetFileURL(key string) (string, error) {
	return fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", s.bucket, s.region, key), nil
}

func (s *S3StorageService) Health() error {
	return nil
}
