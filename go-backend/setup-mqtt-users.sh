#!/bin/bash

# FleetFlow MQTT User Setup Script

echo "Setting up MQTT broker users and permissions..."

# Create mosquitto password file
echo "Creating MQTT users..."

# Create password entries (you'll need to run mosquitto_passwd to hash these)
# For development, we'll create plain text versions first
cat > mosquitto/config/passwd << EOF
# FleetFlow MQTT Users
# Format: username:hashed_password
# Use: mosquitto_passwd -c passwd username
# For development only - use hashed passwords in production
fleetflow:\$6\$SALT\$HASHEDPASSWORD
fleetflow-backend:\$6\$SALT\$HASHEDPASSWORD  
fleetflow-mobile:\$6\$SALT\$HASHEDPASSWORD
EOF

# Create ACL (Access Control List) file for topic permissions
echo "Setting up topic permissions..."

cat > mosquitto/config/acl << EOF
# FleetFlow MQTT Access Control List
# Format: user <username>
#         topic [read|write|readwrite] <topic>

# Backend service - full access
user fleetflow
topic readwrite #

user fleetflow-backend  
topic readwrite fleetflow/#

# Mobile apps - restricted access
user fleetflow-mobile
topic read fleetflow/mobile/+/+
topic write fleetflow/vehicle/+/location
topic write fleetflow/driver/+/location
topic write fleetflow/driver/+/status
topic write fleetflow/trip/+/updates
topic read fleetflow/fleet/alerts
topic read fleetflow/fleet/broadcast
topic read fleetflow/fleet/emergency

# Pattern-based permissions for individual users
# pattern read fleetflow/mobile/driver/%u
# pattern write fleetflow/driver/%u/+

# Anonymous users (disabled in production)
# topic read fleetflow/public/+
EOF

echo "✅ MQTT users and ACL configured!"
echo ""
echo "Next steps:"
echo "1. Run: docker-compose -f docker-compose.mqtt.yml up -d"
echo "2. Create hashed passwords: docker exec -it fleetflow-mqtt-broker mosquitto_passwd -c /mosquitto/config/passwd fleetflow"  
echo "3. Test connection: mosquitto_pub -h localhost -u fleetflow -P fleetflow123 -t test -m 'Hello MQTT!'"
echo "4. Update your .env file with MQTT_ENABLED=true"
echo ""



