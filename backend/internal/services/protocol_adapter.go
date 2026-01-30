package services

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/fleetflow/backend/internal/config"
)

// ProtocolAdapter bridges internal MQTT events with external gRPC/REST APIs
// This allows us to keep internal architecture simple while providing
// powerful third-party integration capabilities
type ProtocolAdapter struct {
	mqttService *MQTTService
	config      *config.Config
	subscribers map[string][]PartnerSubscriber
	eventBuffer chan AdapterEvent
	isRunning   bool
	mu          sync.RWMutex
}

// AdapterEvent represents an internal event that may need external notification
type AdapterEvent struct {
	Type       string                 `json:"type"`
	EntityType string                 `json:"entity_type"` // vehicle, trip, driver, fuel
	EntityID   string                 `json:"entity_id"`
	Action     string                 `json:"action"` // created, updated, deleted, alert
	Data       map[string]interface{} `json:"data"`
	Timestamp  time.Time              `json:"timestamp"`
	Priority   int                    `json:"priority"`              // 1=low, 2=normal, 3=high, 4=critical
	Source     string                 `json:"source"`                // internal, mobile_app, iot_device
	PartnerIDs []string               `json:"partner_ids,omitempty"` // specific partners to notify
}

// PartnerSubscriber defines external partner subscription preferences
type PartnerSubscriber struct {
	PartnerID    string            `json:"partner_id"`
	PartnerName  string            `json:"partner_name"`
	Protocol     string            `json:"protocol"` // grpc, rest, webhook
	Endpoint     string            `json:"endpoint"`
	EventTypes   []string          `json:"event_types"`   // trip_created, location_update, fuel_alert
	EntityFilter map[string]string `json:"entity_filter"` // fleet_id, region, vehicle_type
	RateLimit    int               `json:"rate_limit"`    // events per minute
	RetryCount   int               `json:"retry_count"`
	IsActive     bool              `json:"is_active"`
}

// Event type constants for third-party integrations
const (
	// Trip Events
	EVENT_TRIP_CREATED   = "trip_created"
	EVENT_TRIP_STARTED   = "trip_started"
	EVENT_TRIP_UPDATED   = "trip_updated"
	EVENT_TRIP_COMPLETED = "trip_completed"
	EVENT_TRIP_CANCELLED = "trip_cancelled"
	EVENT_TRIP_DELAYED   = "trip_delayed"

	// Vehicle Events
	EVENT_VEHICLE_LOCATION    = "vehicle_location_updated"
	EVENT_VEHICLE_STATUS      = "vehicle_status_changed"
	EVENT_VEHICLE_OFFLINE     = "vehicle_offline"
	EVENT_VEHICLE_MAINTENANCE = "vehicle_maintenance_due"

	// Driver Events
	EVENT_DRIVER_LOGIN     = "driver_logged_in"
	EVENT_DRIVER_LOGOUT    = "driver_logged_out"
	EVENT_DRIVER_BREAK     = "driver_on_break"
	EVENT_DRIVER_VIOLATION = "driver_violation"

	// Fuel Events
	EVENT_FUEL_THEFT  = "fuel_theft_detected"
	EVENT_FUEL_REFILL = "fuel_refill_completed"
	EVENT_FUEL_LOW    = "fuel_level_low"

	// Alert Events
	EVENT_GEOFENCE_VIOLATION = "geofence_violation"
	EVENT_ROUTE_DEVIATION    = "route_deviation"
	EVENT_EMERGENCY          = "emergency_alert"
	EVENT_BREAKDOWN          = "vehicle_breakdown"
)

// NewProtocolAdapter creates a new protocol adapter
func NewProtocolAdapter(mqttService *MQTTService, config *config.Config) *ProtocolAdapter {
	adapter := &ProtocolAdapter{
		mqttService: mqttService,
		config:      config,
		subscribers: make(map[string][]PartnerSubscriber),
		eventBuffer: make(chan AdapterEvent, 10000), // Buffer for high-volume events
		isRunning:   false,
	}

	// Load partner subscriptions from database/config
	adapter.loadPartnerSubscriptions()

	return adapter
}

// Start begins processing events from internal MQTT and sending to external partners
func (pa *ProtocolAdapter) Start() error {
	if pa.isRunning {
		return fmt.Errorf("protocol adapter already running")
	}

	// Subscribe to internal MQTT topics that need external notification
	if err := pa.subscribeToInternalEvents(); err != nil {
		return fmt.Errorf("failed to subscribe to internal events: %w", err)
	}

	// Start event processing goroutine
	go pa.processEvents()

	pa.isRunning = true
	log.Println("✅ Protocol Adapter started - bridging MQTT ↔ gRPC/REST")

	return nil
}

// subscribeToInternalEvents subscribes to MQTT topics for partner notification
func (pa *ProtocolAdapter) subscribeToInternalEvents() error {
	if !pa.mqttService.IsEnabled() {
		return fmt.Errorf("MQTT service not enabled")
	}

	// Subscribe to trip events
	topics := []string{
		"fleetflow/trip/+/updates",
		"fleetflow/trip/+/completion",
		"fleetflow/vehicle/+/location",
		"fleetflow/vehicle/+/status",
		"fleetflow/driver/+/status",
		"fleetflow/fuel/+/events",
		"fleetflow/fleet/alerts",
		"fleetflow/fleet/emergency",
	}

	for _, topic := range topics {
		token := pa.mqttService.client.Subscribe(topic, 1, func(client mqtt.Client, msg mqtt.Message) {
			pa.handleInternalEvent(msg.Topic(), msg.Payload())
		})
		if token.Wait() && token.Error() != nil {
			return fmt.Errorf("failed to subscribe to %s: %w", topic, token.Error())
		}
	}

	log.Printf("📡 Subscribed to %d internal MQTT topics for partner notification", len(topics))
	return nil
}

// handleInternalEvent processes incoming MQTT events for partner notification
func (pa *ProtocolAdapter) handleInternalEvent(topic string, message []byte) {
	// Parse the internal event
	var eventData map[string]interface{}
	if err := json.Unmarshal(message, &eventData); err != nil {
		log.Printf("❌ Failed to parse internal event: %v", err)
		return
	}

	// Convert to AdapterEvent
	adapterEvent := pa.convertToAdapterEvent(topic, eventData)
	if adapterEvent == nil {
		return // Event not relevant for partners
	}

	// Send to event buffer for processing
	select {
	case pa.eventBuffer <- *adapterEvent:
		// Event queued successfully
	default:
		log.Println("⚠️ Event buffer full, dropping event")
	}
}

// convertToAdapterEvent converts MQTT topic/payload to standardized AdapterEvent
func (pa *ProtocolAdapter) convertToAdapterEvent(topic string, data map[string]interface{}) *AdapterEvent {
	// Parse topic to determine event type
	var eventType, entityType, entityID, action string
	priority := 2 // normal priority by default

	// Topic parsing logic
	if contains(topic, "/trip/") && contains(topic, "/updates") {
		eventType = EVENT_TRIP_UPDATED
		entityType = "trip"
		entityID = extractIDFromTopic(topic, "trip")
		action = "updated"
	} else if contains(topic, "/vehicle/") && contains(topic, "/location") {
		eventType = EVENT_VEHICLE_LOCATION
		entityType = "vehicle"
		entityID = extractIDFromTopic(topic, "vehicle")
		action = "location_updated"
		priority = 1 // Low priority for frequent location updates
	} else if contains(topic, "/fuel/") {
		eventType = EVENT_FUEL_THEFT
		entityType = "fuel"
		entityID = extractIDFromTopic(topic, "fuel")
		action = "theft_detected"
		priority = 4 // Critical priority for fuel theft
	} else if contains(topic, "/fleet/emergency") {
		eventType = EVENT_EMERGENCY
		entityType = "fleet"
		action = "emergency"
		priority = 4 // Critical priority for emergencies
	}

	// Only process events that partners care about
	if eventType == "" || !pa.hasSubscribersForEvent(eventType) {
		return nil
	}

	return &AdapterEvent{
		Type:       eventType,
		EntityType: entityType,
		EntityID:   entityID,
		Action:     action,
		Data:       data,
		Timestamp:  time.Now(),
		Priority:   priority,
		Source:     "internal",
	}
}

// processEvents processes events from the buffer and sends to external partners
func (pa *ProtocolAdapter) processEvents() {
	for pa.isRunning {
		select {
		case event := <-pa.eventBuffer:
			pa.notifyPartners(event)
		case <-time.After(1 * time.Second):
			// Periodic maintenance tasks
			continue
		}
	}
}

// notifyPartners sends event to all subscribed external partners
func (pa *ProtocolAdapter) notifyPartners(event AdapterEvent) {
	pa.mu.RLock()
	subscribers := pa.subscribers[event.Type]
	pa.mu.RUnlock()

	if len(subscribers) == 0 {
		return
	}

	log.Printf("📤 Notifying %d partners about event: %s", len(subscribers), event.Type)

	// Send notifications concurrently
	for _, subscriber := range subscribers {
		if !subscriber.IsActive {
			continue
		}

		// Check if event matches partner's filter criteria
		if !pa.eventMatchesFilter(event, subscriber) {
			continue
		}

		go pa.sendToPartner(event, subscriber)
	}
}

// sendToPartner sends event to specific external partner
func (pa *ProtocolAdapter) sendToPartner(event AdapterEvent, partner PartnerSubscriber) {
	switch partner.Protocol {
	case "grpc":
		pa.sendViaGRPC(event, partner)
	case "rest":
		pa.sendViaREST(event, partner)
	case "webhook":
		pa.sendViaWebhook(event, partner)
	default:
		log.Printf("❌ Unsupported partner protocol: %s", partner.Protocol)
	}
}

// sendViaGRPC sends event to partner via gRPC streaming
func (pa *ProtocolAdapter) sendViaGRPC(event AdapterEvent, partner PartnerSubscriber) {
	// TODO: Implement gRPC client connection and streaming
	log.Printf("🚀 Sending to %s via gRPC: %s", partner.PartnerName, event.Type)

	// Example gRPC call:
	// conn := grpc.Dial(partner.Endpoint)
	// client := NewFleetPartnerAPIClient(conn)
	// client.NotifyEvent(context.Background(), &EventNotification{...})
}

// sendViaREST sends event to partner via REST webhook
func (pa *ProtocolAdapter) sendViaREST(event AdapterEvent, partner PartnerSubscriber) {
	// TODO: Implement HTTP POST to partner endpoint
	log.Printf("🌐 Sending to %s via REST: %s", partner.PartnerName, event.Type)

	// Example REST call:
	// payload := convertToRESTPayload(event)
	// http.Post(partner.Endpoint, "application/json", bytes.NewReader(payload))
}

// sendViaWebhook sends event to partner via webhook
func (pa *ProtocolAdapter) sendViaWebhook(event AdapterEvent, partner PartnerSubscriber) {
	// TODO: Implement webhook delivery with retry logic
	log.Printf("🪝 Sending to %s via webhook: %s", partner.PartnerName, event.Type)
}

// RegisterPartner registers a new external partner for event notifications
func (pa *ProtocolAdapter) RegisterPartner(partner PartnerSubscriber) error {
	pa.mu.Lock()
	defer pa.mu.Unlock()

	for _, eventType := range partner.EventTypes {
		pa.subscribers[eventType] = append(pa.subscribers[eventType], partner)
	}

	log.Printf("✅ Registered partner: %s for %d event types",
		partner.PartnerName, len(partner.EventTypes))

	return nil
}

// Helper functions
func (pa *ProtocolAdapter) loadPartnerSubscriptions() {
	// TODO: Load from database or config file
	// Example partner registrations:

	// ERP System Integration
	_ = pa.RegisterPartner(PartnerSubscriber{
		PartnerID:   "sap-erp-001",
		PartnerName: "SAP ERP System",
		Protocol:    "grpc",
		Endpoint:    "grpc://erp-gateway.company.com:50051",
		EventTypes:  []string{EVENT_TRIP_CREATED, EVENT_TRIP_COMPLETED, EVENT_FUEL_REFILL},
		IsActive:    true,
		RateLimit:   100,
	})

	// Logistics Partner
	_ = pa.RegisterPartner(PartnerSubscriber{
		PartnerID:   "logistics-partner-001",
		PartnerName: "DHL Logistics API",
		Protocol:    "rest",
		Endpoint:    "https://api.dhl.com/fleet-integration/webhooks",
		EventTypes:  []string{EVENT_TRIP_STARTED, EVENT_TRIP_COMPLETED, EVENT_TRIP_DELAYED},
		IsActive:    true,
		RateLimit:   50,
	})

	// Insurance Company
	_ = pa.RegisterPartner(PartnerSubscriber{
		PartnerID:   "insurance-001",
		PartnerName: "Fleet Insurance Provider",
		Protocol:    "webhook",
		Endpoint:    "https://insurance.company.com/webhooks/fleet-events",
		EventTypes:  []string{EVENT_EMERGENCY, EVENT_BREAKDOWN, EVENT_DRIVER_VIOLATION},
		IsActive:    true,
		RateLimit:   10,
	})
}

func (pa *ProtocolAdapter) hasSubscribersForEvent(eventType string) bool {
	pa.mu.RLock()
	defer pa.mu.RUnlock()

	subscribers, exists := pa.subscribers[eventType]
	return exists && len(subscribers) > 0
}

func (pa *ProtocolAdapter) eventMatchesFilter(event AdapterEvent, partner PartnerSubscriber) bool {
	// TODO: Implement filter matching logic
	// Check fleet_id, region, vehicle_type filters
	return true
}

// Helper functions
func contains(s, substr string) bool {
	return len(s) > 0 && len(substr) > 0 &&
		(len(s) >= len(substr)) &&
		(s[len(substr):] != s[:len(s)-len(substr)] || s == substr)
}

func extractIDFromTopic(topic, entityType string) string {
	// TODO: Implement proper topic parsing
	// Example: "fleetflow/vehicle/123/location" -> "123"
	return "123"
}

// Stop gracefully shuts down the protocol adapter
func (pa *ProtocolAdapter) Stop() {
	pa.isRunning = false
	close(pa.eventBuffer)
	log.Println("📡 Protocol Adapter stopped")
}
