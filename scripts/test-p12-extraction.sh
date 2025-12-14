#!/bin/bash

# Test script to help debug .p12 extraction

P12_FILE="$HOME/Desktop/project-secrets/apple_account_1/Certificates.p12"

echo "🔍 Testing .p12 File Extraction"
echo "================================"
echo ""

if [ ! -f "$P12_FILE" ]; then
    echo "❌ File not found: $P12_FILE"
    exit 1
fi

echo "✅ File found: $P12_FILE"
echo "   Size: $(ls -lh "$P12_FILE" | awk '{print $5}')"
echo ""

echo "📋 Testing extraction methods:"
echo ""

echo "1️⃣  Testing with empty password:"
openssl pkcs12 -in "$P12_FILE" -nocerts -nodes -passin pass: 2>&1 | head -5
echo ""

echo "2️⃣  Testing file info (no password needed):"
openssl pkcs12 -in "$P12_FILE" -info -noout -passin pass: 2>&1 | head -10
echo ""

echo "3️⃣  Interactive extraction (will prompt for password):"
echo "   Run this command manually:"
echo "   openssl pkcs12 -in \"$P12_FILE\" -nocerts -nodes"
echo ""

echo "💡 If the password has special characters, try:"
echo "   - Quoting it: openssl ... -passin 'pass:your-password'"
echo "   - Using stdin: echo 'password' | openssl ... -passin stdin"
echo ""

