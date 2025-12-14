#!/bin/bash

# Extract private key using legacy provider (for OpenSSL 3.0+)

P12_FILE="$HOME/Desktop/project-secrets/apple_account_1/Certificates.p12"
OUTPUT_FILE="private-key.txt"

echo "🔐 Extracting Private Key (Legacy Mode)"
echo "========================================"
echo ""
echo "This uses the legacy provider for older .p12 encryption"
echo ""

# Try with legacy provider first (OpenSSL 3.0+)
if openssl pkcs12 -help 2>&1 | grep -q "legacy"; then
    echo "Using OpenSSL 3.0+ with legacy provider..."
    openssl pkcs12 -in "$P12_FILE" -nocerts -nodes -legacy 2>&1 | tee "$OUTPUT_FILE"
else
    # Fallback for older OpenSSL
    echo "Using standard OpenSSL..."
    openssl pkcs12 -in "$P12_FILE" -nocerts -nodes 2>&1 | tee "$OUTPUT_FILE"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "BEGIN.*PRIVATE KEY" "$OUTPUT_FILE"; then
    echo "✅ Private key extracted successfully!"
    echo "   Saved to: $OUTPUT_FILE"
    echo ""
    echo "📋 The private key is in the file above."
    echo "   Look for the section between:"
    echo "   -----BEGIN PRIVATE KEY-----"
    echo "   and"
    echo "   -----END PRIVATE KEY-----"
else
    echo "❌ Could not extract private key"
    echo ""
    echo "💡 Try this alternative method:"
    echo "   security import \"$P12_FILE\" -k ~/Library/Keychains/login.keychain"
    echo "   Then export from Keychain Access"
fi

