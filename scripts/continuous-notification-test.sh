#!/bin/bash

# Continuous notification test script
# This will keep testing until a notification is successfully sent

VERCEL_URL="https://apple-pass-scaler.vercel.app"
MESSAGE="test good"
ATTEMPT=1

echo "🧪 Starting continuous notification testing..."
echo "📱 Testing: $VERCEL_URL/api/broadcast"
echo "💬 Message: \"$MESSAGE\""
echo "⏳ This will keep testing until a device is registered and notification is sent..."
echo ""

while true; do
  echo "[$(date +%H:%M:%S)] Attempt $ATTEMPT..."
  
  RESPONSE=$(curl -s -X POST "$VERCEL_URL/api/broadcast" \
    -H "Content-Type: application/json" \
    -d "{\"message\":\"$MESSAGE\"}")
  
  SENT=$(echo "$RESPONSE" | jq -r '.notifications.sent // 0' 2>/dev/null || echo "0")
  WARNING=$(echo "$RESPONSE" | jq -r '.warning // empty' 2>/dev/null || echo "")
  
  if [ "$SENT" != "0" ] && [ "$SENT" != "null" ] && [ -n "$SENT" ]; then
    echo ""
    echo "✅✅✅ SUCCESS! ✅✅✅"
    echo "📤 Notification sent to $SENT device(s)!"
    echo ""
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    echo ""
    echo "🎉 The notification \"$MESSAGE\" should now appear on your iPhone lock screen!"
    break
  fi
  
  if [ -n "$WARNING" ]; then
    echo "  ⚠️  $WARNING"
  else
    echo "  📊 Sent: $SENT | Passes updated: $(echo "$RESPONSE" | jq -r '.passesUpdated // 0')"
  fi
  
  ATTEMPT=$((ATTEMPT + 1))
  sleep 5
done

