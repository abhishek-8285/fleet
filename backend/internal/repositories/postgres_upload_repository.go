package repositories

import (
	"github.com/fleetflow/backend/internal/models"
	"gorm.io/gorm"
)

// PostgresUploadRepository implements UploadRepository using GORM
type PostgresUploadRepository struct {
	db *gorm.DB
}

// NewPostgresUploadRepository creates a new instance
func NewPostgresUploadRepository(db *gorm.DB) *PostgresUploadRepository {
	return &PostgresUploadRepository{
		db: db,
	}
}

// Ensure PostgresUploadRepository implements UploadRepository
var _ UploadRepository = &PostgresUploadRepository{}

func (r *PostgresUploadRepository) CountUploads(filters map[string]interface{}) (int64, error) {
	var count int64
	query := r.db.Model(&models.Upload{})

	for key, value := range filters {
		switch key {
		case "trip_id":
			query = query.Where("trip_id = ?", value)
		case "upload_type_in":
			if types, ok := value.([]string); ok {
				query = query.Where("upload_type IN ?", types)
			}
		}
	}

	if err := query.Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}
