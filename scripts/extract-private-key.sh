#!/bin/bash

# Helper script to extract private key from .p12 file
# This will prompt for the password

P12_FILE="$HOME/Desktop/project-secrets/apple_account_1/Certificates.p12"
OUTPUT_FILE="private-key.txt"

echo "🔐 Extracting Private Key from Certificates.p12"
echo "================================================"
echo ""
echo "You will be prompted for the .p12 file password"
echo ""

openssl pkcs12 -in "$P12_FILE" -nocerts -nodes 2>&1 | tee "$OUTPUT_FILE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if grep -q "BEGIN.*PRIVATE KEY" "$OUTPUT_FILE"; then
    echo "✅ Private key extracted successfully!"
    echo "   Saved to: $OUTPUT_FILE"
    echo ""
    echo "📋 Copy the section between:"
    echo "   -----BEGIN PRIVATE KEY-----"
    echo "   and"
    echo "   -----END PRIVATE KEY-----"
    echo ""
    echo "   (or -----BEGIN RSA PRIVATE KEY----- if that's the format)"
    echo ""
    echo "💡 Then run: node scripts/add-account-to-db.js"
else
    echo "❌ Could not extract private key"
    echo "   Check the password and try again"
fi

