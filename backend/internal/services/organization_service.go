package services

import (
	"github.com/fleetflow/backend/internal/models"
	"gorm.io/gorm"
)

type OrganizationService struct {
	db *gorm.DB
}

func NewOrganizationService(db *gorm.DB) *OrganizationService {
	return &OrganizationService{db: db}
}

// CreateOrganization creates a new organization and an initial admin user
func (s *OrganizationService) CreateOrganization(org *models.Organization, adminUser *models.UserAccount) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		// 1. Create Organization
		if err := tx.Create(org).Error; err != nil {
			return err
		}

		// 2. Create Default Fleet
		defaultFleet := models.Fleet{
			Name:           "Default Fleet",
			OrganizationID: org.ID,
		}
		if err := tx.Create(&defaultFleet).Error; err != nil {
			return err
		}

		// 3. Create Admin User linked to Org
		adminUser.OrganizationID = &org.ID
		adminUser.Role = models.RoleOrgAdmin
		if err := tx.Create(adminUser).Error; err != nil {
			return err
		}

		return nil
	})
}

// GetOrganizationByID retrieves an organization by ID
func (s *OrganizationService) GetOrganizationByID(id uint) (*models.Organization, error) {
	var org models.Organization
	if err := s.db.Preload("Fleets").First(&org, id).Error; err != nil {
		return nil, err
	}
	return &org, nil
}

// UpdateOrganization updates organization details
func (s *OrganizationService) UpdateOrganization(org *models.Organization) error {
	return s.db.Save(org).Error
}

// CreateFleet adds a new fleet to an organization
func (s *OrganizationService) CreateFleet(fleet *models.Fleet) error {
	return s.db.Create(fleet).Error
}

// GetFleetsByOrgID retrieves all fleets for an organization
func (s *OrganizationService) GetFleetsByOrgID(orgID uint) ([]models.Fleet, error) {
	var fleets []models.Fleet
	if err := s.db.Where("organization_id = ?", orgID).Find(&fleets).Error; err != nil {
		return nil, err
	}
	return fleets, nil
}
