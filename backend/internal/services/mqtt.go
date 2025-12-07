package services

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/fleetflow/backend/internal/config"
)

// MQTTService handles MQTT pub/sub for real-time fleet communication
type MQTTService struct {
	client    mqtt.Client
	config    *config.Config
	isEnabled bool
}

// MQTT Topic Structure for FleetFlow
const (
	// Vehicle Topics
	TOPIC_VEHICLE_LOCATION    = "fleetflow/vehicle/%d/location"    // Real-time GPS
	TOPIC_VEHICLE_STATUS      = "fleetflow/vehicle/%d/status"      // Status updates
	TOPIC_VEHICLE_FUEL        = "fleetflow/vehicle/%d/fuel"        // Fuel events
	TOPIC_VEHICLE_MAINTENANCE = "fleetflow/vehicle/%d/maintenance" // Maintenance alerts
	TOPIC_VEHICLE_DIAGNOSTICS = "fleetflow/vehicle/%d/diagnostics" // Engine data

	// Driver Topics
	TOPIC_DRIVER_LOCATION = "fleetflow/driver/%d/location" // Driver GPS
	TOPIC_DRIVER_STATUS   = "fleetflow/driver/%d/status"   // Available/Break/etc
	TOPIC_DRIVER_ACTIVITY = "fleetflow/driver/%d/activity" // Driver actions

	// Trip Topics
	TOPIC_TRIP_UPDATES    = "fleetflow/trip/%d/updates"    // Trip progress
	TOPIC_TRIP_ALERTS     = "fleetflow/trip/%d/alerts"     // Route deviations
	TOPIC_TRIP_COMPLETION = "fleetflow/trip/%d/completion" // Delivery status

	// Fleet-wide Topics
	TOPIC_FLEET_ALERTS    = "fleetflow/fleet/alerts"    // System alerts
	TOPIC_FLEET_BROADCAST = "fleetflow/fleet/broadcast" // Announcements
	TOPIC_FLEET_EMERGENCY = "fleetflow/fleet/emergency" // Emergency events

	// Mobile App Topics
	TOPIC_MOBILE_DRIVER   = "fleetflow/mobile/driver/%d"   // Driver mobile app
	TOPIC_MOBILE_ADMIN    = "fleetflow/mobile/admin/%d"    // Admin mobile app
	TOPIC_MOBILE_CUSTOMER = "fleetflow/mobile/customer/%s" // Customer tracking
)

// MQTT Message Payloads
type LocationUpdate struct {
	VehicleID      uint      `json:"vehicle_id"`
	DriverID       *uint     `json:"driver_id,omitempty"`
	Latitude       float64   `json:"latitude"`
	Longitude      float64   `json:"longitude"`
	Speed          float64   `json:"speed"`
	Heading        float64   `json:"heading"`
	Accuracy       float64   `json:"accuracy"`
	Timestamp      time.Time `json:"timestamp"`
	Address        string    `json:"address,omitempty"`
	BatteryLevel   *int      `json:"battery_level,omitempty"`
	SignalStrength *int      `json:"signal_strength,omitempty"`
}

type TelemetryUpdate struct {
	VehicleID      uint      `json:"vehicle_id"`
	Timestamp      time.Time `json:"timestamp"`
	EngineRPM      *int      `json:"engine_rpm,omitempty"`
	Speed          *float64  `json:"speed,omitempty"`
	CoolantTemp    *float64  `json:"coolant_temp,omitempty"`
	EngineLoad     *float64  `json:"engine_load,omitempty"`
	ThrottlePos    *float64  `json:"throttle_pos,omitempty"`
	FuelLevel      *float64  `json:"fuel_level,omitempty"`
	BatteryVoltage *float64  `json:"battery_voltage,omitempty"`
	Odometer       *float64  `json:"odometer,omitempty"`
	EngineHours    *float64  `json:"engine_hours,omitempty"`
	FuelUsed       *float64  `json:"fuel_used,omitempty"`
	DTCs           []string  `json:"dtcs,omitempty"` // List of active fault codes
}

type VehicleStatusUpdate struct {
	VehicleID    uint      `json:"vehicle_id"`
	Status       string    `json:"status"` // AVAILABLE, ON_TRIP, MAINTENANCE, OFFLINE
	DriverID     *uint     `json:"driver_id,omitempty"`
	TripID       *uint     `json:"trip_id,omitempty"`
	LastSeen     time.Time `json:"last_seen"`
	FuelLevel    *float64  `json:"fuel_level,omitempty"`
	Odometer     *float64  `json:"odometer,omitempty"`
	EngineStatus string    `json:"engine_status,omitempty"`
}

type TripProgressUpdate struct {
	TripID           uint            `json:"trip_id"`
	VehicleID        uint            `json:"vehicle_id"`
	DriverID         uint            `json:"driver_id"`
	Status           string          `json:"status"` // CREATED, STARTED, IN_PROGRESS, COMPLETED
	CurrentLocation  *LocationUpdate `json:"current_location,omitempty"`
	DistanceCovered  float64         `json:"distance_covered"`
	EstimatedArrival *time.Time      `json:"estimated_arrival,omitempty"`
	CustomerPhone    string          `json:"customer_phone,omitempty"`
	DeliveryCode     string          `json:"delivery_code,omitempty"`
}

type FleetAlert struct {
	ID             string          `json:"id"`
	Type           string          `json:"type"`     // FUEL_THEFT, ROUTE_DEVIATION, MAINTENANCE, EMERGENCY
	Severity       string          `json:"severity"` // LOW, MEDIUM, HIGH, CRITICAL
	VehicleID      *uint           `json:"vehicle_id,omitempty"`
	DriverID       *uint           `json:"driver_id,omitempty"`
	TripID         *uint           `json:"trip_id,omitempty"`
	Message        string          `json:"message"`
	Location       *LocationUpdate `json:"location,omitempty"`
	Timestamp      time.Time       `json:"timestamp"`
	RequiresAction bool            `json:"requires_action"`
}

// NewMQTTService creates a new MQTT service
func NewMQTTService(config *config.Config) *MQTTService {
	service := &MQTTService{
		config:    config,
		isEnabled: config.MQTT.Enabled,
	}

	if service.isEnabled {
		if err := service.connect(); err != nil {
			log.Printf("❌ MQTT connection failed: %v", err)
			service.isEnabled = false
		} else {
			log.Println("✅ MQTT service initialized successfully")
		}
	} else {
		log.Println("⚪ MQTT service disabled in configuration")
	}

	return service
}

// connect establishes connection to MQTT broker
func (m *MQTTService) connect() error {
	opts := mqtt.NewClientOptions().
		AddBroker(m.config.MQTT.Broker).
		SetClientID(fmt.Sprintf("fleetflow-backend-%d", time.Now().Unix())).
		SetUsername(m.config.MQTT.Username).
		SetPassword(m.config.MQTT.Password).
		SetKeepAlive(60 * time.Second).
		SetDefaultPublishHandler(m.defaultMessageHandler).
		SetPingTimeout(10 * time.Second).
		SetConnectTimeout(10 * time.Second).
		SetAutoReconnect(true).
		SetMaxReconnectInterval(5 * time.Minute).
		SetCleanSession(true)

	// Connection lost handler
	opts.SetConnectionLostHandler(func(client mqtt.Client, err error) {
		log.Printf("🔥 MQTT connection lost: %v", err)
	})

	// On connect handler
	opts.SetOnConnectHandler(func(client mqtt.Client) {
		log.Println("🚀 MQTT client connected to broker")

		// Subscribe to fleet-wide topics
		m.subscribeToFleetTopics()
	})

	m.client = mqtt.NewClient(opts)

	// Connect to broker
	if token := m.client.Connect(); token.Wait() && token.Error() != nil {
		return fmt.Errorf("failed to connect to MQTT broker: %w", token.Error())
	}

	return nil
}

// subscribeToFleetTopics subscribes to fleet-wide management topics
func (m *MQTTService) subscribeToFleetTopics() {
	// Subscribe to emergency alerts
	m.client.Subscribe(TOPIC_FLEET_EMERGENCY, 2, func(client mqtt.Client, msg mqtt.Message) {
		log.Printf("🚨 EMERGENCY ALERT: %s", string(msg.Payload()))
		// Handle emergency - notify all admins, trigger alerts, etc.
	})

	// Subscribe to fleet alerts for processing
	m.client.Subscribe(TOPIC_FLEET_ALERTS, 1, func(client mqtt.Client, msg mqtt.Message) {
		var alert FleetAlert
		if err := json.Unmarshal(msg.Payload(), &alert); err == nil {
			log.Printf("⚠️ Fleet Alert: %s - %s", alert.Type, alert.Message)
			// Process alert - store in DB, trigger notifications, etc.
		}
	})

	log.Println("📡 Subscribed to fleet management topics")
}

// defaultMessageHandler handles unprocessed messages
func (m *MQTTService) defaultMessageHandler(client mqtt.Client, msg mqtt.Message) {
	log.Printf("📨 MQTT message received on topic: %s", msg.Topic())
}

// IsEnabled returns if MQTT service is active
func (m *MQTTService) IsEnabled() bool {
	return m.isEnabled && m.client.IsConnected()
}

// PublishLocationUpdate publishes real-time vehicle location
func (m *MQTTService) PublishLocationUpdate(vehicleID uint, location *LocationUpdate) error {
	if !m.IsEnabled() {
		return fmt.Errorf("MQTT service not enabled")
	}

	location.VehicleID = vehicleID
	location.Timestamp = time.Now()

	payload, err := json.Marshal(location)
	if err != nil {
		return fmt.Errorf("failed to marshal location update: %w", err)
	}

	topic := fmt.Sprintf(TOPIC_VEHICLE_LOCATION, vehicleID)

	// Publish with QoS 1 (at least once delivery)
	token := m.client.Publish(topic, 1, false, payload)
	if token.Wait() && token.Error() != nil {
		return fmt.Errorf("failed to publish location update: %w", token.Error())
	}

	log.Printf("📍 Published location update for vehicle %d", vehicleID)
	return nil
}

// PublishVehicleStatus publishes vehicle status changes
func (m *MQTTService) PublishVehicleStatus(vehicleID uint, status *VehicleStatusUpdate) error {
	if !m.IsEnabled() {
		return fmt.Errorf("MQTT service not enabled")
	}

	status.VehicleID = vehicleID
	status.LastSeen = time.Now()

	payload, err := json.Marshal(status)
	if err != nil {
		return fmt.Errorf("failed to marshal vehicle status: %w", err)
	}

	topic := fmt.Sprintf(TOPIC_VEHICLE_STATUS, vehicleID)
	token := m.client.Publish(topic, 1, false, payload)

	if token.Wait() && token.Error() != nil {
		return fmt.Errorf("failed to publish vehicle status: %w", token.Error())
	}

	log.Printf("🚗 Published status update for vehicle %d: %s", vehicleID, status.Status)
	return nil
}

// PublishTripProgress publishes trip progress updates
func (m *MQTTService) PublishTripProgress(tripID uint, progress *TripProgressUpdate) error {
	if !m.IsEnabled() {
		return fmt.Errorf("MQTT service not enabled")
	}

	progress.TripID = tripID

	payload, err := json.Marshal(progress)
	if err != nil {
		return fmt.Errorf("failed to marshal trip progress: %w", err)
	}

	topic := fmt.Sprintf(TOPIC_TRIP_UPDATES, tripID)
	token := m.client.Publish(topic, 1, false, payload)

	if token.Wait() && token.Error() != nil {
		return fmt.Errorf("failed to publish trip progress: %w", token.Error())
	}

	// Also publish to customer tracking if phone provided
	if progress.CustomerPhone != "" {
		customerTopic := fmt.Sprintf(TOPIC_MOBILE_CUSTOMER, progress.CustomerPhone)
		m.client.Publish(customerTopic, 1, false, payload)
	}

	log.Printf("📦 Published trip progress for trip %d: %s", tripID, progress.Status)
	return nil
}

// PublishFleetAlert publishes fleet-wide alerts
func (m *MQTTService) PublishFleetAlert(alert *FleetAlert) error {
	if !m.IsEnabled() {
		return fmt.Errorf("MQTT service not enabled")
	}

	alert.ID = fmt.Sprintf("alert_%d", time.Now().UnixNano())
	alert.Timestamp = time.Now()

	payload, err := json.Marshal(alert)
	if err != nil {
		return fmt.Errorf("failed to marshal fleet alert: %w", err)
	}

	// Use appropriate topic based on severity
	topic := TOPIC_FLEET_ALERTS
	qos := byte(1)

	if alert.Severity == "CRITICAL" {
		topic = TOPIC_FLEET_EMERGENCY
		qos = 2 // Exactly once delivery for emergencies
	}

	token := m.client.Publish(topic, qos, false, payload)

	if token.Wait() && token.Error() != nil {
		return fmt.Errorf("failed to publish fleet alert: %w", token.Error())
	}

	log.Printf("🚨 Published fleet alert: %s - %s", alert.Type, alert.Message)
	return nil
}

// SubscribeToVehicleLocation subscribes to vehicle location updates
func (m *MQTTService) SubscribeToVehicleLocation(vehicleID uint, handler func(*LocationUpdate)) error {
	if !m.IsEnabled() {
		return fmt.Errorf("MQTT service not enabled")
	}

	topic := fmt.Sprintf(TOPIC_VEHICLE_LOCATION, vehicleID)

	token := m.client.Subscribe(topic, 1, func(client mqtt.Client, msg mqtt.Message) {
		var location LocationUpdate
		if err := json.Unmarshal(msg.Payload(), &location); err == nil {
			handler(&location)
		} else {
			log.Printf("❌ Failed to unmarshal location update: %v", err)
		}
	})

	if token.Wait() && token.Error() != nil {
		return fmt.Errorf("failed to subscribe to vehicle location: %w", token.Error())
	}

	log.Printf("📍 Subscribed to location updates for vehicle %d", vehicleID)
	return nil
}

// SubscribeToAllVehicleLocations subscribes to location updates for ALL vehicles (wildcard)
func (m *MQTTService) SubscribeToAllVehicleLocations(handler func(*LocationUpdate)) error {
	if !m.IsEnabled() {
		return fmt.Errorf("MQTT service not enabled")
	}

	// Wildcard topic: fleetflow/vehicle/+/location
	topic := "fleetflow/vehicle/+/location"

	token := m.client.Subscribe(topic, 1, func(client mqtt.Client, msg mqtt.Message) {
		var location LocationUpdate
		if err := json.Unmarshal(msg.Payload(), &location); err == nil {
			handler(&location)
		} else {
			log.Printf("❌ Failed to unmarshal location update: %v", err)
		}
	})

	if token.Wait() && token.Error() != nil {
		return fmt.Errorf("failed to subscribe to all vehicle locations: %w", token.Error())
	}

	log.Printf("🌍 Subscribed to ALL vehicle location updates (Wildcard)")
	return nil
}

// SubscribeToAllVehicleTelemetry subscribes to telemetry updates for ALL vehicles (wildcard)
func (m *MQTTService) SubscribeToAllVehicleTelemetry(handler func(*TelemetryUpdate)) error {
	if !m.IsEnabled() {
		return fmt.Errorf("MQTT service not enabled")
	}

	// Wildcard topic: fleetflow/vehicle/+/telemetry
	topic := "fleetflow/vehicle/+/telemetry"

	token := m.client.Subscribe(topic, 1, func(client mqtt.Client, msg mqtt.Message) {
		var telemetry TelemetryUpdate
		if err := json.Unmarshal(msg.Payload(), &telemetry); err == nil {
			handler(&telemetry)
		} else {
			log.Printf("❌ Failed to unmarshal telemetry update: %v", err)
		}
	})

	if token.Wait() && token.Error() != nil {
		return fmt.Errorf("failed to subscribe to all vehicle telemetry: %w", token.Error())
	}

	log.Printf("🔧 Subscribed to ALL vehicle telemetry updates (Wildcard)")
	return nil
}

// SubscribeToDriverMobile subscribes to driver mobile app communication
func (m *MQTTService) SubscribeToDriverMobile(driverID uint, handler func([]byte)) error {
	if !m.IsEnabled() {
		return fmt.Errorf("MQTT service not enabled")
	}

	topic := fmt.Sprintf(TOPIC_MOBILE_DRIVER, driverID)

	token := m.client.Subscribe(topic, 1, func(client mqtt.Client, msg mqtt.Message) {
		handler(msg.Payload())
	})

	if token.Wait() && token.Error() != nil {
		return fmt.Errorf("failed to subscribe to driver mobile: %w", token.Error())
	}

	log.Printf("📱 Subscribed to driver %d mobile app communication", driverID)
	return nil
}

// PublishToDriverMobile sends message to driver's mobile app
func (m *MQTTService) PublishToDriverMobile(driverID uint, message interface{}) error {
	if !m.IsEnabled() {
		return fmt.Errorf("MQTT service not enabled")
	}

	payload, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("failed to marshal driver message: %w", err)
	}

	topic := fmt.Sprintf(TOPIC_MOBILE_DRIVER, driverID)
	token := m.client.Publish(topic, 1, false, payload)

	if token.Wait() && token.Error() != nil {
		return fmt.Errorf("failed to publish to driver mobile: %w", token.Error())
	}

	log.Printf("📱 Published message to driver %d mobile app", driverID)
	return nil
}

// PublishFleetBroadcast sends message to all fleet participants
func (m *MQTTService) PublishFleetBroadcast(message string, data interface{}) error {
	if !m.IsEnabled() {
		return fmt.Errorf("MQTT service not enabled")
	}

	broadcast := map[string]interface{}{
		"message":   message,
		"data":      data,
		"timestamp": time.Now(),
	}

	payload, err := json.Marshal(broadcast)
	if err != nil {
		return fmt.Errorf("failed to marshal broadcast: %w", err)
	}

	token := m.client.Publish(TOPIC_FLEET_BROADCAST, 1, false, payload)

	if token.Wait() && token.Error() != nil {
		return fmt.Errorf("failed to publish fleet broadcast: %w", token.Error())
	}

	log.Printf("📢 Published fleet broadcast: %s", message)
	return nil
}

// Disconnect closes MQTT connection
func (m *MQTTService) Disconnect() {
	if m.client != nil && m.client.IsConnected() {
		m.client.Disconnect(250)
		log.Println("📡 MQTT client disconnected")
	}
}

// Health check
func (m *MQTTService) HealthCheck() map[string]interface{} {
	return map[string]interface{}{
		"enabled":   m.isEnabled,
		"connected": m.client != nil && m.client.IsConnected(),
		"broker":    m.config.MQTT.Broker,
		"timestamp": time.Now(),
	}
}



