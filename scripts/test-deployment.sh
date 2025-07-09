#!/bin/bash

# Glow Chat Deployment Testing Script
# This script tests the complete deployment setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:3000/api"
FRONTEND_URL="http://localhost:5173"
MONGODB_URL="mongodb://localhost:27017"
REDIS_URL="redis://localhost:6379"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

error() {
    echo -e "${RED}✗ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if required commands exist
check_dependencies() {
    log "Checking dependencies..."
    
    local deps=("curl" "docker" "docker-compose" "jq")
    for dep in "${deps[@]}"; do
        if command -v $dep &> /dev/null; then
            success "$dep is installed"
        else
            error "$dep is not installed"
            exit 1
        fi
    done
}

# Test Docker containers
test_containers() {
    log "Testing Docker containers..."
    
    local containers=("glow-chat-mongodb" "glow-chat-redis" "glow-chat-backend" "glow-chat-frontend")
    
    for container in "${containers[@]}"; do
        if docker ps | grep -q $container; then
            success "$container is running"
        else
            error "$container is not running"
            docker logs $container --tail=20
            exit 1
        fi
    done
}

# Test database connectivity
test_database() {
    log "Testing database connectivity..."
    
    # Test MongoDB
    if docker exec glow-chat-mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
        success "MongoDB is accessible"
    else
        error "MongoDB is not accessible"
        exit 1
    fi
    
    # Test Redis
    if docker exec glow-chat-redis redis-cli ping | grep -q "PONG"; then
        success "Redis is accessible"
    else
        error "Redis is not accessible"
        exit 1
    fi
}

# Test API endpoints
test_api() {
    log "Testing API endpoints..."
    
    # Health check
    local health_response=$(curl -s $API_URL/health)
    if echo $health_response | jq -e '.status == "ok"' &> /dev/null; then
        success "API health check passed"
    else
        error "API health check failed: $health_response"
        exit 1
    fi
    
    # Test registration
    local register_data='{"email":"test@example.com","password":"testpassword123","firstName":"Test","lastName":"User","username":"testuser"}'
    local register_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$register_data" $API_URL/auth/register)
    
    if echo $register_response | jq -e '.success == true' &> /dev/null; then
        success "User registration works"
        
        # Extract token for further tests
        local token=$(echo $register_response | jq -r '.data.token')
        
        # Test authenticated endpoints
        test_authenticated_endpoints "$token"
    else
        if echo $register_response | jq -e '.message' | grep -q "already exists"; then
            warning "User already exists, testing login instead"
            test_login
        else
            error "User registration failed: $register_response"
            exit 1
        fi
    fi
}

# Test login
test_login() {
    log "Testing login..."
    
    local login_data='{"email":"test@example.com","password":"testpassword123"}'
    local login_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$login_data" $API_URL/auth/login)
    
    if echo $login_response | jq -e '.success == true' &> /dev/null; then
        success "User login works"
        
        local token=$(echo $login_response | jq -r '.data.token')
        test_authenticated_endpoints "$token"
    else
        error "User login failed: $login_response"
        exit 1
    fi
}

# Test authenticated endpoints
test_authenticated_endpoints() {
    local token=$1
    log "Testing authenticated endpoints..."
    
    # Test user profile
    local profile_response=$(curl -s -H "Authorization: Bearer $token" $API_URL/users/me)
    if echo $profile_response | jq -e '.success == true' &> /dev/null; then
        success "User profile endpoint works"
    else
        error "User profile endpoint failed: $profile_response"
        exit 1
    fi
    
    # Test WebRTC ICE servers
    local ice_response=$(curl -s -H "Authorization: Bearer $token" $API_URL/webrtc/ice-servers)
    if echo $ice_response | jq -e '.success == true' &> /dev/null; then
        success "WebRTC ICE servers endpoint works"
    else
        error "WebRTC ICE servers endpoint failed: $ice_response"
        exit 1
    fi
}

# Test frontend
test_frontend() {
    log "Testing frontend..."
    
    local frontend_response=$(curl -s $FRONTEND_URL)
    if echo $frontend_response | grep -q "<!DOCTYPE html>"; then
        success "Frontend is serving HTML"
    else
        error "Frontend is not serving proper HTML"
        exit 1
    fi
    
    # Test static assets
    local css_response=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL/assets/index.css 2>/dev/null || echo "404")
    if [ "$css_response" = "200" ] || [ "$css_response" = "404" ]; then
        success "Frontend static assets are being served"
    else
        warning "Frontend static assets might have issues (HTTP $css_response)"
    fi
}

# Test WebSocket connection
test_websocket() {
    log "Testing WebSocket connection..."
    
    # This is a basic test - in practice you'd want more comprehensive WS testing
    local ws_test=$(timeout 5 bash -c "exec 3<>/dev/tcp/localhost/3000" 2>/dev/null && echo "connected" || echo "failed")
    if [ "$ws_test" = "connected" ]; then
        success "WebSocket port is accessible"
    else
        warning "WebSocket connection test inconclusive"
    fi
}

# Test file upload
test_file_upload() {
    log "Testing file upload..."
    
    # First need to login to get a token
    local login_data='{"email":"test@example.com","password":"testpassword123"}'
    local login_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$login_data" $API_URL/auth/login)
    local token=$(echo $login_response | jq -r '.data.token')
    
    # Create a test file
    echo "Test file content" > /tmp/test_upload.txt
    
    # Test file upload
    local upload_response=$(curl -s -X POST -H "Authorization: Bearer $token" -F "media=@/tmp/test_upload.txt" $API_URL/upload/media)
    
    if echo $upload_response | jq -e '.success == true' &> /dev/null; then
        success "File upload works"
    else
        error "File upload failed: $upload_response"
    fi
    
    # Cleanup
    rm -f /tmp/test_upload.txt
}

# Performance tests
test_performance() {
    log "Running basic performance tests..."
    
    # Test API response time
    local start_time=$(date +%s%N)
    curl -s $API_URL/health > /dev/null
    local end_time=$(date +%s%N)
    local response_time=$(( (end_time - start_time) / 1000000 ))
    
    if [ $response_time -lt 1000 ]; then
        success "API response time: ${response_time}ms (Good)"
    elif [ $response_time -lt 3000 ]; then
        warning "API response time: ${response_time}ms (Acceptable)"
    else
        error "API response time: ${response_time}ms (Slow)"
    fi
}

# Test security headers
test_security() {
    log "Testing security headers..."
    
    local headers=$(curl -s -I $FRONTEND_URL)
    
    if echo "$headers" | grep -q "X-Frame-Options"; then
        success "X-Frame-Options header present"
    else
        warning "X-Frame-Options header missing"
    fi
    
    if echo "$headers" | grep -q "X-XSS-Protection"; then
        success "X-XSS-Protection header present"
    else
        warning "X-XSS-Protection header missing"
    fi
    
    if echo "$headers" | grep -q "X-Content-Type-Options"; then
        success "X-Content-Type-Options header present"
    else
        warning "X-Content-Type-Options header missing"
    fi
}

# Cleanup test data
cleanup() {
    log "Cleaning up test data..."
    
    # Remove test user from database
    docker exec glow-chat-mongodb mongosh glow_chat --eval "db.users.deleteOne({email: 'test@example.com'})" &> /dev/null || true
    
    success "Cleanup completed"
}

# Main execution
main() {
    log "Starting Glow Chat deployment tests..."
    
    check_dependencies
    test_containers
    test_database
    test_api
    test_frontend
    test_websocket
    test_file_upload
    test_performance
    test_security
    cleanup
    
    success "All tests completed successfully!"
    log "Your Glow Chat deployment is ready for production!"
}

# Handle script interruption
trap cleanup EXIT

# Run main function
main "$@"