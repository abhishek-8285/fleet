package models

import (
	"time"

	"gorm.io/gorm"
)

// CameraStatus represents the health status of a camera
type CameraStatus string

const (
	CameraStatusOnline      CameraStatus = "ONLINE"
	CameraStatusOffline     CameraStatus = "OFFLINE"
	CameraStatusMalfunction CameraStatus = "MALFUNCTION"
)

// Camera represents a dashcam or site camera
type Camera struct {
	ID            uint           `json:"id" gorm:"primaryKey"`
	VehicleID     *uint          `json:"vehicle_id" gorm:"index"` // Nullable if site camera
	YardID        *uint          `json:"yard_id" gorm:"index"`    // Nullable if vehicle camera
	SerialNumber  string         `json:"serial_number" gorm:"uniqueIndex;not null"`
	Model         string         `json:"model"`
	Status        CameraStatus   `json:"status" gorm:"default:'OFFLINE'"`
	LastHeartbeat time.Time      `json:"last_heartbeat"`
	FirmwareVer   string         `json:"firmware_ver"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`

	Vehicle *Vehicle `json:"vehicle,omitempty" gorm:"foreignKey:VehicleID"`
	Yard    *Yard    `json:"yard,omitempty" gorm:"foreignKey:YardID"`
}

// VideoEventType represents the trigger for the video
type VideoEventType string

const (
	VideoEventHarshBraking VideoEventType = "HARSH_BRAKING"
	VideoEventImpact       VideoEventType = "IMPACT"
	VideoEventSpeeding     VideoEventType = "SPEEDING"
	VideoEventManual       VideoEventType = "MANUAL"
	VideoEventDistraction  VideoEventType = "DISTRACTION" // AI Detected
	VideoEventDrowsiness   VideoEventType = "DROWSINESS"  // AI Detected
)

// VideoClip represents a recorded video segment
type VideoClip struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	CameraID     uint           `json:"camera_id" gorm:"index;not null"`
	VehicleID    *uint          `json:"vehicle_id" gorm:"index"`
	DriverID     *uint          `json:"driver_id" gorm:"index"`
	EventType    VideoEventType `json:"event_type" gorm:"index"`
	StartTime    time.Time      `json:"start_time"`
	EndTime      time.Time      `json:"end_time"`
	DurationSec  int            `json:"duration_sec"`
	StorageURL   string         `json:"storage_url"` // S3 URL
	ThumbnailURL string         `json:"thumbnail_url"`
	IsViewed     bool           `json:"is_viewed" gorm:"default:false"`
	IsStarred    bool           `json:"is_starred" gorm:"default:false"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`

	Camera  Camera   `json:"camera" gorm:"foreignKey:CameraID"`
	Vehicle *Vehicle `json:"vehicle,omitempty" gorm:"foreignKey:VehicleID"`
	Driver  *Driver  `json:"driver,omitempty" gorm:"foreignKey:DriverID"`
}

// AIDetection represents objects or behaviors detected in a video
type AIDetection struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	VideoClipID uint      `json:"video_clip_id" gorm:"index;not null"`
	Label       string    `json:"label"` // e.g., "cell_phone", "stop_sign", "pedestrian"
	Confidence  float64   `json:"confidence"`
	Timestamp   time.Time `json:"timestamp"`              // Exact time within the clip
	BoundingBox string    `json:"bounding_box,omitempty"` // JSON string of coordinates
	CreatedAt   time.Time `json:"created_at"`

	VideoClip VideoClip `json:"video_clip" gorm:"foreignKey:VideoClipID"`
}
