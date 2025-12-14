#!/usr/bin/env node

/**
 * Prepares all certificate data for manual addition
 * This shows you exactly what to copy/paste
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const secretsDir = path.join(process.env.HOME || require('os').homedir(), 'Desktop/project-secrets/apple_account_1');

console.log('📋 Preparing All Certificate Data for Manual Addition');
console.log('=====================================================\n');

// Read APNS key
const apnsKey = fs.readFileSync(path.join(secretsDir, 'AuthKey_F92T5PM6V7.p8'), 'utf-8').trim();

// Convert certificates to PEM
const passCert = execSync(
  `openssl x509 -inform DER -in "${path.join(secretsDir, 'pass (2).cer')}" -outform PEM`,
  { encoding: 'utf-8' }
).trim();

const wwdrCert = execSync(
  `openssl x509 -inform DER -in "${path.join(secretsDir, 'AppleWWDRCAG4.cer')}" -outform PEM`,
  { encoding: 'utf-8' }
).trim();

console.log('✅ All certificates extracted (except private key)\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('STEP 1: Extract Private Key Manually');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('Run this command in Terminal:');
console.log('');
console.log(`  openssl pkcs12 -in "${path.join(secretsDir, 'Certificates.p12')}" -nocerts -nodes`);
console.log('');
console.log('Enter your password when prompted, then copy the section between:');
console.log('  -----BEGIN PRIVATE KEY-----');
console.log('  and');
console.log('  -----END PRIVATE KEY-----');
console.log('(including those lines)');
console.log('');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('STEP 2: Account Information');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('Name: Account 1 - Main');
console.log('Team ID: DJ6CRGLPJM');
console.log('Pass Type ID: pass.com.mybrand.campaign1');
console.log('APNS Key ID: F92T5PM6V7');
console.log('');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('STEP 3: Certificate Contents (Copy These)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

console.log('APNS Auth Key:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(apnsKey);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

console.log('Pass Signer Certificate:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(passCert);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

console.log('WWDR Certificate:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(wwdrCert);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

console.log('Pass Signer Key (Private Key):');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('[EXTRACT THIS MANUALLY - See Step 1 above]');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('STEP 4: Add via Dashboard');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('1. Start dev server: npm run dev');
console.log('2. Go to: http://localhost:3000/dashboard/accounts');
console.log('3. Click "Add Account"');
console.log('4. Fill in the form with the information above');
console.log('5. Paste each certificate section into its field');
console.log('');

// Save to file for easy reference
const outputFile = 'certificate-data.txt';
const output = `
Apple Developer Account - Certificate Data
=========================================

Account Information:
- Name: Account 1 - Main
- Team ID: DJ6CRGLPJM
- Pass Type ID: pass.com.mybrand.campaign1
- APNS Key ID: F92T5PM6V7

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APNS Auth Key:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${apnsKey}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pass Signer Certificate:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${passCert}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WWDR Certificate:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${wwdrCert}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pass Signer Key (Private Key):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[EXTRACT MANUALLY using: openssl pkcs12 -in "Certificates.p12" -nocerts -nodes]
`;

fs.writeFileSync(outputFile, output);
console.log(`✅ All data saved to: ${outputFile}`);
console.log('   You can reference this file when adding the account\n');

