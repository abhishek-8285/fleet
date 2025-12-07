#!/bin/bash

echo "🛑 Stopping All FleetFlow Services..."
echo "====================================="

# Kill all services
if [ -d "logs" ]; then
    for pid_file in logs/*.pid; do
        if [ -f "$pid_file" ]; then
            service_name=$(basename "$pid_file" .pid)
            pid=$(cat "$pid_file")
            if kill -0 "$pid" 2>/dev/null; then
                echo "🛑 Stopping $service_name (PID: $pid)..."
                kill "$pid"
            fi
            rm -f "$pid_file"
        fi
    done
fi

# Stop Docker services
echo "🛑 Stopping Docker services..."
docker-compose down

echo "✅ All services stopped"
