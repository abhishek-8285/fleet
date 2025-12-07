package services

import (
	"fmt"
	"time"

	"github.com/fleetflow/backend/internal/models"
	"gorm.io/gorm"
)

// VideoService handles video pipeline and AI events
type VideoService struct {
	db *gorm.DB
}

// NewVideoService creates a new video service
func NewVideoService(db *gorm.DB) *VideoService {
	return &VideoService{
		db: db,
	}
}

// RegisterCamera adds a new camera to the system
func (s *VideoService) RegisterCamera(camera *models.Camera) error {
	return s.db.Create(camera).Error
}

// CreateVideoClip records a new video clip metadata
func (s *VideoService) CreateVideoClip(clip *models.VideoClip) error {
	return s.db.Create(clip).Error
}

// GetCameraBySerial finds a camera by serial number
func (s *VideoService) GetCameraBySerial(serial string) (*models.Camera, error) {
	var camera models.Camera
	err := s.db.Where("serial_number = ?", serial).First(&camera).Error
	return &camera, err
}

// ProcessAIEvent handles incoming AI detections from the camera
func (s *VideoService) ProcessAIEvent(cameraSerial string, eventType models.VideoEventType, timestamp time.Time, detections []models.AIDetection) error {
	camera, err := s.GetCameraBySerial(cameraSerial)
	if err != nil {
		return fmt.Errorf("camera not found: %w", err)
	}

	// Create a clip record
	clip := &models.VideoClip{
		CameraID:    camera.ID,
		VehicleID:   camera.VehicleID,
		EventType:   eventType,
		StartTime:   timestamp.Add(-10 * time.Second), // 10s buffer before
		EndTime:     timestamp.Add(10 * time.Second),  // 10s buffer after
		DurationSec: 20,
		IsViewed:    false,
		CreatedAt:   time.Now(),
		// StorageURL would be generated here or passed in
		StorageURL: fmt.Sprintf("https://storage.fleetflow.io/clips/%s/%d.mp4", cameraSerial, timestamp.Unix()),
	}

	if err := s.db.Create(clip).Error; err != nil {
		return fmt.Errorf("failed to create clip: %w", err)
	}

	// Save detections
	for _, d := range detections {
		d.VideoClipID = clip.ID
		if err := s.db.Create(&d).Error; err != nil {
			return fmt.Errorf("failed to save detection: %w", err)
		}
	}

	return nil
}

// GetClips returns a list of video clips with filters
func (s *VideoService) GetClips(vehicleID uint, eventType string) ([]models.VideoClip, error) {
	var clips []models.VideoClip
	query := s.db.Preload("Camera").Preload("Vehicle")

	if vehicleID != 0 {
		query = query.Where("vehicle_id = ?", vehicleID)
	}
	if eventType != "" {
		query = query.Where("event_type = ?", eventType)
	}

	err := query.Order("created_at desc").Limit(50).Find(&clips).Error
	return clips, err
}
