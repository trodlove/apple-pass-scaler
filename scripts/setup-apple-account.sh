#!/bin/bash

# Script to extract all Apple account credentials and prepare for database insertion

SECRETS_DIR="$HOME/Desktop/project-secrets/apple_account_1"
OUTPUT_FILE="apple-account-data.txt"

echo "🍎 Apple Developer Account Setup"
echo "================================"
echo ""

# Check if secrets directory exists
if [ ! -d "$SECRETS_DIR" ]; then
    echo "❌ Error: Secrets directory not found at $SECRETS_DIR"
    exit 1
fi

echo "✅ Found secrets directory"
echo ""

# Extract certificates to PEM format
echo "📋 Extracting certificates..."

# Convert pass certificate to PEM
PASS_CERT_PEM=$(openssl x509 -inform DER -in "$SECRETS_DIR/pass (2).cer" -outform PEM 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ Error converting pass certificate"
    exit 1
fi

# Convert WWDR certificate to PEM
WWDR_CERT_PEM=$(openssl x509 -inform DER -in "$SECRETS_DIR/AppleWWDRCAG4.cer" -outform PEM 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ Error converting WWDR certificate"
    exit 1
fi

# Read APNS key
APNS_KEY=$(cat "$SECRETS_DIR/AuthKey_F92T5PM6V7.p8")

echo "✅ Certificates extracted"
echo ""

# Account information
TEAM_ID="DJ6CRGLPJM"
PASS_TYPE_ID="pass.com.mybrand.campaign1"
APNS_KEY_ID="F92T5PM6V7"

echo "📝 Account Information:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Team ID: $TEAM_ID"
echo "Pass Type ID: $PASS_TYPE_ID"
echo "APNS Key ID: $APNS_KEY_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Ask for .p12 password
echo "🔐 To extract the private key from Certificates.p12, you need the password."
echo "   Run this command manually:"
echo ""
echo "   openssl pkcs12 -in \"$SECRETS_DIR/Certificates.p12\" -nocerts -nodes"
echo ""
read -p "Enter password for Certificates.p12 (or press Enter to skip): " P12_PASSWORD

if [ -n "$P12_PASSWORD" ]; then
    PRIVATE_KEY=$(openssl pkcs12 -in "$SECRETS_DIR/Certificates.p12" -nocerts -nodes -passin pass:"$P12_PASSWORD" 2>/dev/null | grep -A 100 "BEGIN PRIVATE KEY" | grep -B 100 "END PRIVATE KEY")
    
    if [ $? -eq 0 ] && [ -n "$PRIVATE_KEY" ]; then
        echo "✅ Private key extracted successfully"
        echo ""
        
        # Create output file with all data
        cat > "$OUTPUT_FILE" << EOF
Apple Developer Account Data
============================

Name: Account 1 - Main
Team ID: $TEAM_ID
Pass Type ID: $PASS_TYPE_ID
APNS Key ID: $APNS_KEY_ID

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APNS Auth Key:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
$APNS_KEY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pass Signer Certificate:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
$PASS_CERT_PEM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pass Signer Key (Private Key):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
$PRIVATE_KEY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WWDR Certificate:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
$WWDR_CERT_PEM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next Steps:
1. Go to http://localhost:3000/dashboard/accounts
2. Click "Add Account"
3. Fill in the form with the information above
4. Copy and paste each certificate section into its respective field

EOF
        
        echo "✅ Account data saved to $OUTPUT_FILE"
        echo ""
        echo "📋 You can now:"
        echo "   1. View the file: cat $OUTPUT_FILE"
        echo "   2. Go to the dashboard and add the account"
        echo ""
    else
        echo "❌ Error extracting private key. Wrong password?"
        echo "   You can extract it manually using the command shown above"
    fi
else
    echo "⏭️  Skipping private key extraction"
    echo ""
    echo "💡 To extract manually, run:"
    echo "   openssl pkcs12 -in \"$SECRETS_DIR/Certificates.p12\" -nocerts -nodes"
fi

