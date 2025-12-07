package models

import "time"

// Analytics and reporting data structures

// DashboardStats represents dashboard statistics
type DashboardStats struct {
	// Fleet overview
	TotalVehicles       int `json:"total_vehicles"`
	ActiveVehicles      int `json:"active_vehicles"`
	ParkedVehicles      int `json:"parked_vehicles"`
	MaintenanceVehicles int `json:"maintenance_vehicles"`
	TotalDrivers        int `json:"total_drivers"`
	AvailableDrivers    int `json:"available_drivers"`
	OnTripDrivers       int `json:"on_trip_drivers"`

	// Today's stats
	ActiveTrips         int     `json:"active_trips"`
	CompletedTripsToday int     `json:"completed_trips_today"`
	TodayRevenue        float64 `json:"today_revenue"`
	TodayFuelCost       float64 `json:"today_fuel_cost"`
	TodayProfit         float64 `json:"today_profit"`
	TodayDistance       float64 `json:"today_distance"`

	// Performance metrics
	FleetEfficiency      float64 `json:"fleet_efficiency"`
	OnTimeDeliveryRate   float64 `json:"on_time_delivery_rate"`
	CustomerSatisfaction float64 `json:"customer_satisfaction"`
	FuelTheftSavings     float64 `json:"fuel_theft_savings"`

	// Alerts summary
	CriticalAlerts     int `json:"critical_alerts"`
	FuelTheftAlerts    int `json:"fuel_theft_alerts"`
	ComplianceWarnings int `json:"compliance_warnings"`
	MaintenanceDue     int `json:"maintenance_due"`

	// Trends
	RevenueTrend    float64   `json:"revenue_trend"`
	EfficiencyTrend float64   `json:"efficiency_trend"`
	CostTrend       float64   `json:"cost_trend"`
	LastUpdated     time.Time `json:"last_updated"`
}

// FleetPerformance represents fleet performance metrics
type FleetPerformance struct {
	Period               string             `json:"period"`
	StartDate            time.Time          `json:"start_date"`
	EndDate              time.Time          `json:"end_date"`
	TotalTrips           int                `json:"total_trips"`
	CompletedTrips       int                `json:"completed_trips"`
	CancelledTrips       int                `json:"cancelled_trips"`
	TotalDistance        float64            `json:"total_distance"`
	TotalRevenue         float64            `json:"total_revenue"`
	TotalFuelCost        float64            `json:"total_fuel_cost"`
	TotalMaintenanceCost float64            `json:"total_maintenance_cost"`
	NetProfit            float64            `json:"net_profit"`
	CompletionRate       float64            `json:"completion_rate"`
	OnTimeRate           float64            `json:"on_time_rate"`
	AverageTripDuration  float64            `json:"average_trip_duration"`
	AverageTripDistance  float64            `json:"average_trip_distance"`
	RevenuePerKm         float64            `json:"revenue_per_km"`
	CostPerKm            float64            `json:"cost_per_km"`
	FleetUtilization     float64            `json:"fleet_utilization"`
	DriverUtilization    float64            `json:"driver_utilization"`
	FuelEfficiency       float64            `json:"fuel_efficiency"`
	TopDrivers           []TopPerformer     `json:"top_drivers"`
	TopVehicles          []TopPerformer     `json:"top_vehicles"`
	DailyBreakdown       []DailyPerformance `json:"daily_breakdown"`
}

// TopPerformer represents a top performing entity
type TopPerformer struct {
	ID          uint    `json:"id"`
	Name        string  `json:"name"`
	MetricValue float64 `json:"metric_value"`
	MetricType  string  `json:"metric_type"`
	TripsCount  int     `json:"trips_count"`
}

// DailyPerformance represents daily performance metrics
type DailyPerformance struct {
	Date           time.Time `json:"date"`
	TripsCount     int       `json:"trips_count"`
	Distance       float64   `json:"distance"`
	Revenue        float64   `json:"revenue"`
	FuelCost       float64   `json:"fuel_cost"`
	Efficiency     float64   `json:"efficiency"`
	ActiveVehicles int       `json:"active_vehicles"`
}

// DriverPerformanceReport represents driver performance report
type DriverPerformanceReport struct {
	Period       string                    `json:"period"`
	Drivers      []DriverPerformanceMetric `json:"drivers"`
	FleetAverage DriverPerformanceMetric   `json:"fleet_average"`
	GeneratedAt  time.Time                 `json:"generated_at"`
}

// DriverPerformanceMetric represents driver performance metrics
type DriverPerformanceMetric struct {
	DriverID              uint    `json:"driver_id"`
	DriverName            string  `json:"driver_name"`
	Rating                float64 `json:"rating"`
	TotalTrips            int     `json:"total_trips"`
	CompletedTrips        int     `json:"completed_trips"`
	CompletionRate        float64 `json:"completion_rate"`
	OnTimeRate            float64 `json:"on_time_rate"`
	FuelEfficiency        float64 `json:"fuel_efficiency"`
	RevenueGenerated      float64 `json:"revenue_generated"`
	CustomerRating        float64 `json:"customer_rating"`
	SafetyScore           float64 `json:"safety_score"`
	DistanceDriven        float64 `json:"distance_driven"`
	IncidentsCount        int     `json:"incidents_count"`
	PerformanceGrade      string  `json:"performance_grade"`
	ImprovementPercentage float64 `json:"improvement_percentage"`
}

// VehicleUtilizationReport represents vehicle utilization report
type VehicleUtilizationReport struct {
	Period       string                     `json:"period"`
	Vehicles     []VehicleUtilizationMetric `json:"vehicles"`
	FleetAverage VehicleUtilizationMetric   `json:"fleet_average"`
	GeneratedAt  time.Time                  `json:"generated_at"`
}

// VehicleUtilizationMetric represents vehicle utilization metrics
type VehicleUtilizationMetric struct {
	VehicleID        uint    `json:"vehicle_id"`
	LicensePlate     string  `json:"license_plate"`
	UtilizationRate  float64 `json:"utilization_rate"`
	TotalTrips       int     `json:"total_trips"`
	TotalDistance    float64 `json:"total_distance"`
	FuelEfficiency   float64 `json:"fuel_efficiency"`
	RevenueGenerated float64 `json:"revenue_generated"`
	MaintenanceCost  float64 `json:"maintenance_cost"`
	ProfitMargin     float64 `json:"profit_margin"`
	IdleHours        int     `json:"idle_hours"`
	MaintenanceHours int     `json:"maintenance_hours"`
	PerformanceGrade string  `json:"performance_grade"`
	CostPerKm        float64 `json:"cost_per_km"`
	RevenuePerKm     float64 `json:"revenue_per_km"`
}

// FuelEfficiencyReport represents fuel efficiency report
type FuelEfficiencyReport struct {
	Period                 string                  `json:"period"`
	FleetAverageEfficiency float64                 `json:"fleet_average_efficiency"`
	TargetEfficiency       float64                 `json:"target_efficiency"`
	EfficiencyVariance     float64                 `json:"efficiency_variance"`
	TotalFuelCost          float64                 `json:"total_fuel_cost"`
	PotentialSavings       float64                 `json:"potential_savings"`
	Vehicles               []VehicleFuelEfficiency `json:"vehicles"`
	Drivers                []DriverFuelEfficiency  `json:"drivers"`
	DailyTrends            []DailyFuelEfficiency   `json:"daily_trends"`
	GeneratedAt            time.Time               `json:"generated_at"`
}

// VehicleFuelEfficiency represents vehicle fuel efficiency
type VehicleFuelEfficiency struct {
	VehicleID          uint    `json:"vehicle_id"`
	LicensePlate       string  `json:"license_plate"`
	Efficiency         float64 `json:"efficiency"`
	TargetEfficiency   float64 `json:"target_efficiency"`
	VariancePercentage float64 `json:"variance_percentage"`
	FuelCost           float64 `json:"fuel_cost"`
	TripsCount         int     `json:"trips_count"`
	Distance           float64 `json:"distance"`
	EfficiencyGrade    string  `json:"efficiency_grade"`
}

// DriverFuelEfficiency represents driver fuel efficiency
type DriverFuelEfficiency struct {
	DriverID           uint    `json:"driver_id"`
	DriverName         string  `json:"driver_name"`
	Efficiency         float64 `json:"efficiency"`
	TargetEfficiency   float64 `json:"target_efficiency"`
	VariancePercentage float64 `json:"variance_percentage"`
	TripsCount         int     `json:"trips_count"`
	EfficiencyGrade    string  `json:"efficiency_grade"`
}

// DailyFuelEfficiency represents daily fuel efficiency
type DailyFuelEfficiency struct {
	Date              time.Time `json:"date"`
	AverageEfficiency float64   `json:"average_efficiency"`
	FuelCost          float64   `json:"fuel_cost"`
	VehiclesActive    int       `json:"vehicles_active"`
}

// RevenueAnalytics represents revenue analytics
type RevenueAnalytics struct {
	Period                  string          `json:"period"`
	TotalRevenue            float64         `json:"total_revenue"`
	TotalCosts              float64         `json:"total_costs"`
	NetProfit               float64         `json:"net_profit"`
	ProfitMargin            float64         `json:"profit_margin"`
	FuelCosts               float64         `json:"fuel_costs"`
	MaintenanceCosts        float64         `json:"maintenance_costs"`
	DriverCosts             float64         `json:"driver_costs"`
	OverheadCosts           float64         `json:"overhead_costs"`
	RevenueSources          []RevenueSource `json:"revenue_sources"`
	DailyTrends             []DailyRevenue  `json:"daily_trends"`
	ProjectedMonthlyRevenue float64         `json:"projected_monthly_revenue"`
	ProjectedMonthlyProfit  float64         `json:"projected_monthly_profit"`
	GeneratedAt             time.Time       `json:"generated_at"`
}

// RevenueSource represents a revenue source
type RevenueSource struct {
	SourceType        string  `json:"source_type"`
	Revenue           float64 `json:"revenue"`
	TripsCount        int     `json:"trips_count"`
	AveragePerTrip    float64 `json:"average_per_trip"`
	PercentageOfTotal float64 `json:"percentage_of_total"`
}

// DailyRevenue represents daily revenue
type DailyRevenue struct {
	Date       time.Time `json:"date"`
	Revenue    float64   `json:"revenue"`
	Costs      float64   `json:"costs"`
	Profit     float64   `json:"profit"`
	TripsCount int       `json:"trips_count"`
}

// ComplianceReport represents compliance report
type ComplianceReport struct {
	OverallScore         float64             `json:"overall_score"`
	TotalDrivers         int                 `json:"total_drivers"`
	CompliantDrivers     int                 `json:"compliant_drivers"`
	LicenseExpiring      int                 `json:"license_expiring"`
	MedicalCertExpiring  int                 `json:"medical_cert_expiring"`
	DriverCompliance     []DriverCompliance  `json:"driver_compliance"`
	TotalVehicles        int                 `json:"total_vehicles"`
	CompliantVehicles    int                 `json:"compliant_vehicles"`
	RegistrationExpiring int                 `json:"registration_expiring"`
	InsuranceExpiring    int                 `json:"insurance_expiring"`
	MaintenanceDue       int                 `json:"maintenance_due"`
	VehicleCompliance    []VehicleCompliance `json:"vehicle_compliance"`
	CriticalIssues       []ComplianceIssue   `json:"critical_issues"`
	GeneratedAt          time.Time           `json:"generated_at"`
}

// DriverCompliance represents driver compliance
type DriverCompliance struct {
	DriverID                uint     `json:"driver_id"`
	DriverName              string   `json:"driver_name"`
	ComplianceScore         float64  `json:"compliance_score"`
	LicenseStatus           string   `json:"license_status"`
	LicenseDaysToExpiry     int      `json:"license_days_to_expiry"`
	MedicalCertStatus       string   `json:"medical_cert_status"`
	MedicalCertDaysToExpiry int      `json:"medical_cert_days_to_expiry"`
	Issues                  []string `json:"issues"`
}

// VehicleCompliance represents vehicle compliance
type VehicleCompliance struct {
	VehicleID                uint     `json:"vehicle_id"`
	LicensePlate             string   `json:"license_plate"`
	ComplianceScore          float64  `json:"compliance_score"`
	RegistrationStatus       string   `json:"registration_status"`
	RegistrationDaysToExpiry int      `json:"registration_days_to_expiry"`
	InsuranceStatus          string   `json:"insurance_status"`
	InsuranceDaysToExpiry    int      `json:"insurance_days_to_expiry"`
	MaintenanceDue           bool     `json:"maintenance_due"`
	Issues                   []string `json:"issues"`
}

// ComplianceIssue represents a compliance issue
type ComplianceIssue struct {
	IssueType     string    `json:"issue_type"`
	Severity      string    `json:"severity"`
	Description   string    `json:"description"`
	AffectedCount int       `json:"affected_count"`
	Deadline      time.Time `json:"deadline"`
	AffectedIDs   []uint    `json:"affected_ids"`
}
