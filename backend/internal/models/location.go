package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"gorm.io/gorm"
)

// Geofence related types
type GeofenceType string
type GeofenceShapeType string
type GeofenceAlertType string

const (
	GeofenceTypeInclusion      GeofenceType = "INCLUSION"
	GeofenceTypeExclusion      GeofenceType = "EXCLUSION"
	GeofenceTypeTimeRestricted GeofenceType = "TIME_RESTRICTED"

	GeofenceShapeTypeCircle    GeofenceShapeType = "CIRCLE"
	GeofenceShapeTypePolygon   GeofenceShapeType = "POLYGON"
	GeofenceShapeTypeRectangle GeofenceShapeType = "RECTANGLE"

	GeofenceAlertTypeEntryViolation GeofenceAlertType = "ENTRY_VIOLATION"
	GeofenceAlertTypeExitViolation  GeofenceAlertType = "EXIT_VIOLATION"
	GeofenceAlertTypeTimeViolation  GeofenceAlertType = "TIME_VIOLATION"
)

// LocationPing represents a GPS location update from a vehicle/driver
type LocationPing struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Latitude  float64        `json:"latitude" gorm:"type:decimal(10,8);not null"`
	Longitude float64        `json:"longitude" gorm:"type:decimal(11,8);not null"`
	Accuracy  float64        `json:"accuracy" gorm:"type:decimal(8,2)"`           // in meters
	Speed     *float64       `json:"speed,omitempty" gorm:"type:decimal(8,2)"`    // km/h
	Heading   *float64       `json:"heading,omitempty" gorm:"type:decimal(6,2)"`  // degrees
	Altitude  *float64       `json:"altitude,omitempty" gorm:"type:decimal(8,2)"` // meters
	Timestamp time.Time      `json:"timestamp" gorm:"not null;index"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Foreign keys
	DriverID  *uint `json:"driver_id,omitempty" gorm:"index"`
	VehicleID *uint `json:"vehicle_id,omitempty" gorm:"index"`
	TripID    *uint `json:"trip_id,omitempty" gorm:"index"`

	// Associations
	Driver  *Driver  `json:"driver,omitempty" gorm:"foreignKey:DriverID"`
	Vehicle *Vehicle `json:"vehicle,omitempty" gorm:"foreignKey:VehicleID"`
	Trip    *Trip    `json:"trip,omitempty" gorm:"foreignKey:TripID"`

	// Additional metadata
	Source       string `json:"source" gorm:"default:'MOBILE'"` // MOBILE, GPS_DEVICE, MANUAL
	BatteryLevel *int   `json:"battery_level,omitempty"`        // Mobile battery percentage
	NetworkType  string `json:"network_type,omitempty"`         // 2G, 3G, 4G, WIFI
}

// GeofenceEvent represents when a vehicle enters/exits a geofence
type GeofenceEvent struct {
	ID         uint           `json:"id" gorm:"primaryKey"`
	GeofenceID uint           `json:"geofence_id" gorm:"not null;index"`
	VehicleID  uint           `json:"vehicle_id" gorm:"not null;index"`
	DriverID   *uint          `json:"driver_id,omitempty" gorm:"index"`
	TripID     *uint          `json:"trip_id,omitempty" gorm:"index"`
	EventType  string         `json:"event_type" gorm:"not null"` // ENTER, EXIT
	Latitude   float64        `json:"latitude" gorm:"type:decimal(10,8);not null"`
	Longitude  float64        `json:"longitude" gorm:"type:decimal(11,8);not null"`
	Timestamp  time.Time      `json:"timestamp" gorm:"not null;index"`
	CreatedAt  time.Time      `json:"created_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`

	// Associations
	Geofence *Geofence `json:"geofence,omitempty" gorm:"foreignKey:GeofenceID"`
	Vehicle  *Vehicle  `json:"vehicle,omitempty" gorm:"foreignKey:VehicleID"`
	Driver   *Driver   `json:"driver,omitempty" gorm:"foreignKey:DriverID"`
	Trip     *Trip     `json:"trip,omitempty" gorm:"foreignKey:TripID"`
}

// Geofence represents a geographic boundary
type Geofence struct {
	ID          uint              `json:"id" gorm:"primaryKey"`
	Name        string            `json:"name" gorm:"not null"`
	Description string            `json:"description,omitempty"`
	Type        GeofenceType      `json:"type" gorm:"not null"`       // INCLUSION, EXCLUSION, TIME_RESTRICTED
	ShapeType   GeofenceShapeType `json:"shape_type" gorm:"not null"` // CIRCLE, POLYGON, RECTANGLE

	// For circular geofences
	CenterLatitude  *float64 `json:"center_latitude,omitempty" gorm:"type:decimal(10,8)"`
	CenterLongitude *float64 `json:"center_longitude,omitempty" gorm:"type:decimal(11,8)"`
	Radius          *float64 `json:"radius,omitempty" gorm:"type:decimal(8,2)"` // in meters

	// For polygon geofences
	// For polygon geofences
	Coordinates Coordinates `json:"coordinates,omitempty" gorm:"type:text"` // Array of lat/lng points

	// Configuration
	IsActive     bool           `json:"is_active" gorm:"default:true"`
	AlertOnEnter bool           `json:"alert_on_enter" gorm:"default:false"`
	AlertOnExit  bool           `json:"alert_on_exit" gorm:"default:false"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`

	// Associations
	Events []GeofenceEvent `json:"events,omitempty" gorm:"foreignKey:GeofenceID"`
}

// Coordinates represents a list of coordinates for a polygon
type Coordinates []float64

// Scan implements the sql.Scanner interface
func (c *Coordinates) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, c)
}

// Value implements the driver.Valuer interface
func (c Coordinates) Value() (driver.Value, error) {
	return json.Marshal(c)
}

// RouteDeviation represents when a vehicle deviates from planned route
type RouteDeviation struct {
	ID                uint           `json:"id" gorm:"primaryKey"`
	TripID            uint           `json:"trip_id" gorm:"not null;index"`
	VehicleID         uint           `json:"vehicle_id" gorm:"not null;index"`
	DriverID          uint           `json:"driver_id" gorm:"not null;index"`
	DeviationDistance float64        `json:"deviation_distance" gorm:"type:decimal(8,2)"` // in meters
	DeviationDuration int            `json:"deviation_duration"`                          // in minutes
	StartLatitude     float64        `json:"start_latitude" gorm:"type:decimal(10,8)"`
	StartLongitude    float64        `json:"start_longitude" gorm:"type:decimal(11,8)"`
	EndLatitude       *float64       `json:"end_latitude,omitempty" gorm:"type:decimal(10,8)"`
	EndLongitude      *float64       `json:"end_longitude,omitempty" gorm:"type:decimal(11,8)"`
	StartTime         time.Time      `json:"start_time" gorm:"not null"`
	EndTime           *time.Time     `json:"end_time,omitempty"`
	Reason            string         `json:"reason,omitempty"` // FUEL_STOP, TRAFFIC, EMERGENCY, UNKNOWN
	IsResolved        bool           `json:"is_resolved" gorm:"default:false"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `json:"-" gorm:"index"`

	// Associations
	Trip    *Trip    `json:"trip,omitempty" gorm:"foreignKey:TripID"`
	Vehicle *Vehicle `json:"vehicle,omitempty" gorm:"foreignKey:VehicleID"`
	Driver  *Driver  `json:"driver,omitempty" gorm:"foreignKey:DriverID"`
}

// CalculateDistance calculates distance between two GPS points using Haversine formula
func CalculateDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadius = 6371 // Earth's radius in kilometers

	// Convert degrees to radians
	lat1Rad := lat1 * 3.14159265359 / 180
	lon1Rad := lon1 * 3.14159265359 / 180
	lat2Rad := lat2 * 3.14159265359 / 180
	lon2Rad := lon2 * 3.14159265359 / 180

	// Haversine formula
	dlat := lat2Rad - lat1Rad
	dlon := lon2Rad - lon1Rad

	a := 0.5 - 0.5*(dlat*dlat+(1-lat1Rad*lat1Rad)*dlon*dlon)
	return earthRadius * 2 * (a * a)
}

// IsInGeofence checks if a point is within a circular geofence
func (g *Geofence) IsInGeofence(latitude, longitude float64) bool {
	if g.Type != "CIRCLE" || g.CenterLatitude == nil || g.CenterLongitude == nil || g.Radius == nil {
		return false
	}

	distance := CalculateDistance(*g.CenterLatitude, *g.CenterLongitude, latitude, longitude) * 1000 // Convert to meters
	return distance <= *g.Radius
}

// GetLastKnownLocation returns the latest location for a vehicle
func GetLastKnownLocation(db *gorm.DB, vehicleID uint) (*LocationPing, error) {
	var location LocationPing
	err := db.Where("vehicle_id = ?", vehicleID).
		Order("timestamp DESC").
		First(&location).Error

	if err != nil {
		return nil, err
	}

	return &location, nil
}

// GetLocationHistory returns location history for a vehicle within a time range
func GetLocationHistory(db *gorm.DB, vehicleID uint, startTime, endTime time.Time) ([]LocationPing, error) {
	var locations []LocationPing
	err := db.Where("vehicle_id = ? AND timestamp BETWEEN ? AND ?", vehicleID, startTime, endTime).
		Order("timestamp ASC").
		Find(&locations).Error

	return locations, err
}

// CalculateSpeed calculates speed between two location points
func (l1 *LocationPing) CalculateSpeed(l2 *LocationPing) float64 {
	if l1.Timestamp.Equal(l2.Timestamp) {
		return 0
	}

	distance := CalculateDistance(l1.Latitude, l1.Longitude, l2.Latitude, l2.Longitude)
	timeDiff := l2.Timestamp.Sub(l1.Timestamp).Hours()

	if timeDiff == 0 {
		return 0
	}

	return distance / timeDiff // km/h
}
