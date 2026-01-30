package services

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

// WebSocketHub manages WebSocket connections for real-time features
type WebSocketHub struct {
	clients    map[*WebSocketClient]bool
	broadcast  chan []byte
	register   chan *WebSocketClient
	unregister chan *WebSocketClient
	mutex      sync.RWMutex
	upgrader   websocket.Upgrader
}

// WebSocketClient represents a WebSocket client connection
type WebSocketClient struct {
	hub    *WebSocketHub
	conn   *websocket.Conn
	send   chan []byte
	userID uint
	topics []string // Topics this client is subscribed to
}

// NewWebSocketHub creates a new WebSocket hub
func NewWebSocketHub(locationService *LocationService) *WebSocketHub {
	return &WebSocketHub{
		broadcast:  make(chan []byte),
		register:   make(chan *WebSocketClient),
		unregister: make(chan *WebSocketClient),
		clients:    make(map[*WebSocketClient]bool),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				// In production, add proper origin checking
				return true
			},
		},
	}
}

// Run starts the WebSocket hub
func (h *WebSocketHub) Run() {
	log.Println("🔌 Starting WebSocket Hub")

	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			h.clients[client] = true
			h.mutex.Unlock()
			log.Printf("🔌 WebSocket client connected. Total clients: %d", len(h.clients))

		case client := <-h.unregister:
			h.mutex.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.mutex.Unlock()
			log.Printf("🔌 WebSocket client disconnected. Total clients: %d", len(h.clients))

		case message := <-h.broadcast:
			h.mutex.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mutex.RUnlock()
		}
	}
}

// Stop stops the WebSocket hub
func (h *WebSocketHub) Stop() {
	log.Println("🔌 Stopping WebSocket Hub")
	h.mutex.Lock()
	defer h.mutex.Unlock()

	for client := range h.clients {
		close(client.send)
		client.conn.Close()
	}
}

// Close gracefully closes the WebSocket hub
func (h *WebSocketHub) Close() {
	h.Stop()
}

// BroadcastToTopic broadcasts a message to all clients subscribed to a topic
func (h *WebSocketHub) BroadcastToTopic(topic string, message []byte) {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	for client := range h.clients {
		// Check if client is subscribed to this topic
		subscribed := false
		for _, t := range client.topics {
			if t == topic {
				subscribed = true
				break
			}
		}

		if subscribed {
			select {
			case client.send <- message:
			default:
				close(client.send)
				delete(h.clients, client)
			}
		}
	}
}

// ServeWS handles websocket requests from clients
func (h *WebSocketHub) ServeWS(w http.ResponseWriter, r *http.Request, userID uint) {
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("❌ WebSocket upgrade error: %v", err)
		return
	}

	client := &WebSocketClient{
		hub:    h,
		conn:   conn,
		send:   make(chan []byte, 256),
		userID: userID,
		topics: []string{}, // Will be populated based on subscriptions
	}

	client.hub.register <- client

	// Start goroutines for reading and writing
	go client.writePump()
	go client.readPump()
}

// readPump pumps messages from the websocket connection to the hub
func (c *WebSocketClient) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("❌ WebSocket error: %v", err)
			}
			break
		}

		// Handle incoming messages (e.g., subscription requests)
		c.handleMessage(message)
	}
}

// writePump pumps messages from the hub to the websocket connection
func (c *WebSocketClient) writePump() {
	defer c.conn.Close()

	for message := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
			log.Printf("❌ WebSocket write error: %v", err)
			return
		}
	}
}

// handleMessage handles incoming messages from WebSocket clients
func (c *WebSocketClient) handleMessage(message []byte) {
	// Parse and handle subscription requests, etc.
	// Implementation would handle JSON messages for topic subscriptions
	log.Printf("🔌 Received WebSocket message: %s", string(message))
}
