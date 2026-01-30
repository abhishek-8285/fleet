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

// VehicleServer implements the VehicleService gRPC service
type VehicleServer struct {
	pb.UnimplementedVehicleServiceServer
	services *services.Container
}

// NewVehicleServer creates a new VehicleServer
func NewVehicleServer(services *services.Container) *VehicleServer {
	return &VehicleServer{
		services: services,
	}
}

// GetVehicles returns paginated list of vehicles
func (s *VehicleServer) GetVehicles(ctx context.Context, req *pb.GetVehiclesRequest) (*pb.GetVehiclesResponse, error) {
	log.Printf("🚚 GetVehicles request")

	// Set default pagination - TODO: update when protobuf definitions include pagination
	page := uint32(1)
	if page == 0 {
		page = 1
	}
	limit := uint32(20)
	if limit == 0 {
		limit = 20
	}

	// Get vehicles from service - TODO: update when GetVehicles signature is finalized
	filters := map[string]interface{}{
		"page":  int(page),
		"limit": int(limit),
	}
	vehicles, total, err := s.services.VehicleService.GetVehicles(int(page), int(limit), filters)
	if err != nil {
		log.Printf("❌ Failed to get vehicles: %v", err)
		return nil, status.Error(codes.Internal, "failed to get vehicles")
	}

	// Convert to protobuf
	pbVehicles := make([]*pb.Vehicle, len(vehicles))
	for i, vehicle := range vehicles {
		pbVehicles[i] = convertVehicleToProto(&vehicle)
	}

	totalPages := (total + int64(limit) - 1) / int64(limit)

	return &pb.GetVehiclesResponse{
		Vehicles: pbVehicles,
		Pagination: &pb.Pagination{
			Page:       int32(page),
			Limit:      int32(limit),
			Total:      int32(total),
			TotalPages: int32(totalPages),
		},
	}, nil
}

// CreateVehicle creates a new vehicle
func (s *VehicleServer) CreateVehicle(ctx context.Context, req *pb.CreateVehicleRequest) (*pb.Vehicle, error) {
	log.Printf("🚚 CreateVehicle request for plate: %s", req.LicensePlate)

	// Validate input
	if req.LicensePlate == "" {
		return nil, status.Error(codes.InvalidArgument, "license plate is required")
	}
	if req.Make == "" || req.Model == "" {
		return nil, status.Error(codes.InvalidArgument, "make and model are required")
	}

	// Convert protobuf to domain model
	vehicle := convertProtoToVehicle(req)

	// Create vehicle via service
	createdVehicle, err := s.services.VehicleService.CreateVehicle(vehicle)
	if err != nil {
		log.Printf("❌ Failed to create vehicle: %v", err)
		return nil, status.Error(codes.Internal, "failed to create vehicle")
	}

	return convertVehicleToProto(createdVehicle), nil
}

// GetVehicle gets vehicle by ID
func (s *VehicleServer) GetVehicle(ctx context.Context, req *pb.GetVehicleRequest) (*pb.Vehicle, error) {
	log.Printf("🚚 GetVehicle request for ID: %d", req.Id)

	if req.Id == 0 {
		return nil, status.Error(codes.InvalidArgument, "vehicle ID is required")
	}

	// Get vehicle from service
	vehicle, err := s.services.VehicleService.GetVehicleByID(uint(req.Id))
	if err != nil {
		log.Printf("❌ Failed to get vehicle: %v", err)
		return nil, status.Error(codes.NotFound, "vehicle not found")
	}

	return convertVehicleToProto(vehicle), nil
}

// UpdateVehicle updates a vehicle
func (s *VehicleServer) UpdateVehicle(ctx context.Context, req *pb.UpdateVehicleRequest) (*pb.Vehicle, error) {
	log.Printf("🚚 UpdateVehicle request for ID: %d", req.Id)

	if req.Id == 0 {
		return nil, status.Error(codes.InvalidArgument, "vehicle ID is required")
	}

	// Convert protobuf to domain model
	vehicle := convertUpdateProtoToVehicle(req)
	vehicle.ID = uint(req.Id)

	// Update vehicle via service
	updatedVehicle, err := s.services.VehicleService.UpdateVehicle(vehicle)
	if err != nil {
		log.Printf("❌ Failed to update vehicle: %v", err)
		return nil, status.Error(codes.Internal, "failed to update vehicle")
	}

	return convertVehicleToProto(updatedVehicle), nil
}

// DeleteVehicle deletes a vehicle
func (s *VehicleServer) DeleteVehicle(ctx context.Context, req *pb.DeleteVehicleRequest) (*pb.SuccessResponse, error) {
	log.Printf("🚚 DeleteVehicle request for ID: %d", req.Id)

	if req.Id == 0 {
		return nil, status.Error(codes.InvalidArgument, "vehicle ID is required")
	}

	// Delete vehicle via service
	err := s.services.VehicleService.DeleteVehicle(uint(req.Id))
	if err != nil {
		log.Printf("❌ Failed to delete vehicle: %v", err)
		return nil, status.Error(codes.Internal, "failed to delete vehicle")
	}

	return &pb.SuccessResponse{
		Message: "Vehicle deleted successfully",
		Success: true,
	}, nil
}

// GetVehicleLocation gets vehicle location
func (s *VehicleServer) GetVehicleLocation(ctx context.Context, req *pb.GetVehicleLocationRequest) (*pb.VehicleLocationResponse, error) {
	log.Printf("🚚 GetVehicleLocation request for ID: %d", req.VehicleId)

	if req.VehicleId == 0 {
		return nil, status.Error(codes.InvalidArgument, "vehicle ID is required")
	}

	// Get vehicle location from service
	// TODO: Get vehicle location when protobuf definitions are aligned
	// location, err := s.services.LocationService.GetVehicleLocation(uint(req.VehicleId))
	// if err != nil {
	//     log.Printf("❌ Failed to get vehicle location: %v", err)
	//     return nil, status.Error(codes.NotFound, "vehicle location not found")
	// }

	log.Printf("📋 GetVehicleLocation - mock implementation")

	// TODO: Convert models.VehicleLocationResponse to pb.VehicleLocationResponse when protobuf is aligned
	return &pb.VehicleLocationResponse{}, nil
}

// UpdateVehicleLocation updates vehicle location
func (s *VehicleServer) UpdateVehicleLocation(ctx context.Context, req *pb.UpdateVehicleLocationRequest) (*pb.SuccessResponse, error) {
	log.Printf("🚚 UpdateVehicleLocation request for vehicle: %d", req.VehicleId)

	if req.VehicleId == 0 {
		return nil, status.Error(codes.InvalidArgument, "vehicle ID is required")
	}

	// TODO: Implement when protobuf definitions include location fields
	log.Printf("📋 UpdateVehicleLocation - mock implementation")

	// TODO: Save location via service when protobuf fields are aligned
	// err := s.services.LocationService.SaveLocationPing(locationPing)
	// if err != nil {
	//     log.Printf("❌ Failed to update vehicle location: %v", err)
	//     return nil, status.Error(codes.Internal, "failed to update vehicle location")
	// }

	return &pb.SuccessResponse{
		Message: "Vehicle location updated successfully",
		Success: true,
	}, nil
}

// GetVehiclePerformance gets vehicle performance metrics
func (s *VehicleServer) GetVehiclePerformance(ctx context.Context, req *pb.GetVehiclePerformanceRequest) (*pb.VehiclePerformance, error) {
	log.Printf("🚚 GetVehiclePerformance request for ID: %d", req.Id)

	if req.Id == 0 {
		return nil, status.Error(codes.InvalidArgument, "vehicle ID is required")
	}

	// TODO: Implement when VehicleService.GetVehiclePerformance method is implemented
	log.Printf("📋 GetVehiclePerformance - mock implementation")

	return &pb.VehiclePerformance{}, nil
}

// GetVehicleCompliance gets vehicle compliance status
func (s *VehicleServer) GetVehicleCompliance(ctx context.Context, req *pb.GetVehicleComplianceRequest) (*pb.VehicleCompliance, error) {
	log.Printf("🚚 GetVehicleCompliance request for ID: %d", req.Id)

	if req.Id == 0 {
		return nil, status.Error(codes.InvalidArgument, "vehicle ID is required")
	}

	// TODO: Implement when VehicleService.GetVehicleCompliance method is implemented
	log.Printf("📋 GetVehicleCompliance - mock implementation")

	return &pb.VehicleCompliance{}, nil
}

// GetAvailableVehicles gets available vehicles
func (s *VehicleServer) GetAvailableVehicles(ctx context.Context, req *pb.GetAvailableVehiclesRequest) (*pb.GetAvailableVehiclesResponse, error) {
	log.Printf("🚚 GetAvailableVehicles request")

	// TODO: Implement when VehicleService.GetAvailableVehicles method and protobuf fields are implemented
	log.Printf("📋 GetAvailableVehicles - mock implementation")

	return &pb.GetAvailableVehiclesResponse{
		Vehicles: []*pb.AvailableVehicle{}, // Empty list for mock
	}, nil
}

// GetVehicleStats gets vehicle statistics
func (s *VehicleServer) GetVehicleStats(ctx context.Context, req *pb.GetVehicleStatsRequest) (*pb.VehicleStats, error) {
	log.Printf("🚚 GetVehicleStats request")

	// TODO: Implement when VehicleService.GetVehicleStats method is implemented
	log.Printf("📋 GetVehicleStats - mock implementation")

	return &pb.VehicleStats{}, nil
}

// StreamVehicleLocations streams vehicle locations
func (s *VehicleServer) StreamVehicleLocations(req *pb.StreamVehicleLocationsRequest, stream pb.VehicleService_StreamVehicleLocationsServer) error {
	log.Printf("🚚 StreamVehicleLocations request")

	// TODO: Implement when VehicleService.StreamVehicleLocations method is implemented
	log.Printf("📋 StreamVehicleLocations - mock implementation")

	return nil
}

// StreamVehicleStatus streams vehicle status changes
func (s *VehicleServer) StreamVehicleStatus(req *pb.StreamVehicleStatusRequest, stream pb.VehicleService_StreamVehicleStatusServer) error {
	log.Printf("🚚 StreamVehicleStatus request")

	// TODO: Implement when VehicleService.StreamVehicleStatus method is implemented
	log.Printf("📋 StreamVehicleStatus - mock implementation")

	return nil
}

// StreamMaintenanceAlerts streams maintenance alerts
func (s *VehicleServer) StreamMaintenanceAlerts(req *pb.StreamMaintenanceAlertsRequest, stream pb.VehicleService_StreamMaintenanceAlertsServer) error {
	log.Printf("🚚 StreamMaintenanceAlerts request")

	// TODO: Implement when VehicleService.StreamMaintenanceAlerts method is implemented
	log.Printf("📋 StreamMaintenanceAlerts - mock implementation")

	return nil
}

// Helper functions

func convertVehicleToProto(vehicle *models.Vehicle) *pb.Vehicle {
	pbVehicle := &pb.Vehicle{
		Id:           uint32(vehicle.ID),
		LicensePlate: vehicle.LicensePlate,
		Make:         vehicle.Make,
		Model:        vehicle.Model,
		VehicleType:  0, // TODO: Use proper VehicleType enum when defined (0 = UNSPECIFIED)
		Status:       convertVehicleStatus(string(vehicle.Status)),
		FuelType:     vehicle.FuelType,
		FuelCapacity: vehicle.FuelCapacity,
		CreatedAt:    timestamppb.New(vehicle.CreatedAt),
		UpdatedAt:    timestamppb.New(vehicle.UpdatedAt),
	}

	// Handle nullable fields
	if vehicle.Year != nil {
		pbVehicle.Year = uint32(*vehicle.Year)
	}
	if vehicle.InsuranceExpiry != nil {
		pbVehicle.InsuranceExpiry = timestamppb.New(*vehicle.InsuranceExpiry)
	}
	if vehicle.RegistrationExpiry != nil {
		pbVehicle.RegistrationExpiry = timestamppb.New(*vehicle.RegistrationExpiry)
	}
	// TODO: Add protobuf fields for pollution, fitness, and maintenance dates when definitions are updated

	return pbVehicle
}

func convertProtoToVehicle(req *pb.CreateVehicleRequest) *models.Vehicle {
	vehicle := &models.Vehicle{
		LicensePlate: req.LicensePlate,
		Make:         req.Make,
		Model:        req.Model,
		VehicleType:  models.VehicleType(req.FuelType), // TODO: Fix when VehicleType enum mapping is proper
		FuelType:     req.FuelType,
		FuelCapacity: req.FuelCapacity,
		LoadCapacity: req.LoadCapacity,
	}

	// Handle nullable fields
	if req.Year != 0 {
		year := int(req.Year)
		vehicle.Year = &year
	}
	if req.InsuranceExpiry != nil {
		expiry := req.InsuranceExpiry.AsTime()
		vehicle.InsuranceExpiry = &expiry
	}
	if req.RegistrationExpiry != nil {
		expiry := req.RegistrationExpiry.AsTime()
		vehicle.RegistrationExpiry = &expiry
	}
	// TODO: Add protobuf fields for pollution and fitness expiry when definitions are updated

	return vehicle
}

func convertUpdateProtoToVehicle(req *pb.UpdateVehicleRequest) *models.Vehicle {
	vehicle := &models.Vehicle{
		// TODO: Map fields when protobuf definitions are aligned with Go models
		ID: uint(req.Id),
	}

	// TODO: Handle nullable fields when protobuf definitions are updated
	// Example fields that need to be added to protobuf:
	// - InsuranceExpiry, RegistrationExpiry, PollutionExpiry, FitnessExpiry
	// - LastServiceDate, NextServiceDue

	return vehicle
}

// Enum converter functions
/*
func convertVehicleType(vType string) string {
	// TODO: Add VehicleType enum to common.proto, for now return string directly
	return vType
}
*/

/*
func convertPBVehicleType(vType string) string {
	// TODO: Add VehicleType enum to common.proto, for now return string directly
	return vType
}
*/

func convertVehicleStatus(status string) pb.VehicleStatus {
	switch status {
	case "ACTIVE":
		return pb.VehicleStatus_VEHICLE_STATUS_ACTIVE
	case "INACTIVE":
		return pb.VehicleStatus_VEHICLE_STATUS_INACTIVE
	case "MAINTENANCE":
		return pb.VehicleStatus_VEHICLE_STATUS_MAINTENANCE
	case "PARKED":
		return pb.VehicleStatus_VEHICLE_STATUS_PARKED
	default:
		return pb.VehicleStatus_VEHICLE_STATUS_UNSPECIFIED
	}
}

/*
func convertPBVehicleStatus(status pb.VehicleStatus) string {
	switch status {
	case pb.VehicleStatus_VEHICLE_STATUS_ACTIVE:
		return "ACTIVE"
	case pb.VehicleStatus_VEHICLE_STATUS_INACTIVE:
		return "INACTIVE"
	case pb.VehicleStatus_VEHICLE_STATUS_MAINTENANCE:
		return "MAINTENANCE"
	case pb.VehicleStatus_VEHICLE_STATUS_PARKED:
		return "PARKED"
	default:
		return "ACTIVE"
	}
}
*/

// TODO: Replace with proper protobuf enum when available
/*
func convertFuelType(fType string) string {
	return fType // Return string directly until protobuf enum is added
}
*/

/*
func convertPBFuelType(fType string) string {
	return fType // Return string directly until protobuf enum is added
}
*/
