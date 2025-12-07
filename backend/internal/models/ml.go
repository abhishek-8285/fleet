package models

import (
	"time"
)

// ML Efficiency Metrics
type MLEfficiencyMetrics struct {
	Current               float64  `json:"current"`
	Predicted             float64  `json:"predicted"`
	Optimal               float64  `json:"optimal"`
	Trend                 string   `json:"trend"`
	MaintenanceRequired   bool     `json:"maintenance_required"`
	DriverRecommendations []string `json:"driver_recommendations"`
	CostSavingPotential   float64  `json:"cost_saving_potential"`
	EnvironmentalImpact   float64  `json:"environmental_impact"`
	NextMaintenanceKm     float64  `json:"next_maintenance_km"`
}

// ML Prediction metadata
type MLPrediction struct {
	Accuracy   float64 `json:"accuracy"`
	Confidence float64 `json:"confidence"`
	Model      string  `json:"model"`
}

// Fuel Efficiency Update for real-time ML predictions
type FuelEfficiencyUpdate struct {
	VehicleID             uint      `json:"vehicle_id"`
	CurrentEfficiency     float64   `json:"current_efficiency"`
	PredictedEfficiency   float64   `json:"predicted_efficiency"`
	OptimalEfficiency     float64   `json:"optimal_efficiency"`
	EfficiencyTrend       string    `json:"efficiency_trend"`
	MaintenanceRequired   bool      `json:"maintenance_required"`
	DriverRecommendations []string  `json:"driver_recommendations"`
	CostSavingPotential   float64   `json:"cost_saving_potential"`
	EnvironmentalImpact   float64   `json:"environmental_impact"`
	NextMaintenanceKm     float64   `json:"next_maintenance_km"`
	PredictionAccuracy    float64   `json:"prediction_accuracy"`
	LastUpdated           time.Time `json:"last_updated"`
}

// Fuel Theft Alert for real-time monitoring
type FuelTheftAlert struct {
	VehicleID         uint      `json:"vehicle_id"`
	FuelEventID       uint      `json:"fuel_event_id"`
	DetectedAt        time.Time `json:"detected_at"`
	TheftType         string    `json:"theft_type"`
	Severity          string    `json:"severity"`
	FraudScore        float64   `json:"fraud_score"`
	Evidence          string    `json:"evidence"`
	RecommendedAction string    `json:"recommended_action"`
	EstimatedLoss     float64   `json:"estimated_loss"`
}

// Fuel Anomaly for ML-based detection
type FuelAnomaly struct {
	VehicleID       uint      `json:"vehicle_id"`
	AnomalyType     string    `json:"anomaly_type"`
	AnomalyScore    float64   `json:"anomaly_score"`
	DetectedAt      time.Time `json:"detected_at"`
	Description     string    `json:"description"`
	SuggestedAction string    `json:"suggested_action"`
	Confidence      float64   `json:"confidence"`
}
