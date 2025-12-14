#!/bin/bash

# Test notification loop - keeps trying until successful
VERCEL_URL="https://apple-pass-scaler.vercel.app"
MAX_ATTEMPTS=50
ATTEMPT=1

echo "🧪 Starting notification test loop..."
echo "📱 Testing: $VERCEL_URL/api/test-notification"
echo ""

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  echo "🔄 Attempt $ATTEMPT/$MAX_ATTEMPTS..."
  
  RESPONSE=$(curl -s -X POST "$VERCEL_URL/api/test-notification" \
    -H "Content-Type: application/json" \
    -w "\n%{http_code}")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  echo "📊 HTTP Code: $HTTP_CODE"
  echo "📄 Response: $BODY"
  echo ""
  
  # Check if successful
  if echo "$BODY" | grep -q '"success":true'; then
    echo "✅ SUCCESS! Notification sent successfully!"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    exit 0
  fi
  
  # Check if devices found but failed to send
  if echo "$BODY" | grep -q "sent.*device"; then
    SENT=$(echo "$BODY" | grep -o '"sent":[0-9]*' | grep -o '[0-9]*')
    if [ "$SENT" -gt 0 ]; then
      echo "✅ SUCCESS! Sent to $SENT device(s)!"
      echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
      exit 0
    fi
  fi
  
  echo "⏳ Waiting 3 seconds before next attempt..."
  sleep 3
  ATTEMPT=$((ATTEMPT + 1))
done

echo "❌ Failed after $MAX_ATTEMPTS attempts"
exit 1

