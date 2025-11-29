#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "  Login Issue Diagnostic Script"
echo "======================================"
echo ""

# Backend URL
BACKEND_URL="http://localhost:5000"
API_URL="${BACKEND_URL}/api"

# Test credentials
TEST_EMAIL="test@example.com"
TEST_PASSWORD="password123"
TEST_NAME="Test User"
TEST_COMPANY="Test Company"

# Function to check if backend is running
check_backend() {
    echo -n "1. Checking if backend is running... "
    response=$(curl -s -o /dev/null -w "%{http_code}" ${BACKEND_URL}/health)
    
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✓ Backend is running${NC}"
        return 0
    else
        echo -e "${RED}✗ Backend is not responding (HTTP $response)${NC}"
        echo -e "${YELLOW}   Please start the backend server first:${NC}"
        echo "   cd backend && npm start"
        return 1
    fi
}

# Function to check MongoDB connection
check_mongodb() {
    echo -n "2. Checking MongoDB connection... "
    
    # Try to get health status (will fail if DB not connected)
    response=$(curl -s ${BACKEND_URL}/health)
    
    if echo "$response" | grep -q "success"; then
        echo -e "${GREEN}✓ MongoDB connected${NC}"
        return 0
    else
        echo -e "${RED}✗ MongoDB connection issue${NC}"
        echo -e "${YELLOW}   Please start MongoDB:${NC}"
        echo "   sudo systemctl start mongodb"
        return 1
    fi
}

# Function to create test user
create_test_user() {
    echo -n "3. Creating test user... "
    
    response=$(curl -s -X POST ${API_URL}/auth/register \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"${TEST_NAME}\",
            \"email\": \"${TEST_EMAIL}\",
            \"password\": \"${TEST_PASSWORD}\",
            \"company\": \"${TEST_COMPANY}\"
        }")
    
    if echo "$response" | grep -q "token"; then
        echo -e "${GREEN}✓ Test user created successfully${NC}"
        echo -e "   Email: ${TEST_EMAIL}"
        echo -e "   Password: ${TEST_PASSWORD}"
        return 0
    elif echo "$response" | grep -q "already exists"; then
        echo -e "${YELLOW}⚠ User already exists${NC}"
        echo -e "   Email: ${TEST_EMAIL}"
        echo -e "   Password: ${TEST_PASSWORD}"
        return 0
    else
        echo -e "${RED}✗ Failed to create user${NC}"
        echo "   Response: $response"
        return 1
    fi
}

# Function to test login
test_login() {
    echo -n "4. Testing login endpoint... "
    
    response=$(curl -s -X POST ${API_URL}/auth/login \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"${TEST_EMAIL}\",
            \"password\": \"${TEST_PASSWORD}\"
        }")
    
    if echo "$response" | grep -q "token"; then
        echo -e "${GREEN}✓ Login successful${NC}"
        
        # Extract token (basic extraction)
        token=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        echo -e "   Token: ${token:0:50}..."
        
        # Save token for next test
        echo "$token" > /tmp/test_token.txt
        return 0
    else
        echo -e "${RED}✗ Login failed${NC}"
        echo "   Response: $response"
        return 1
    fi
}

# Function to test auth/me endpoint
test_auth_me() {
    echo -n "5. Testing /auth/me endpoint... "
    
    if [ ! -f /tmp/test_token.txt ]; then
        echo -e "${YELLOW}⚠ Skipped (no token available)${NC}"
        return 1
    fi
    
    token=$(cat /tmp/test_token.txt)
    
    response=$(curl -s ${API_URL}/auth/me \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${token}")
    
    if echo "$response" | grep -q "user"; then
        echo -e "${GREEN}✓ Token validation successful${NC}"
        user_email=$(echo "$response" | grep -o '"email":"[^"]*"' | cut -d'"' -f4)
        echo -e "   User: ${user_email}"
        return 0
    else
        echo -e "${RED}✗ Token validation failed${NC}"
        echo "   Response: $response"
        return 1
    fi
}

# Function to check CORS
check_cors() {
    echo -n "6. Checking CORS configuration... "
    
    response=$(curl -s -I ${API_URL}/auth/login \
        -H "Origin: http://localhost:5173" \
        -H "Access-Control-Request-Method: POST")
    
    if echo "$response" | grep -q "Access-Control-Allow-Origin"; then
        echo -e "${GREEN}✓ CORS is configured${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ CORS headers not found${NC}"
        echo -e "${YELLOW}   Make sure backend .env has: FRONTEND_URL=http://localhost:5173${NC}"
        return 1
    fi
}

# Function to check frontend connection
check_frontend() {
    echo -n "7. Checking frontend... "
    
    frontend_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
    
    if [ "$frontend_response" == "200" ]; then
        echo -e "${GREEN}✓ Frontend is running${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ Frontend is not running (HTTP $frontend_response)${NC}"
        echo -e "${YELLOW}   Start frontend with: cd frontend && npm run dev${NC}"
        return 1
    fi
}

# Run all checks
echo ""
check_backend || exit 1
echo ""
check_mongodb || exit 1
echo ""
create_test_user
echo ""
test_login || exit 1
echo ""
test_auth_me
echo ""
check_cors
echo ""
check_frontend
echo ""

# Summary
echo "======================================"
echo "  Diagnostic Summary"
echo "======================================"
echo ""
echo "✓ Backend is running"
echo "✓ MongoDB is connected"
echo "✓ Test user is available"
echo "✓ Login endpoint works"
echo ""
echo -e "${GREEN}Backend is working correctly!${NC}"
echo ""
echo "Test Credentials:"
echo "  Email:    ${TEST_EMAIL}"
echo "  Password: ${TEST_PASSWORD}"
echo ""
echo "You can now try logging in from the frontend."
echo ""

# Cleanup
rm -f /tmp/test_token.txt

exit 0
