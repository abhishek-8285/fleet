package simulator

import (
	"log"
	"math/rand"
	"time"
)

type Simulator struct {
	vehicles []*VirtualVehicle
	mqtt     *MQTTClient
	running  bool
}

func NewSimulator() *Simulator {
	// Connect to MQTT (assuming running locally or via docker network)
	// For local dev, we use localhost:1883. In docker, use mosquitto:1883
	mqttClient := NewMQTTClient("tcp://localhost:1883", "fleetflow", "fleetflow123")

	return &Simulator{
		mqtt: mqttClient,
		vehicles: []*VirtualVehicle{
			NewVirtualVehicle("TRUCK-001", "KA-01-HH-1234", RouteBangaloreCity),
			NewVirtualVehicle("TRUCK-002", "MH-02-AB-9876", RouteHighway),
			NewVirtualVehicle("VAN-003", "DL-03-XY-5555", RouteBangaloreCity),
		},
	}
}

func (s *Simulator) Start() {
	s.running = true
	log.Printf("🚀 Starting simulation for %d vehicles...\n", len(s.vehicles))

	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for s.running {
		select {
		case <-ticker.C:
			for _, v := range s.vehicles {
				v.Update(1.0) // 1 second delta
				s.mqtt.PublishTelemetry(v.ID, v.Telemetry)

				log.Printf("📡 [%s] Lat: %.4f, Lon: %.4f, Speed: %.0f km/h, Fuel: %.1f%%",
					v.ID, v.Telemetry.Latitude, v.Telemetry.Longitude, v.Telemetry.Speed, v.Telemetry.FuelLevel)

				if len(v.Telemetry.Events) > 0 {
					for _, e := range v.Telemetry.Events {
						log.Printf("⚠️ [%s] EVENT: %s (Severity: %s)", v.ID, e.Type, e.Severity)
					}
				}
			}
		}
	}
}

func (s *Simulator) Stop() {
	s.running = false
	s.mqtt.Disconnect()
}

type VirtualVehicle struct {
	ID        string
	Plate     string
	Telemetry TelemetryData
	Route     *RouteEngine
}

type TelemetryData struct {
	Latitude  float64       `json:"latitude"`
	Longitude float64       `json:"longitude"`
	Speed     float64       `json:"speed"`
	RPM       float64       `json:"rpm"`
	FuelLevel float64       `json:"fuel_level"`
	Timestamp int64         `json:"timestamp"`
	Events    []SafetyEvent `json:"events,omitempty"`
}

type SafetyEvent struct {
	Type      string `json:"type"`     // "HARSH_BRAKING", "SPEEDING", "CORNERING", "FUEL_THEFT"
	Severity  string `json:"severity"` // "LOW", "MEDIUM", "HIGH", "CRITICAL"
	Timestamp int64  `json:"timestamp"`
}

func NewVirtualVehicle(id, plate string, route []Point) *VirtualVehicle {
	return &VirtualVehicle{
		ID:    id,
		Plate: plate,
		Route: NewRouteEngine(route),
		Telemetry: TelemetryData{
			Speed:     0,
			RPM:       800,
			FuelLevel: 100,
			Events:    []SafetyEvent{},
		},
	}
}

func (v *VirtualVehicle) Update(deltaSeconds float64) {
	// Reset events
	v.Telemetry.Events = []SafetyEvent{}

	// Simulate speed changes
	targetSpeed := 40.0 + rand.Float64()*40.0                   // 40-80 km/h
	v.Telemetry.Speed = v.Telemetry.Speed*0.9 + targetSpeed*0.1 // Smooth transition

	// Update position along route
	lat, lon := v.Route.UpdatePosition(v.Telemetry.Speed, deltaSeconds)
	v.Telemetry.Latitude = lat
	v.Telemetry.Longitude = lon

	// Update other metrics
	v.Telemetry.RPM = 1500 + (v.Telemetry.Speed * 20) + rand.Float64()*100
	v.Telemetry.FuelLevel -= 0.001 * deltaSeconds
	if v.Telemetry.FuelLevel < 0 {
		v.Telemetry.FuelLevel = 100
	}
	v.Telemetry.Timestamp = time.Now().Unix()

	// 🎲 Random Event Generation
	if rand.Float64() < 0.05 { // 5% chance per second
		eventType := ""
		severity := "MEDIUM"

		r := rand.Float64()
		if r < 0.33 {
			eventType = "HARSH_BRAKING"
			v.Telemetry.Speed *= 0.5 // Slow down rapidly
		} else if r < 0.66 {
			eventType = "SPEEDING"
			severity = "HIGH"
		} else {
			eventType = "CORNERING"
		}

		v.Telemetry.Events = append(v.Telemetry.Events, SafetyEvent{
			Type:      eventType,
			Severity:  severity,
			Timestamp: time.Now().Unix(),
		})
	}

	// ⛽ Simulate Fuel Theft (Rare)
	if rand.Float64() < 0.001 { // 0.1% chance
		v.Telemetry.FuelLevel -= 5.0 // Sudden drop
		v.Telemetry.Events = append(v.Telemetry.Events, SafetyEvent{
			Type:      "FUEL_THEFT",
			Severity:  "CRITICAL",
			Timestamp: time.Now().Unix(),
		})
	}
}
