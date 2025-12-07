#!/bin/bash

# FleetFlow Go Backend API Test Script
# This script tests the basic functionality of our Go backend

BASE_URL="http://localhost:8080"
API_URL="$BASE_URL/api/v1"

echo "🚛 FleetFlow Go Backend API Test Script"
echo "============================================="

# Test 1: Health Check
echo -e "\n📋 Test 1: Health Check"
echo "GET $BASE_URL/health"
curl -s -X GET "$BASE_URL/health" | jq '.' || echo "Failed to parse JSON"

# Test 2: Send OTP
echo -e "\n📱 Test 2: Send OTP"
echo "POST $API_URL/auth/otp/send"
curl -s -X POST "$API_URL/auth/otp/send" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210"
  }' | jq '.' || echo "Failed to parse JSON"

# Test 3: Verify OTP (will fail with wrong OTP, but tests the endpoint)
echo -e "\n🔐 Test 3: Verify OTP"
echo "POST $API_URL/auth/otp/verify"
curl -s -X POST "$API_URL/auth/otp/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "otp": "111111"
  }' | jq '.' || echo "Failed to parse JSON"

# Extract access token (if verification succeeded)
ACCESS_TOKEN=$(curl -s -X POST "$API_URL/auth/otp/verify" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "otp": "111111"}' | jq -r '.access_token // empty')

if [ ! -z "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
  echo "✅ Got access token: ${ACCESS_TOKEN:0:20}..."
  
  # Test 4: Get Drivers (protected endpoint)
  echo -e "\n👥 Test 4: Get Drivers (Protected)"
  echo "GET $API_URL/drivers"
  curl -s -X GET "$API_URL/drivers" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" | jq '.' || echo "Failed to parse JSON"
  
  # Test 5: Create Driver (protected endpoint)
  echo -e "\n👤 Test 5: Create Driver (Protected)"
  echo "POST $API_URL/drivers"
  curl -s -X POST "$API_URL/drivers" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "राहुल शर्मा",
      "phone": "+919876543211",
      "license_number": "DL1420110012345",
      "address": "123 Main Street, New Delhi"
    }' | jq '.' || echo "Failed to parse JSON"
    
  # Test 6: Get Profile (protected endpoint)
  echo -e "\n👤 Test 6: Get Profile (Protected)"
  echo "GET $API_URL/auth/profile"
  curl -s -X GET "$API_URL/auth/profile" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" | jq '.' || echo "Failed to parse JSON"
    
else
  echo "❌ No access token received, skipping protected endpoint tests"
  echo "💡 In development, the OTP is always '111111'"
fi

# Test 7: Test without authentication (should fail)
echo -e "\n🚫 Test 7: Unauthorized Access"
echo "GET $API_URL/drivers (without token)"
curl -s -X GET "$API_URL/drivers" \
  -H "Content-Type: application/json" | jq '.' || echo "Failed to parse JSON"

echo -e "\n============================================="
echo "🎯 API Test Complete!"
echo ""
echo "📌 To run the Go backend:"
echo "   cd go-backend && go run main.go"
echo ""
echo "📌 To test with correct OTP in development:"
echo "   Use OTP: 111111 for any phone number"
echo ""
echo "📌 Database setup:"
echo "   Make sure PostgreSQL is running"
echo "   Create database: createdb fleetflow"
echo "   Update DATABASE_URL in .env"
echo ""
echo "🚛 FleetFlow Go Backend is ready for action! ✨"
