package services

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/fleetflow/backend/internal/models"
	"googlemaps.github.io/maps"
)

// RoutingService handles advanced routing logic
type RoutingService struct {
	mapsService *MapsService
}

// NewRoutingService creates a new routing service
func NewRoutingService(mapsService *MapsService) *RoutingService {
	return &RoutingService{
		mapsService: mapsService,
	}
}

// MatrixElement represents a single cell in the distance matrix
type MatrixElement struct {
	Distance int           `json:"distance"` // meters
	Duration time.Duration `json:"duration"`
	Status   string        `json:"status"`
}

// GetDistanceMatrix fetches the distance matrix for a set of origins and destinations
func (rs *RoutingService) GetDistanceMatrix(ctx context.Context, origins, destinations []Location) ([][]MatrixElement, error) {
	if len(origins) == 0 || len(destinations) == 0 {
		return nil, fmt.Errorf("origins and destinations must not be empty")
	}

	// Convert locations to strings for the API
	originStrs := make([]string, len(origins))
	for i, loc := range origins {
		originStrs[i] = fmt.Sprintf("%f,%f", loc.Lat, loc.Lng)
	}

	destStrs := make([]string, len(destinations))
	for i, loc := range destinations {
		destStrs[i] = fmt.Sprintf("%f,%f", loc.Lat, loc.Lng)
	}

	req := &maps.DistanceMatrixRequest{
		Origins:      originStrs,
		Destinations: destStrs,
		Mode:         maps.TravelModeDriving,
		Language:     "en",
		// Region is not supported in DistanceMatrixRequest struct
	}

	resp, err := rs.mapsService.client.DistanceMatrix(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to get distance matrix: %w", err)
	}

	matrix := make([][]MatrixElement, len(origins))
	for i, row := range resp.Rows {
		matrix[i] = make([]MatrixElement, len(destinations))
		for j, element := range row.Elements {
			matrix[i][j] = MatrixElement{
				Distance: element.Distance.Meters,
				Duration: element.Duration,
				Status:   element.Status,
			}
		}
	}

	return matrix, nil
}

// OptimizeMultiStopRoute optimizes a route with multiple stops using matrix data
func (rs *RoutingService) OptimizeMultiStopRoute(ctx context.Context, start Location, stops []RoutePoint, vehicleType string) (*OptimizedRoute, error) {
	if len(stops) == 0 {
		return nil, fmt.Errorf("no stops provided")
	}

	// 1. Get Distance Matrix for all points (Start + Stops)
	allPoints := append([]Location{start}, make([]Location, len(stops))...)
	for i, stop := range stops {
		allPoints[i+1] = stop.Location
	}

	matrix, err := rs.GetDistanceMatrix(ctx, allPoints, allPoints)
	if err != nil {
		return nil, err
	}

	// 2. Solve TSP (Traveling Salesman Problem)
	// For small N (< 10), we can use brute force or dynamic programming.
	// For larger N, we use Nearest Neighbor with 2-opt (implemented in MapsService, but we can enhance it here with Matrix data)

	// For now, let's use a greedy approach with the matrix data
	optimizedIndices := rs.solveTSP_Greedy(matrix)

	// 3. Reconstruct the ordered list of stops
	// Note: optimizedIndices[0] is always 0 (start), so we skip it
	orderedStops := make([]RoutePoint, len(stops))
	for i := 1; i < len(optimizedIndices); i++ {
		originalIndex := optimizedIndices[i] - 1 // Adjust for start point
		orderedStops[i-1] = stops[originalIndex]
	}

	// 4. Get final route details from Maps Service
	return rs.mapsService.OptimizeRoute(ctx, start, orderedStops, vehicleType)
}

// solveTSP_Greedy solves TSP using a greedy nearest neighbor approach based on the matrix
func (rs *RoutingService) solveTSP_Greedy(matrix [][]MatrixElement) []int {
	n := len(matrix)
	visited := make([]bool, n)
	path := make([]int, 0, n)

	current := 0 // Start at origin
	visited[current] = true
	path = append(path, current)

	for len(path) < n {
		nearest := -1
		minDuration := time.Duration(1<<63 - 1) // Max duration

		for i := 0; i < n; i++ {
			if !visited[i] {
				duration := matrix[current][i].Duration
				if duration < minDuration {
					minDuration = duration
					nearest = i
				}
			}
		}

		if nearest != -1 {
			visited[nearest] = true
			path = append(path, nearest)
			current = nearest
		} else {
			break // Should not happen if graph is connected
		}
	}

	return path
}

// CalculateETA predicts the arrival time at a destination
func (rs *RoutingService) CalculateETA(ctx context.Context, origin, destination Location, departureTime time.Time) (time.Time, error) {
	req := &maps.DirectionsRequest{
		Origin:        fmt.Sprintf("%f,%f", origin.Lat, origin.Lng),
		Destination:   fmt.Sprintf("%f,%f", destination.Lat, destination.Lng),
		Mode:          maps.TravelModeDriving,
		DepartureTime: fmt.Sprintf("%d", departureTime.Unix()),
		TrafficModel:  maps.TrafficModelBestGuess,
	}

	routes, _, err := rs.mapsService.client.Directions(ctx, req)
	if err != nil {
		return time.Time{}, fmt.Errorf("failed to calculate ETA: %w", err)
	}

	if len(routes) == 0 {
		return time.Time{}, fmt.Errorf("no route found")
	}

	duration := routes[0].Legs[0].DurationInTraffic
	if duration == 0 {
		duration = routes[0].Legs[0].Duration
	}

	return departureTime.Add(duration), nil
}

// CheckRouteDeviation checks if a driver is deviating from the planned route
func (rs *RoutingService) CheckRouteDeviation(ctx context.Context, currentLoc Location, routePolyline string) (bool, float64, error) {
	// Decode polyline
	path, err := maps.DecodePolyline(routePolyline)
	if err != nil {
		return false, 0, fmt.Errorf("failed to decode polyline: %w", err)
	}

	// Find minimum distance from current location to any point on the path
	minDistance := math.MaxFloat64

	// Convert current location to maps.LatLng
	point := maps.LatLng{Lat: currentLoc.Lat, Lng: currentLoc.Lng}

	for _, p := range path {
		dist := rs.distance(point, p)
		if dist < minDistance {
			minDistance = dist
		}
	}

	// Threshold for deviation: 500 meters
	isDeviating := minDistance > 500
	return isDeviating, minDistance, nil
}

// distance calculates distance between two points in meters (Haversine approximation)
func (rs *RoutingService) distance(p1, p2 maps.LatLng) float64 {
	const R = 6371000 // Earth radius in meters

	lat1 := p1.Lat * math.Pi / 180
	lat2 := p2.Lat * math.Pi / 180
	dLat := (p2.Lat - p1.Lat) * math.Pi / 180
	dLng := (p2.Lng - p1.Lng) * math.Pi / 180

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1)*math.Cos(lat2)*
			math.Sin(dLng/2)*math.Sin(dLng/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return R * c
}

// RouteAssignmentService handles automated trip assignment
type RouteAssignmentService struct {
	routingService *RoutingService
}

// NewRouteAssignmentService creates a new route assignment service
func NewRouteAssignmentService(routingService *RoutingService) *RouteAssignmentService {
	return &RouteAssignmentService{
		routingService: routingService,
	}
}

// AssignTripToBestDriver finds the best driver for a trip based on ETA and cost
func (ras *RouteAssignmentService) AssignTripToBestDriver(ctx context.Context, trip *models.Trip, availableDrivers []models.Driver) (*models.Driver, error) {
	if len(availableDrivers) == 0 {
		return nil, fmt.Errorf("no available drivers")
	}

	// 1. Calculate ETA for each driver to pickup location
	pickupLoc := Location{Lat: trip.PickupLatitude, Lng: trip.PickupLongitude}
	driverLocs := make([]Location, len(availableDrivers))

	// In a real scenario, we would get the driver's current location from Redis/DB
	// For now, we'll assume the driver's last known location is available
	// This is a placeholder implementation
	for i := range availableDrivers {
		// Mock location for now
		driverLocs[i] = Location{Lat: 28.6139, Lng: 77.2090}
	}

	matrix, err := ras.routingService.GetDistanceMatrix(ctx, driverLocs, []Location{pickupLoc})
	if err != nil {
		return nil, err
	}

	// 2. Score drivers based on ETA and other factors (rating, vehicle type)
	bestDriverIndex := -1
	minDuration := time.Duration(1<<63 - 1)

	for i, row := range matrix {
		if len(row) > 0 {
			duration := row[0].Duration
			if duration < minDuration {
				minDuration = duration
				bestDriverIndex = i
			}
		}
	}

	if bestDriverIndex != -1 {
		return &availableDrivers[bestDriverIndex], nil
	}

	return nil, fmt.Errorf("could not find a suitable driver")
}
