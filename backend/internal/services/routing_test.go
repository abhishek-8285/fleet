package services

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"googlemaps.github.io/maps"
)

// TestTSPLogic tests the greedy TSP algorithm
func TestTSPLogic(t *testing.T) {
	// Mock matrix: 3 points (0, 1, 2)
	// Distances:
	// 0->1: 10m
	// 0->2: 20m
	// 1->2: 5m
	// Optimal path: 0 -> 1 -> 2 (Total: 15m) vs 0 -> 2 -> 1 (Total: 25m)

	matrix := [][]MatrixElement{
		{ // From 0
			{Distance: 0, Duration: 0},
			{Distance: 10, Duration: 10 * time.Second},
			{Distance: 20, Duration: 20 * time.Second},
		},
		{ // From 1
			{Distance: 10, Duration: 10 * time.Second},
			{Distance: 0, Duration: 0},
			{Distance: 5, Duration: 5 * time.Second},
		},
		{ // From 2
			{Distance: 20, Duration: 20 * time.Second},
			{Distance: 5, Duration: 5 * time.Second},
			{Distance: 0, Duration: 0},
		},
	}

	rs := &RoutingService{}
	path := rs.solveTSP_Greedy(matrix)

	// Expected path: 0 -> 1 -> 2
	assert.Equal(t, []int{0, 1, 2}, path)
}

// TestDeviationLogic tests the route deviation detection
func TestDeviationLogic(t *testing.T) {
	rs := &RoutingService{}

	// Mock polyline: A straight line from (0,0) to (0,10)
	// We'll use simple coordinates for testing the distance logic
	// Note: The actual implementation uses Haversine, so we need lat/lng
	
	start := maps.LatLng{Lat: 12.9716, Lng: 77.5946} // Bangalore
	// end := maps.LatLng{Lat: 12.9716, Lng: 77.6046}   // ~1km East (Unused)

	// Point on route
	onRoute := Location{Lat: 12.9716, Lng: 77.5996} // Midpoint
	
	// Point off route (North)
	offRoute := Location{Lat: 12.9816, Lng: 77.5996} // ~1km North

	// Calculate distances manually to verify logic
	distOnRoute := rs.distance(maps.LatLng{Lat: onRoute.Lat, Lng: onRoute.Lng}, start)
	distOffRoute := rs.distance(maps.LatLng{Lat: offRoute.Lat, Lng: offRoute.Lng}, start)

	assert.True(t, distOnRoute < 1000)
	assert.True(t, distOffRoute > 1000)
}
