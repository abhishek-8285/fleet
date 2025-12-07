package models

import (
	"time"

	"gorm.io/gorm"
)

// UploadType represents the type of upload
type UploadType string

const (
	UploadTypeFuelReceipt    UploadType = "FUEL_RECEIPT"
	UploadTypePOD            UploadType = "POD" // Proof of Delivery
	UploadTypeSignature      UploadType = "SIGNATURE"
	UploadTypeVehiclePhoto   UploadType = "VEHICLE_PHOTO"
	UploadTypeDriverDocument UploadType = "DRIVER_DOCUMENT"
	UploadTypeCompliance     UploadType = "COMPLIANCE"
	UploadTypeIncident       UploadType = "INCIDENT"
	UploadTypeOther          UploadType = "OTHER"
)

// UploadStatus represents the processing status of an upload
type UploadStatus string

const (
	UploadStatusPending    UploadStatus = "PENDING"
	UploadStatusProcessing UploadStatus = "PROCESSING"
	UploadStatusProcessed  UploadStatus = "PROCESSED"
	UploadStatusFailed     UploadStatus = "FAILED"
	UploadStatusRejected   UploadStatus = "REJECTED"
)

// Upload represents a file upload in the system
type Upload struct {
	ID           uint         `json:"id" gorm:"primaryKey"`
	FileName     string       `json:"file_name" gorm:"not null"`
	OriginalName string       `json:"original_name" gorm:"not null"`
	ContentType  string       `json:"content_type" gorm:"not null"`
	FileSize     int64        `json:"file_size" gorm:"not null"`
	FilePath     string       `json:"file_path" gorm:"not null"`
	PublicURL    string       `json:"public_url,omitempty"`
	UploadType   UploadType   `json:"upload_type" gorm:"type:varchar(30);not null"`
	Status       UploadStatus `json:"status" gorm:"type:varchar(20);default:'PENDING'"`

	// File metadata
	FileHash     string `json:"file_hash,omitempty"` // SHA256 hash for duplicate detection
	ThumbnailURL string `json:"thumbnail_url,omitempty"`

	// Processing information
	ProcessedAt    *time.Time `json:"processed_at,omitempty"`
	ProcessingLogs string     `json:"processing_logs,omitempty"`
	ErrorMessage   string     `json:"error_message,omitempty"`

	// OCR/Analysis results (for receipts, documents)
	ExtractedText  string   `json:"extracted_text,omitempty"`
	AnalysisResult string   `json:"analysis_result,omitempty"` // JSON blob
	Confidence     *float64 `json:"confidence,omitempty" gorm:"type:decimal(5,2)"`

	// Verification
	IsVerified        bool       `json:"is_verified" gorm:"default:false"`
	VerifiedBy        *uint      `json:"verified_by,omitempty" gorm:"index"`
	VerifiedAt        *time.Time `json:"verified_at,omitempty"`
	VerificationNotes string     `json:"verification_notes,omitempty"`

	// Metadata
	Description string `json:"description,omitempty"`
	Tags        string `json:"tags,omitempty"` // Comma-separated tags

	// Audit fields
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Foreign keys - nullable to support various entity associations
	TripID      *uint `json:"trip_id,omitempty" gorm:"index"`
	VehicleID   *uint `json:"vehicle_id,omitempty" gorm:"index"`
	DriverID    *uint `json:"driver_id,omitempty" gorm:"index"`
	FuelEventID *uint `json:"fuel_event_id,omitempty" gorm:"index"`
	UploadedBy  uint  `json:"uploaded_by" gorm:"not null;index"`

	// Associations
	Trip           *Trip        `json:"trip,omitempty" gorm:"foreignKey:TripID"`
	Vehicle        *Vehicle     `json:"vehicle,omitempty" gorm:"foreignKey:VehicleID"`
	Driver         *Driver      `json:"driver,omitempty" gorm:"foreignKey:DriverID"`
	FuelEvent      *FuelEvent   `json:"fuel_event,omitempty" gorm:"foreignKey:FuelEventID"`
	UploadedByUser *UserAccount `json:"uploaded_by_user,omitempty" gorm:"foreignKey:UploadedBy"`
	VerifiedByUser *UserAccount `json:"verified_by_user,omitempty" gorm:"foreignKey:VerifiedBy"`
}

// PODData represents Proof of Delivery specific data
type PODData struct {
	CustomerName      string    `json:"customer_name"`
	CustomerSignature string    `json:"customer_signature"` // Base64 encoded signature
	DeliveryPhotos    []string  `json:"delivery_photos"`    // Array of photo URLs
	DeliveryNotes     string    `json:"delivery_notes,omitempty"`
	DeliveredAt       time.Time `json:"delivered_at"`
	ReceiverName      string    `json:"receiver_name,omitempty"`
	ReceiverPhone     string    `json:"receiver_phone,omitempty"`
	GPS               struct {
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
		Accuracy  float64 `json:"accuracy"`
	} `json:"gps,omitempty"`
}

// FuelReceiptData represents extracted data from fuel receipts
type FuelReceiptData struct {
	StationName   string  `json:"station_name,omitempty"`
	StationBrand  string  `json:"station_brand,omitempty"`
	ReceiptNumber string  `json:"receipt_number,omitempty"`
	Date          string  `json:"date,omitempty"`
	Time          string  `json:"time,omitempty"`
	FuelType      string  `json:"fuel_type,omitempty"`
	Quantity      float64 `json:"quantity,omitempty"`
	PricePerLiter float64 `json:"price_per_liter,omitempty"`
	TotalAmount   float64 `json:"total_amount,omitempty"`
	PaymentMethod string  `json:"payment_method,omitempty"`
	VehicleNumber string  `json:"vehicle_number,omitempty"`
	Confidence    float64 `json:"confidence,omitempty"`
}

// IsImage checks if the upload is an image file
func (u *Upload) IsImage() bool {
	return u.ContentType == "image/jpeg" ||
		u.ContentType == "image/png" ||
		u.ContentType == "image/gif" ||
		u.ContentType == "image/webp"
}

// IsPDF checks if the upload is a PDF file
func (u *Upload) IsPDF() bool {
	return u.ContentType == "application/pdf"
}

// IsDocument checks if the upload is a document
func (u *Upload) IsDocument() bool {
	return u.IsPDF() ||
		u.ContentType == "application/msword" ||
		u.ContentType == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}

// IsProcessed checks if the upload has been processed
func (u *Upload) IsProcessed() bool {
	return u.Status == UploadStatusProcessed
}

// IsFailed checks if the upload processing failed
func (u *Upload) IsFailed() bool {
	return u.Status == UploadStatusFailed
}

// IsRejected checks if the upload was rejected
func (u *Upload) IsRejected() bool {
	return u.Status == UploadStatusRejected
}

// MarkAsProcessed marks the upload as processed
func (u *Upload) MarkAsProcessed(logs string) {
	u.Status = UploadStatusProcessed
	now := time.Now()
	u.ProcessedAt = &now
	u.ProcessingLogs = logs
}

// MarkAsFailed marks the upload as failed
func (u *Upload) MarkAsFailed(errorMsg string) {
	u.Status = UploadStatusFailed
	now := time.Now()
	u.ProcessedAt = &now
	u.ErrorMessage = errorMsg
}

// MarkAsRejected marks the upload as rejected
func (u *Upload) MarkAsRejected(reason string) {
	u.Status = UploadStatusRejected
	u.ErrorMessage = reason
}

// Verify verifies the upload
func (u *Upload) Verify(verifiedBy uint, notes string) {
	u.IsVerified = true
	u.VerifiedBy = &verifiedBy
	now := time.Now()
	u.VerifiedAt = &now
	u.VerificationNotes = notes
}

// GetFileExtension returns the file extension
func (u *Upload) GetFileExtension() string {
	if len(u.FileName) == 0 {
		return ""
	}

	for i := len(u.FileName) - 1; i >= 0; i-- {
		if u.FileName[i] == '.' {
			return u.FileName[i:]
		}
	}
	return ""
}

// GetSizeInMB returns the file size in megabytes
func (u *Upload) GetSizeInMB() float64 {
	return float64(u.FileSize) / (1024 * 1024)
}

// RequiresProcessing checks if the upload requires processing
func (u *Upload) RequiresProcessing() bool {
	return u.UploadType == UploadTypeFuelReceipt && (u.IsImage() || u.IsPDF())
}

// CanBeVerified checks if the upload can be verified
func (u *Upload) CanBeVerified() bool {
	return u.IsProcessed() && !u.IsVerified
}
