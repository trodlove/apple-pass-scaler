#!/usr/bin/env node

/**
 * Helper script to prepare Apple account data for the dashboard
 * This reads the APNS key and helps you format it for the account form
 */

const fs = require('fs');
const path = require('path');

const apnsKeyPath = path.join(
  __dirname,
  '../../Desktop/project-secrets/apple_account_1/AuthKey_F92T5PM6V7.p8'
);

try {
  const apnsKeyContent = fs.readFileSync(apnsKeyPath, 'utf-8');
  
  console.log('✅ APNS Key loaded successfully!\n');
  console.log('=== APNS Auth Key (copy this to the dashboard form) ===');
  console.log(apnsKeyContent);
  console.log('\n=== APNS Key ID ===');
  console.log('F92T5PM6V7');
  console.log('\n⚠️  You still need to provide:');
  console.log('1. Team ID (from Apple Developer portal)');
  console.log('2. Pass Type ID (from Apple Developer portal)');
  console.log('3. Pass Signer Certificate (.cer file content)');
  console.log('4. Pass Signer Key (.p12 private key content)');
  console.log('5. WWDR Certificate (download from Apple)');
  console.log('\n📝 Add the account at: http://localhost:3000/dashboard/accounts');
} catch (error) {
  console.error('❌ Error reading APNS key:', error.message);
  console.log('\nMake sure the file exists at:');
  console.log(apnsKeyPath);
}

