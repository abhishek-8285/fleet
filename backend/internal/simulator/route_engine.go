package simulator

import (
	"math"
)

type RouteEngine struct {
	RoutePoints []Point
	CurrentIdx  int
	Progress    float64 // 0.0 to 1.0 between current and next point
}

type Point struct {
	Lat float64
	Lon float64
}

func NewRouteEngine(route []Point) *RouteEngine {
	return &RouteEngine{
		RoutePoints: route,
		CurrentIdx:  0,
		Progress:    0,
	}
}

func (r *RouteEngine) UpdatePosition(speedKmh float64, deltaSeconds float64) (float64, float64) {
	if len(r.RoutePoints) < 2 {
		return r.RoutePoints[0].Lat, r.RoutePoints[0].Lon
	}

	// Calculate distance to next point
	p1 := r.RoutePoints[r.CurrentIdx]
	p2 := r.RoutePoints[(r.CurrentIdx+1)%len(r.RoutePoints)] // Loop route

	distKm := haversine(p1.Lat, p1.Lon, p2.Lat, p2.Lon)
	if distKm == 0 {
		r.CurrentIdx = (r.CurrentIdx + 1) % len(r.RoutePoints)
		return p1.Lat, p1.Lon
	}

	// Calculate distance traveled in this step
	distTraveledKm := (speedKmh * deltaSeconds) / 3600.0

	// Update progress
	r.Progress += distTraveledKm / distKm

	if r.Progress >= 1.0 {
		// Reached next point
		r.CurrentIdx = (r.CurrentIdx + 1) % len(r.RoutePoints)
		r.Progress = 0
		return p2.Lat, p2.Lon
	}

	// Interpolate
	newLat := p1.Lat + (p2.Lat-p1.Lat)*r.Progress
	newLon := p1.Lon + (p2.Lon-p1.Lon)*r.Progress

	return newLat, newLon
}

// Haversine formula to calculate distance between two points in km
func haversine(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371 // Earth radius in km
	dLat := (lat2 - lat1) * (math.Pi / 180.0)
	dLon := (lon2 - lon1) * (math.Pi / 180.0)

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*(math.Pi/180.0))*math.Cos(lat2*(math.Pi/180.0))*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return R * c
}

// Predefined Routes (Bangalore)
var RouteBangaloreCity = []Point{
	{12.9716, 77.5946}, // MG Road
	{12.9352, 77.6245}, // Koramangala
	{12.9141, 77.6100}, // BTM Layout
	{12.9250, 77.5938}, // Jayanagar
	{12.9569, 77.5635}, // Chamrajpet
	{12.9716, 77.5946}, // Back to MG Road
}

var RouteHighway = []Point{
	{12.9716, 77.5946}, // Bangalore
	{12.2958, 76.6394}, // Mysore
	{12.9716, 77.5946}, // Back
}
