package repositories

import (
	"fmt"
	"time"

	"github.com/fleetflow/backend/internal/models"
	"gorm.io/gorm"
)

// PostgresDriverRepository implements DriverRepository using GORM
type PostgresDriverRepository struct {
	db *gorm.DB
}

// NewPostgresDriverRepository creates a new instance
func NewPostgresDriverRepository(db *gorm.DB) *PostgresDriverRepository {
	return &PostgresDriverRepository{
		db: db,
	}
}

// Ensure PostgresDriverRepository implements DriverRepository
var _ DriverRepository = &PostgresDriverRepository{}

func (r *PostgresDriverRepository) CreateDriver(driver *models.Driver) error {
	return r.db.Create(driver).Error
}

func (r *PostgresDriverRepository) GetDriverByPhone(phone string) (*models.Driver, error) {
	var driver models.Driver
	if err := r.db.Where("phone = ?", phone).First(&driver).Error; err != nil {
		return nil, err
	}
	return &driver, nil
}

func (r *PostgresDriverRepository) GetDriverByID(id uint) (*models.Driver, error) {
	var driver models.Driver
	if err := r.db.Where("id = ?", id).First(&driver).Error; err != nil {
		return nil, err
	}
	return &driver, nil
}

func (r *PostgresDriverRepository) GetDrivers(page, limit int, filters map[string]interface{}) ([]models.Driver, int64, error) {
	var drivers []models.Driver
	var total int64
	query := r.db.Model(&models.Driver{})

	for key, value := range filters {
		switch key {
		case "status":
			query = query.Where("status = ?", value)
		case "is_active":
			query = query.Where("is_active = ?", value)
		case "search":
			searchTerm := fmt.Sprintf("%%%s%%", value)
			query = query.Where("name ILIKE ? OR phone ILIKE ? OR license_number ILIKE ?", searchTerm, searchTerm, searchTerm)
		case "license_expiring":
			if val, ok := value.(bool); ok && val {
				query = query.Where("license_expiry <= ?", time.Now().AddDate(0, 0, 30))
			}
		}
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	if err := query.Order("name ASC").Offset(offset).Limit(limit).Find(&drivers).Error; err != nil {
		return nil, 0, err
	}

	return drivers, total, nil
}

func (r *PostgresDriverRepository) UpdateDriver(driver *models.Driver) error {
	return r.db.Save(driver).Error
}

func (r *PostgresDriverRepository) DeleteDriver(id uint) error {
	return r.db.Delete(&models.Driver{}, id).Error
}

func (r *PostgresDriverRepository) UpdateDriverStatus(id uint, status string) error {
	return r.db.Model(&models.Driver{}).Where("id = ?", id).Update("status", status).Error
}

func (r *PostgresDriverRepository) GetDriversByStatus(status string, isActive bool) ([]models.Driver, error) {
	var drivers []models.Driver
	if err := r.db.Where("status = ? AND is_active = ?", status, isActive).Find(&drivers).Error; err != nil {
		return nil, err
	}
	return drivers, nil
}

func (r *PostgresDriverRepository) CountDrivers(filters map[string]interface{}) (int64, error) {
	var count int64
	query := r.db.Model(&models.Driver{})

	for key, value := range filters {
		switch key {
		case "is_active": // Example usage
			query = query.Where("is_active = ?", value)
		case "status":
			query = query.Where("status = ?", value)
		}
	}

	if err := query.Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}
