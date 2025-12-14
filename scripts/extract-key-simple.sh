#!/bin/bash

# Simple extraction using legacy provider with interactive password

P12_FILE="$HOME/Desktop/project-secrets/apple_account_1/Certificates.p12"

echo "🔐 Extract Private Key (OpenSSL 3.0+ Legacy Mode)"
echo "=================================================="
echo ""
echo "Your .p12 file uses old encryption (RC2-40-CBC)"
echo "OpenSSL 3.0+ requires the -legacy flag"
echo ""
echo "Run this command and enter your password when prompted:"
echo ""
echo "  openssl pkcs12 -in \"$P12_FILE\" -nocerts -nodes -legacy"
echo ""
echo "Then copy the section between:"
echo "  -----BEGIN PRIVATE KEY-----"
echo "  and"
echo "  -----END PRIVATE KEY-----"
echo ""

# Actually run it
echo "Starting extraction..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

openssl pkcs12 -in "$P12_FILE" -nocerts -nodes -legacy 2>&1

EXIT_CODE=$?

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Extraction complete!"
    echo "   Copy the private key section from above"
else
    echo ""
    echo "❌ Extraction failed"
    echo ""
    echo "💡 Alternative: Import to Keychain and export"
    echo "   1. Open Keychain Access"
    echo "   2. File → Import Items"
    echo "   3. Select: $P12_FILE"
    echo "   4. Enter password when prompted"
    echo "   5. Find the certificate, right-click → Export"
    echo "   6. Choose format: .pem"
    echo "   7. The .pem file will contain both cert and key"
fi

