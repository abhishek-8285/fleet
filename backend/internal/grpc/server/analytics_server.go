package server

import (
	"context"
	"log"

	"github.com/fleetflow/backend/internal/models"
	"github.com/fleetflow/backend/internal/services"
	pb "github.com/fleetflow/backend/proto/gen"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// AnalyticsServer implements the AnalyticsService gRPC service
type AnalyticsServer struct {
	pb.UnimplementedAnalyticsServiceServer
	services *services.Container
}

// NewAnalyticsServer creates a new AnalyticsServer
func NewAnalyticsServer(services *services.Container) *AnalyticsServer {
	return &AnalyticsServer{
		services: services,
	}
}

// GetDashboardStats gets dashboard statistics
func (s *AnalyticsServer) GetDashboardStats(ctx context.Context, req *pb.GetDashboardStatsRequest) (*pb.DashboardStats, error) {
	log.Printf("📊 GetDashboardStats request for period: %s", req.Period)

	// Get dashboard stats from service
	stats, err := s.services.AnalyticsService.GetDashboardStats(req.Period)
	if err != nil {
		log.Printf("❌ Failed to get dashboard stats: %v", err)
		return nil, status.Error(codes.Internal, "failed to get dashboard stats")
	}

	return convertDashboardStatsToProto(stats), nil
}

// GetFleetPerformance gets fleet performance metrics
func (s *AnalyticsServer) GetFleetPerformance(ctx context.Context, req *pb.GetFleetPerformanceRequest) (*pb.FleetPerformance, error) {
	log.Printf("📊 GetFleetPerformance request for period: %s", req.Period)

	// Get fleet performance from service
	performance, err := s.services.AnalyticsService.GetFleetPerformance(req.Period)
	if err != nil {
		log.Printf("❌ Failed to get fleet performance: %v", err)
		return nil, status.Error(codes.Internal, "failed to get fleet performance")
	}

	return convertFleetPerformanceToProto(performance), nil
}

// GetDriverPerformance gets driver performance report
func (s *AnalyticsServer) GetDriverPerformance(ctx context.Context, req *pb.GetDriverPerformanceRequest) (*pb.DriverPerformanceReport, error) {
	log.Printf("📊 GetDriverPerformance request for drivers: %v, period: %s", req.DriverIds, req.Period)

	// Convert uint32 slice to uint slice
	driverIDs := make([]uint, len(req.DriverIds))
	for i, id := range req.DriverIds {
		driverIDs[i] = uint(id)
	}

	// Get driver performance from service
	report, err := s.services.AnalyticsService.GetDriverPerformanceReport(req.Period, driverIDs)
	if err != nil {
		log.Printf("❌ Failed to get driver performance: %v", err)
		return nil, status.Error(codes.Internal, "failed to get driver performance")
	}

	return convertDriverPerformanceReportToProto(report), nil
}

// GetVehicleUtilization gets vehicle utilization report
func (s *AnalyticsServer) GetVehicleUtilization(ctx context.Context, req *pb.GetVehicleUtilizationRequest) (*pb.VehicleUtilizationReport, error) {
	log.Printf("📊 GetVehicleUtilization request for period: %s", req.Period)

	// Get vehicle utilization from service
	report, err := s.services.AnalyticsService.GetVehicleUtilizationReport(req.Period)
	if err != nil {
		log.Printf("❌ Failed to get vehicle utilization: %v", err)
		return nil, status.Error(codes.Internal, "failed to get vehicle utilization")
	}

	return convertVehicleUtilizationReportToProto(report), nil
}

// GetFuelEfficiency gets fuel efficiency report
func (s *AnalyticsServer) GetFuelEfficiency(ctx context.Context, req *pb.GetFuelEfficiencyRequest) (*pb.FuelEfficiencyReport, error) {
	log.Printf("📊 GetFuelEfficiency request for period: %s", req.Period)

	// Get fuel efficiency from service
	report, err := s.services.AnalyticsService.GetFuelEfficiencyReport(req.Period)
	if err != nil {
		log.Printf("❌ Failed to get fuel efficiency: %v", err)
		return nil, status.Error(codes.Internal, "failed to get fuel efficiency")
	}

	return convertFuelEfficiencyReportToProto(report), nil
}

// GetRevenueAnalytics gets revenue analytics
func (s *AnalyticsServer) GetRevenueAnalytics(ctx context.Context, req *pb.GetRevenueAnalyticsRequest) (*pb.RevenueAnalytics, error) {
	log.Printf("📊 GetRevenueAnalytics request for period: %s", req.Period)

	// Get revenue analytics from service
	analytics, err := s.services.AnalyticsService.GetRevenueAnalytics(req.Period)
	if err != nil {
		log.Printf("❌ Failed to get revenue analytics: %v", err)
		return nil, status.Error(codes.Internal, "failed to get revenue analytics")
	}

	return convertRevenueAnalyticsToProto(analytics), nil
}

// GetComplianceReport gets compliance report
func (s *AnalyticsServer) GetComplianceReport(ctx context.Context, req *pb.GetComplianceReportRequest) (*pb.ComplianceReport, error) {
	log.Printf("📊 GetComplianceReport request - days_ahead: %d, include_details: %t", req.DaysAhead, req.IncludeDetails)

	// Get compliance report from service
	report, err := s.services.AnalyticsService.GetComplianceReport(req.IncludeDetails, req.DaysAhead)
	if err != nil {
		log.Printf("❌ Failed to get compliance report: %v", err)
		return nil, status.Error(codes.Internal, "failed to get compliance report")
	}

	return convertComplianceReportToProto(report), nil
}

// GetSystemSettings gets system settings
func (s *AnalyticsServer) GetSystemSettings(ctx context.Context, req *pb.GetSystemSettingsRequest) (*pb.SystemSettings, error) {
	log.Printf("📊 GetSystemSettings request")

	// Get system settings from service
	settings, err := s.services.AnalyticsService.GetSystemSettings()
	if err != nil {
		log.Printf("❌ Failed to get system settings: %v", err)
		return nil, status.Error(codes.Internal, "failed to get system settings")
	}

	return convertSystemSettingsToProto(settings), nil
}

// UpdateSystemSettings updates system settings
func (s *AnalyticsServer) UpdateSystemSettings(ctx context.Context, req *pb.UpdateSystemSettingsRequest) (*pb.SystemSettings, error) {
	log.Printf("📊 UpdateSystemSettings request")

	// Convert settings map to domain model - simplified for now
	settings := &models.SystemSettings{
		CompanyName:     req.Settings["company_name"],
		CompanyAddress:  req.Settings["company_address"],
		CompanyPhone:    req.Settings["company_phone"],
		CompanyEmail:    req.Settings["company_email"],
		TimeZone:        req.Settings["time_zone"],
		Currency:        req.Settings["currency"],
		DateFormat:      req.Settings["date_format"],
		DistanceUnit:    req.Settings["distance_unit"],
		FuelUnit:        req.Settings["fuel_unit"],
		DefaultLanguage: req.Settings["default_language"],
	}

	// Update system settings via service
	updatedSettings, err := s.services.AnalyticsService.UpdateSystemSettings(settings)
	if err != nil {
		log.Printf("❌ Failed to update system settings: %v", err)
		return nil, status.Error(codes.Internal, "failed to update system settings")
	}

	return convertSystemSettingsToProto(updatedSettings), nil
}

// GetAuditLogs gets audit logs
func (s *AnalyticsServer) GetAuditLogs(ctx context.Context, req *pb.GetAuditLogsRequest) (*pb.GetAuditLogsResponse, error) {
	log.Printf("📊 GetAuditLogs request")

	// Set default pagination
	page := uint32(1)
	limit := uint32(20)
	if req.Pagination != nil {
		if req.Pagination.Page > 0 {
			page = uint32(req.Pagination.Page)
		}
		if req.Pagination.Limit > 0 {
			limit = uint32(req.Pagination.Limit)
		}
	}

	// Mock audit logs response for now
	// TODO: Implement actual audit service call
	logs := []*pb.AuditLog{}

	return &pb.GetAuditLogsResponse{
		Logs: logs,
		Pagination: &pb.Pagination{
			Page:       int32(page),
			Limit:      int32(limit),
			Total:      0,
			TotalPages: 0,
		},
	}, nil
}

// GetSecurityEvents gets security events
func (s *AnalyticsServer) GetSecurityEvents(ctx context.Context, req *pb.GetSecurityEventsRequest) (*pb.GetSecurityEventsResponse, error) {
	log.Printf("📊 GetSecurityEvents request")

	// Set default pagination
	page := uint32(1)
	limit := uint32(20)
	if req.Pagination != nil {
		if req.Pagination.Page > 0 {
			page = uint32(req.Pagination.Page)
		}
		if req.Pagination.Limit > 0 {
			limit = uint32(req.Pagination.Limit)
		}
	}

	// Mock security events response for now
	// TODO: Implement actual security service call
	events := []*pb.SecurityEvent{}

	return &pb.GetSecurityEventsResponse{
		Events: events,
		Pagination: &pb.Pagination{
			Page:       int32(page),
			Limit:      int32(limit),
			Total:      0,
			TotalPages: 0,
		},
	}, nil
}

// StreamDashboardUpdates streams dashboard updates
func (s *AnalyticsServer) StreamDashboardUpdates(req *pb.StreamDashboardRequest, stream pb.AnalyticsService_StreamDashboardUpdatesServer) error {
	log.Printf("📊 StreamDashboardUpdates request")

	// Stream dashboard updates from service
	period := "real-time" // Default period for dashboard updates
	updateChan, err := s.services.AnalyticsService.StreamDashboardUpdates(period)
	if err != nil {
		log.Printf("❌ Failed to start dashboard updates streaming: %v", err)
		return status.Error(codes.Internal, "failed to start dashboard updates streaming")
	}

	// Stream updates to client
	for update := range updateChan {
		// Convert interface{} to *pb.DashboardUpdate
		if dashboardUpdate, ok := update.(*pb.DashboardUpdate); ok {
			if err := stream.Send(dashboardUpdate); err != nil {
				log.Printf("❌ Failed to send dashboard update: %v", err)
				return err
			}
		} else {
			log.Printf("⚠️ Unexpected update type: %T", update)
		}
	}

	return nil
}

// StreamPerformanceMetrics streams performance metrics
func (s *AnalyticsServer) StreamPerformanceMetrics(req *pb.StreamPerformanceRequest, stream pb.AnalyticsService_StreamPerformanceMetricsServer) error {
	log.Printf("📊 StreamPerformanceMetrics request")

	// Stream performance metrics from service
	period := "real-time" // Default period for performance metrics
	metricsChan, err := s.services.AnalyticsService.StreamPerformanceMetrics(period)
	if err != nil {
		log.Printf("❌ Failed to start performance metrics streaming: %v", err)
		return status.Error(codes.Internal, "failed to start performance metrics streaming")
	}

	// Stream metrics to client
	for metrics := range metricsChan {
		// Convert interface{} to *pb.PerformanceMetric
		if performanceMetric, ok := metrics.(*pb.PerformanceMetric); ok {
			if err := stream.Send(performanceMetric); err != nil {
				log.Printf("❌ Failed to send performance metrics: %v", err)
				return err
			}
		} else {
			log.Printf("⚠️ Unexpected metrics type: %T", metrics)
		}
	}

	return nil
}

// StreamAlerts streams alerts
func (s *AnalyticsServer) StreamAlerts(req *pb.StreamAlertsRequest, stream pb.AnalyticsService_StreamAlertsServer) error {
	log.Printf("📊 StreamAlerts request")

	// Stream alerts from service
	alertChan, err := s.services.AnalyticsService.StreamAlerts(req.AlertTypes)
	if err != nil {
		log.Printf("❌ Failed to start alerts streaming: %v", err)
		return status.Error(codes.Internal, "failed to start alerts streaming")
	}

	// Stream alerts to client
	for alert := range alertChan {
		// Convert interface{} to *pb.AlertNotification
		if alertNotification, ok := alert.(*pb.AlertNotification); ok {
			if err := stream.Send(alertNotification); err != nil {
				log.Printf("❌ Failed to send alert: %v", err)
				return err
			}
		} else {
			log.Printf("⚠️ Unexpected alert type: %T", alert)
		}
	}

	return nil
}

// Helper functions

func convertDashboardStatsToProto(stats *models.DashboardStats) *pb.DashboardStats {
	return &pb.DashboardStats{
		TotalVehicles:        uint32(stats.TotalVehicles),
		ActiveVehicles:       uint32(stats.ActiveVehicles),
		ParkedVehicles:       uint32(stats.ParkedVehicles),
		MaintenanceVehicles:  uint32(stats.MaintenanceVehicles),
		TotalDrivers:         uint32(stats.TotalDrivers),
		AvailableDrivers:     uint32(stats.AvailableDrivers),
		OnTripDrivers:        uint32(stats.OnTripDrivers),
		ActiveTrips:          uint32(stats.ActiveTrips),
		CompletedTripsToday:  uint32(stats.CompletedTripsToday),
		TodayRevenue:         stats.TodayRevenue,
		TodayFuelCost:        stats.TodayFuelCost,
		TodayProfit:          stats.TodayProfit,
		TodayDistance:        stats.TodayDistance,
		FleetEfficiency:      stats.FleetEfficiency,
		OnTimeDeliveryRate:   stats.OnTimeDeliveryRate,
		CustomerSatisfaction: stats.CustomerSatisfaction,
		FuelTheftSavings:     stats.FuelTheftSavings,
		CriticalAlerts:       uint32(stats.CriticalAlerts),
		FuelTheftAlerts:      uint32(stats.FuelTheftAlerts),
		ComplianceWarnings:   uint32(stats.ComplianceWarnings),
		MaintenanceDue:       uint32(stats.MaintenanceDue),
		RevenueTrend:         0.0, // Could be calculated from historical data
		EfficiencyTrend:      0.0, // Could be calculated from historical data
		CostTrend:            0.0, // Could be calculated from historical data
		LastUpdated:          timestamppb.New(stats.LastUpdated),
	}
}

func convertFleetPerformanceToProto(performance *models.FleetPerformance) *pb.FleetPerformance {
	pbPerformance := &pb.FleetPerformance{
		Period:               performance.Period,
		StartDate:            timestamppb.New(performance.StartDate),
		EndDate:              timestamppb.New(performance.EndDate),
		TotalTrips:           uint32(performance.TotalTrips),
		CompletedTrips:       uint32(performance.CompletedTrips),
		CancelledTrips:       uint32(performance.CancelledTrips),
		TotalDistance:        performance.TotalDistance,
		TotalRevenue:         performance.TotalRevenue,
		TotalFuelCost:        performance.TotalFuelCost,
		TotalMaintenanceCost: performance.TotalMaintenanceCost,
		NetProfit:            performance.NetProfit,
		CompletionRate:       performance.CompletionRate,
		OnTimeRate:           performance.OnTimeRate,
		AverageTripDuration:  performance.AverageTripDuration,
		AverageTripDistance:  performance.AverageTripDistance,
		RevenuePerKm:         performance.RevenuePerKm,
		CostPerKm:            performance.CostPerKm,
		FleetUtilization:     performance.FleetUtilization,
		DriverUtilization:    performance.DriverUtilization,
		FuelEfficiency:       performance.FuelEfficiency,
	}

	// Convert top performers
	pbPerformance.TopDrivers = make([]*pb.TopPerformer, len(performance.TopDrivers))
	for i, driver := range performance.TopDrivers {
		pbPerformance.TopDrivers[i] = &pb.TopPerformer{
			Id:          uint32(driver.ID),
			Name:        driver.Name,
			MetricValue: driver.MetricValue,
			TripsCount:  uint32(driver.TripsCount),
		}
	}

	pbPerformance.TopVehicles = make([]*pb.TopPerformer, len(performance.TopVehicles))
	for i, vehicle := range performance.TopVehicles {
		pbPerformance.TopVehicles[i] = &pb.TopPerformer{
			Id:          uint32(vehicle.ID),
			Name:        vehicle.Name,
			MetricValue: vehicle.MetricValue,
			TripsCount:  uint32(vehicle.TripsCount),
		}
	}

	// Convert daily breakdown
	pbPerformance.DailyBreakdown = make([]*pb.DailyPerformance, len(performance.DailyBreakdown))
	for i, daily := range performance.DailyBreakdown {
		pbPerformance.DailyBreakdown[i] = &pb.DailyPerformance{
			Date:           timestamppb.New(daily.Date),
			TripsCount:     uint32(daily.TripsCount),
			Distance:       daily.Distance,
			Revenue:        daily.Revenue,
			FuelCost:       daily.FuelCost,
			Efficiency:     daily.Efficiency,
			ActiveVehicles: uint32(daily.ActiveVehicles),
		}
	}

	return pbPerformance
}

func convertDriverPerformanceReportToProto(report *models.DriverPerformanceReport) *pb.DriverPerformanceReport {
	pbReport := &pb.DriverPerformanceReport{
		Period:      report.Period,
		GeneratedAt: timestamppb.New(report.GeneratedAt),
	}

	// Convert driver metrics
	pbReport.Drivers = make([]*pb.DriverPerformanceMetric, len(report.Drivers))
	for i, metric := range report.Drivers {
		pbReport.Drivers[i] = &pb.DriverPerformanceMetric{
			DriverId:              uint32(metric.DriverID),
			DriverName:            metric.DriverName,
			Rating:                metric.Rating,
			TotalTrips:            uint32(metric.TotalTrips),
			CompletedTrips:        uint32(metric.CompletedTrips),
			CompletionRate:        metric.CompletionRate,
			OnTimeRate:            metric.OnTimeRate,
			FuelEfficiency:        metric.FuelEfficiency,
			RevenueGenerated:      metric.RevenueGenerated,
			CustomerRating:        metric.CustomerRating,
			SafetyScore:           metric.SafetyScore,
			DistanceDriven:        metric.DistanceDriven,
			IncidentsCount:        uint32(metric.IncidentsCount),
			PerformanceGrade:      metric.PerformanceGrade,
			ImprovementPercentage: metric.ImprovementPercentage,
		}
	}

	// Convert fleet average
	pbReport.FleetAverage = &pb.DriverPerformanceMetric{
		DriverId:              0, // Fleet average doesn't have a specific driver ID
		DriverName:            "Fleet Average",
		Rating:                report.FleetAverage.Rating,
		TotalTrips:            uint32(report.FleetAverage.TotalTrips),
		CompletedTrips:        uint32(report.FleetAverage.CompletedTrips),
		CompletionRate:        report.FleetAverage.CompletionRate,
		OnTimeRate:            report.FleetAverage.OnTimeRate,
		FuelEfficiency:        report.FleetAverage.FuelEfficiency,
		RevenueGenerated:      report.FleetAverage.RevenueGenerated,
		CustomerRating:        report.FleetAverage.CustomerRating,
		SafetyScore:           report.FleetAverage.SafetyScore,
		DistanceDriven:        report.FleetAverage.DistanceDriven,
		IncidentsCount:        uint32(report.FleetAverage.IncidentsCount),
		PerformanceGrade:      report.FleetAverage.PerformanceGrade,
		ImprovementPercentage: report.FleetAverage.ImprovementPercentage,
	}

	return pbReport
}

func convertVehicleUtilizationReportToProto(report *models.VehicleUtilizationReport) *pb.VehicleUtilizationReport {
	pbReport := &pb.VehicleUtilizationReport{
		Period:      report.Period,
		GeneratedAt: timestamppb.New(report.GeneratedAt),
	}

	// Convert vehicle metrics
	pbReport.Vehicles = make([]*pb.VehicleUtilizationMetric, len(report.Vehicles))
	for i, metric := range report.Vehicles {
		pbReport.Vehicles[i] = &pb.VehicleUtilizationMetric{
			VehicleId:        uint32(metric.VehicleID),
			LicensePlate:     metric.LicensePlate,
			UtilizationRate:  metric.UtilizationRate,
			TotalTrips:       uint32(metric.TotalTrips),
			TotalDistance:    metric.TotalDistance,
			FuelEfficiency:   metric.FuelEfficiency,
			RevenueGenerated: metric.RevenueGenerated,
			MaintenanceCost:  metric.MaintenanceCost,
			ProfitMargin:     metric.ProfitMargin,
			IdleHours:        uint32(metric.IdleHours),
			MaintenanceHours: uint32(metric.MaintenanceHours),
			PerformanceGrade: metric.PerformanceGrade,
			CostPerKm:        metric.CostPerKm,
			RevenuePerKm:     metric.RevenuePerKm,
		}
	}

	// Convert fleet average
	pbReport.FleetAverage = &pb.VehicleUtilizationMetric{
		VehicleId:        0, // Fleet average doesn't have a specific vehicle ID
		LicensePlate:     "Fleet Average",
		UtilizationRate:  report.FleetAverage.UtilizationRate,
		TotalTrips:       uint32(report.FleetAverage.TotalTrips),
		TotalDistance:    report.FleetAverage.TotalDistance,
		FuelEfficiency:   report.FleetAverage.FuelEfficiency,
		RevenueGenerated: report.FleetAverage.RevenueGenerated,
		MaintenanceCost:  report.FleetAverage.MaintenanceCost,
		ProfitMargin:     report.FleetAverage.ProfitMargin,
		IdleHours:        uint32(report.FleetAverage.IdleHours),
		MaintenanceHours: uint32(report.FleetAverage.MaintenanceHours),
		PerformanceGrade: report.FleetAverage.PerformanceGrade,
		CostPerKm:        report.FleetAverage.CostPerKm,
		RevenuePerKm:     report.FleetAverage.RevenuePerKm,
	}

	return pbReport
}

func convertFuelEfficiencyReportToProto(report *models.FuelEfficiencyReport) *pb.FuelEfficiencyReport {
	pbReport := &pb.FuelEfficiencyReport{
		Period:                 report.Period,
		FleetAverageEfficiency: report.FleetAverageEfficiency,
		TargetEfficiency:       report.TargetEfficiency,
		EfficiencyVariance:     report.EfficiencyVariance,
		TotalFuelCost:          report.TotalFuelCost,
		PotentialSavings:       report.PotentialSavings,
		GeneratedAt:            timestamppb.New(report.GeneratedAt),
	}

	// Convert vehicle efficiency metrics
	pbReport.Vehicles = make([]*pb.VehicleFuelEfficiency, len(report.Vehicles))
	for i, metric := range report.Vehicles {
		pbReport.Vehicles[i] = &pb.VehicleFuelEfficiency{
			VehicleId:          uint32(metric.VehicleID),
			LicensePlate:       metric.LicensePlate,
			Efficiency:         metric.Efficiency,
			TargetEfficiency:   metric.TargetEfficiency,
			VariancePercentage: metric.VariancePercentage,
			FuelCost:           metric.FuelCost,
			TripsCount:         uint32(metric.TripsCount),
			Distance:           metric.Distance,
			EfficiencyGrade:    metric.EfficiencyGrade,
		}
	}

	// Convert driver efficiency metrics
	pbReport.Drivers = make([]*pb.DriverFuelEfficiency, len(report.Drivers))
	for i, metric := range report.Drivers {
		pbReport.Drivers[i] = &pb.DriverFuelEfficiency{
			DriverId:           uint32(metric.DriverID),
			DriverName:         metric.DriverName,
			Efficiency:         metric.Efficiency,
			TargetEfficiency:   metric.TargetEfficiency,
			VariancePercentage: metric.VariancePercentage,
			TripsCount:         uint32(metric.TripsCount),
			EfficiencyGrade:    metric.EfficiencyGrade,
		}
	}

	// Convert daily trends
	pbReport.DailyTrends = make([]*pb.DailyFuelEfficiency, len(report.DailyTrends))
	for i, trend := range report.DailyTrends {
		pbReport.DailyTrends[i] = &pb.DailyFuelEfficiency{
			Date:              timestamppb.New(trend.Date),
			AverageEfficiency: trend.AverageEfficiency,
			FuelCost:          trend.FuelCost,
			VehiclesActive:    uint32(trend.VehiclesActive),
		}
	}

	return pbReport
}

func convertRevenueAnalyticsToProto(analytics *models.RevenueAnalytics) *pb.RevenueAnalytics {
	pbAnalytics := &pb.RevenueAnalytics{
		Period:                  analytics.Period,
		TotalRevenue:            analytics.TotalRevenue,
		TotalCosts:              analytics.TotalCosts,
		NetProfit:               analytics.NetProfit,
		ProfitMargin:            analytics.ProfitMargin,
		FuelCosts:               analytics.FuelCosts,
		MaintenanceCosts:        analytics.MaintenanceCosts,
		DriverCosts:             analytics.DriverCosts,
		OverheadCosts:           analytics.OverheadCosts,
		ProjectedMonthlyRevenue: analytics.ProjectedMonthlyRevenue,
		ProjectedMonthlyProfit:  analytics.ProjectedMonthlyProfit,
		GeneratedAt:             timestamppb.New(analytics.GeneratedAt),
	}

	// Convert revenue sources
	pbAnalytics.RevenueSources = make([]*pb.RevenueSource, len(analytics.RevenueSources))
	for i, source := range analytics.RevenueSources {
		pbAnalytics.RevenueSources[i] = &pb.RevenueSource{
			SourceType:        source.SourceType,
			Revenue:           source.Revenue,
			TripsCount:        uint32(source.TripsCount),
			AveragePerTrip:    source.AveragePerTrip,
			PercentageOfTotal: source.PercentageOfTotal,
		}
	}

	// Convert daily trends
	pbAnalytics.DailyTrends = make([]*pb.DailyRevenue, len(analytics.DailyTrends))
	for i, trend := range analytics.DailyTrends {
		pbAnalytics.DailyTrends[i] = &pb.DailyRevenue{
			Date:       timestamppb.New(trend.Date),
			Revenue:    trend.Revenue,
			Costs:      trend.Costs,
			Profit:     trend.Profit,
			TripsCount: uint32(trend.TripsCount),
		}
	}

	return pbAnalytics
}

func convertComplianceReportToProto(report *models.ComplianceReport) *pb.ComplianceReport {
	pbReport := &pb.ComplianceReport{
		OverallScore:         report.OverallScore,
		TotalDrivers:         uint32(report.TotalDrivers),
		CompliantDrivers:     uint32(report.CompliantDrivers),
		LicenseExpiring:      uint32(report.LicenseExpiring),
		MedicalCertExpiring:  uint32(report.MedicalCertExpiring),
		TotalVehicles:        uint32(report.TotalVehicles),
		CompliantVehicles:    uint32(report.CompliantVehicles),
		RegistrationExpiring: uint32(report.RegistrationExpiring),
		InsuranceExpiring:    uint32(report.InsuranceExpiring),
		MaintenanceDue:       uint32(report.MaintenanceDue),
		GeneratedAt:          timestamppb.New(report.GeneratedAt),
	}

	// Convert vehicle compliance
	pbReport.VehicleCompliance = make([]*pb.VehicleCompliance, len(report.VehicleCompliance))
	for i, compliance := range report.VehicleCompliance {
		pbReport.VehicleCompliance[i] = &pb.VehicleCompliance{
			VehicleId:                uint32(compliance.VehicleID),
			LicensePlate:             compliance.LicensePlate,
			ComplianceScore:          compliance.ComplianceScore,
			RegistrationStatus:       compliance.RegistrationStatus,
			RegistrationDaysToExpiry: int32(compliance.RegistrationDaysToExpiry),
			InsuranceStatus:          compliance.InsuranceStatus,
			InsuranceDaysToExpiry:    int32(compliance.InsuranceDaysToExpiry),
			MaintenanceDue:           compliance.MaintenanceDue,
			Issues:                   compliance.Issues,
		}
	}

	// Convert driver compliance
	pbReport.DriverCompliance = make([]*pb.DriverCompliance, len(report.DriverCompliance))
	for i, compliance := range report.DriverCompliance {
		pbReport.DriverCompliance[i] = &pb.DriverCompliance{
			DriverId:                uint32(compliance.DriverID),
			DriverName:              compliance.DriverName,
			ComplianceScore:         compliance.ComplianceScore,
			LicenseStatus:           compliance.LicenseStatus,
			LicenseDaysToExpiry:     int32(compliance.LicenseDaysToExpiry),
			MedicalCertStatus:       compliance.MedicalCertStatus,
			MedicalCertDaysToExpiry: int32(compliance.MedicalCertDaysToExpiry),
			Issues:                  compliance.Issues,
		}
	}

	// Convert critical issues
	pbReport.CriticalIssues = make([]*pb.ComplianceIssue, len(report.CriticalIssues))
	for i, issue := range report.CriticalIssues {
		pbReport.CriticalIssues[i] = &pb.ComplianceIssue{
			IssueType:     issue.IssueType,
			Severity:      convertAlertSeverity(issue.Severity),
			Description:   issue.Description,
			AffectedCount: uint32(issue.AffectedCount),
			Deadline:      timestamppb.New(issue.Deadline),
			AffectedIds:   convertUintSliceToUint32Slice(issue.AffectedIDs),
		}
	}

	return pbReport
}

func convertSystemSettingsToProto(settings *models.SystemSettings) *pb.SystemSettings {
	// Convert Go model to map[string]string as expected by proto
	settingsMap := make(map[string]string)
	settingsMap["company_name"] = settings.CompanyName
	settingsMap["company_address"] = settings.CompanyAddress
	settingsMap["company_phone"] = settings.CompanyPhone
	settingsMap["company_email"] = settings.CompanyEmail
	settingsMap["time_zone"] = settings.TimeZone
	settingsMap["currency"] = settings.Currency
	settingsMap["date_format"] = settings.DateFormat
	settingsMap["distance_unit"] = settings.DistanceUnit
	settingsMap["fuel_unit"] = settings.FuelUnit
	settingsMap["default_language"] = settings.DefaultLanguage

	return &pb.SystemSettings{
		Settings:    settingsMap,
		LastUpdated: timestamppb.New(settings.UpdatedAt),
		UpdatedBy:   0, // TODO: Add updated_by field to SystemSettings model
	}
}

/*
func convertProtoToSystemSettings(pbSettings *pb.SystemSettings) *models.SystemSettings {
...
}
*/

/*
func convertAuditLogToProto(log *models.AuditLog) *pb.AuditLog {
...
}
*/

/*
func convertSecurityEventToProto(event *models.SecurityEvent) *pb.SecurityEvent {
...
}
*/

// TODO: Add these helper functions when protobuf definitions are updated
/*
func convertAlertSettingsToProto(settings *models.AlertSettings) *pb.AlertSettings {
	if settings == nil {
		return nil
	}
	return &pb.AlertSettings{
		FuelTheftAlert:      settings.FuelTheftAlert,
		SpeedingAlert:       settings.SpeedingAlert,
		RouteDeviationAlert: settings.RouteDeviationAlert,
		MaintenanceAlert:    settings.MaintenanceAlert,
		ComplianceAlert:     settings.ComplianceAlert,
		GeofenceAlert:       settings.GeofenceAlert,
	}
}

func convertNotificationSettingsToProto(settings *models.NotificationSettings) *pb.NotificationSettings {
	if settings == nil {
		return nil
	}
	return &pb.NotificationSettings{
		EmailNotifications:    settings.EmailNotifications,
		SmsNotifications:      settings.SMSNotifications,
		PushNotifications:     settings.PushNotifications,
		WhatsappNotifications: settings.WhatsappNotifications,
	}
}

func convertSecuritySettingsToProto(settings *models.SecuritySettings) *pb.SecuritySettings {
	if settings == nil {
		return nil
	}
	return &pb.SecuritySettings{
		PasswordMinLength:     uint32(settings.PasswordMinLength),
		PasswordRequireUpper:  settings.PasswordRequireUpper,
		PasswordRequireLower:  settings.PasswordRequireLower,
		PasswordRequireDigit:  settings.PasswordRequireDigit,
		PasswordRequireSymbol: settings.PasswordRequireSymbol,
		SessionTimeoutMinutes: uint32(settings.SessionTimeoutMinutes),
		MaxLoginAttempts:      uint32(settings.MaxLoginAttempts),
		TwoFactorEnabled:      settings.TwoFactorEnabled,
	}
}

*/

// Helper function to convert []uint to []uint32
func convertUintSliceToUint32Slice(uints []uint) []uint32 {
	result := make([]uint32, len(uints))
	for i, v := range uints {
		result[i] = uint32(v)
	}
	return result
}
