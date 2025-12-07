package services

import (
	"context"
	"fmt"
	"math"

	"googlemaps.github.io/maps"
)

// NavigationService handles advanced navigation features
type NavigationService struct {
	mapsClient *maps.Client
}

// NewNavigationService creates a new navigation service
func NewNavigationService(mapsClient *maps.Client) *NavigationService {
	return &NavigationService{
		mapsClient: mapsClient,
	}
}

// CalculateDeadReckoning estimates the current position based on last known state
// This is used when GPS signal is lost (e.g., tunnels)
func (s *NavigationService) CalculateDeadReckoning(lastLat, lastLon, speedKmh, headingDeg float64, timeDeltaSeconds float64) (float64, float64) {
	// Convert units
	speedMs := speedKmh * 1000 / 3600
	distanceMeters := speedMs * timeDeltaSeconds

	// Earth radius in meters
	const R = 6371000

	// Convert to radians
	lat1 := lastLat * math.Pi / 180
	lon1 := lastLon * math.Pi / 180
	bearing := headingDeg * math.Pi / 180

	// Formula to calculate new lat/lon
	lat2 := math.Asin(math.Sin(lat1)*math.Cos(distanceMeters/R) + math.Cos(lat1)*math.Sin(distanceMeters/R)*math.Cos(bearing))
	lon2 := lon1 + math.Atan2(math.Sin(bearing)*math.Sin(distanceMeters/R)*math.Cos(lat1), math.Cos(distanceMeters/R)-math.Sin(lat1)*math.Sin(lat2))

	// Convert back to degrees
	newLat := lat2 * 180 / math.Pi
	newLon := lon2 * 180 / math.Pi

	return newLat, newLon
}

// SnapToRoad takes a raw GPS point and returns the nearest road segment
// Uses Google Maps Roads API (or OSRM in future)
func (s *NavigationService) SnapToRoad(ctx context.Context, lat, lon float64) (float64, float64, error) {
	// TODO: Fix SnapToRoads implementation with correct library method
	return lat, lon, nil
}

// GeocodeAddress converts an address string to Lat/Lon
func (s *NavigationService) GeocodeAddress(ctx context.Context, address string) (float64, float64, error) {
	if s.mapsClient == nil {
		return 0, 0, fmt.Errorf("maps client not initialized")
	}

	r := &maps.GeocodingRequest{
		Address: address,
	}

	resp, err := s.mapsClient.Geocode(ctx, r)
	if err != nil {
		return 0, 0, fmt.Errorf("geocoding failed: %w", err)
	}

	if len(resp) > 0 {
		return resp[0].Geometry.Location.Lat, resp[0].Geometry.Location.Lng, nil
	}

	return 0, 0, fmt.Errorf("address not found")
}

// ReverseGeocode converts Lat/Lon to a human-readable address
func (s *NavigationService) ReverseGeocode(ctx context.Context, lat, lon float64) (string, error) {
	if s.mapsClient == nil {
		return "Unknown Location", nil
	}

	r := &maps.GeocodingRequest{
		LatLng: &maps.LatLng{Lat: lat, Lng: lon},
	}

	resp, err := s.mapsClient.Geocode(ctx, r)
	if err != nil {
		return "", fmt.Errorf("reverse geocoding failed: %w", err)
	}

	if len(resp) > 0 {
		return resp[0].FormattedAddress, nil
	}

	return "Unknown Location", nil
}

// GetTurnByTurnDirections fetches route instructions
func (s *NavigationService) GetTurnByTurnDirections(ctx context.Context, origin, dest string) ([]string, error) {
	if s.mapsClient == nil {
		return []string{}, fmt.Errorf("maps client not initialized")
	}

	r := &maps.DirectionsRequest{
		Origin:      origin,
		Destination: dest,
		Mode:        maps.TravelModeDriving,
	}

	routes, _, err := s.mapsClient.Directions(ctx, r)
	if err != nil {
		return nil, fmt.Errorf("directions failed: %w", err)
	}

	var steps []string
	if len(routes) > 0 && len(routes[0].Legs) > 0 {
		for _, step := range routes[0].Legs[0].Steps {
			steps = append(steps, step.HTMLInstructions) // Contains HTML, client should parse or display
		}
	}

	return steps, nil
}
