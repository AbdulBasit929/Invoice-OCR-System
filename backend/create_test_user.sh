#!/bin/bash

# create_test_user.sh - Create test user using the API

echo "========================================"
echo "  Creating Test User via API"
echo "========================================"
echo ""

BACKEND_URL="http://localhost:5000/api"

# Test credentials
TEST_EMAIL="test@example.com"
TEST_PASSWORD="password123"
TEST_NAME="Test User"
TEST_COMPANY="Test Company"

echo "Testing backend connection..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health)

if [ "$response" != "200" ]; then
    echo "✗ Backend is not running!"
    echo "  Please start backend: cd backend && npm start"
    exit 1
fi

echo "✓ Backend is running"
echo ""

echo "Creating test user..."
echo "  Name:     $TEST_NAME"
echo "  Email:    $TEST_EMAIL"
echo "  Password: $TEST_PASSWORD"
echo ""

response=$(curl -s -X POST ${BACKEND_URL}/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"${TEST_NAME}\",
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\",
    \"company\": \"${TEST_COMPANY}\"
  }")

if echo "$response" | grep -q "token"; then
    echo "✓ User created successfully!"
    echo ""
    echo "Test credentials:"
    echo "  Email:    $TEST_EMAIL"
    echo "  Password: $TEST_PASSWORD"
    echo ""
    
    # Extract token
    token=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "Token: ${token:0:50}..."
    echo ""
    
    # Test login
    echo "Testing login..."
    login_response=$(curl -s -X POST ${BACKEND_URL}/auth/login \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"${TEST_EMAIL}\",
        \"password\": \"${TEST_PASSWORD}\"
      }")
    
    if echo "$login_response" | grep -q "token"; then
        echo "✓ Login test successful!"
        echo ""
        echo "========================================"
        echo "  ✓ Everything is working!"
        echo "========================================"
    else
        echo "✗ Login test failed!"
        echo "Response: $login_response"
    fi
    
elif echo "$response" | grep -q "already exists"; then
    echo "⚠ User already exists"
    echo ""
    echo "Testing login with existing user..."
    
    login_response=$(curl -s -X POST ${BACKEND_URL}/auth/login \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"${TEST_EMAIL}\",
        \"password\": \"${TEST_PASSWORD}\"
      }")
    
    if echo "$login_response" | grep -q "token"; then
        echo "✓ Login successful!"
        echo ""
        echo "Test credentials:"
        echo "  Email:    $TEST_EMAIL"
        echo "  Password: $TEST_PASSWORD"
    else
        echo "✗ Login failed!"
        echo ""
        echo "This means the existing user has a double-hashed password."
        echo "Please run: node scripts/fix_passwords.js"
        echo "Then create the user again."
    fi
else
    echo "✗ Failed to create user"
    echo "Response: $response"
fi

echo ""
