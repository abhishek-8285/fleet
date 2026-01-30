package server

import (
	"context"
	"io"
	"log"
	"time"

	"github.com/fleetflow/backend/internal/models"
	"github.com/fleetflow/backend/internal/services"
	pb "github.com/fleetflow/backend/proto/gen"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// FuelServer implements the FuelService gRPC service
type FuelServer struct {
	pb.UnimplementedFuelServiceServer
	services *services.Container
}

// NewFuelServer creates a new FuelServer
func NewFuelServer(services *services.Container) *FuelServer {
	return &FuelServer{
		services: services,
	}
}

// GetFuelEvents gets paginated fuel events
func (s *FuelServer) GetFuelEvents(ctx context.Context, req *pb.GetFuelEventsRequest) (*pb.GetFuelEventsResponse, error) {
	log.Printf("⛽ GetFuelEvents request")

	// Get pagination parameters
	page := int(req.Pagination.Page)
	if page < 1 {
		page = 1
	}
	limit := int(req.Pagination.Limit)
	if limit < 1 || limit > 100 {
		limit = 20
	}

	// Build filters
	filters := make(map[string]interface{})
	if req.Filters != nil {
		if req.Filters.Search != "" {
			filters["search"] = req.Filters.Search
		}
		if req.Filters.Status != "" {
			filters["status"] = req.Filters.Status
		}
		if req.Filters.StartDate != nil {
			filters["start_date"] = req.Filters.StartDate.AsTime()
		}
		if req.Filters.EndDate != nil {
			filters["end_date"] = req.Filters.EndDate.AsTime()
		}
	}

	if req.StatusFilter != pb.FuelEventStatus_FUEL_EVENT_STATUS_UNSPECIFIED {
		filters["status"] = convertPBFuelEventStatus(req.StatusFilter)
	}
	if req.VehicleId > 0 {
		filters["vehicle_id"] = uint(req.VehicleId)
	}
	if req.DriverId > 0 {
		filters["driver_id"] = uint(req.DriverId)
	}
	if req.SuspiciousOnly {
		filters["suspicious_only"] = true
	}

	// Get fuel events via service
	fuelEvents, total, err := s.services.FuelService.GetFuelEvents(page, limit, filters)
	if err != nil {
		log.Printf("❌ Failed to get fuel events: %v", err)
		return nil, status.Error(codes.Internal, "failed to get fuel events")
	}

	// Convert to protobuf
	pbEvents := make([]*pb.FuelEvent, len(fuelEvents))
	for i, event := range fuelEvents {
		pbEvents[i] = s.convertFuelEventToProto(&event)
	}

	// Calculate pagination
	totalPages := int32((total + int64(limit) - 1) / int64(limit))

	return &pb.GetFuelEventsResponse{
		Events: pbEvents,
		Pagination: &pb.Pagination{
			Page:       int32(page),
			Limit:      int32(limit),
			Total:      int32(total),
			TotalPages: totalPages,
		},
	}, nil
}

// CreateFuelEvent creates a new fuel event
func (s *FuelServer) CreateFuelEvent(ctx context.Context, req *pb.CreateFuelEventRequest) (*pb.FuelEvent, error) {
	log.Printf("⛽ CreateFuelEvent request for vehicle: %d", req.VehicleId)

	// Validate input
	if req.Liters <= 0 || req.AmountInr <= 0 {
		return nil, status.Error(codes.InvalidArgument, "liters and amount must be positive")
	}

	// Helper functions for pointers
	float64Ptr := func(f float64) *float64 { return &f }
	uintPtr := func(u uint) *uint { return &u }

	// Convert request to model
	fuelEvent := &models.FuelEvent{
		Liters:          req.Liters,
		AmountINR:       req.AmountInr,
		PricePerLiter:   req.PricePerLiter,
		OdometerKm:      req.OdometerKm,
		FuelType:        req.FuelType,
		Location:        req.Location,
		Latitude:        float64Ptr(req.Latitude),
		Longitude:       float64Ptr(req.Longitude),
		StationName:     req.StationName,
		StationBrand:    req.StationBrand,
		ReceiptNumber:   req.ReceiptNumber,
		ReceiptPhotoURL: req.ReceiptPhotoUrl,
		DriverID:        uintPtr(uint(req.DriverId)),
		VehicleID:       uint(req.VehicleId),
		TripID:          uintPtr(uint(req.TripId)),
		Status:          models.FuelEventStatus("pending"),
		IsAuthorized:    true, // Will be validated by fraud detection
	}

	// Create fuel event via service
	createdEvent, err := s.services.FuelService.CreateFuelEvent(fuelEvent)
	if err != nil {
		log.Printf("❌ Failed to create fuel event: %v", err)
		return nil, status.Error(codes.Internal, "failed to create fuel event")
	}

	return s.convertFuelEventToProto(createdEvent), nil
}

// GetFuelEvent gets fuel event by ID
func (s *FuelServer) GetFuelEvent(ctx context.Context, req *pb.GetFuelEventRequest) (*pb.FuelEvent, error) {
	log.Printf("⛽ GetFuelEvent request for ID: %d", req.Id)

	fuelEvent, err := s.services.FuelService.GetFuelEventByID(uint(req.Id))
	if err != nil {
		log.Printf("❌ Failed to get fuel event: %v", err)
		return nil, status.Error(codes.NotFound, "fuel event not found")
	}

	return s.convertFuelEventToProto(fuelEvent), nil
}

// VerifyFuelEvent verifies a fuel event
func (s *FuelServer) VerifyFuelEvent(ctx context.Context, req *pb.VerifyFuelEventRequest) (*pb.SuccessResponse, error) {
	log.Printf("⛽ VerifyFuelEvent request for ID: %d", req.Id)

	// Get user ID from context (would be set by auth middleware)
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "authentication required")
	}

	err = s.services.FuelService.VerifyFuelEvent(uint(req.Id), userID, req.VerificationNotes)
	if err != nil {
		log.Printf("❌ Failed to verify fuel event: %v", err)
		return nil, status.Error(codes.Internal, "failed to verify fuel event")
	}

	return &pb.SuccessResponse{
		Message: "Fuel event verified successfully",
		Success: true,
	}, nil
}

// RejectFuelEvent rejects a fuel event
func (s *FuelServer) RejectFuelEvent(ctx context.Context, req *pb.RejectFuelEventRequest) (*pb.SuccessResponse, error) {
	log.Printf("⛽ RejectFuelEvent request for ID: %d", req.Id)

	// Get user ID from context
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "authentication required")
	}

	err = s.services.FuelService.RejectFuelEvent(uint(req.Id), userID, req.Reason)
	if err != nil {
		log.Printf("❌ Failed to reject fuel event: %v", err)
		return nil, status.Error(codes.Internal, "failed to reject fuel event")
	}

	return &pb.SuccessResponse{
		Message: "Fuel event rejected successfully",
		Success: true,
	}, nil
}

// GetFuelAnalytics gets fuel analytics
func (s *FuelServer) GetFuelAnalytics(ctx context.Context, req *pb.GetFuelAnalyticsRequest) (*pb.FuelAnalytics, error) {
	log.Printf("⛽ GetFuelAnalytics request for period: %s", req.Period)

	analytics, err := s.services.FuelService.GetFuelAnalytics(req.Period, req.StartDate.AsTime(), req.EndDate.AsTime())
	if err != nil {
		log.Printf("❌ Failed to get fuel analytics: %v", err)
		return nil, status.Error(codes.Internal, "failed to get fuel analytics")
	}

	// Convert to protobuf
	pbAnalytics := &pb.FuelAnalytics{
		Period:                analytics.Period,
		StartDate:             timestamppb.New(analytics.StartDate),
		EndDate:               timestamppb.New(analytics.EndDate),
		TotalFuelConsumed:     analytics.TotalFuelConsumed,
		TotalFuelCost:         analytics.TotalFuelCost,
		AverageFuelEfficiency: analytics.AverageFuelEfficiency,
		CostPerKilometer:      analytics.CostPerKilometer,
		NumberOfRefuels:       uint32(analytics.NumberOfRefuels),
		SuspiciousEvents:      uint32(analytics.SuspiciousEvents),
		TheftSavings:          analytics.TheftSavings,
	}

	// Convert vehicle summaries
	pbAnalytics.TopEfficientVehicles = make([]*pb.VehicleFuelSummary, len(analytics.TopEfficientVehicles))
	for i, summary := range analytics.TopEfficientVehicles {
		pbAnalytics.TopEfficientVehicles[i] = &pb.VehicleFuelSummary{
			VehicleId:        uint32(summary.ID),
			LicensePlate:     summary.Name,               // Name represents vehicle plate for vehicles
			FuelEfficiency:   summary.MetricValue,        // MetricValue contains the efficiency
			TotalCost:        0,                          // Mock for now
			SuspiciousEvents: uint32(summary.TripsCount), // Using trips count as placeholder
		}
	}

	// Convert daily trends
	pbAnalytics.DailyTrends = make([]*pb.DailyFuelSummary, len(analytics.DailyTrends))
	for i, trend := range analytics.DailyTrends {
		pbAnalytics.DailyTrends[i] = &pb.DailyFuelSummary{
			Date:              timestamppb.New(trend.Date),
			TotalFuel:         trend.FuelConsumed,
			TotalCost:         trend.Cost,
			AverageEfficiency: trend.Efficiency,
			EventsCount:       uint32(trend.EventsCount),
		}
	}

	return pbAnalytics, nil
}

// ==== REAL-TIME STREAMING SERVICES ====

// StreamFuelTheftAlerts streams fuel theft alerts in real-time
func (s *FuelServer) StreamFuelTheftAlerts(req *pb.FuelTheftMonitorRequest, stream pb.FuelService_StreamFuelTheftAlertsServer) error {
	log.Printf("🚀 StreamFuelTheftAlerts started - REAL-TIME FUEL THEFT DETECTION!")

	// Set up parameters
	theftThreshold := req.TheftThresholdPercentage
	if theftThreshold == 0 {
		theftThreshold = 15.0 // Default 15% variance threshold
	}

	// Set up alert channel
	alertChan := make(chan *models.FuelTheftAlert, 100)

	// Subscribe to fuel theft alerts
	unsubscribe := s.services.FuelService.SubscribeToTheftAlerts(req.VehicleIds, theftThreshold, alertChan)
	defer unsubscribe()

	// Stream alerts
	for {
		select {
		case alert := <-alertChan:
			// Filter by severity
			if req.MinSeverity != pb.AlertSeverity_ALERT_SEVERITY_UNSPECIFIED {
				if convertAlertSeverity(alert.Severity) < req.MinSeverity {
					continue
				}
			}

			pbAlert := &pb.FuelTheftAlert{
				VehicleId:  uint32(alert.VehicleID),
				DetectedAt: timestamppb.New(alert.DetectedAt),
			}

			if err := stream.Send(pbAlert); err != nil {
				log.Printf("❌ Failed to send fuel theft alert: %v", err)
				return err
			}

		case <-stream.Context().Done():
			log.Printf("⛽ StreamFuelTheftAlerts ended")
			return nil
		}
	}
}

// StreamFuelAnomalies streams fuel consumption anomalies
func (s *FuelServer) StreamFuelAnomalies(req *pb.FuelAnomalyRequest, stream pb.FuelService_StreamFuelAnomaliesServer) error {
	log.Printf("🚀 StreamFuelAnomalies started - REAL-TIME ANOMALY DETECTION!")

	// Set up anomaly detection parameters
	anomalyThreshold := req.AnomalyThreshold
	if anomalyThreshold == 0 {
		anomalyThreshold = 2.0 // Default 2 standard deviations
	}

	// Set up anomaly channel
	anomalyChan := make(chan *models.FuelAnomaly, 100)

	// Subscribe to fuel anomalies
	unsubscribe := s.services.FuelService.SubscribeToAnomalies(req.VehicleIds, anomalyThreshold, anomalyChan)
	defer unsubscribe()

	// Stream anomalies
	for {
		select {
		case anomaly := <-anomalyChan:
			pbAnomaly := &pb.FuelAnomaly{
				VehicleId:    uint32(anomaly.VehicleID),
				AnomalyType:  anomaly.AnomalyType,
				AnomalyScore: anomaly.AnomalyScore,
				Description:  anomaly.Description,
				DetectedAt:   timestamppb.New(anomaly.DetectedAt),
			}

			if err := stream.Send(pbAnomaly); err != nil {
				log.Printf("❌ Failed to send fuel anomaly: %v", err)
				return err
			}

		case <-stream.Context().Done():
			log.Printf("⛽ StreamFuelAnomalies ended")
			return nil
		}
	}
}

// StreamFuelEfficiency streams fuel efficiency updates
func (s *FuelServer) StreamFuelEfficiency(req *pb.FuelEfficiencyRequest, stream pb.FuelService_StreamFuelEfficiencyServer) error {
	log.Printf("🚀 StreamFuelEfficiency started - REAL-TIME EFFICIENCY MONITORING!")

	// Set up update interval
	updateInterval := time.Duration(req.UpdateIntervalMinutes) * time.Minute
	if updateInterval == 0 {
		updateInterval = 30 * time.Minute // Default 30 minutes
	}

	// Set up ticker for periodic updates
	ticker := time.NewTicker(updateInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			// Get fuel efficiency updates for requested vehicles
			efficiencyUpdates, err := s.services.FuelService.GetFuelEfficiencyUpdates(req.VehicleIds, updateInterval)
			if err != nil {
				log.Printf("❌ Failed to get fuel efficiency updates: %v", err)
				continue
			}

			// Send updates
			for _, update := range efficiencyUpdates {
				pbUpdate := &pb.FuelEfficiencyUpdate{
					VehicleId:         uint32(update.VehicleID),
					CurrentEfficiency: update.CurrentEfficiency,
				}

				if err := stream.Send(pbUpdate); err != nil {
					log.Printf("❌ Failed to send fuel efficiency update: %v", err)
					return err
				}
			}

		case <-stream.Context().Done():
			log.Printf("⛽ StreamFuelEfficiency ended")
			return nil
		}
	}
}

// ProcessFuelEvents handles bidirectional fuel event processing
func (s *FuelServer) ProcessFuelEvents(stream pb.FuelService_ProcessFuelEventsServer) error {
	log.Printf("🚀 ProcessFuelEvents started - BIDIRECTIONAL FUEL EVENT PROCESSING!")

	for {
		batch, err := stream.Recv()
		if err == io.EOF {
			log.Printf("⛽ ProcessFuelEvents stream ended")
			return nil
		}
		if err != nil {
			log.Printf("❌ ProcessFuelEvents stream error: %v", err)
			return err
		}

		// Process fuel event batch
		results, err := s.processFuelEventBatch(batch)
		if err != nil {
			log.Printf("❌ Failed to process fuel event batch: %v", err)
			continue
		}

		// Send results back
		if err := stream.Send(results); err != nil {
			log.Printf("❌ Failed to send fuel event results: %v", err)
			return err
		}
	}
}

// Helper function to process fuel event batch
func (s *FuelServer) processFuelEventBatch(batch *pb.FuelEventBatch) (*pb.FuelEventResult, error) {
	log.Printf("⛽ Processing fuel event batch: %s with %d events", batch.BatchId, len(batch.Events))

	results := &pb.FuelEventResult{
		BatchId: batch.BatchId,
		Results: make([]*pb.FuelEventProcessingResult, len(batch.Events)),
	}

	processedCount := 0
	suspiciousCount := 0
	verifiedCount := 0

	// Process each event
	for i, event := range batch.Events {
		// Convert to internal model
		fuelEvent := s.convertProtoToFuelEvent(event)

		// Run fraud detection
		fraudScore, fraudReason, warnings := s.services.FuelService.RunFraudDetection(fuelEvent)

		// Determine status
		status := pb.FuelEventStatus_FUEL_EVENT_STATUS_VERIFIED
		requiresReview := false

		if fraudScore > 0.7 {
			status = pb.FuelEventStatus_FUEL_EVENT_STATUS_SUSPICIOUS
			requiresReview = true
			suspiciousCount++
		} else if fraudScore > 0.3 {
			status = pb.FuelEventStatus_FUEL_EVENT_STATUS_PENDING
			requiresReview = true
		} else {
			verifiedCount++
		}

		results.Results[i] = &pb.FuelEventProcessingResult{
			FuelEventId:          event.Id,
			Status:               status,
			FraudScore:           fraudScore,
			FraudReason:          fraudReason,
			Warnings:             warnings,
			RequiresManualReview: requiresReview,
		}

		processedCount++
	}

	results.ProcessedCount = uint32(processedCount)
	results.SuspiciousCount = uint32(suspiciousCount)
	results.VerifiedCount = uint32(verifiedCount)

	return results, nil
}

// Helper functions
func (s *FuelServer) convertFuelEventToProto(event *models.FuelEvent) *pb.FuelEvent {
	return &pb.FuelEvent{
		Id:            uint32(event.ID),
		Liters:        event.Liters,
		AmountInr:     event.AmountINR,
		PricePerLiter: event.PricePerLiter,
		OdometerKm:    event.OdometerKm,
		FuelType:      event.FuelType,
		Status:        convertFuelEventStatus(string(event.Status)),
		Location:      event.Location,
		Latitude: func() float64 {
			if event.Latitude != nil {
				return *event.Latitude
			}
			return 0
		}(),
		Longitude: func() float64 {
			if event.Longitude != nil {
				return *event.Longitude
			}
			return 0
		}(),
		StationName:     event.StationName,
		StationBrand:    event.StationBrand,
		StationId:       event.StationID,
		ReceiptNumber:   event.ReceiptNumber,
		ReceiptPhotoUrl: event.ReceiptPhotoURL,
		VerifiedBy: func() uint32 {
			if event.VerifiedBy != nil {
				return uint32(*event.VerifiedBy)
			}
			return 0
		}(),
		VerifiedAt: func() *timestamppb.Timestamp {
			if event.VerifiedAt != nil {
				return timestamppb.New(*event.VerifiedAt)
			}
			return nil
		}(),
		VerificationNotes: event.VerificationNotes,
		IsAuthorized:      event.IsAuthorized,
		FraudScore:        event.FraudScore,
		FraudReason:       event.FraudReason,
		CreatedAt:         timestamppb.New(event.CreatedAt),
		UpdatedAt:         timestamppb.New(event.UpdatedAt),
		DriverId: func() uint32 {
			if event.DriverID != nil {
				return uint32(*event.DriverID)
			}
			return 0
		}(),
		VehicleId: uint32(event.VehicleID),
		TripId: func() uint32 {
			if event.TripID != nil {
				return uint32(*event.TripID)
			}
			return 0
		}(),
		DriverName:   event.DriverName,
		VehiclePlate: event.VehiclePlate,
	}
}

func (s *FuelServer) convertProtoToFuelEvent(pb *pb.FuelEvent) *models.FuelEvent {
	// Helper functions for pointers
	float64Ptr := func(f float64) *float64 { return &f }
	uintPtr := func(u uint) *uint { return &u }

	return &models.FuelEvent{
		ID:              uint(pb.Id),
		Liters:          pb.Liters,
		AmountINR:       pb.AmountInr,
		PricePerLiter:   pb.PricePerLiter,
		OdometerKm:      pb.OdometerKm,
		FuelType:        pb.FuelType,
		Status:          models.FuelEventStatus(convertPBFuelEventStatus(pb.Status)),
		Location:        pb.Location,
		Latitude:        float64Ptr(pb.Latitude),
		Longitude:       float64Ptr(pb.Longitude),
		StationName:     pb.StationName,
		StationBrand:    pb.StationBrand,
		ReceiptNumber:   pb.ReceiptNumber,
		ReceiptPhotoURL: pb.ReceiptPhotoUrl,
		DriverID:        uintPtr(uint(pb.DriverId)),
		VehicleID:       uint(pb.VehicleId),
		TripID:          uintPtr(uint(pb.TripId)),
	}
}

// Conversion helper functions
func convertFuelEventStatus(status string) pb.FuelEventStatus {
	switch status {
	case "pending":
		return pb.FuelEventStatus_FUEL_EVENT_STATUS_PENDING
	case "verified":
		return pb.FuelEventStatus_FUEL_EVENT_STATUS_VERIFIED
	case "suspicious":
		return pb.FuelEventStatus_FUEL_EVENT_STATUS_SUSPICIOUS
	case "rejected":
		return pb.FuelEventStatus_FUEL_EVENT_STATUS_REJECTED
	default:
		return pb.FuelEventStatus_FUEL_EVENT_STATUS_UNSPECIFIED
	}
}

func convertPBFuelEventStatus(status pb.FuelEventStatus) string {
	switch status {
	case pb.FuelEventStatus_FUEL_EVENT_STATUS_PENDING:
		return "pending"
	case pb.FuelEventStatus_FUEL_EVENT_STATUS_VERIFIED:
		return "verified"
	case pb.FuelEventStatus_FUEL_EVENT_STATUS_SUSPICIOUS:
		return "suspicious"
	case pb.FuelEventStatus_FUEL_EVENT_STATUS_REJECTED:
		return "rejected"
	default:
		return "pending"
	}
}

/*
func convertFuelAlertType(alertType string) pb.FuelAlertType {
...
}
*/
