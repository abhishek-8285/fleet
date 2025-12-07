package models

import (
	"time"

	"gorm.io/gorm"
)

// MaintenanceTask represents a standard maintenance activity
type MaintenanceTask struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"uniqueIndex;not null"` // e.g., "Oil Change", "Tire Rotation"
	Description string         `json:"description"`
	Category    string         `json:"category"` // "PREVENTIVE", "REPAIR", "INSPECTION"
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// ServiceSchedule defines when a task should be performed for a vehicle
type ServiceSchedule struct {
	ID                uint           `json:"id" gorm:"primaryKey"`
	VehicleID         uint           `json:"vehicle_id" gorm:"index"`
	MaintenanceTaskID uint           `json:"maintenance_task_id" gorm:"index"`
	IntervalMileage   int            `json:"interval_mileage"` // e.g., every 10,000 km
	IntervalMonths    int            `json:"interval_months"`  // e.g., every 6 months
	LastPerformedAt   *time.Time     `json:"last_performed_at"`
	LastMileage       int            `json:"last_mileage"`
	NextDueDate       *time.Time     `json:"next_due_date"`
	NextDueMileage    int            `json:"next_due_mileage"`
	Status            string         `json:"status" gorm:"default:'ACTIVE'"` // ACTIVE, INACTIVE
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `json:"-" gorm:"index"`

	Vehicle         Vehicle         `json:"vehicle" gorm:"foreignKey:VehicleID"`
	MaintenanceTask MaintenanceTask `json:"maintenance_task" gorm:"foreignKey:MaintenanceTaskID"`
}

// WorkOrder represents a maintenance job
type WorkOrder struct {
	ID                uint           `json:"id" gorm:"primaryKey"`
	VehicleID         uint           `json:"vehicle_id" gorm:"index"`
	MaintenanceTaskID *uint          `json:"maintenance_task_id" gorm:"index"` // Optional, can be ad-hoc
	Description       string         `json:"description"`
	Status            string         `json:"status" gorm:"default:'OPEN'"` // OPEN, IN_PROGRESS, COMPLETED, CANCELLED
	Priority          string         `json:"priority" gorm:"default:'MEDIUM'"`
	AssignedTo        string         `json:"assigned_to"` // Mechanic name or ID
	ScheduledDate     *time.Time     `json:"scheduled_date"`
	CompletedDate     *time.Time     `json:"completed_date"`
	CostParts         float64        `json:"cost_parts" gorm:"type:decimal(10,2)"`
	CostLabor         float64        `json:"cost_labor" gorm:"type:decimal(10,2)"`
	TotalCost         float64        `json:"total_cost" gorm:"type:decimal(10,2)"`
	Notes             string         `json:"notes"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `json:"-" gorm:"index"`

	Vehicle         Vehicle          `json:"vehicle" gorm:"foreignKey:VehicleID"`
	MaintenanceTask *MaintenanceTask `json:"maintenance_task,omitempty" gorm:"foreignKey:MaintenanceTaskID"`
}

// DVIR represents a Driver Vehicle Inspection Report
type DVIR struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	VehicleID    uint           `json:"vehicle_id" gorm:"index"`
	DriverID     uint           `json:"driver_id" gorm:"index"`
	Type         string         `json:"type"` // PRE_TRIP, POST_TRIP
	Odometer     int            `json:"odometer"`
	Location     string         `json:"location"`
	Status       string         `json:"status"` // SAFE, UNSAFE, REPAIRS_NEEDED
	Defects      string         `json:"defects" gorm:"type:jsonb"` // JSON array of defects found
	MechanicSign string         `json:"mechanic_sign"`             // Name of mechanic who reviewed
	DriverSign   string         `json:"driver_sign"`               // Digital signature/name
	SignedAt     time.Time      `json:"signed_at"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`

	Vehicle Vehicle `json:"vehicle" gorm:"foreignKey:VehicleID"`
	Driver  Driver  `json:"driver" gorm:"foreignKey:DriverID"`
}

// IsDue checks if the service schedule is due based on current mileage and time
func (s *ServiceSchedule) IsDue(currentMileage int) bool {
	if s.Status != "ACTIVE" {
		return false
	}

	mileageDue := s.NextDueMileage > 0 && currentMileage >= s.NextDueMileage
	timeDue := s.NextDueDate != nil && time.Now().After(*s.NextDueDate)

	return mileageDue || timeDue
}
