package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"

	// "net/url"
	"sort"
	"strings"
	"time"

	"googlemaps.github.io/maps"
)

type Location struct {
	Lat     float64 `json:"lat"`
	Lng     float64 `json:"lng"`
	Address string  `json:"address,omitempty"`
}

type RoutePoint struct {
	Location    Location    `json:"location"`
	Type        string      `json:"type"` // pickup, delivery, waypoint
	TimeWindow  *TimeWindow `json:"time_window,omitempty"`
	ServiceTime int         `json:"service_time"` // minutes
}

type TimeWindow struct {
	Start time.Time `json:"start"`
	End   time.Time `json:"end"`
}

type OptimizedRoute struct {
	Points          []RoutePoint `json:"points"`
	TotalDistance   int          `json:"total_distance"` // meters
	TotalDuration   int          `json:"total_duration"` // seconds
	EstimatedFuel   float64      `json:"estimated_fuel"` // liters
	EstimatedCost   float64      `json:"estimated_cost"` // INR
	Polyline        string       `json:"polyline"`
	Instructions    []string     `json:"instructions"`
	TrafficFactored bool         `json:"traffic_factored"`
}

type TrafficInfo struct {
	CurrentDelay    int       `json:"current_delay"`    // seconds
	AverageSpeed    float64   `json:"average_speed"`    // km/h
	CongestionLevel string    `json:"congestion_level"` // low, medium, high
	RecommendedTime time.Time `json:"recommended_time"`
}

type FuelOptimization struct {
	Route           OptimizedRoute `json:"route"`
	FuelStations    []FuelStation  `json:"fuel_stations"`
	FuelSavings     float64        `json:"fuel_savings"` // liters saved
	CostSavings     float64        `json:"cost_savings"` // INR saved
	RecommendedStop *FuelStation   `json:"recommended_stop,omitempty"`
}

type FuelStation struct {
	PlaceID   string   `json:"place_id"`
	Name      string   `json:"name"`
	Location  Location `json:"location"`
	PriceINR  float64  `json:"price_inr"` // per liter
	Distance  int      `json:"distance"`  // meters from route
	Detour    int      `json:"detour"`    // additional distance
	Brand     string   `json:"brand"`
	Rating    float64  `json:"rating"`
	OpenHours string   `json:"open_hours"`
}

type WeatherCondition struct {
	Temperature float64 `json:"temperature"` // celsius
	Humidity    float64 `json:"humidity"`    // percentage
	Visibility  float64 `json:"visibility"`  // km
	WindSpeed   float64 `json:"wind_speed"`  // km/h
	Condition   string  `json:"condition"`   // clear, rain, fog, etc.
	Impact      string  `json:"impact"`      // low, medium, high
}

type MapsService struct {
	client     *maps.Client
	apiKey     string
	weatherKey string
	httpClient *http.Client
}

func NewMapsService(apiKey, weatherKey string) (*MapsService, error) {
	client, err := maps.NewClient(maps.WithAPIKey(apiKey))
	if err != nil {
		return nil, fmt.Errorf("failed to create maps client: %w", err)
	}

	return &MapsService{
		client:     client,
		apiKey:     apiKey,
		weatherKey: weatherKey,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}, nil
}

// OptimizeRoute optimizes a route for multiple delivery points
func (ms *MapsService) OptimizeRoute(ctx context.Context, start Location, points []RoutePoint, vehicleType string) (*OptimizedRoute, error) {
	if len(points) == 0 {
		return nil, fmt.Errorf("no route points provided")
	}

	// For small number of points, use simple optimization
	if len(points) <= 10 {
		return ms.optimizeSimpleRoute(ctx, start, points, vehicleType)
	}

	// For larger routes, use advanced algorithms
	return ms.optimizeAdvancedRoute(ctx, start, points, vehicleType)
}

func (ms *MapsService) optimizeSimpleRoute(ctx context.Context, start Location, points []RoutePoint, vehicleType string) (*OptimizedRoute, error) {
	// Convert to waypoints for Google Maps
	waypoints := make([]string, len(points))
	for i, point := range points {
		waypoints[i] = fmt.Sprintf("%f,%f", point.Location.Lat, point.Location.Lng)
	}

	// Get directions with waypoint optimization
	req := &maps.DirectionsRequest{
		Origin:      fmt.Sprintf("%f,%f", start.Lat, start.Lng),
		Destination: waypoints[len(waypoints)-1],
		Waypoints:   waypoints[:len(waypoints)-1],
		Optimize:    true,
		Mode:        maps.TravelModeDriving,
		Language:    "en",
		Region:      "IN",
	}

	// Choose route type based on vehicle
	switch vehicleType {
	case "truck", "heavy_vehicle":
		req.Avoid = []maps.Avoid{maps.AvoidTolls} // Trucks often avoid tolls in India
	case "bike", "motorcycle":
		// No specific restrictions
	default:
		req.TrafficModel = maps.TrafficModelBestGuess
	}

	routes, _, err := ms.client.Directions(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to get directions: %w", err)
	}

	if len(routes) == 0 {
		return nil, fmt.Errorf("no routes found")
	}

	route := routes[0]

	// Reorder points based on optimized waypoint order
	optimizedPoints := ms.reorderPoints(points, route.WaypointOrder)

	// Calculate fuel and cost estimates
	totalDistance := 0
	totalDuration := 0
	instructions := []string{}

	for _, leg := range route.Legs {
		totalDistance += leg.Distance.Meters
		totalDuration += int(leg.Duration.Seconds())

		for _, step := range leg.Steps {
			instructions = append(instructions, step.HTMLInstructions)
		}
	}

	fuelConsumption := ms.calculateFuelConsumption(totalDistance, vehicleType)
	estimatedCost := ms.calculateTripCost(totalDistance, fuelConsumption, vehicleType)

	return &OptimizedRoute{
		Points:          optimizedPoints,
		TotalDistance:   totalDistance,
		TotalDuration:   totalDuration,
		EstimatedFuel:   fuelConsumption,
		EstimatedCost:   estimatedCost,
		Polyline:        route.OverviewPolyline.Points,
		Instructions:    instructions,
		TrafficFactored: true,
	}, nil
}

func (ms *MapsService) optimizeAdvancedRoute(ctx context.Context, start Location, points []RoutePoint, vehicleType string) (*OptimizedRoute, error) {
	// Use nearest neighbor algorithm with 2-opt improvement
	optimizedOrder := ms.nearestNeighborTSP(start, points)

	// Apply 2-opt improvements
	optimizedOrder = ms.twoOptImprovement(start, optimizedOrder)

	// Get actual route from Google Maps
	return ms.getRouteForOrder(ctx, start, optimizedOrder, vehicleType)
}

// GetTrafficInfo gets current traffic information for a route
func (ms *MapsService) GetTrafficInfo(ctx context.Context, start, end Location) (*TrafficInfo, error) {
	req := &maps.DirectionsRequest{
		Origin:       fmt.Sprintf("%f,%f", start.Lat, start.Lng),
		Destination:  fmt.Sprintf("%f,%f", end.Lat, end.Lng),
		Mode:         maps.TravelModeDriving,
		TrafficModel: maps.TrafficModelBestGuess,
	}

	routes, _, err := ms.client.Directions(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to get traffic info: %w", err)
	}

	if len(routes) == 0 {
		return nil, fmt.Errorf("no routes found")
	}

	route := routes[0]
	duration := route.Legs[0].Duration.Seconds()
	durationInTraffic := route.Legs[0].DurationInTraffic.Seconds()

	delay := int(durationInTraffic - duration)
	distance := route.Legs[0].Distance.Meters
	averageSpeed := (float64(distance) / durationInTraffic) * 3.6 // m/s to km/h

	congestionLevel := "low"
	if delay > 300 { // 5 minutes
		congestionLevel = "medium"
	}
	if delay > 900 { // 15 minutes
		congestionLevel = "high"
	}

	// Recommend better departure time
	recommendedTime := time.Now()
	if congestionLevel == "high" {
		// Suggest departure 2 hours later to avoid traffic
		recommendedTime = time.Now().Add(2 * time.Hour)
	}

	return &TrafficInfo{
		CurrentDelay:    delay,
		AverageSpeed:    averageSpeed,
		CongestionLevel: congestionLevel,
		RecommendedTime: recommendedTime,
	}, nil
}

// OptimizeForFuel finds the most fuel-efficient route with gas stations
func (ms *MapsService) OptimizeForFuel(ctx context.Context, start Location, end Location, currentFuelLevel float64, tankCapacity float64, vehicleType string) (*FuelOptimization, error) {
	// Get basic optimized route
	route, err := ms.OptimizeRoute(ctx, start, []RoutePoint{{Location: end, Type: "delivery"}}, vehicleType)
	if err != nil {
		return nil, fmt.Errorf("failed to optimize route: %w", err)
	}

	// Calculate if refueling is needed
	fuelNeeded := ms.calculateFuelConsumption(route.TotalDistance, vehicleType)

	if currentFuelLevel < fuelNeeded*1.2 { // 20% safety margin
		// Find fuel stations along route
		stations, err := ms.findFuelStationsAlongRoute(ctx, start, end, route.Polyline)
		if err != nil {
			return nil, fmt.Errorf("failed to find fuel stations: %w", err)
		}

		// Optimize for best fuel station
		bestStation := ms.selectBestFuelStation(stations, *route)

		return &FuelOptimization{
			Route:           *route,
			FuelStations:    stations,
			FuelSavings:     0, // Calculate based on alternative routes
			CostSavings:     0,
			RecommendedStop: bestStation,
		}, nil
	}

	return &FuelOptimization{
		Route:        *route,
		FuelStations: []FuelStation{},
		FuelSavings:  0,
		CostSavings:  0,
	}, nil
}

// GetWeatherConditions gets weather conditions for the route
func (ms *MapsService) GetWeatherConditions(ctx context.Context, locations []Location) ([]WeatherCondition, error) {
	conditions := make([]WeatherCondition, 0, len(locations))

	for _, location := range locations {
		weather, err := ms.getWeatherForLocation(ctx, location)
		if err != nil {
			// Continue with other locations if one fails
			continue
		}
		conditions = append(conditions, *weather)
	}

	return conditions, nil
}

func (ms *MapsService) getWeatherForLocation(ctx context.Context, location Location) (*WeatherCondition, error) {
	// Using OpenWeatherMap API as example
	url := fmt.Sprintf("https://api.openweathermap.org/data/2.5/weather?lat=%f&lon=%f&appid=%s&units=metric",
		location.Lat, location.Lng, ms.weatherKey)

	resp, err := ms.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch weather: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read weather response: %w", err)
	}

	var weatherData struct {
		Main struct {
			Temp     float64 `json:"temp"`
			Humidity float64 `json:"humidity"`
		} `json:"main"`
		Weather []struct {
			Main        string `json:"main"`
			Description string `json:"description"`
		} `json:"weather"`
		Wind struct {
			Speed float64 `json:"speed"`
		} `json:"wind"`
		Visibility int `json:"visibility"`
	}

	if err := json.Unmarshal(body, &weatherData); err != nil {
		return nil, fmt.Errorf("failed to parse weather data: %w", err)
	}

	condition := &WeatherCondition{
		Temperature: weatherData.Main.Temp,
		Humidity:    weatherData.Main.Humidity,
		WindSpeed:   weatherData.Wind.Speed * 3.6,           // m/s to km/h
		Visibility:  float64(weatherData.Visibility) / 1000, // m to km
	}

	if len(weatherData.Weather) > 0 {
		condition.Condition = strings.ToLower(weatherData.Weather[0].Main)
	}

	// Determine impact on driving
	condition.Impact = "low"
	if condition.Condition == "rain" || condition.Condition == "snow" {
		condition.Impact = "medium"
	}
	if condition.Condition == "thunderstorm" || condition.Visibility < 1.0 {
		condition.Impact = "high"
	}

	return condition, nil
}

// Helper functions

func (ms *MapsService) reorderPoints(points []RoutePoint, waypointOrder []int) []RoutePoint {
	if len(waypointOrder) == 0 {
		return points
	}

	reordered := make([]RoutePoint, len(points))
	for i, orderIndex := range waypointOrder {
		if orderIndex < len(points) {
			reordered[i] = points[orderIndex]
		}
	}

	return reordered
}

func (ms *MapsService) calculateFuelConsumption(distanceMeters int, vehicleType string) float64 {
	distanceKm := float64(distanceMeters) / 1000.0

	// Fuel efficiency estimates (km per liter) for Indian vehicles
	var efficiency float64
	switch vehicleType {
	case "truck":
		efficiency = 4.0 // 4 km/L for trucks
	case "heavy_vehicle":
		efficiency = 3.0 // 3 km/L for heavy vehicles
	case "car":
		efficiency = 15.0 // 15 km/L for cars
	case "bike":
		efficiency = 40.0 // 40 km/L for bikes
	default:
		efficiency = 12.0 // Default efficiency
	}

	return distanceKm / efficiency
}

func (ms *MapsService) calculateTripCost(distanceMeters int, fuelLiters float64, vehicleType string) float64 {
	// Cost components in INR
	fuelCostPerLiter := 100.0 // Average diesel price in India

	var maintenanceCostPerKm float64
	var driverCostPerKm float64

	switch vehicleType {
	case "truck", "heavy_vehicle":
		maintenanceCostPerKm = 3.0
		driverCostPerKm = 8.0
		fuelCostPerLiter = 95.0 // Diesel
	case "car":
		maintenanceCostPerKm = 1.5
		driverCostPerKm = 5.0
		fuelCostPerLiter = 105.0 // Petrol
	case "bike":
		maintenanceCostPerKm = 0.5
		driverCostPerKm = 3.0
		fuelCostPerLiter = 105.0 // Petrol
	}

	distanceKm := float64(distanceMeters) / 1000.0

	fuelCost := fuelLiters * fuelCostPerLiter
	maintenanceCost := distanceKm * maintenanceCostPerKm
	driverCost := distanceKm * driverCostPerKm

	return fuelCost + maintenanceCost + driverCost
}

func (ms *MapsService) nearestNeighborTSP(start Location, points []RoutePoint) []RoutePoint {
	if len(points) <= 1 {
		return points
	}

	visited := make([]bool, len(points))
	result := make([]RoutePoint, 0, len(points))
	current := start

	for len(result) < len(points) {
		nearest := -1
		minDistance := math.Inf(1)

		for i, point := range points {
			if visited[i] {
				continue
			}

			distance := ms.haversineDistance(current, point.Location)
			if distance < minDistance {
				minDistance = distance
				nearest = i
			}
		}

		if nearest != -1 {
			visited[nearest] = true
			result = append(result, points[nearest])
			current = points[nearest].Location
		}
	}

	return result
}

func (ms *MapsService) twoOptImprovement(start Location, points []RoutePoint) []RoutePoint {
	improved := true
	result := make([]RoutePoint, len(points))
	copy(result, points)

	for improved {
		improved = false
		for i := 1; i < len(result)-1; i++ {
			for j := i + 1; j < len(result); j++ {
				// Calculate current distance
				current := ms.calculateRouteDistance(start, result)

				// Swap and calculate new distance
				ms.reverse(result, i, j)
				newDistance := ms.calculateRouteDistance(start, result)

				if newDistance < current {
					improved = true
				} else {
					// Revert swap
					ms.reverse(result, i, j)
				}
			}
		}
	}

	return result
}

func (ms *MapsService) reverse(points []RoutePoint, start, end int) {
	for start < end {
		points[start], points[end] = points[end], points[start]
		start++
		end--
	}
}

func (ms *MapsService) calculateRouteDistance(start Location, points []RoutePoint) float64 {
	if len(points) == 0 {
		return 0
	}

	total := ms.haversineDistance(start, points[0].Location)
	for i := 1; i < len(points); i++ {
		total += ms.haversineDistance(points[i-1].Location, points[i].Location)
	}

	return total
}

func (ms *MapsService) haversineDistance(loc1, loc2 Location) float64 {
	const earthRadius = 6371 // Earth's radius in kilometers

	lat1Rad := loc1.Lat * math.Pi / 180
	lat2Rad := loc2.Lat * math.Pi / 180
	deltaLat := (loc2.Lat - loc1.Lat) * math.Pi / 180
	deltaLng := (loc2.Lng - loc1.Lng) * math.Pi / 180

	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*
			math.Sin(deltaLng/2)*math.Sin(deltaLng/2)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadius * c
}

func (ms *MapsService) getRouteForOrder(ctx context.Context, start Location, points []RoutePoint, vehicleType string) (*OptimizedRoute, error) {
	if len(points) == 0 {
		return &OptimizedRoute{
			Points:        points,
			TotalDistance: 0,
			TotalDuration: 0,
		}, nil
	}

	waypoints := make([]string, len(points)-1)
	for i := 0; i < len(points)-1; i++ {
		waypoints[i] = fmt.Sprintf("%f,%f", points[i].Location.Lat, points[i].Location.Lng)
	}

	req := &maps.DirectionsRequest{
		Origin:      fmt.Sprintf("%f,%f", start.Lat, start.Lng),
		Destination: fmt.Sprintf("%f,%f", points[len(points)-1].Location.Lat, points[len(points)-1].Location.Lng),
		Waypoints:   waypoints,
		Mode:        maps.TravelModeDriving,
		Language:    "en",
		Region:      "IN",
	}

	routes, _, err := ms.client.Directions(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to get route: %w", err)
	}

	if len(routes) == 0 {
		return nil, fmt.Errorf("no routes found")
	}

	route := routes[0]
	totalDistance := 0
	totalDuration := 0

	for _, leg := range route.Legs {
		totalDistance += leg.Distance.Meters
		totalDuration += int(leg.Duration.Seconds())
	}

	fuelConsumption := ms.calculateFuelConsumption(totalDistance, vehicleType)
	estimatedCost := ms.calculateTripCost(totalDistance, fuelConsumption, vehicleType)

	return &OptimizedRoute{
		Points:        points,
		TotalDistance: totalDistance,
		TotalDuration: totalDuration,
		EstimatedFuel: fuelConsumption,
		EstimatedCost: estimatedCost,
		Polyline:      route.OverviewPolyline.Points,
	}, nil
}

func (ms *MapsService) findFuelStationsAlongRoute(ctx context.Context, start, end Location, polyline string) ([]FuelStation, error) {
	// Use Google Places API to find fuel stations near the route
	midpoint := Location{
		Lat: (start.Lat + end.Lat) / 2,
		Lng: (start.Lng + end.Lng) / 2,
	}

	req := &maps.NearbySearchRequest{
		Location: &maps.LatLng{
			Lat: midpoint.Lat,
			Lng: midpoint.Lng,
		},
		Radius: 50000, // 50km radius
		Type:   maps.PlaceTypeGasStation,
	}

	result, err := ms.client.NearbySearch(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to find fuel stations: %w", err)
	}

	stations := make([]FuelStation, 0, len(result.Results))
	for _, place := range result.Results {
		station := FuelStation{
			PlaceID: place.PlaceID,
			Name:    place.Name,
			Location: Location{
				Lat: place.Geometry.Location.Lat,
				Lng: place.Geometry.Location.Lng,
			},
			Rating:   float64(place.Rating),
			PriceINR: 100.0, // Default price, would need to be updated from real data
		}

		// Calculate distance from route
		station.Distance = int(ms.haversineDistance(midpoint, station.Location) * 1000)

		stations = append(stations, station)
	}

	// Sort by distance
	sort.Slice(stations, func(i, j int) bool {
		return stations[i].Distance < stations[j].Distance
	})

	return stations, nil
}

func (ms *MapsService) selectBestFuelStation(stations []FuelStation, route OptimizedRoute) *FuelStation {
	if len(stations) == 0 {
		return nil
	}

	// Simple selection based on distance and price
	// In production, this would consider factors like:
	// - Brand reliability
	// - Opening hours
	// - Real-time fuel prices
	// - User reviews
	// - Detour impact on route

	best := &stations[0]
	bestScore := ms.calculateStationScore(stations[0])

	for i := 1; i < len(stations); i++ {
		score := ms.calculateStationScore(stations[i])
		if score > bestScore {
			best = &stations[i]
			bestScore = score
		}
	}

	return best
}

func (ms *MapsService) calculateStationScore(station FuelStation) float64 {
	// Scoring factors (higher is better)
	distanceScore := 1000.0 / (1.0 + float64(station.Distance)/1000.0) // Closer is better
	priceScore := 110.0 - station.PriceINR                             // Lower price is better
	ratingScore := station.Rating * 20                                 // Higher rating is better

	return distanceScore + priceScore + ratingScore
}
