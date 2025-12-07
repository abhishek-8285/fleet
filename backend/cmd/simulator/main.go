package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/fleetflow/backend/internal/simulator"
)

func main() {
	log.Println("🚛 FleetFlow Hardware Simulator Starting...")

	// Initialize Simulator
	sim := simulator.NewSimulator()

	// Start Simulation Loop
	go sim.Start()

	// Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Shutting down simulator...")
	sim.Stop()
	log.Println("✅ Simulator stopped")
}
