#!/bin/bash

# Personal Stats API - Health Check Script
# Run this to verify your setup is working correctly

echo "================================"
echo "Personal Stats API - Health Check"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
echo "Checking if server is running..."
if curl -s -f http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server is not running${NC}"
    echo "Start the server with: npm run dev"
    exit 1
fi

echo ""
echo "Testing endpoints..."
echo "================================"

# Test root endpoint
echo -n "Testing GET / ... "
if curl -s -f http://localhost:3000/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

# Test health endpoint
echo -n "Testing GET /health ... "
HEALTH=$(curl -s http://localhost:3000/health)
if echo "$HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✅${NC}"
    
    # Check Redis connection
    if echo "$HEALTH" | grep -q '"redis_connected":true'; then
        echo "  └─ Redis: ${GREEN}Connected${NC}"
    else
        echo "  └─ Redis: ${YELLOW}Not connected${NC}"
    fi
else
    echo -e "${RED}❌${NC}"
fi

# Test aggregated stats
echo -n "Testing GET /stats ... "
if curl -s -f http://localhost:3000/stats > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

# Test Discord endpoint
echo -n "Testing GET /stats/discord ... "
DISCORD=$(curl -s -w "%{http_code}" http://localhost:3000/stats/discord -o /tmp/discord.json)
if [ "$DISCORD" == "200" ]; then
    echo -e "${GREEN}✅ (200 OK)${NC}"
elif [ "$DISCORD" == "404" ]; then
    echo -e "${YELLOW}⚠️  (404 - Not configured)${NC}"
    echo "  └─ Check DISCORD_USER_ID in .env"
else
    echo -e "${RED}❌ ($DISCORD)${NC}"
fi

# Test Spotify endpoint
echo -n "Testing GET /stats/spotify ... "
SPOTIFY=$(curl -s -w "%{http_code}" http://localhost:3000/stats/spotify -o /tmp/spotify.json)
if [ "$SPOTIFY" == "200" ]; then
    echo -e "${GREEN}✅ (200 OK)${NC}"
elif [ "$SPOTIFY" == "404" ]; then
    echo -e "${YELLOW}⚠️  (404 - Not listening)${NC}"
    echo "  └─ Start playing Spotify with Discord open"
else
    echo -e "${RED}❌ ($SPOTIFY)${NC}"
fi

# Test LeetCode endpoint
echo -n "Testing GET /stats/leetcode ... "
LEETCODE=$(curl -s -w "%{http_code}" http://localhost:3000/stats/leetcode -o /tmp/leetcode.json)
if [ "$LEETCODE" == "200" ]; then
    echo -e "${GREEN}✅ (200 OK)${NC}"
elif [ "$LEETCODE" == "404" ]; then
    echo -e "${YELLOW}⚠️  (404 - Not configured)${NC}"
    echo "  └─ Check LEETCODE_USERNAME in .env"
else
    echo -e "${RED}❌ ($LEETCODE)${NC}"
fi

# Test WakaTime endpoint
echo -n "Testing GET /stats/wakatime ... "
WAKATIME=$(curl -s -w "%{http_code}" http://localhost:3000/stats/wakatime -o /tmp/wakatime.json)
if [ "$WAKATIME" == "200" ]; then
    echo -e "${GREEN}✅ (200 OK)${NC}"
elif [ "$WAKATIME" == "404" ]; then
    echo -e "${YELLOW}⚠️  (404 - Not configured)${NC}"
    echo "  └─ Check WAKATIME_API_KEY in .env"
else
    echo -e "${RED}❌ ($WAKATIME)${NC}"
fi

echo ""
echo "================================"
echo "Response Time Test"
echo "================================"

# Test response time
echo -n "Measuring response time for /stats ... "
TIME=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:3000/stats)
echo "${TIME}s"

if (( $(echo "$TIME < 0.1" | bc -l) )); then
    echo -e "${GREEN}✅ Excellent response time${NC}"
elif (( $(echo "$TIME < 0.5" | bc -l) )); then
    echo -e "${GREEN}✅ Good response time${NC}"
elif (( $(echo "$TIME < 2.0" | bc -l) )); then
    echo -e "${YELLOW}⚠️  Acceptable response time${NC}"
else
    echo -e "${RED}❌ Slow response time${NC}"
fi

echo ""
echo "================================"
echo "Configuration Check"
echo "================================"

# Check .env file
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
    
    # Check for required variables
    source .env 2>/dev/null
    
    echo ""
    echo "Environment variables:"
    [ ! -z "$REDIS_URL" ] && echo -e "  REDIS_URL: ${GREEN}Set${NC}" || echo -e "  REDIS_URL: ${RED}Missing${NC}"
    [ ! -z "$DISCORD_USER_ID" ] && echo -e "  DISCORD_USER_ID: ${GREEN}Set${NC}" || echo -e "  DISCORD_USER_ID: ${YELLOW}Not set${NC}"
    [ ! -z "$LEETCODE_USERNAME" ] && echo -e "  LEETCODE_USERNAME: ${GREEN}Set${NC}" || echo -e "  LEETCODE_USERNAME: ${YELLOW}Not set${NC}"
    [ ! -z "$WAKATIME_API_KEY" ] && echo -e "  WAKATIME_API_KEY: ${GREEN}Set${NC}" || echo -e "  WAKATIME_API_KEY: ${YELLOW}Not set${NC}"
else
    echo -e "${RED}❌ .env file not found${NC}"
    echo "Create it with: cp .env.example .env"
fi

echo ""
echo "================================"
echo "Health Check Complete"
echo "================================"
echo ""
echo "View your API at: http://localhost:3000"
echo "API Documentation: http://localhost:3000/"
echo ""
