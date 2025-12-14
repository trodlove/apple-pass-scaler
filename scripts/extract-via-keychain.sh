#!/bin/bash

# Alternative method: Import to Keychain and export as .pem
# This bypasses the OpenSSL RC2-40-CBC issue

P12_FILE="$HOME/Desktop/project-secrets/apple_account_1/Certificates.p12"
KEYCHAIN_NAME="temp-wallet-keychain"
KEYCHAIN_PATH="$HOME/Library/Keychains/${KEYCHAIN_NAME}-db"

echo "🔐 Alternative Extraction via Keychain"
echo "======================================="
echo ""
echo "This method imports to Keychain Access and exports as .pem"
echo ""

# Create temporary keychain
echo "1️⃣  Creating temporary keychain..."
security create-keychain -p "" "$KEYCHAIN_NAME" 2>/dev/null
security unlock-keychain -p "" "$KEYCHAIN_NAME" 2>/dev/null
security set-keychain-settings -t 300 -u "$KEYCHAIN_NAME" 2>/dev/null

echo "2️⃣  Importing .p12 file..."
echo "   (You'll be prompted for the .p12 password)"
security import "$P12_FILE" -k "$KEYCHAIN_NAME" -T /usr/bin/security

if [ $? -eq 0 ]; then
    echo "✅ Import successful!"
    echo ""
    echo "3️⃣  Finding the certificate..."
    
    # List certificates in the keychain
    CERT_NAME=$(security find-certificate -c "pass.com.mybrand.campaign1" "$KEYCHAIN_NAME" 2>/dev/null | grep "alis" | head -1 | cut -d'"' -f4)
    
    if [ -z "$CERT_NAME" ]; then
        echo "   Certificate found, extracting..."
        
        # Export certificate and key
        echo "4️⃣  Exporting private key..."
        security find-certificate -c "pass.com.mybrand.campaign1" -p -k "$KEYCHAIN_NAME" > cert-and-key.pem 2>/dev/null
        
        if [ -f "cert-and-key.pem" ]; then
            echo "✅ Exported to: cert-and-key.pem"
            echo ""
            echo "📋 The private key is in cert-and-key.pem"
            echo "   Look for the section between:"
            echo "   -----BEGIN PRIVATE KEY-----"
            echo "   and"
            echo "   -----END PRIVATE KEY-----"
        fi
    else
        echo "⚠️  Could not find certificate automatically"
        echo ""
        echo "💡 Manual steps:"
        echo "   1. Open Keychain Access"
        echo "   2. Search for 'pass.com.mybrand.campaign1'"
        echo "   3. Right-click → Export"
        echo "   4. Choose format: .pem"
    fi
    
    # Cleanup
    echo ""
    echo "5️⃣  Cleaning up temporary keychain..."
    security delete-keychain "$KEYCHAIN_NAME" 2>/dev/null
else
    echo "❌ Import failed"
    security delete-keychain "$KEYCHAIN_NAME" 2>/dev/null
fi

