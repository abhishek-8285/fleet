package server

import (
	"context"
	"fmt"
	"io"
	"log"
	"sync"
	"time"

	"github.com/fleetflow/backend/internal/models"
	"github.com/fleetflow/backend/internal/services"
	pb "github.com/fleetflow/backend/proto/gen"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// LocationServer implements the LocationService gRPC service
type LocationServer struct {
	pb.UnimplementedLocationServiceServer
	services      *services.Container
	activeStreams map[string]chan *pb.FleetLocationUpdate
	streamsMutex  sync.RWMutex
}

// NewLocationServer creates a new LocationServer
func NewLocationServer(services *services.Container) *LocationServer {
	return &LocationServer{
		services:      services,
		activeStreams: make(map[string]chan *pb.FleetLocationUpdate),
	}
}

// RecordLocationPing records a single location ping
func (s *LocationServer) RecordLocationPing(ctx context.Context, req *pb.LocationPingRequest) (*pb.SuccessResponse, error) {
	log.Printf("📍 RecordLocationPing for vehicle: %d", req.VehicleId)

	// Convert request to model
	locationPing := &models.LocationPing{
		Latitude:  req.Latitude,
		Longitude: req.Longitude,
		Accuracy:  req.Accuracy,
		Speed:     &req.Speed,
		Heading:   &req.Heading,
		Altitude:  &req.Altitude,
		Timestamp: time.Now(),
		DriverID: func() *uint {
			if req.DriverId != 0 {
				id := uint(req.DriverId)
				return &id
			}
			return nil
		}(),
		VehicleID: func() *uint {
			if req.VehicleId != 0 {
				id := uint(req.VehicleId)
				return &id
			}
			return nil
		}(),
		TripID: func() *uint {
			if req.TripId != 0 {
				id := uint(req.TripId)
				return &id
			}
			return nil
		}(),
		Source:       req.Source,
		BatteryLevel: func() *int { level := int(req.BatteryLevel); return &level }(),
		NetworkType:  req.NetworkType,
	}

	// Save location ping via service
	err := s.services.LocationService.SaveLocationPing(locationPing)
	if err != nil {
		log.Printf("❌ Failed to save location ping: %v", err)
		return nil, status.Error(codes.Internal, "failed to save location ping")
	}

	// Broadcast to active streams
	s.broadcastLocationUpdate(locationPing)

	return &pb.SuccessResponse{
		Message: "Location ping recorded successfully",
		Success: true,
	}, nil
}

// GetVehicleLocation gets current vehicle location
func (s *LocationServer) GetVehicleLocation(ctx context.Context, req *pb.GetVehicleLocationRequest) (*pb.VehicleLocationResponse, error) {
	log.Printf("📍 GetVehicleLocation for vehicle: %d", req.VehicleId)

	location, err := s.services.LocationService.GetVehicleLocation(uint(req.VehicleId))
	if err != nil {
		log.Printf("❌ Failed to get vehicle location: %v", err)
		return nil, status.Error(codes.NotFound, "vehicle location not found")
	}

	return &pb.VehicleLocationResponse{
		LatestPing: &pb.LocationPing{
			Id:        uint32(location.LatestPing.ID),
			Latitude:  location.LatestPing.Latitude,
			Longitude: location.LatestPing.Longitude,
			Accuracy:  location.LatestPing.Accuracy,
			Speed: func() float64 {
				if location.LatestPing.Speed != nil {
					return *location.LatestPing.Speed
				}
				return 0
			}(),
			Heading: func() float64 {
				if location.LatestPing.Heading != nil {
					return *location.LatestPing.Heading
				}
				return 0
			}(),
			Altitude: func() float64 {
				if location.LatestPing.Altitude != nil {
					return *location.LatestPing.Altitude
				}
				return 0
			}(),
			Timestamp: timestamppb.New(location.LatestPing.Timestamp),
			DriverId: func() uint32 {
				if location.LatestPing.DriverID != nil {
					return uint32(*location.LatestPing.DriverID)
				}
				return 0
			}(),
			VehicleId: func() uint32 {
				if location.LatestPing.VehicleID != nil {
					return uint32(*location.LatestPing.VehicleID)
				}
				return 0
			}(),
			TripId: func() uint32 {
				if location.LatestPing.TripID != nil {
					return uint32(*location.LatestPing.TripID)
				}
				return 0
			}(),
			Source: location.LatestPing.Source,
			BatteryLevel: func() uint32 {
				if location.LatestPing.BatteryLevel != nil {
					return uint32(*location.LatestPing.BatteryLevel)
				}
				return 0
			}(),
			NetworkType: location.LatestPing.NetworkType,
		},
		// Status field not available in VehicleLocationResponse model
		CurrentDriverId: func() uint32 {
			if location.LatestPing != nil && location.LatestPing.DriverID != nil {
				return uint32(*location.LatestPing.DriverID)
			} else {
				return 0
			}
		}(),
		DriverName: location.DriverName,
		CurrentTripId: func() uint32 {
			if location.LatestPing != nil && location.LatestPing.TripID != nil {
				return uint32(*location.LatestPing.TripID)
			} else {
				return 0
			}
		}(),
		LastUpdate: func() *timestamppb.Timestamp {
			if location.LatestPing != nil {
				return timestamppb.New(location.LatestPing.CreatedAt)
			} else {
				return timestamppb.New(time.Now())
			}
		}(),
	}, nil
}

// GetLocationHistory gets location history for a vehicle
func (s *LocationServer) GetLocationHistory(ctx context.Context, req *pb.GetLocationHistoryRequest) (*pb.GetLocationHistoryResponse, error) {
	log.Printf("📍 GetLocationHistory for vehicle: %d", req.VehicleId)

	history, err := s.services.LocationService.GetLocationHistory(
		uint(req.VehicleId),
		req.StartTime.AsTime(),
		req.EndTime.AsTime(),
		int(req.Limit),
	)
	if err != nil {
		log.Printf("❌ Failed to get location history: %v", err)
		return nil, status.Error(codes.Internal, "failed to get location history")
	}

	// Convert to protobuf
	pbPings := make([]*pb.LocationPing, len(history.Pings))
	for i, ping := range history.Pings {
		pbPings[i] = &pb.LocationPing{
			Id:        uint32(ping.ID),
			Latitude:  ping.Latitude,
			Longitude: ping.Longitude,
			Accuracy:  ping.Accuracy,
			Speed: func() float64 {
				if ping.Speed != nil {
					return *ping.Speed
				}
				return 0
			}(),
			Heading: func() float64 {
				if ping.Heading != nil {
					return *ping.Heading
				}
				return 0
			}(),
			Altitude: func() float64 {
				if ping.Altitude != nil {
					return *ping.Altitude
				}
				return 0
			}(),
			Timestamp: timestamppb.New(ping.Timestamp),
			DriverId: func() uint32 {
				if ping.DriverID != nil {
					return uint32(*ping.DriverID)
				}
				return 0
			}(),
			VehicleId: func() uint32 {
				if ping.VehicleID != nil {
					return uint32(*ping.VehicleID)
				}
				return 0
			}(),
			TripId: func() uint32 {
				if ping.TripID != nil {
					return uint32(*ping.TripID)
				}
				return 0
			}(),
			Source: ping.Source,
			BatteryLevel: func() uint32 {
				if ping.BatteryLevel != nil {
					return uint32(*ping.BatteryLevel)
				}
				return 0
			}(),
			NetworkType: ping.NetworkType,
		}
	}

	return &pb.GetLocationHistoryResponse{
		Pings:      pbPings,
		TotalCount: uint32(history.TotalPings), // Use TotalPings from LocationHistory model
	}, nil
}

// GetDriverLocation gets current driver location
func (s *LocationServer) GetDriverLocation(ctx context.Context, req *pb.GetDriverLocationRequest) (*pb.DriverLocationResponse, error) {
	log.Printf("📍 GetDriverLocation for driver: %d", req.DriverId)

	location, err := s.services.LocationService.GetDriverLocation(uint(req.DriverId))
	if err != nil {
		log.Printf("❌ Failed to get driver location: %v", err)
		return nil, status.Error(codes.NotFound, "driver location not found")
	}

	return &pb.DriverLocationResponse{
		LatestPing: &pb.LocationPing{
			Id:        uint32(location.DriverID), // Use DriverID as ping ID
			Latitude:  location.Latitude,
			Longitude: location.Longitude,
			Accuracy: func() float64 {
				if location.Accuracy != nil {
					return *location.Accuracy
				}
				return 0
			}(),
			Speed: func() float64 {
				if location.Speed != nil {
					return *location.Speed
				}
				return 0
			}(),
			Heading: func() float64 {
				if location.Heading != nil {
					return *location.Heading
				}
				return 0
			}(),
			Timestamp: timestamppb.New(location.LastUpdated),
			DriverId:  uint32(location.DriverID),
			VehicleId: func() uint32 {
				if location.VehicleID != nil {
					return uint32(*location.VehicleID)
				}
				return 0
			}(),
			Source:       "DRIVER_APP", // Default source
			BatteryLevel: 100,          // Default battery level
			NetworkType:  "4G",         // Default network type
		},
		Status: convertDriverStatus(location.Status),
		CurrentVehicleId: func() uint32 {
			if location.VehicleID != nil {
				return uint32(*location.VehicleID)
			}
			return 0
		}(),
		VehiclePlate: location.VehiclePlate,
		CurrentTripId: func() uint32 {
			if location.TripID != nil {
				return uint32(*location.TripID)
			}
			return 0
		}(),
		LastUpdate: timestamppb.New(location.LastUpdated),
	}, nil
}

// ==== REAL-TIME STREAMING SERVICES ====

// StreamGPSTracking handles bidirectional GPS streaming (THE POWER OF gRPC!)
func (s *LocationServer) StreamGPSTracking(stream pb.LocationService_StreamGPSTrackingServer) error {
	log.Printf("🚀 StreamGPSTracking started - BIDIRECTIONAL STREAMING!")

	// Set up context
	ctx := stream.Context()
	clientID := s.generateClientID()

	// Channels for handling updates
	gpsUpdates := make(chan *pb.GPSUpdate, 100)
	broadcastUpdates := make(chan *pb.GPSBroadcast, 100)

	// Register for broadcasts
	s.registerGPSStream(clientID, broadcastUpdates)
	defer s.unregisterGPSStream(clientID)

	// Handle incoming GPS updates
	go func() {
		for {
			update, err := stream.Recv()
			if err == io.EOF {
				log.Printf("📍 GPS stream ended for client: %s", clientID)
				return
			}
			if err != nil {
				log.Printf("❌ GPS stream error: %v", err)
				return
			}

			// Process GPS update asynchronously
			select {
			case gpsUpdates <- update:
			case <-ctx.Done():
				return
			}
		}
	}()

	// Process GPS updates and send broadcasts
	for {
		select {
		case update := <-gpsUpdates:
			// Process the GPS update
			if err := s.processGPSUpdate(update); err != nil {
				log.Printf("❌ Failed to process GPS update: %v", err)
			}

		case broadcast := <-broadcastUpdates:
			// Send broadcast to client
			if err := stream.Send(broadcast); err != nil {
				log.Printf("❌ Failed to send GPS broadcast: %v", err)
				return err
			}

		case <-ctx.Done():
			log.Printf("📍 StreamGPSTracking ended for client: %s", clientID)
			return nil
		}
	}
}

// WatchFleetLive provides live fleet monitoring (Server Streaming)
func (s *LocationServer) WatchFleetLive(req *pb.WatchFleetRequest, stream pb.LocationService_WatchFleetLiveServer) error {
	log.Printf("🚀 WatchFleetLive started - LIVE FLEET MONITORING!")

	// Set up parameters
	updateInterval := time.Duration(req.UpdateIntervalSeconds) * time.Second
	if updateInterval == 0 {
		updateInterval = 10 * time.Second // Default 10 seconds
	}

	// Get initial fleet positions
	fleetLocations, err := s.services.LocationService.GetFleetLocations(req.VehicleIds, req.IncludeOffline)
	if err != nil {
		log.Printf("❌ Failed to get fleet locations: %v", err)
		return status.Error(codes.Internal, "failed to get fleet locations")
	}

	// Send initial positions
	for _, location := range fleetLocations {
		update := s.convertToFleetLocationUpdate(location)
		if err := stream.Send(update); err != nil {
			return err
		}
	}

	// Set up real-time updates
	ticker := time.NewTicker(updateInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			// Get recent updates
			cutoffTime := time.Now().Add(-updateInterval)
			recentUpdates, err := s.services.LocationService.GetRecentFleetUpdates(req.VehicleIds, cutoffTime)
			if err != nil {
				log.Printf("❌ Failed to get recent updates: %v", err)
				continue
			}

			// Send updates
			for _, location := range recentUpdates {
				// Convert FleetLocationUpdate to protobuf
				update := &pb.FleetLocationUpdate{
					VehicleId:    uint32(location.VehicleID),
					LicensePlate: location.LicensePlate,
					Location: &pb.Location{
						Latitude:  location.Location.Latitude,
						Longitude: location.Location.Longitude,
						Timestamp: timestamppb.New(location.Location.Timestamp),
					},
					Speed: func() float64 {
						if location.Speed != nil {
							return *location.Speed
						} else {
							return 0
						}
					}(),
					Heading: func() float64 {
						if location.Heading != nil {
							return *location.Heading
						} else {
							return 0
						}
					}(),
				}

				if err := stream.Send(update); err != nil {
					return err
				}
			}

		case <-stream.Context().Done():
			log.Printf("📍 WatchFleetLive ended")
			return nil
		}
	}
}

// StreamGeofenceAlerts streams geofence violations in real-time
func (s *LocationServer) StreamGeofenceAlerts(req *pb.GeofenceAlertRequest, stream pb.LocationService_StreamGeofenceAlertsServer) error {
	log.Printf("🚀 StreamGeofenceAlerts started - REAL-TIME GEOFENCE MONITORING!")

	// Set up alert channel
	alertChan := make(chan *models.GeofenceAlert, 100)

	// Subscribe to geofence alerts
	unsubscribe := s.services.LocationService.SubscribeToGeofenceAlerts(req.VehicleIds, req.GeofenceIds, alertChan)
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

			pbAlert := &pb.GeofenceAlert{
				VehicleId:    uint32(alert.VehicleID),
				LicensePlate: alert.LicensePlate,
				GeofenceId:   uint32(alert.GeofenceID),
				GeofenceName: alert.GeofenceName,
				EventType:    convertGeofenceEventType(alert.EventType),
				Location: &pb.Location{
					Latitude:  alert.Location.Latitude,
					Longitude: alert.Location.Longitude,
					Timestamp: timestamppb.New(alert.Location.Timestamp),
				},
				Severity:    convertAlertSeverity(alert.Severity),
				Description: alert.Description,
				Timestamp:   timestamppb.New(alert.Timestamp),
				DriverId:    uint32(alert.DriverID),
				DriverName:  alert.DriverName,
				TripId:      uint32(alert.TripID),
			}

			if err := stream.Send(pbAlert); err != nil {
				log.Printf("❌ Failed to send geofence alert: %v", err)
				return err
			}

		case <-stream.Context().Done():
			log.Printf("📍 StreamGeofenceAlerts ended")
			return nil
		}
	}
}

// StreamRouteDeviations streams route deviations in real-time
func (s *LocationServer) StreamRouteDeviations(req *pb.RouteDeviationRequest, stream pb.LocationService_StreamRouteDeviationsServer) error {
	log.Printf("🚀 StreamRouteDeviations started - REAL-TIME ROUTE MONITORING!")

	// Set up deviation channel
	deviationChan := make(chan *models.RouteDeviation, 100)

	// Subscribe to route deviations
	unsubscribe := s.services.LocationService.SubscribeToRouteDeviations(req.TripIds, req.MaxDeviationMeters, deviationChan)
	defer unsubscribe()

	// Stream deviations
	for {
		select {
		case deviation := <-deviationChan:
			pbDeviation := &pb.RouteDeviation{
				TripId:            uint32(deviation.TripID),
				TrackingId:        fmt.Sprintf("dev_%d", deviation.ID), // Generate tracking ID
				VehicleId:         uint32(deviation.VehicleID),
				LicensePlate:      "TBD", // Would be populated from Vehicle relationship
				DriverId:          uint32(deviation.DriverID),
				DriverName:        "TBD", // Would be populated from Driver relationship
				DeviationDistance: deviation.DeviationDistance,
				DeviationDuration: uint32(deviation.DeviationDuration),
				DeviationStart: &pb.Location{
					Latitude:  deviation.StartLatitude,
					Longitude: deviation.StartLongitude,
					Timestamp: timestamppb.New(deviation.StartTime),
				},
				CurrentLocation: &pb.Location{
					Latitude: func() float64 {
						if deviation.EndLatitude != nil {
							return *deviation.EndLatitude
						}
						return deviation.StartLatitude
					}(),
					Longitude: func() float64 {
						if deviation.EndLongitude != nil {
							return *deviation.EndLongitude
						}
						return deviation.StartLongitude
					}(),
					Timestamp: func() *timestamppb.Timestamp {
						if deviation.EndTime != nil {
							return timestamppb.New(*deviation.EndTime)
						}
						return timestamppb.New(deviation.StartTime)
					}(),
				},
				Reason:    deviation.Reason,
				Severity:  convertAlertSeverity("MEDIUM"), // Mock severity
				StartTime: timestamppb.New(deviation.StartTime),
				Timestamp: timestamppb.New(deviation.CreatedAt),
			}

			if err := stream.Send(pbDeviation); err != nil {
				log.Printf("❌ Failed to send route deviation: %v", err)
				return err
			}

		case <-stream.Context().Done():
			log.Printf("📍 StreamRouteDeviations ended")
			return nil
		}
	}
}

// StreamLocationEvents streams comprehensive location events
func (s *LocationServer) StreamLocationEvents(req *pb.LocationEventRequest, stream pb.LocationService_StreamLocationEventsServer) error {
	log.Printf("🚀 StreamLocationEvents started - COMPREHENSIVE LOCATION MONITORING!")

	// Set up event channel
	eventChan := make(chan *models.LocationEvent, 100)

	// Subscribe to location events
	unsubscribe := s.services.LocationService.SubscribeToLocationEvents(req.VehicleIds, req.EventTypes, eventChan)
	defer unsubscribe()

	// Stream events
	for {
		select {
		case event := <-eventChan:
			// Filter by severity
			if req.MinSeverity != pb.AlertSeverity_ALERT_SEVERITY_UNSPECIFIED {
				if convertAlertSeverity(event.Severity) < req.MinSeverity {
					continue
				}
			}

			pbEvent := &pb.LocationEvent{
				EventId:      event.EventID,
				EventType:    event.EventType,
				VehicleId:    uint32(event.VehicleID),
				LicensePlate: event.LicensePlate,
				DriverId:     uint32(event.DriverID),
				DriverName:   event.DriverName,
				Location: &pb.Location{
					Latitude:  event.Location.Latitude,
					Longitude: event.Location.Longitude,
					Timestamp: timestamppb.New(event.Location.Timestamp),
				},
				Severity:    convertAlertSeverity(event.Severity),
				Description: event.Description,
				Metadata:    event.Metadata,
				Timestamp:   timestamppb.New(event.Timestamp),
			}

			// Add event-specific data
			if event.GeofenceData != nil {
				pbEvent.GeofenceData = &pb.GeofenceAlert{
					VehicleId:    uint32(event.GeofenceData.VehicleID),
					GeofenceId:   uint32(event.GeofenceData.GeofenceID),
					GeofenceName: event.GeofenceData.GeofenceName,
					EventType:    convertGeofenceEventType(event.GeofenceData.EventType),
					Description:  event.GeofenceData.Description,
					Timestamp:    timestamppb.New(event.GeofenceData.Timestamp),
				}
			}

			if err := stream.Send(pbEvent); err != nil {
				log.Printf("❌ Failed to send location event: %v", err)
				return err
			}

		case <-stream.Context().Done():
			log.Printf("📍 StreamLocationEvents ended")
			return nil
		}
	}
}

// Helper functions for streaming management
func (s *LocationServer) generateClientID() string {
	return fmt.Sprintf("client_%d", time.Now().UnixNano())
}

func (s *LocationServer) registerGPSStream(clientID string, ch chan *pb.GPSBroadcast) {
	s.streamsMutex.Lock()
	defer s.streamsMutex.Unlock()
	// This would be used to manage GPS broadcast streams
	log.Printf("📍 Registered GPS stream: %s", clientID)
}

func (s *LocationServer) unregisterGPSStream(clientID string) {
	s.streamsMutex.Lock()
	defer s.streamsMutex.Unlock()
	// Clean up GPS stream
	log.Printf("📍 Unregistered GPS stream: %s", clientID)
}

func (s *LocationServer) processGPSUpdate(update *pb.GPSUpdate) error {
	// Convert to model and save
	locationPing := &models.LocationPing{
		Latitude:  update.Latitude,
		Longitude: update.Longitude,
		Speed:     &update.Speed,
		Heading:   &update.Heading,
		Accuracy:  update.Accuracy,
		Timestamp: update.Timestamp.AsTime(),
		VehicleID: func() *uint {
			if update.VehicleId != 0 {
				id := uint(update.VehicleId)
				return &id
			}
			return nil
		}(),
		DriverID: func() *uint {
			if update.DriverId != 0 {
				id := uint(update.DriverId)
				return &id
			}
			return nil
		}(),
		TripID: func() *uint {
			if update.TripId != 0 {
				id := uint(update.TripId)
				return &id
			}
			return nil
		}(),
		BatteryLevel: func() *int { level := int(update.BatteryLevel); return &level }(),
		NetworkType:  update.NetworkType,
		Source:       "GPS_STREAM",
	}

	// Save and process
	if err := s.services.LocationService.SaveLocationPing(locationPing); err != nil {
		return err
	}

	// Check for geofence violations, route deviations, etc.
	s.services.LocationService.ProcessLocationUpdate(locationPing)

	return nil
}

func (s *LocationServer) broadcastLocationUpdate(ping *models.LocationPing) {
	// This would broadcast to all active fleet monitoring streams
	// Implementation would involve maintaining active stream channels
	log.Printf("📍 Broadcasting location update for vehicle: %d", ping.VehicleID)
}

func (s *LocationServer) convertToFleetLocationUpdate(location *models.FleetLocation) *pb.FleetLocationUpdate {
	return &pb.FleetLocationUpdate{
		VehicleId:    uint32(location.VehicleID),
		LicensePlate: location.LicensePlate,
		Location: &pb.Location{
			Latitude:  location.Location.Latitude,
			Longitude: location.Location.Longitude,
			Accuracy:  location.Location.Accuracy,
			Timestamp: timestamppb.New(location.Location.Timestamp),
		},
		Status:          convertVehicleStatus(location.Status),
		Speed:           location.Speed,
		Heading:         location.Heading,
		CurrentDriverId: uint32(location.CurrentDriverID),
		DriverName:      location.DriverName,
		DriverStatus:    convertDriverStatus(location.DriverStatus),
		CurrentTripId:   uint32(location.CurrentTripID),
		TripStatus:      convertTripStatus(location.TripStatus),
		FuelLevel:       location.FuelLevel,
		LastUpdate:      timestamppb.New(location.LastUpdate),
	}
}

// Note: convertVehicleStatus and convertTripStatus are defined in vehicle_server.go and trip_server.go respectively

func convertAlertSeverity(severity string) pb.AlertSeverity {
	switch severity {
	case "low":
		return pb.AlertSeverity_ALERT_SEVERITY_LOW
	case "medium":
		return pb.AlertSeverity_ALERT_SEVERITY_MEDIUM
	case "high":
		return pb.AlertSeverity_ALERT_SEVERITY_HIGH
	case "critical":
		return pb.AlertSeverity_ALERT_SEVERITY_CRITICAL
	default:
		return pb.AlertSeverity_ALERT_SEVERITY_UNSPECIFIED
	}
}

func convertGeofenceEventType(eventType string) pb.GeofenceEventType {
	switch eventType {
	case "enter":
		return pb.GeofenceEventType_GEOFENCE_EVENT_ENTER
	case "exit":
		return pb.GeofenceEventType_GEOFENCE_EVENT_EXIT
	case "dwell":
		return pb.GeofenceEventType_GEOFENCE_EVENT_DWELL
	default:
		return pb.GeofenceEventType_GEOFENCE_EVENT_UNSPECIFIED
	}
}
