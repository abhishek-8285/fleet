package server

import (
	"context"
	"log"
	"time"

	"github.com/fleetflow/backend/internal/models"
	"github.com/fleetflow/backend/internal/services"
	pb "github.com/fleetflow/backend/proto/gen"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// DriverServer implements the DriverService gRPC service
type DriverServer struct {
	pb.UnimplementedDriverServiceServer
	services *services.Container
}

// NewDriverServer creates a new DriverServer
func NewDriverServer(services *services.Container) *DriverServer {
	return &DriverServer{
		services: services,
	}
}

// GetDrivers returns paginated list of drivers
func (s *DriverServer) GetDrivers(ctx context.Context, req *pb.GetDriversRequest) (*pb.GetDriversResponse, error) {
	log.Printf("🚗 GetDrivers request")

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
		if req.Filters.IsActive {
			filters["is_active"] = req.Filters.IsActive
		}
	}

	if req.LicenseExpiring {
		filters["license_expiring"] = true
	}

	// Get drivers via service
	drivers, total, err := s.services.DriverService.GetDrivers(page, limit, filters)
	if err != nil {
		log.Printf("❌ Failed to get drivers: %v", err)
		return nil, status.Error(codes.Internal, "failed to get drivers")
	}

	// Convert to protobuf
	pbDrivers := make([]*pb.Driver, len(drivers))
	for i, driver := range drivers {
		pbDrivers[i] = s.convertDriverToProto(&driver)
	}

	// Calculate pagination
	totalPages := int32((total + int64(limit) - 1) / int64(limit))

	return &pb.GetDriversResponse{
		Drivers: pbDrivers,
		Pagination: &pb.Pagination{
			Page:       int32(page),
			Limit:      int32(limit),
			Total:      int32(total),
			TotalPages: totalPages,
		},
	}, nil
}

// Helper function to get time pointer
func timePtr(t time.Time) *time.Time { return &t }

// CreateDriver creates a new driver
func (s *DriverServer) CreateDriver(ctx context.Context, req *pb.CreateDriverRequest) (*pb.Driver, error) {
	log.Printf("🚗 CreateDriver request for: %s", req.Name)

	// Validate input
	if req.Name == "" || req.Phone == "" {
		return nil, status.Error(codes.InvalidArgument, "name and phone are required")
	}

	// Convert request to model
	driver := &models.Driver{
		Name:              req.Name,
		Phone:             req.Phone,
		LicenseNumber:     req.LicenseNumber,
		LicenseExpiry:     timePtr(req.LicenseExpiry.AsTime()),
		MedicalCertExpiry: timePtr(req.MedicalCertExpiry.AsTime()),
		Address:           req.Address,
		DateOfBirth:       timePtr(req.DateOfBirth.AsTime()),
		EmergencyName:     req.EmergencyName,
		EmergencyPhone:    req.EmergencyPhone,
		HiredAt:           timePtr(req.HiredAt.AsTime()),
		Status:            models.DriverStatus("available"),
		IsActive:          true,
	}

	// Create driver via service
	createdDriver, err := s.services.DriverService.CreateDriver(driver)
	if err != nil {
		log.Printf("❌ Failed to create driver: %v", err)
		return nil, status.Error(codes.Internal, "failed to create driver")
	}

	return s.convertDriverToProto(createdDriver), nil
}

// GetDriver gets driver by ID
func (s *DriverServer) GetDriver(ctx context.Context, req *pb.GetDriverRequest) (*pb.Driver, error) {
	log.Printf("🚗 GetDriver request for ID: %d", req.Id)

	driver, err := s.services.DriverService.GetDriverByID(uint(req.Id))
	if err != nil {
		log.Printf("❌ Failed to get driver: %v", err)
		return nil, status.Error(codes.NotFound, "driver not found")
	}

	return s.convertDriverToProto(driver), nil
}

// UpdateDriver updates a driver
func (s *DriverServer) UpdateDriver(ctx context.Context, req *pb.UpdateDriverRequest) (*pb.Driver, error) {
	log.Printf("🚗 UpdateDriver request for ID: %d", req.Id)

	// Get existing driver
	existingDriver, err := s.services.DriverService.GetDriverByID(uint(req.Id))
	if err != nil {
		return nil, status.Error(codes.NotFound, "driver not found")
	}

	// Update fields
	if req.Name != "" {
		existingDriver.Name = req.Name
	}
	if req.LicenseNumber != "" {
		existingDriver.LicenseNumber = req.LicenseNumber
	}
	if req.LicenseExpiry != nil {
		existingDriver.LicenseExpiry = timePtr(req.LicenseExpiry.AsTime())
	}
	if req.MedicalCertExpiry != nil {
		existingDriver.MedicalCertExpiry = timePtr(req.MedicalCertExpiry.AsTime())
	}
	if req.Status != pb.DriverStatus_DRIVER_STATUS_UNSPECIFIED {
		existingDriver.Status = models.DriverStatus(convertPBDriverStatus(req.Status))
	}
	if req.Address != "" {
		existingDriver.Address = req.Address
	}
	if req.DateOfBirth != nil {
		existingDriver.DateOfBirth = timePtr(req.DateOfBirth.AsTime())
	}
	if req.EmergencyName != "" {
		existingDriver.EmergencyName = req.EmergencyName
	}
	if req.EmergencyPhone != "" {
		existingDriver.EmergencyPhone = req.EmergencyPhone
	}
	existingDriver.IsActive = req.IsActive

	// Update driver via service
	updatedDriver, err := s.services.DriverService.UpdateDriver(existingDriver)
	if err != nil {
		log.Printf("❌ Failed to update driver: %v", err)
		return nil, status.Error(codes.Internal, "failed to update driver")
	}

	return s.convertDriverToProto(updatedDriver), nil
}

// DeleteDriver deletes a driver
func (s *DriverServer) DeleteDriver(ctx context.Context, req *pb.DeleteDriverRequest) (*pb.SuccessResponse, error) {
	log.Printf("🚗 DeleteDriver request for ID: %d", req.Id)

	err := s.services.DriverService.DeleteDriver(uint(req.Id))
	if err != nil {
		log.Printf("❌ Failed to delete driver: %v", err)
		return nil, status.Error(codes.Internal, "failed to delete driver")
	}

	return &pb.SuccessResponse{
		Message: "Driver deleted successfully",
		Success: true,
	}, nil
}

// UpdateDriverStatus updates driver status
func (s *DriverServer) UpdateDriverStatus(ctx context.Context, req *pb.UpdateDriverStatusRequest) (*pb.SuccessResponse, error) {
	log.Printf("🚗 UpdateDriverStatus request for ID: %d, status: %s", req.Id, req.Status)

	err := s.services.DriverService.UpdateDriverStatus(uint(req.Id), convertPBDriverStatus(req.Status), req.Reason)
	if err != nil {
		log.Printf("❌ Failed to update driver status: %v", err)
		return nil, status.Error(codes.Internal, "failed to update driver status")
	}

	return &pb.SuccessResponse{
		Message: "Driver status updated successfully",
		Success: true,
	}, nil
}

// GetDriverPerformance gets driver performance metrics
func (s *DriverServer) GetDriverPerformance(ctx context.Context, req *pb.GetDriverPerformanceRequest) (*pb.DriverPerformanceMetric, error) {
	log.Printf("🚗 GetDriverPerformance request for drivers: %v, period: %s", req.DriverIds, req.Period)

	// For now, just handle the first driver ID
	var driverID uint32
	if len(req.DriverIds) > 0 {
		driverID = req.DriverIds[0]
	} else {
		return nil, status.Error(codes.InvalidArgument, "at least one driver ID is required")
	}

	performance, err := s.services.DriverService.GetDriverPerformance(uint(driverID), req.Period)
	if err != nil {
		log.Printf("❌ Failed to get driver performance: %v", err)
		return nil, status.Error(codes.Internal, "failed to get driver performance")
	}

	return &pb.DriverPerformanceMetric{
		DriverId:              uint32(performance.DriverID),
		DriverName:            performance.DriverName,
		Rating:                performance.Rating,
		TotalTrips:            uint32(performance.TotalTrips),
		CompletedTrips:        uint32(performance.CompletedTrips),
		CompletionRate:        performance.CompletionRate,
		OnTimeRate:            performance.OnTimeRate,
		FuelEfficiency:        performance.FuelEfficiency,
		RevenueGenerated:      performance.RevenueGenerated,
		CustomerRating:        performance.CustomerRating,
		SafetyScore:           performance.SafetyScore,
		DistanceDriven:        performance.DistanceDriven,
		IncidentsCount:        uint32(performance.IncidentsCount),
		PerformanceGrade:      performance.PerformanceGrade,
		ImprovementPercentage: performance.ImprovementPercentage,
	}, nil
}

// GetDriverCompliance gets driver compliance status
func (s *DriverServer) GetDriverCompliance(ctx context.Context, req *pb.GetDriverComplianceRequest) (*pb.DriverCompliance, error) {
	log.Printf("🚗 GetDriverCompliance request for ID: %d", req.Id)

	compliance, err := s.services.DriverService.GetDriverCompliance(uint(req.Id))
	if err != nil {
		log.Printf("❌ Failed to get driver compliance: %v", err)
		return nil, status.Error(codes.Internal, "failed to get driver compliance")
	}

	return &pb.DriverCompliance{
		DriverId:                uint32(compliance.DriverID),
		DriverName:              compliance.DriverName,
		ComplianceScore:         compliance.ComplianceScore,
		LicenseStatus:           compliance.LicenseStatus,
		LicenseDaysToExpiry:     int32(compliance.LicenseDaysToExpiry),
		MedicalCertStatus:       compliance.MedicalCertStatus,
		MedicalCertDaysToExpiry: int32(compliance.MedicalCertDaysToExpiry),
		Issues:                  compliance.Issues,
	}, nil
}

// GetAvailableDrivers gets available drivers for assignment
func (s *DriverServer) GetAvailableDrivers(ctx context.Context, req *pb.GetAvailableDriversRequest) (*pb.GetAvailableDriversResponse, error) {
	log.Printf("🚗 GetAvailableDrivers request")

	// Convert location
	var pickupLocation *models.Location
	if req.PickupLocation != nil {
		pickupLocation = &models.Location{
			Latitude:  req.PickupLocation.Latitude,
			Longitude: req.PickupLocation.Longitude,
		}
	}

	availableDrivers, err := s.services.DriverService.GetAvailableDrivers(pickupLocation, req.MaxDistanceKm)
	if err != nil {
		log.Printf("❌ Failed to get available drivers: %v", err)
		return nil, status.Error(codes.Internal, "failed to get available drivers")
	}

	// Convert to protobuf
	pbAvailableDrivers := make([]*pb.AvailableDriver, len(availableDrivers))
	for i, availableDriver := range availableDrivers {
		pbAvailableDrivers[i] = &pb.AvailableDriver{
			Driver:              s.convertDriverToProto(&availableDriver.Driver),
			DistanceKm:          availableDriver.DistanceKm,
			EstimatedEtaMinutes: uint32(availableDriver.EstimatedETAMinutes),
			CanBeAssigned:       availableDriver.CanBeAssigned,
			ReasonIfNot:         availableDriver.ReasonIfNot,
		}
	}

	return &pb.GetAvailableDriversResponse{
		Drivers: pbAvailableDrivers,
	}, nil
}

// GetDriverStats gets overall driver statistics
func (s *DriverServer) GetDriverStats(ctx context.Context, req *pb.GetDriverStatsRequest) (*pb.DriverStats, error) {
	log.Printf("🚗 GetDriverStats request")

	stats, err := s.services.DriverService.GetDriverSummaryStats()
	if err != nil {
		log.Printf("❌ Failed to get driver stats: %v", err)
		return nil, status.Error(codes.Internal, "failed to get driver stats")
	}

	return &pb.DriverStats{
		TotalDrivers:        uint32(stats.TotalDrivers),
		ActiveDrivers:       uint32(stats.ActiveDrivers),
		AvailableDrivers:    uint32(stats.AvailableDrivers),
		OnTripDrivers:       uint32(stats.OnTripDrivers),
		OnBreakDrivers:      uint32(stats.OnBreakDrivers),
		OfflineDrivers:      uint32(stats.OfflineDrivers),
		LicenseExpiringSoon: uint32(stats.LicenseExpiringSoon),
		MedicalCertExpiring: uint32(stats.MedicalCertExpiring),
		AverageRating:       stats.AverageRating,
		TopPerformerId:      uint32(stats.TopPerformerID),
		TopPerformerName:    stats.TopPerformerName,
		TopPerformerRating:  stats.TopPerformerRating,
	}, nil
}

// StreamDriverStatus streams driver status changes (real-time)
func (s *DriverServer) StreamDriverStatus(req *pb.StreamDriverStatusRequest, stream pb.DriverService_StreamDriverStatusServer) error {
	log.Printf("🚗 StreamDriverStatus request for drivers: %v", req.DriverIds)

	// Set up streaming channel
	statusChan := make(chan *services.DriverStatusUpdate, 100)

	// Subscribe to driver status updates
	unsubscribe := s.services.DriverService.SubscribeToStatusUpdates(req.DriverIds, statusChan)
	defer unsubscribe()

	// Stream updates
	for {
		select {
		case update := <-statusChan:
			pbUpdate := &pb.DriverStatusUpdate{
				DriverId:  uint32(update.DriverID),
				Name:      update.Name,
				OldStatus: convertDriverStatus(string(update.OldStatus)),
				NewStatus: convertDriverStatus(string(update.NewStatus)),
				Reason:    update.Reason,
				Timestamp: timestamppb.New(update.Timestamp),
			}

			if err := stream.Send(pbUpdate); err != nil {
				log.Printf("❌ Failed to send driver status update: %v", err)
				return err
			}

		case <-stream.Context().Done():
			log.Printf("🚗 StreamDriverStatus ended for drivers: %v", req.DriverIds)
			return nil
		}
	}
}

// StreamDriverLocations streams driver locations (real-time)
func (s *DriverServer) StreamDriverLocations(req *pb.StreamDriverLocationsRequest, stream pb.DriverService_StreamDriverLocationsServer) error {
	log.Printf("🚗 StreamDriverLocations request for drivers: %v", req.DriverIds)

	// Set up streaming channel
	locationChan := make(chan *services.DriverLocationUpdate, 100)

	// Subscribe to driver location updates
	unsubscribe := s.services.DriverService.SubscribeToLocationUpdates(req.DriverIds, locationChan)
	defer unsubscribe()

	// Stream updates
	for {
		select {
		case update := <-locationChan:
			pbUpdate := &pb.DriverLocationUpdate{
				DriverId: uint32(update.DriverID),
				Name:     update.Name,
				Location: &pb.Location{
					Latitude:  update.Location.Latitude,
					Longitude: update.Location.Longitude,
					Accuracy:  update.Location.Accuracy,
					Timestamp: timestamppb.New(update.Location.Timestamp),
				},
				Status: convertDriverStatus(string(update.Status)),
				CurrentTripId: func() uint32 {
					if update.CurrentTripID != nil {
						return uint32(*update.CurrentTripID)
					}
					return 0
				}(),
				CurrentVehicleId: func() uint32 {
					if update.CurrentVehicleID != nil {
						return uint32(*update.CurrentVehicleID)
					}
					return 0
				}(),
			}

			if err := stream.Send(pbUpdate); err != nil {
				log.Printf("❌ Failed to send driver location update: %v", err)
				return err
			}

		case <-stream.Context().Done():
			log.Printf("🚗 StreamDriverLocations ended for drivers: %v", req.DriverIds)
			return nil
		}
	}
}

// Helper function to convert driver model to protobuf
func (s *DriverServer) convertDriverToProto(driver *models.Driver) *pb.Driver {
	pbDriver := &pb.Driver{
		Id:                  uint32(driver.ID),
		Name:                driver.Name,
		Phone:               driver.Phone,
		LicenseNumber:       driver.LicenseNumber,
		Status:              convertDriverStatus(string(driver.Status)),
		Rating:              driver.Rating,
		TotalTrips:          uint32(driver.TotalTrips),
		IsActive:            driver.IsActive,
		CreatedAt:           timestamppb.New(driver.CreatedAt),
		UpdatedAt:           timestamppb.New(driver.UpdatedAt),
		Address:             driver.Address,
		EmergencyName:       driver.EmergencyName,
		EmergencyPhone:      driver.EmergencyPhone,
		FuelEfficiency:      driver.FuelEfficiency,
		OnTimeDeliveries:    uint32(driver.OnTimeDeliveries),
		CustomerRatingSum:   driver.CustomerRatingSum,
		CustomerRatingCount: uint32(driver.CustomerRatingCount),
		CurrentTripId:       0, // Mock for now
		CurrentVehicleId:    0, // Mock for now
	}

	// Handle nullable time fields
	if driver.LicenseExpiry != nil {
		pbDriver.LicenseExpiry = timestamppb.New(*driver.LicenseExpiry)
	}
	if driver.MedicalCertExpiry != nil {
		pbDriver.MedicalCertExpiry = timestamppb.New(*driver.MedicalCertExpiry)
	}
	if driver.HiredAt != nil {
		pbDriver.HiredAt = timestamppb.New(*driver.HiredAt)
	}
	if driver.DateOfBirth != nil {
		pbDriver.DateOfBirth = timestamppb.New(*driver.DateOfBirth)
	}

	// Current location would be handled separately in a real implementation

	return pbDriver
}

// Convert protobuf driver status to string
func convertPBDriverStatus(status pb.DriverStatus) string {
	switch status {
	case pb.DriverStatus_DRIVER_STATUS_AVAILABLE:
		return "available"
	case pb.DriverStatus_DRIVER_STATUS_ON_TRIP:
		return "on_trip"
	case pb.DriverStatus_DRIVER_STATUS_ON_BREAK:
		return "on_break"
	case pb.DriverStatus_DRIVER_STATUS_OFFLINE:
		return "offline"
	case pb.DriverStatus_DRIVER_STATUS_MAINTENANCE:
		return "maintenance"
	default:
		return "available"
	}
}
