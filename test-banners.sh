#!/bin/bash

# Banner Connection Test Script

echo "╔════════════════════════════════════════╗"
echo "║   BANNER BACKEND CONNECTION TEST       ║"
echo "╚════════════════════════════════════════╝"
echo ""

echo "🔍 Testing backend endpoint..."
echo ""

# Test the banners endpoint
echo "📡 GET https://marquebackend-production.up.railway.app/api/v1/banners"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" https://marquebackend-production.up.railway.app/api/v1/banners)
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "Status Code: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ SUCCESS! Backend endpoint works!"
  echo ""
  echo "📊 Response:"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  echo ""
  echo "🎉 Your backend is returning data!"
  echo "⚠️  BUT: The browser shows CORS error"
  echo ""
  echo "📋 Next steps:"
  echo "   1. Backend works in curl ✓"
  echo "   2. Backend needs CORS headers ✗"
  echo "   3. Tell your backend dev to add CORS"
  echo ""
  echo "   See FIX_BANNER_CORS.md for instructions"
elif [ "$HTTP_STATUS" = "404" ]; then
  echo "❌ ERROR: Endpoint not found (404)"
  echo ""
  echo "Possible issues:"
  echo "   1. /api/v1/banners endpoint doesn't exist"
  echo "   2. URL is wrong"
  echo "   3. Backend not deployed"
elif [ "$HTTP_STATUS" = "500" ]; then
  echo "❌ ERROR: Server error (500)"
  echo ""
  echo "Backend has an internal error"
  echo "Check backend logs for details"
else
  echo "❌ ERROR: Unexpected status $HTTP_STATUS"
  echo ""
  echo "Response:"
  echo "$BODY"
fi

echo ""
echo "════════════════════════════════════════"
echo ""

# Test CORS headers
echo "🔍 Checking CORS headers..."
echo ""

CORS_HEADERS=$(curl -s -I https://marquebackend-production.up.railway.app/api/v1/banners | grep -i "access-control")

if [ -z "$CORS_HEADERS" ]; then
  echo "❌ No CORS headers found!"
  echo ""
  echo "This is why browser shows CORS error:"
  echo "   - curl works ✓"
  echo "   - Browser blocked ✗"
  echo ""
  echo "📋 Backend needs to add:"
  echo "   Access-Control-Allow-Origin: *"
  echo "   Access-Control-Allow-Methods: GET, OPTIONS"
  echo "   Access-Control-Allow-Headers: *"
else
  echo "✅ CORS headers found:"
  echo "$CORS_HEADERS"
fi

echo ""
echo "════════════════════════════════════════"

