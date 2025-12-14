#!/usr/bin/env node

/**
 * Quick script to prepare account data without password prompt
 * Outputs the account data that can be manually added via dashboard
 */

const fs = require('fs');
const path = require('path');

const secretsDir = path.join(__dirname, '../../Desktop/project-secrets/apple_account_1');

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8').trim();
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

console.log('🍎 Preparing Apple Developer Account Data\n');

// Read certificate files
const apnsKey = readFile(path.join(secretsDir, 'AuthKey_F92T5PM6V7.p8'));
const passCert = readFile(path.join(secretsDir, 'pass (2).cer'));
const wwdrCert = readFile(path.join(secretsDir, 'AppleWWDRCAG4.cer'));

if (!apnsKey || !passCert || !wwdrCert) {
  console.error('❌ Error: Could not read all certificate files');
  process.exit(1);
}

console.log('✅ Certificate files read successfully\n');

// Account data (private key needs to be extracted from .p12)
const accountData = {
  name: 'Account 1 - Main',
  team_id: 'DJ6CRGLPJM',
  pass_type_id: 'pass.com.mybrand.campaign1',
  apns_key_id: 'F92T5PM6V7',
  apns_auth_key: apnsKey,
  pass_signer_cert: passCert,
  pass_signer_key: '[EXTRACT FROM Certificates.p12 - See instructions below]',
  wwdr_cert: wwdrCert,
  status: 'ACTIVE'
};

console.log('📋 Account Information:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Name: ${accountData.name}`);
console.log(`Team ID: ${accountData.team_id}`);
console.log(`Pass Type ID: ${accountData.pass_type_id}`);
console.log(`APNS Key ID: ${accountData.apns_key_id}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📝 To extract the private key from Certificates.p12, run:');
console.log('   openssl pkcs12 -in "Certificates.p12" -nocerts -nodes');
console.log('   (Enter the password when prompted)');
console.log('   Copy the section between -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----\n');

console.log('📋 Certificate Contents:\n');
console.log('APNS Auth Key:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(apnsKey);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('Pass Signer Certificate:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(passCert);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('WWDR Certificate:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(wwdrCert);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('💡 Next Steps:');
console.log('1. Extract private key from Certificates.p12 (see command above)');
console.log('2. Go to http://localhost:3000/dashboard/accounts');
console.log('3. Click "Add Account"');
console.log('4. Fill in the form with the information above');
console.log('5. Paste the certificate contents in their respective fields\n');

