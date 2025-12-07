package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/fleetflow/backend/internal/models"
	"gorm.io/gorm"
)

// MaintenanceService handles maintenance and DVIR operations
type MaintenanceService struct {
	db *gorm.DB
}

// NewMaintenanceService creates a new maintenance service
func NewMaintenanceService(db *gorm.DB) *MaintenanceService {
	return &MaintenanceService{
		db: db,
	}
}

// SubmitDVIR processes a driver vehicle inspection report
func (s *MaintenanceService) SubmitDVIR(ctx context.Context, dvir *models.DVIR) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		// 1. Save the DVIR
		if err := tx.Create(dvir).Error; err != nil {
			return err
		}

		// 2. Check for defects
		var defects []string
		if err := json.Unmarshal([]byte(dvir.Defects), &defects); err != nil {
			return fmt.Errorf("failed to parse defects: %w", err)
		}

		// 3. If defects found, create Work Order and update Vehicle Status
		if len(defects) > 0 {
			// Update Vehicle Status
			if dvir.Status == "UNSAFE" {
				if err := tx.Model(&models.Vehicle{}).Where("id = ?", dvir.VehicleID).
					Update("status", models.VehicleStatusMaintenance).Error; err != nil {
					return err
				}
			}

			// Create Work Order
			workOrder := models.WorkOrder{
				VehicleID:   dvir.VehicleID,
				Description: fmt.Sprintf("Defects reported in DVIR #%d: %v", dvir.ID, defects),
				Status:      "OPEN",
				Priority:    "HIGH",
				CreatedAt:   time.Now(),
			}
			if err := tx.Create(&workOrder).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

// CheckMaintenanceDue checks all vehicles for due maintenance
func (s *MaintenanceService) CheckMaintenanceDue(ctx context.Context) ([]models.ServiceSchedule, error) {
	var dueSchedules []models.ServiceSchedule
	var vehicles []models.Vehicle

	// Get all active vehicles
	if err := s.db.Where("is_active = ?", true).Find(&vehicles).Error; err != nil {
		return nil, err
	}

	for _, vehicle := range vehicles {
		var schedules []models.ServiceSchedule
		if err := s.db.Where("vehicle_id = ? AND status = ?", vehicle.ID, "ACTIVE").
			Preload("MaintenanceTask").Find(&schedules).Error; err != nil {
			continue
		}

		for _, schedule := range schedules {
			// Check mileage
			mileageDue := schedule.NextDueMileage > 0 && int(vehicle.TotalKilometers) >= schedule.NextDueMileage
			
			// Check time
			timeDue := schedule.NextDueDate != nil && time.Now().After(*schedule.NextDueDate)

			if mileageDue || timeDue {
				dueSchedules = append(dueSchedules, schedule)
				
				// Create alert (placeholder logic)
				// In real system, this would trigger a notification
				fmt.Printf("Maintenance Due: Vehicle %s needs %s\n", vehicle.LicensePlate, schedule.MaintenanceTask.Name)
			}
		}
	}

	return dueSchedules, nil
}

// CreateWorkOrder creates a new work order
func (s *MaintenanceService) CreateWorkOrder(ctx context.Context, workOrder *models.WorkOrder) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(workOrder).Error; err != nil {
			return err
		}

		// Update vehicle status to MAINTENANCE
		return tx.Model(&models.Vehicle{}).Where("id = ?", workOrder.VehicleID).
			Update("status", models.VehicleStatusMaintenance).Error
	})
}

// ResolveWorkOrder completes a work order
func (s *MaintenanceService) ResolveWorkOrder(ctx context.Context, workOrderID uint, notes string, costParts, costLabor float64) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		var workOrder models.WorkOrder
		if err := tx.First(&workOrder, workOrderID).Error; err != nil {
			return err
		}

		now := time.Now()
		workOrder.Status = "COMPLETED"
		workOrder.CompletedDate = &now
		workOrder.Notes = notes
		workOrder.CostParts = costParts
		workOrder.CostLabor = costLabor
		workOrder.TotalCost = costParts + costLabor

		if err := tx.Save(&workOrder).Error; err != nil {
			return err
		}

		// Check if there are other open work orders for this vehicle
		var count int64
		tx.Model(&models.WorkOrder{}).Where("vehicle_id = ? AND status IN ?", workOrder.VehicleID, []string{"OPEN", "IN_PROGRESS"}).Count(&count)

		// If no other open work orders, set vehicle status back to ACTIVE
		if count == 0 {
			if err := tx.Model(&models.Vehicle{}).Where("id = ?", workOrder.VehicleID).
				Update("status", models.VehicleStatusActive).Error; err != nil {
				return err
			}
		}

		// Update Service Schedule if linked
		if workOrder.MaintenanceTaskID != nil {
			var schedule models.ServiceSchedule
			if err := tx.Where("vehicle_id = ? AND maintenance_task_id = ?", workOrder.VehicleID, *workOrder.MaintenanceTaskID).
				First(&schedule).Error; err == nil {
				
				// Update schedule
				schedule.LastPerformedAt = &now
				
				// Get current vehicle mileage
				var vehicle models.Vehicle
				tx.First(&vehicle, workOrder.VehicleID)
				schedule.LastMileage = int(vehicle.TotalKilometers)
				
				// Calculate next due
				if schedule.IntervalMileage > 0 {
					schedule.NextDueMileage = schedule.LastMileage + schedule.IntervalMileage
				}
				if schedule.IntervalMonths > 0 {
					nextDate := now.AddDate(0, schedule.IntervalMonths, 0)
					schedule.NextDueDate = &nextDate
				}
				
				tx.Save(&schedule)
			}
		}

		return nil
	})
}
