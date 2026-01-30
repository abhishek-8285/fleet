package server

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/fleetflow/backend/internal/models"
	"github.com/fleetflow/backend/internal/services"
	pb "github.com/fleetflow/backend/proto/gen"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// TripServer implements the TripService gRPC service
type TripServer struct {
	pb.UnimplementedTripServiceServer
	services *services.Container
}

// NewTripServer creates a new TripServer
func NewTripServer(services *services.Container) *TripServer {
	return &TripServer{
		services: services,
	}
}

// GetTrips returns paginated list of trips
func (s *TripServer) GetTrips(ctx context.Context, req *pb.GetTripsRequest) (*pb.GetTripsResponse, error) {
	log.Printf("🚛 GetTrips request - DriverID: %d, VehicleID: %d", req.DriverId, req.VehicleId)

	// Set default pagination
	page := int(1)
	limit := int(20)
	if req.Pagination != nil {
		if req.Pagination.Page > 0 {
			page = int(req.Pagination.Page)
		}
		if req.Pagination.Limit > 0 {
			limit = int(req.Pagination.Limit)
		}
	}

	// Create filters
	filters := make(map[string]interface{})
	if req.StatusFilter != pb.TripStatus_TRIP_STATUS_UNSPECIFIED {
		filters["status"] = req.StatusFilter.String()
	}
	if req.DriverId > 0 {
		filters["driver_id"] = req.DriverId
	}
	if req.VehicleId > 0 {
		filters["vehicle_id"] = req.VehicleId
	}
	if req.CustomerPhone != "" {
		filters["customer_phone"] = req.CustomerPhone
	}

	// Get trips from service
	trips, total, err := s.services.TripService.GetTrips(page, limit, filters)
	if err != nil {
		log.Printf("❌ Failed to get trips: %v", err)
		return nil, status.Error(codes.Internal, "failed to get trips")
	}

	// Convert to protobuf
	pbTrips := make([]*pb.Trip, len(trips))
	for i, trip := range trips {
		pbTrips[i] = convertTripToProto(&trip)
	}

	totalPages := (total + int64(limit) - 1) / int64(limit)

	return &pb.GetTripsResponse{
		Trips: pbTrips,
		Pagination: &pb.Pagination{
			Page:       int32(page),
			Limit:      int32(limit),
			Total:      int32(total),
			TotalPages: int32(totalPages),
		},
	}, nil
}

// CreateTrip creates a new trip
func (s *TripServer) CreateTrip(ctx context.Context, req *pb.CreateTripRequest) (*pb.Trip, error) {
	log.Printf("🚛 CreateTrip request for customer: %s", req.CustomerPhone)

	// Validate input
	if req.CustomerPhone == "" {
		return nil, status.Error(codes.InvalidArgument, "customer phone is required")
	}

	// Convert protobuf to domain model
	trip := convertProtoToTrip(req)

	// Create trip via service
	createdTrip, err := s.services.TripService.CreateTrip(trip)
	if err != nil {
		log.Printf("❌ Failed to create trip: %v", err)
		return nil, status.Error(codes.Internal, "failed to create trip")
	}

	return convertTripToProto(createdTrip), nil
}

// GetTrip gets trip by ID
func (s *TripServer) GetTrip(ctx context.Context, req *pb.GetTripRequest) (*pb.Trip, error) {
	log.Printf("🚛 GetTrip request for ID: %d", req.Id)

	if req.Id == 0 {
		return nil, status.Error(codes.InvalidArgument, "trip ID is required")
	}

	// Get trip from service
	trip, err := s.services.TripService.GetTripByID(uint(req.Id))
	if err != nil {
		log.Printf("❌ Failed to get trip: %v", err)
		return nil, status.Error(codes.NotFound, "trip not found")
	}

	return convertTripToProto(trip), nil
}

// UpdateTrip updates a trip
func (s *TripServer) UpdateTrip(ctx context.Context, req *pb.UpdateTripRequest) (*pb.Trip, error) {
	log.Printf("🚛 UpdateTrip request for ID: %d", req.Id)

	if req.Id == 0 {
		return nil, status.Error(codes.InvalidArgument, "trip ID is required")
	}

	// Convert protobuf to domain model
	trip := convertUpdateProtoToTrip(req)
	trip.ID = uint(req.Id)

	// Update trip via service
	updatedTrip, err := s.services.TripService.UpdateTrip(trip)
	if err != nil {
		log.Printf("❌ Failed to update trip: %v", err)
		return nil, status.Error(codes.Internal, "failed to update trip")
	}

	return convertTripToProto(updatedTrip), nil
}

// DeleteTrip deletes a trip
func (s *TripServer) DeleteTrip(ctx context.Context, req *pb.DeleteTripRequest) (*pb.SuccessResponse, error) {
	log.Printf("🚛 DeleteTrip request for ID: %d", req.Id)

	if req.Id == 0 {
		return nil, status.Error(codes.InvalidArgument, "trip ID is required")
	}

	// Delete trip via service
	err := s.services.TripService.DeleteTrip(uint(req.Id))
	if err != nil {
		log.Printf("❌ Failed to delete trip: %v", err)
		return nil, status.Error(codes.Internal, "failed to delete trip")
	}

	return &pb.SuccessResponse{
		Message: "Trip deleted successfully",
		Success: true,
	}, nil
}

// AssignTrip assigns trip to driver and vehicle
func (s *TripServer) AssignTrip(ctx context.Context, req *pb.AssignTripRequest) (*pb.Trip, error) {
	log.Printf("🚛 AssignTrip request for trip: %d, driver: %d, vehicle: %d", req.TripId, req.DriverId, req.VehicleId)

	if req.TripId == 0 || req.DriverId == 0 || req.VehicleId == 0 {
		return nil, status.Error(codes.InvalidArgument, "trip ID, driver ID, and vehicle ID are required")
	}

	// Assign trip via service
	err := s.services.TripService.AssignTrip(uint(req.TripId), uint(req.DriverId), uint(req.VehicleId))
	if err != nil {
		log.Printf("❌ Failed to assign trip: %v", err)
		return nil, status.Error(codes.Internal, "failed to assign trip")
	}

	// Get the updated trip
	trip, err := s.services.TripService.GetTripByID(uint(req.TripId))
	if err != nil {
		log.Printf("❌ Failed to get updated trip: %v", err)
		return nil, status.Error(codes.Internal, "failed to get updated trip")
	}

	return convertTripToProto(trip), nil
}

// StartTrip starts a trip
func (s *TripServer) StartTrip(ctx context.Context, req *pb.StartTripRequest) (*pb.Trip, error) {
	log.Printf("🚛 StartTrip request for trip: %d", req.TripId)

	if req.TripId == 0 {
		return nil, status.Error(codes.InvalidArgument, "trip ID is required")
	}

	// Start trip via service
	err := s.services.TripService.StartTrip(uint(req.TripId))
	if err != nil {
		log.Printf("❌ Failed to start trip: %v", err)
		return nil, status.Error(codes.Internal, "failed to start trip")
	}

	// Get the updated trip
	trip, err := s.services.TripService.GetTripByID(uint(req.TripId))
	if err != nil {
		log.Printf("❌ Failed to get updated trip: %v", err)
		return nil, status.Error(codes.Internal, "failed to get updated trip")
	}

	return convertTripToProto(trip), nil
}

// PauseTrip pauses a trip
func (s *TripServer) PauseTrip(ctx context.Context, req *pb.PauseTripRequest) (*pb.Trip, error) {
	log.Printf("🚛 PauseTrip request for trip: %d", req.TripId)

	if req.TripId == 0 {
		return nil, status.Error(codes.InvalidArgument, "trip ID is required")
	}

	// TODO: Implement PauseTrip in TripService
	log.Printf("⏸️ PauseTrip not yet implemented for trip: %d", req.TripId)

	// Get the trip for now
	trip, err := s.services.TripService.GetTripByID(uint(req.TripId))
	if err != nil {
		log.Printf("❌ Failed to get trip: %v", err)
		return nil, status.Error(codes.Internal, "failed to get trip")
	}

	return convertTripToProto(trip), nil
}

// ResumeTrip resumes a trip
func (s *TripServer) ResumeTrip(ctx context.Context, req *pb.ResumeTripRequest) (*pb.Trip, error) {
	log.Printf("🚛 ResumeTrip request for trip: %d", req.TripId)

	if req.TripId == 0 {
		return nil, status.Error(codes.InvalidArgument, "trip ID is required")
	}

	// TODO: Implement ResumeTrip in TripService
	log.Printf("▶️ ResumeTrip not yet implemented for trip: %d", req.TripId)

	// Get the trip for now
	trip, err := s.services.TripService.GetTripByID(uint(req.TripId))
	if err != nil {
		log.Printf("❌ Failed to get trip: %v", err)
		return nil, status.Error(codes.Internal, "failed to get trip")
	}

	return convertTripToProto(trip), nil
}

// CompleteTrip completes a trip
func (s *TripServer) CompleteTrip(ctx context.Context, req *pb.CompleteTripRequest) (*pb.Trip, error) {
	log.Printf("🚛 CompleteTrip request for trip: %d", req.TripId)

	if req.TripId == 0 {
		return nil, status.Error(codes.InvalidArgument, "trip ID is required")
	}

	// Complete trip via service
	err := s.services.TripService.CompleteTrip(uint(req.TripId))
	if err != nil {
		log.Printf("❌ Failed to complete trip: %v", err)
		return nil, status.Error(codes.Internal, "failed to complete trip")
	}

	// Get the updated trip
	trip, err := s.services.TripService.GetTripByID(uint(req.TripId))
	if err != nil {
		log.Printf("❌ Failed to get updated trip: %v", err)
		return nil, status.Error(codes.Internal, "failed to get updated trip")
	}

	return convertTripToProto(trip), nil
}

// CancelTrip cancels a trip
func (s *TripServer) CancelTrip(ctx context.Context, req *pb.CancelTripRequest) (*pb.Trip, error) {
	log.Printf("🚛 CancelTrip request for trip: %d", req.TripId)

	if req.TripId == 0 {
		return nil, status.Error(codes.InvalidArgument, "trip ID is required")
	}

	// TODO: Implement CancelTrip in TripService
	log.Printf("❌ CancelTrip not yet implemented for trip: %d", req.TripId)

	// Get the trip for now
	trip, err := s.services.TripService.GetTripByID(uint(req.TripId))
	if err != nil {
		log.Printf("❌ Failed to get trip: %v", err)
		return nil, status.Error(codes.Internal, "failed to get trip")
	}

	return convertTripToProto(trip), nil
}

// GetTripLocation gets trip location/route
func (s *TripServer) GetTripLocation(ctx context.Context, req *pb.GetTripLocationRequest) (*pb.TripLocation, error) {
	log.Printf("🚛 GetTripLocation request for trip: %d", req.TripId)

	if req.TripId == 0 {
		return nil, status.Error(codes.InvalidArgument, "trip ID is required")
	}

	// TODO: Implement GetTripLocation in TripService
	log.Printf("📍 GetTripLocation not yet implemented for trip: %d", req.TripId)

	// Return mock trip location for now
	return &pb.TripLocation{
		TripId: req.TripId,
		// Add mock location data
	}, nil
}

// UpdateETA updates trip ETA
func (s *TripServer) UpdateETA(ctx context.Context, req *pb.UpdateETARequest) (*pb.SuccessResponse, error) {
	log.Printf("🚛 UpdateETA request for trip: %d", req.TripId)

	if req.TripId == 0 {
		return nil, status.Error(codes.InvalidArgument, "trip ID is required")
	}
	if req.NewEta == nil {
		return nil, status.Error(codes.InvalidArgument, "new ETA is required")
	}

	// TODO: Implement UpdateETA in TripService
	log.Printf("🕒 UpdateETA not yet implemented for trip: %d", req.TripId)

	return &pb.SuccessResponse{
		Message: "ETA updated successfully",
		Success: true,
	}, nil
}

// GetPublicTripStatus gets public trip status
func (s *TripServer) GetPublicTripStatus(ctx context.Context, req *pb.GetPublicTripStatusRequest) (*pb.PublicTripStatus, error) {
	log.Printf("🚛 GetPublicTripStatus request for tracking ID: %s", req.TrackingId)

	if req.TrackingId == "" {
		return nil, status.Error(codes.InvalidArgument, "tracking ID is required")
	}

	// TODO: Implement GetPublicTripStatus in TripService
	log.Printf("🌐 GetPublicTripStatus not yet implemented for tracking: %s", req.TrackingId)

	return &pb.PublicTripStatus{
		TrackingId: req.TrackingId,
		// Add mock fields
	}, nil
}

// StreamTripUpdates streams trip updates
func (s *TripServer) StreamTripUpdates(req *pb.StreamTripUpdatesRequest, stream pb.TripService_StreamTripUpdatesServer) error {
	log.Printf("🚛 StreamTripUpdates request")

	// TODO: Implement StreamTripUpdates in TripService
	log.Printf("🚛 StreamTripUpdates not yet implemented")
	return status.Error(codes.Unimplemented, "StreamTripUpdates not yet implemented")
}

// StreamTripLocations streams trip locations
func (s *TripServer) StreamTripLocations(req *pb.StreamTripLocationsRequest, stream pb.TripService_StreamTripLocationsServer) error {
	log.Printf("🚛 StreamTripLocations request")

	// TODO: Implement StreamTripLocations in TripService
	log.Printf("📍 StreamTripLocations not yet implemented")
	return status.Error(codes.Unimplemented, "StreamTripLocations not yet implemented")
}

// StreamTripAssignments streams trip assignments
func (s *TripServer) StreamTripAssignments(req *pb.StreamTripAssignmentsRequest, stream pb.TripService_StreamTripAssignmentsServer) error {
	log.Printf("🚛 StreamTripAssignments request")

	// TODO: Implement StreamTripAssignments in TripService
	log.Printf("📋 StreamTripAssignments not yet implemented")
	return status.Error(codes.Unimplemented, "StreamTripAssignments not yet implemented")
}

// Helper functions

func convertTripToProto(trip *models.Trip) *pb.Trip {
	pbTrip := &pb.Trip{
		Id:                uint32(trip.ID),
		TrackingId:        trip.TrackingID,
		Status:            convertTripStatus(string(trip.Status)),
		CustomerName:      trip.CustomerName,
		CustomerPhone:     trip.CustomerPhone,
		PickupAddress:     trip.PickupAddress,
		DropoffAddress:    trip.DropoffAddress,
		Distance:          trip.Distance,
		EstimatedDuration: uint32(trip.EstimatedDuration),
		CreatedAt:         timestamppb.New(trip.CreatedAt),
		UpdatedAt:         timestamppb.New(trip.UpdatedAt),
	}

	// Handle nullable fields
	if trip.DriverID != nil {
		pbTrip.DriverId = uint32(*trip.DriverID)
	}
	if trip.VehicleID != nil {
		pbTrip.VehicleId = uint32(*trip.VehicleID)
	}
	// TODO: Add other fields when protobuf definitions are updated

	return pbTrip
}

func convertProtoToTrip(req *pb.CreateTripRequest) *models.Trip {
	trip := &models.Trip{
		CustomerName:   req.CustomerName,
		CustomerPhone:  req.CustomerPhone,
		PickupAddress:  req.CustomerPhone, // Placeholder - update when protobuf is updated
		DropoffAddress: req.CustomerName,  // Placeholder - update when protobuf is updated
		Status:         models.TripStatusScheduled,
		TrackingID:     fmt.Sprintf("TRP_%d", time.Now().Unix()),
	}

	// TODO: Add proper field mappings when CreateTripRequest protobuf is updated
	return trip
}

func convertUpdateProtoToTrip(req *pb.UpdateTripRequest) *models.Trip {
	trip := &models.Trip{
		// TODO: Add proper field mappings when UpdateTripRequest protobuf is updated
		Status: models.TripStatusScheduled, // Default status
	}

	// TODO: Complete field mappings when protobuf is updated
	return trip
}

// Enum converter functions
func convertTripStatus(status string) pb.TripStatus {
	switch status {
	case "SCHEDULED":
		return pb.TripStatus_TRIP_STATUS_SCHEDULED
	case "ASSIGNED":
		return pb.TripStatus_TRIP_STATUS_ASSIGNED
	case "IN_PROGRESS":
		return pb.TripStatus_TRIP_STATUS_IN_PROGRESS
	case "PAUSED":
		return pb.TripStatus_TRIP_STATUS_PAUSED
	case "COMPLETED":
		return pb.TripStatus_TRIP_STATUS_COMPLETED
	case "CANCELLED":
		return pb.TripStatus_TRIP_STATUS_CANCELLED
	case "DELAYED":
		return pb.TripStatus_TRIP_STATUS_DELAYED
	default:
		return pb.TripStatus_TRIP_STATUS_UNSPECIFIED
	}
}

/*
func convertPBTripStatus(status pb.TripStatus) string {
...
}
*/
