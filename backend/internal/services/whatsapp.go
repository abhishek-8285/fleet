package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"
	"time"
)

// WhatsAppConfig holds WhatsApp Business API configuration
type WhatsAppConfig struct {
	APIEndpoint     string
	AccessToken     string
	PhoneNumberID   string
	VerifyToken     string
	WebhookURL      string
	CustomerPortalURL string
}

// WhatsAppService handles WhatsApp Business API integration
type WhatsAppService struct {
	config     WhatsAppConfig
	httpClient *http.Client
	templates  map[string]*WhatsAppTemplate
	mutex      sync.RWMutex
}

// WhatsAppTemplate represents a WhatsApp message template
type WhatsAppTemplate struct {
	Name        string            `json:"name"`
	Language    string            `json:"language"`
	Components  []TemplateComponent `json:"components"`
}

// TemplateComponent represents a component of a WhatsApp template
type TemplateComponent struct {
	Type       string                 `json:"type"`
	Parameters []TemplateParameter    `json:"parameters,omitempty"`
}

// TemplateParameter represents a parameter in a template component
type TemplateParameter struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

// WhatsAppMessage represents a WhatsApp message to be sent
type WhatsAppMessage struct {
	To          string                 `json:"to"`
	Type        string                 `json:"type"`
	Text        *TextMessage          `json:"text,omitempty"`
	Template    *TemplateMessage      `json:"template,omitempty"`
}

// TextMessage represents a simple text message
type TextMessage struct {
	Body string `json:"body"`
}

// TemplateMessage represents a template-based message
type TemplateMessage struct {
	Name       string            `json:"name"`
	Language   LanguageCode      `json:"language"`
	Components []TemplateComponent `json:"components,omitempty"`
}

// LanguageCode represents a language code
type LanguageCode struct {
	Code string `json:"code"`
}

// WhatsAppResponse represents the API response from WhatsApp
type WhatsAppResponse struct {
	Messages []struct {
		ID string `json:"id"`
	} `json:"messages"`
	Error struct {
		Code    int    `json:"code"`
		Title   string `json:"title"`
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// NewWhatsAppService creates a new WhatsApp service
func NewWhatsAppService(config WhatsAppConfig) *WhatsAppService {
	service := &WhatsAppService{
		config: config,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		templates: make(map[string]*WhatsAppTemplate),
	}
	
	service.initializeTemplates()
	return service
}

// initializeTemplates sets up default message templates
func (w *WhatsAppService) initializeTemplates() {
	// Trip status update template
	w.templates["trip_status"] = &WhatsAppTemplate{
		Name:     "trip_status",
		Language: "en",
		Components: []TemplateComponent{
			{
				Type: "body",
				Parameters: []TemplateParameter{
					{Type: "text", Text: "{{tracking_id}}"},
					{Type: "text", Text: "{{status}}"},
					{Type: "text", Text: "{{tracking_url}}"},
				},
			},
		},
	}

	// Delivery notification template
	w.templates["delivery_notification"] = &WhatsAppTemplate{
		Name:     "delivery_notification", 
		Language: "en",
		Components: []TemplateComponent{
			{
				Type: "body",
				Parameters: []TemplateParameter{
					{Type: "text", Text: "{{tracking_id}}"},
					{Type: "text", Text: "{{location}}"},
					{Type: "text", Text: "{{time}}"},
				},
			},
		},
	}

	log.Printf("📝 WhatsApp templates initialized: %d templates loaded", len(w.templates))
}

// SendTextMessage sends a simple text message
func (w *WhatsAppService) SendTextMessage(phoneNumber, message string) error {
	msg := WhatsAppMessage{
		To:   w.formatPhoneNumber(phoneNumber),
		Type: "text",
		Text: &TextMessage{
			Body: message,
		},
	}

	return w.sendMessage(msg)
}

// SendTripStatusNotification sends a trip status update notification
func (w *WhatsAppService) SendTripStatusNotification(phoneNumber, trackingID, status string) error {
	trackingURL := fmt.Sprintf("%s/track/%s", w.config.CustomerPortalURL, trackingID)
	
	message := fmt.Sprintf(
		"🚛 *FleetFlow Update*\n\n" +
		"Your shipment *%s* is now *%s*\n\n" +
		"📱 Track live: %s\n\n" +
		"Thank you for choosing FleetFlow! 🙏",
		trackingID,
		status,
		trackingURL,
	)

	return w.SendTextMessage(phoneNumber, message)
}

// SendPickupNotification sends a pickup scheduled notification
func (w *WhatsAppService) SendPickupNotification(phoneNumber, trackingID, estimatedTime string) error {
	message := fmt.Sprintf(
		"📦 *FleetFlow Pickup Scheduled*\n\n" +
		"Your shipment *%s* will be picked up around *%s*\n\n" +
		"📱 Track: %s/track/%s\n\n" +
		"We'll keep you updated! 🚛",
		trackingID,
		estimatedTime,
		w.config.CustomerPortalURL,
		trackingID,
	)

	return w.SendTextMessage(phoneNumber, message)
}

// SendLocationUpdate sends a location update notification
func (w *WhatsAppService) SendLocationUpdate(phoneNumber, trackingID, location string) error {
	message := fmt.Sprintf(
		"📍 *FleetFlow Location Update*\n\n" +
		"Your shipment *%s* is currently at:\n*%s*\n\n" +
		"📱 Live tracking: %s/track/%s\n\n" +
		"Stay updated with FleetFlow! 🌟",
		trackingID,
		location,
		w.config.CustomerPortalURL,
		trackingID,
	)

	return w.SendTextMessage(phoneNumber, message)
}

// SendDeliveryConfirmation sends a delivery confirmation message
func (w *WhatsAppService) SendDeliveryConfirmation(phoneNumber, trackingID, location, deliveredAt string) error {
	message := fmt.Sprintf(
		"✅ *Shipment Delivered Successfully!*\n\n" +
		"📦 Tracking ID: *%s*\n" +
		"📍 Location: *%s*\n" +
		"⏰ Delivered at: *%s*\n\n" +
		"Thank you for choosing FleetFlow! 🙏\n\n" +
		"Rate your experience: %s/feedback/%s",
		trackingID,
		location,
		deliveredAt,
		w.config.CustomerPortalURL,
		trackingID,
	)

	return w.SendTextMessage(phoneNumber, message)
}

// ProcessTripEvent processes trip lifecycle events and sends notifications
func (w *WhatsAppService) ProcessTripEvent(ctx context.Context, event TripEvent) error {
	if event.CustomerPhone == "" {
		log.Printf("⚠️ No customer phone for trip %s, skipping WhatsApp notification", event.TripID)
		return nil
	}

	switch event.EventType {
	case "trip.created":
		return w.SendPickupNotification(event.CustomerPhone, event.TripID, event.EstimatedPickupTime)
	
	case "trip.started":
		return w.SendTripStatusNotification(event.CustomerPhone, event.TripID, "In Transit")
	
	case "trip.location_updated":
		if event.NotifyCustomer {
			return w.SendLocationUpdate(event.CustomerPhone, event.TripID, event.CurrentLocation)
		}
		
	case "trip.out_for_delivery":
		return w.SendTripStatusNotification(event.CustomerPhone, event.TripID, "Out for Delivery")
	
	case "trip.completed":
		return w.SendDeliveryConfirmation(
			event.CustomerPhone, 
			event.TripID, 
			event.DeliveryLocation,
			event.DeliveredAt,
		)
	
	default:
		log.Printf("📝 Unknown event type: %s for trip %s", event.EventType, event.TripID)
	}

	return nil
}

// sendMessage sends a message via WhatsApp Business API
func (w *WhatsAppService) sendMessage(msg WhatsAppMessage) error {
	// For development mode, just log the message
	if w.config.AccessToken == "" {
		log.Printf("📱 [DEV] WhatsApp Message to %s: %s", msg.To, w.getMessageContent(msg))
		return nil
	}

	jsonData, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %v", err)
	}

	url := fmt.Sprintf("%s/%s/messages", w.config.APIEndpoint, w.config.PhoneNumberID)
	
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+w.config.AccessToken)

	resp, err := w.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("WhatsApp API error (status %d): %s", resp.StatusCode, string(body))
	}

	var response WhatsAppResponse
	if err := json.Unmarshal(body, &response); err != nil {
		log.Printf("⚠️ Could not parse WhatsApp response, but message likely sent: %s", string(body))
		return nil
	}

	if response.Error.Code != 0 {
		return fmt.Errorf("WhatsApp API error: %s", response.Error.Message)
	}

	log.Printf("✅ WhatsApp message sent successfully to %s", msg.To)
	return nil
}

// formatPhoneNumber ensures phone number is in correct format for WhatsApp
func (w *WhatsAppService) formatPhoneNumber(phone string) string {
	// Remove any non-numeric characters except +
	// Ensure it starts with country code
	if len(phone) > 0 && phone[0] != '+' {
		if len(phone) == 10 {
			return "+91" + phone // Add India country code
		}
	}
	return phone
}

// getMessageContent extracts the text content from a message for logging
func (w *WhatsAppService) getMessageContent(msg WhatsAppMessage) string {
	if msg.Text != nil {
		return msg.Text.Body
	}
	if msg.Template != nil {
		return fmt.Sprintf("Template: %s", msg.Template.Name)
	}
	return "Unknown message type"
}

// GetStatus returns the current status of the WhatsApp service
func (w *WhatsAppService) GetStatus() map[string]interface{} {
	w.mutex.RLock()
	defer w.mutex.RUnlock()
	
	return map[string]interface{}{
		"service":           "WhatsApp Business API",
		"status":           "active",
		"templates_loaded": len(w.templates),
		"api_configured":   w.config.AccessToken != "",
		"phone_number_id":  w.config.PhoneNumberID,
		"timestamp":        time.Now().Unix(),
	}
}

// VerifyWebhook verifies WhatsApp webhook requests
func (w *WhatsAppService) VerifyWebhook(mode, token, challenge string) (string, error) {
	if mode == "subscribe" && token == w.config.VerifyToken {
		log.Printf("✅ WhatsApp webhook verified")
		return challenge, nil
	}
	
	log.Printf("❌ WhatsApp webhook verification failed: mode=%s", mode)
	return "", fmt.Errorf("webhook verification failed")
}

// TripEvent represents a trip lifecycle event
type TripEvent struct {
	TripID              string    `json:"trip_id"`
	EventType           string    `json:"event_type"`
	CustomerPhone       string    `json:"customer_phone"`
	EstimatedPickupTime string    `json:"estimated_pickup_time,omitempty"`
	CurrentLocation     string    `json:"current_location,omitempty"`
	DeliveryLocation    string    `json:"delivery_location,omitempty"`
	DeliveredAt         string    `json:"delivered_at,omitempty"`
	NotifyCustomer      bool      `json:"notify_customer,omitempty"`
	Timestamp           time.Time `json:"timestamp"`
}
