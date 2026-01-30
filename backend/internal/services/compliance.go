package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

// ComplianceDocument represents various compliance documents
type ComplianceDocument struct {
	ID          string    `json:"id"`
	Type        string    `json:"type"` // license, permit, insurance, puc, etc.
	DocumentNo  string    `json:"document_no"`
	IssueDate   time.Time `json:"issue_date"`
	ExpiryDate  time.Time `json:"expiry_date"`
	IssuingAuth string    `json:"issuing_authority"`
	Status      string    `json:"status"` // valid, expired, expiring_soon
	VehicleID   string    `json:"vehicle_id,omitempty"`
	DriverID    string    `json:"driver_id,omitempty"`
	DocumentURL string    `json:"document_url,omitempty"`
	Verified    bool      `json:"verified"`
	LastChecked time.Time `json:"last_checked"`
}

// ComplianceAlert represents compliance-related alerts
type ComplianceAlert struct {
	ID          string    `json:"id"`
	Type        string    `json:"type"`     // expiry, violation, renewal
	Severity    string    `json:"severity"` // low, medium, high, critical
	Title       string    `json:"title"`
	Description string    `json:"description"`
	DueDate     time.Time `json:"due_date"`
	VehicleID   string    `json:"vehicle_id,omitempty"`
	DriverID    string    `json:"driver_id,omitempty"`
	DocumentID  string    `json:"document_id,omitempty"`
	ActionURL   string    `json:"action_url,omitempty"`
	Resolved    bool      `json:"resolved"`
	CreatedAt   time.Time `json:"created_at"`
}

// VehicleCompliance represents overall compliance status for a vehicle
type VehicleCompliance struct {
	VehicleID    string               `json:"vehicle_id"`
	LicensePlate string               `json:"license_plate"`
	Status       string               `json:"status"` // compliant, non_compliant, warning
	Score        int                  `json:"score"`  // 0-100
	Documents    []ComplianceDocument `json:"documents"`
	Alerts       []ComplianceAlert    `json:"alerts"`
	NextAction   *ComplianceAlert     `json:"next_action,omitempty"`
	LastUpdated  time.Time            `json:"last_updated"`
}

// DriverCompliance represents compliance status for a driver
type DriverCompliance struct {
	DriverID    string               `json:"driver_id"`
	Name        string               `json:"name"`
	Status      string               `json:"status"`
	Score       int                  `json:"score"`
	Documents   []ComplianceDocument `json:"documents"`
	Alerts      []ComplianceAlert    `json:"alerts"`
	LastUpdated time.Time            `json:"last_updated"`
}

// PoliceVerification represents RTO/Police verification data
type PoliceVerification struct {
	VehicleNumber string      `json:"vehicle_number"`
	OwnerName     string      `json:"owner_name"`
	ChassisNo     string      `json:"chassis_no"`
	EngineNo      string      `json:"engine_no"`
	Status        string      `json:"status"` // clear, pending, issues
	Violations    []Violation `json:"violations,omitempty"`
	LastChecked   time.Time   `json:"last_checked"`
}

// Violation represents traffic violations or challans
type Violation struct {
	ID          string     `json:"id"`
	Type        string     `json:"type"`
	Description string     `json:"description"`
	Amount      float64    `json:"amount"`
	Date        time.Time  `json:"date"`
	Location    string     `json:"location"`
	Status      string     `json:"status"` // pending, paid, disputed
	PaidDate    *time.Time `json:"paid_date,omitempty"`
}

// ComplianceReport represents automated compliance reports
type ComplianceReport struct {
	ID                 string              `json:"id"`
	Period             string              `json:"period"` // monthly, quarterly, annual
	StartDate          time.Time           `json:"start_date"`
	EndDate            time.Time           `json:"end_date"`
	FleetCompliance    []VehicleCompliance `json:"fleet_compliance"`
	DriverCompliance   []DriverCompliance  `json:"driver_compliance"`
	Summary            ComplianceSummary   `json:"summary"`
	RecommendedActions []string            `json:"recommended_actions"`
	GeneratedAt        time.Time           `json:"generated_at"`
	ReportURL          string              `json:"report_url"`
}

// ComplianceSummary provides high-level compliance metrics
type ComplianceSummary struct {
	TotalVehicles     int     `json:"total_vehicles"`
	CompliantVehicles int     `json:"compliant_vehicles"`
	TotalDrivers      int     `json:"total_drivers"`
	CompliantDrivers  int     `json:"compliant_drivers"`
	ComplianceScore   float64 `json:"compliance_score"`
	CriticalAlerts    int     `json:"critical_alerts"`
	ExpiringDocuments int     `json:"expiring_documents"`
	TotalFines        float64 `json:"total_fines"`
	UnpaidFines       float64 `json:"unpaid_fines"`
}

// ComplianceService handles all compliance-related operations
type ComplianceService struct {
	httpClient *http.Client
	rtoConfig  RTOConfig
	logger     Logger
}

type RTOConfig struct {
	BaseURL      string
	APIKey       string
	StateCode    string
	PoliceURL    string
	PoliceAPIKey string
}

type Logger interface {
	Info(args ...interface{})
	Error(args ...interface{})
	Warn(args ...interface{})
}

func NewComplianceService(config RTOConfig, logger Logger) *ComplianceService {
	return &ComplianceService{
		httpClient: &http.Client{Timeout: 30 * time.Second},
		rtoConfig:  config,
		logger:     logger,
	}
}

// CheckVehicleCompliance performs comprehensive compliance check for a vehicle
func (cs *ComplianceService) CheckVehicleCompliance(ctx context.Context, vehicleID, licensePlate string) (*VehicleCompliance, error) {
	cs.logger.Info("Checking compliance for vehicle:", licensePlate)

	// Get existing documents
	documents, err := cs.getVehicleDocuments(ctx, vehicleID)
	if err != nil {
		return nil, fmt.Errorf("failed to get vehicle documents: %w", err)
	}

	// Verify with RTO
	rtoData, err := cs.verifyWithRTO(ctx, licensePlate)
	if err != nil {
		cs.logger.Warn("RTO verification failed:", err)
		// Continue with offline check
	}

	// Check police records
	policeData, err := cs.checkPoliceRecords(ctx, licensePlate)
	if err != nil {
		cs.logger.Warn("Police verification failed:", err)
		// Continue with available data
	}

	// Generate alerts
	alerts := cs.generateComplianceAlerts(documents, rtoData, policeData)

	// Calculate compliance score
	score := cs.calculateComplianceScore(documents, alerts)

	// Determine overall status
	status := cs.determineComplianceStatus(score, alerts)

	return &VehicleCompliance{
		VehicleID:    vehicleID,
		LicensePlate: licensePlate,
		Status:       status,
		Score:        score,
		Documents:    documents,
		Alerts:       alerts,
		NextAction:   cs.getNextAction(alerts),
		LastUpdated:  time.Now(),
	}, nil
}

// CheckDriverCompliance performs comprehensive compliance check for a driver
func (cs *ComplianceService) CheckDriverCompliance(ctx context.Context, driverID, licenseNo string) (*DriverCompliance, error) {
	cs.logger.Info("Checking compliance for driver:", driverID)

	// Get driver documents
	documents, err := cs.getDriverDocuments(ctx, driverID)
	if err != nil {
		return nil, fmt.Errorf("failed to get driver documents: %w", err)
	}

	// Verify license with RTO
	licenseData, err := cs.verifyDriverLicense(ctx, licenseNo)
	if err != nil {
		cs.logger.Warn("License verification failed:", err)
	}

	// Generate alerts
	alerts := cs.generateDriverAlerts(documents, licenseData)

	// Calculate compliance score
	score := cs.calculateDriverScore(documents, alerts)

	// Determine status
	status := cs.determineComplianceStatus(score, alerts)

	return &DriverCompliance{
		DriverID:    driverID,
		Status:      status,
		Score:       score,
		Documents:   documents,
		Alerts:      alerts,
		LastUpdated: time.Now(),
	}, nil
}

// AutomateComplianceCheck runs automated compliance checks
func (cs *ComplianceService) AutomateComplianceCheck(ctx context.Context) error {
	cs.logger.Info("Starting automated compliance check")

	// This would typically be called from a scheduled job
	// Check all vehicles and drivers for compliance

	// Get all vehicles
	vehicles, err := cs.getAllVehicles(ctx)
	if err != nil {
		return fmt.Errorf("failed to get vehicles: %w", err)
	}

	// Check each vehicle
	for _, vehicle := range vehicles {
		compliance, err := cs.CheckVehicleCompliance(ctx, vehicle.ID, vehicle.LicensePlate)
		if err != nil {
			cs.logger.Error("Failed to check vehicle compliance:", vehicle.LicensePlate, err)
			continue
		}

		// Save compliance data
		if err := cs.saveVehicleCompliance(ctx, compliance); err != nil {
			cs.logger.Error("Failed to save vehicle compliance:", err)
		}

		// Send notifications for critical alerts
		if err := cs.sendComplianceNotifications(ctx, compliance); err != nil {
			cs.logger.Error("Failed to send compliance notifications:", err)
		}
	}

	// Check all drivers
	drivers, err := cs.getAllDrivers(ctx)
	if err != nil {
		return fmt.Errorf("failed to get drivers: %w", err)
	}

	for _, driver := range drivers {
		compliance, err := cs.CheckDriverCompliance(ctx, driver.ID, driver.LicenseNo)
		if err != nil {
			cs.logger.Error("Failed to check driver compliance:", driver.ID, err)
			continue
		}

		// Save compliance data
		if err := cs.saveDriverCompliance(ctx, compliance); err != nil {
			cs.logger.Error("Failed to save driver compliance:", err)
		}
	}

	cs.logger.Info("Automated compliance check completed")
	return nil
}

// GenerateComplianceReport generates comprehensive compliance reports
func (cs *ComplianceService) GenerateComplianceReport(ctx context.Context, period string, startDate, endDate time.Time) (*ComplianceReport, error) {
	cs.logger.Info("Generating compliance report for period:", period)

	// Get fleet compliance data
	fleetCompliance, err := cs.getFleetComplianceData(ctx, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get fleet compliance data: %w", err)
	}

	// Get driver compliance data
	driverCompliance, err := cs.getDriverComplianceData(ctx, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get driver compliance data: %w", err)
	}

	// Generate summary
	summary := cs.generateComplianceSummary(fleetCompliance, driverCompliance)

	// Generate recommendations
	recommendations := cs.generateRecommendations(fleetCompliance, driverCompliance)

	report := &ComplianceReport{
		ID:                 fmt.Sprintf("RPT_%d", time.Now().Unix()),
		Period:             period,
		StartDate:          startDate,
		EndDate:            endDate,
		FleetCompliance:    fleetCompliance,
		DriverCompliance:   driverCompliance,
		Summary:            summary,
		RecommendedActions: recommendations,
		GeneratedAt:        time.Now(),
	}

	// Generate PDF report (would be implemented)
	reportURL, err := cs.generatePDFReport(ctx, report)
	if err != nil {
		cs.logger.Warn("Failed to generate PDF report:", err)
	} else {
		report.ReportURL = reportURL
	}

	return report, nil
}

// Verification functions

func (cs *ComplianceService) verifyWithRTO(ctx context.Context, licensePlate string) (*PoliceVerification, error) {
	// Simulate RTO API call
	// In production, this would call actual RTO/Vahan API
	url := fmt.Sprintf("%s/vehicle/verify?number=%s&key=%s",
		cs.rtoConfig.BaseURL, url.QueryEscape(licensePlate), cs.rtoConfig.APIKey)

	resp, err := cs.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("RTO API call failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("RTO API returned status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read RTO response: %w", err)
	}

	var verification PoliceVerification
	if err := json.Unmarshal(body, &verification); err != nil {
		return nil, fmt.Errorf("failed to parse RTO response: %w", err)
	}

	return &verification, nil
}

func (cs *ComplianceService) checkPoliceRecords(ctx context.Context, licensePlate string) (*PoliceVerification, error) {
	// Simulate police records API call
	url := fmt.Sprintf("%s/challan/check?vehicle=%s&key=%s",
		cs.rtoConfig.PoliceURL, url.QueryEscape(licensePlate), cs.rtoConfig.PoliceAPIKey)

	resp, err := cs.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("police API call failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read police response: %w", err)
	}

	var verification PoliceVerification
	if err := json.Unmarshal(body, &verification); err != nil {
		return nil, fmt.Errorf("failed to parse police response: %w", err)
	}

	return &verification, nil
}

func (cs *ComplianceService) verifyDriverLicense(ctx context.Context, licenseNo string) (*ComplianceDocument, error) {
	// Simulate license verification API call
	url := fmt.Sprintf("%s/license/verify?number=%s&key=%s",
		cs.rtoConfig.BaseURL, url.QueryEscape(licenseNo), cs.rtoConfig.APIKey)

	resp, err := cs.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("license verification failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read license response: %w", err)
	}

	var doc ComplianceDocument
	if err := json.Unmarshal(body, &doc); err != nil {
		return nil, fmt.Errorf("failed to parse license response: %w", err)
	}

	return &doc, nil
}

// Alert generation functions

func (cs *ComplianceService) generateComplianceAlerts(documents []ComplianceDocument, rtoData, policeData *PoliceVerification) []ComplianceAlert {
	var alerts []ComplianceAlert

	// Check for expiring documents
	for _, doc := range documents {
		if cs.isDocumentExpiring(doc) {
			severity := "medium"
			if time.Until(doc.ExpiryDate) <= 7*24*time.Hour {
				severity = "high"
			}
			if doc.ExpiryDate.Before(time.Now()) {
				severity = "critical"
			}

			alerts = append(alerts, ComplianceAlert{
				ID:          fmt.Sprintf("EXP_%s_%d", doc.Type, time.Now().Unix()),
				Type:        "expiry",
				Severity:    severity,
				Title:       fmt.Sprintf("%s Expiring Soon", cases.Title(language.Und).String(doc.Type)),
				Description: fmt.Sprintf("%s (No: %s) expires on %s", doc.Type, doc.DocumentNo, doc.ExpiryDate.Format("02-Jan-2006")),
				DueDate:     doc.ExpiryDate,
				DocumentID:  doc.ID,
				CreatedAt:   time.Now(),
			})
		}
	}

	// Check police violations
	if policeData != nil {
		for _, violation := range policeData.Violations {
			if violation.Status == "pending" {
				alerts = append(alerts, ComplianceAlert{
					ID:          fmt.Sprintf("VIO_%s", violation.ID),
					Type:        "violation",
					Severity:    "high",
					Title:       "Pending Traffic Violation",
					Description: fmt.Sprintf("%s - Amount: ₹%.2f", violation.Description, violation.Amount),
					DueDate:     violation.Date.Add(30 * 24 * time.Hour), // Assume 30 days to pay
					CreatedAt:   time.Now(),
				})
			}
		}
	}

	return alerts
}

func (cs *ComplianceService) generateDriverAlerts(documents []ComplianceDocument, licenseData *ComplianceDocument) []ComplianceAlert {
	var alerts []ComplianceAlert

	// Check driver documents
	for _, doc := range documents {
		if cs.isDocumentExpiring(doc) {
			severity := "medium"
			if time.Until(doc.ExpiryDate) <= 15*24*time.Hour {
				severity = "high"
			}
			if doc.ExpiryDate.Before(time.Now()) {
				severity = "critical"
			}

			alerts = append(alerts, ComplianceAlert{
				ID:          fmt.Sprintf("DRV_EXP_%s_%d", doc.Type, time.Now().Unix()),
				Type:        "expiry",
				Severity:    severity,
				Title:       fmt.Sprintf("Driver %s Expiring", cases.Title(language.Und).String(doc.Type)),
				Description: fmt.Sprintf("%s expires on %s", doc.Type, doc.ExpiryDate.Format("02-Jan-2006")),
				DueDate:     doc.ExpiryDate,
				DocumentID:  doc.ID,
				CreatedAt:   time.Now(),
			})
		}
	}

	return alerts
}

// Scoring functions

func (cs *ComplianceService) calculateComplianceScore(documents []ComplianceDocument, alerts []ComplianceAlert) int {
	score := 100

	// Deduct points for missing documents
	requiredDocs := []string{"registration", "insurance", "puc", "permit"}
	for _, reqDoc := range requiredDocs {
		found := false
		for _, doc := range documents {
			if doc.Type == reqDoc && doc.Status == "valid" {
				found = true
				break
			}
		}
		if !found {
			score -= 20
		}
	}

	// Deduct points for alerts
	for _, alert := range alerts {
		switch alert.Severity {
		case "critical":
			score -= 25
		case "high":
			score -= 15
		case "medium":
			score -= 10
		case "low":
			score -= 5
		}
	}

	if score < 0 {
		score = 0
	}

	return score
}

func (cs *ComplianceService) calculateDriverScore(documents []ComplianceDocument, alerts []ComplianceAlert) int {
	score := 100

	// Check for required driver documents
	requiredDocs := []string{"license", "medical_certificate", "id_proof"}
	for _, reqDoc := range requiredDocs {
		found := false
		for _, doc := range documents {
			if doc.Type == reqDoc && doc.Status == "valid" {
				found = true
				break
			}
		}
		if !found {
			score -= 30
		}
	}

	// Deduct for alerts
	for _, alert := range alerts {
		switch alert.Severity {
		case "critical":
			score -= 20
		case "high":
			score -= 15
		case "medium":
			score -= 10
		case "low":
			score -= 5
		}
	}

	if score < 0 {
		score = 0
	}

	return score
}

// Helper functions

func (cs *ComplianceService) isDocumentExpiring(doc ComplianceDocument) bool {
	daysUntilExpiry := time.Until(doc.ExpiryDate).Hours() / 24
	return daysUntilExpiry <= 30 // Consider expiring if less than 30 days
}

func (cs *ComplianceService) determineComplianceStatus(score int, alerts []ComplianceAlert) string {
	if score >= 90 {
		return "compliant"
	}

	for _, alert := range alerts {
		if alert.Severity == "critical" {
			return "non_compliant"
		}
	}

	if score >= 70 {
		return "warning"
	}

	return "non_compliant"
}

func (cs *ComplianceService) getNextAction(alerts []ComplianceAlert) *ComplianceAlert {
	if len(alerts) == 0 {
		return nil
	}

	// Sort by severity and due date
	var nextAction *ComplianceAlert
	for i, alert := range alerts {
		if alert.Resolved {
			continue
		}

		if nextAction == nil ||
			cs.getAlertPriority(alert) > cs.getAlertPriority(*nextAction) ||
			(cs.getAlertPriority(alert) == cs.getAlertPriority(*nextAction) && alert.DueDate.Before(nextAction.DueDate)) {
			nextAction = &alerts[i]
		}
	}

	return nextAction
}

func (cs *ComplianceService) getAlertPriority(alert ComplianceAlert) int {
	switch alert.Severity {
	case "critical":
		return 4
	case "high":
		return 3
	case "medium":
		return 2
	case "low":
		return 1
	default:
		return 0
	}
}

// Placeholder functions (would be implemented with actual database calls)

func (cs *ComplianceService) getVehicleDocuments(ctx context.Context, vehicleID string) ([]ComplianceDocument, error) {
	// This would query the database for vehicle documents
	return []ComplianceDocument{}, nil
}

func (cs *ComplianceService) getDriverDocuments(ctx context.Context, driverID string) ([]ComplianceDocument, error) {
	// This would query the database for driver documents
	return []ComplianceDocument{}, nil
}

func (cs *ComplianceService) getAllVehicles(ctx context.Context) ([]struct{ ID, LicensePlate string }, error) {
	// This would query the database for all vehicles
	return []struct{ ID, LicensePlate string }{}, nil
}

func (cs *ComplianceService) getAllDrivers(ctx context.Context) ([]struct{ ID, LicenseNo string }, error) {
	// This would query the database for all drivers
	return []struct{ ID, LicenseNo string }{}, nil
}

func (cs *ComplianceService) saveVehicleCompliance(ctx context.Context, compliance *VehicleCompliance) error {
	// This would save compliance data to database
	return nil
}

func (cs *ComplianceService) saveDriverCompliance(ctx context.Context, compliance *DriverCompliance) error {
	// This would save compliance data to database
	return nil
}

func (cs *ComplianceService) sendComplianceNotifications(ctx context.Context, compliance *VehicleCompliance) error {
	// This would send notifications via WhatsApp/SMS/Email
	return nil
}

func (cs *ComplianceService) getFleetComplianceData(ctx context.Context, start, end time.Time) ([]VehicleCompliance, error) {
	// This would get historical compliance data
	return []VehicleCompliance{}, nil
}

func (cs *ComplianceService) getDriverComplianceData(ctx context.Context, start, end time.Time) ([]DriverCompliance, error) {
	// This would get historical driver compliance data
	return []DriverCompliance{}, nil
}

func (cs *ComplianceService) generateComplianceSummary(fleet []VehicleCompliance, drivers []DriverCompliance) ComplianceSummary {
	summary := ComplianceSummary{
		TotalVehicles: len(fleet),
		TotalDrivers:  len(drivers),
	}

	// Calculate metrics
	for _, v := range fleet {
		if v.Status == "compliant" {
			summary.CompliantVehicles++
		}
		for _, alert := range v.Alerts {
			if alert.Severity == "critical" {
				summary.CriticalAlerts++
			}
		}
	}

	for _, d := range drivers {
		if d.Status == "compliant" {
			summary.CompliantDrivers++
		}
	}

	if summary.TotalVehicles > 0 && summary.TotalDrivers > 0 {
		summary.ComplianceScore = float64(summary.CompliantVehicles+summary.CompliantDrivers) /
			float64(summary.TotalVehicles+summary.TotalDrivers) * 100
	}

	return summary
}

func (cs *ComplianceService) generateRecommendations(fleet []VehicleCompliance, drivers []DriverCompliance) []string {
	var recommendations []string

	// Analyze compliance data and generate recommendations
	if len(fleet) > 0 {
		expiredCount := 0
		for _, v := range fleet {
			if v.Status == "non_compliant" {
				expiredCount++
			}
		}
		if expiredCount > 0 {
			recommendations = append(recommendations,
				fmt.Sprintf("Immediate action required: %d vehicles are non-compliant", expiredCount))
		}
	}

	recommendations = append(recommendations,
		"Schedule monthly compliance audits",
		"Set up automated document renewal reminders",
		"Implement digital document management system",
		"Train drivers on compliance requirements",
	)

	return recommendations
}

func (cs *ComplianceService) generatePDFReport(ctx context.Context, report *ComplianceReport) (string, error) {
	// This would generate a PDF report and return the URL
	// Implementation would use a PDF generation library
	return "https://reports.fleetflow.in/compliance/" + report.ID + ".pdf", nil
}
