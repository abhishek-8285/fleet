package simulator

import (
	"encoding/json"
	"fmt"
	"log"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

type MQTTClient struct {
	client mqtt.Client
}

func NewMQTTClient(broker, user, password string) *MQTTClient {
	opts := mqtt.NewClientOptions()
	opts.AddBroker(broker)
	opts.SetClientID("fleetflow-simulator")
	opts.SetUsername(user)
	opts.SetPassword(password)
	opts.SetAutoReconnect(true)
	opts.SetOnConnectHandler(func(c mqtt.Client) {
		log.Println("✅ Connected to MQTT Broker")
	})
	opts.SetConnectionLostHandler(func(c mqtt.Client, err error) {
		log.Printf("❌ MQTT Connection Lost: %v", err)
	})

	client := mqtt.NewClient(opts)
	if token := client.Connect(); token.Wait() && token.Error() != nil {
		log.Printf("⚠️ Failed to connect to MQTT (will retry): %v", token.Error())
	}

	return &MQTTClient{client: client}
}

func (m *MQTTClient) PublishTelemetry(vehicleID string, data TelemetryData) {
	topic := fmt.Sprintf("fleet/vehicles/%s/telemetry", vehicleID)
	payload, _ := json.Marshal(data)

	token := m.client.Publish(topic, 0, false, payload)
	_ = token.Wait()
}

func (m *MQTTClient) Disconnect() {
	m.client.Disconnect(250)
}
