#!/usr/bin/env node

/**
 * Script to directly add Apple Developer Account to Supabase database
 * This bypasses the API and uses the Supabase client directly
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const secretsDir = path.join(process.env.HOME || require('os').homedir(), 'Desktop/project-secrets/apple_account_1');

// Check environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('   Make sure .env.local exists and has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Read certificate files
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8').trim();
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    return null;
  }
}

// Extract private key from .p12
function extractPrivateKey(p12Path) {
  console.log('🔐 Attempting to extract private key from .p12 file...');
  console.log('   (If this fails, you may need to provide the password)');
  
  // Try without password first
  try {
    const output = execSync(
      `openssl pkcs12 -in "${p12Path}" -nocerts -nodes -passin pass: 2>&1`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
    
    const match = output.match(/-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA )?PRIVATE KEY-----/);
    if (match) {
      console.log('✅ Private key extracted (no password needed)');
      return match[0].trim();
    }
  } catch (error) {
    // Try with empty string as password (some .p12 files use empty password)
  }
  
  // If that didn't work, we need the password
  console.log('⚠️  Could not extract private key automatically');
  console.log('   The .p12 file requires a password');
  console.log('   Please run this command manually:');
  console.log(`   openssl pkcs12 -in "${p12Path}" -nocerts -nodes`);
  console.log('   Then copy the private key section and update this script');
  return null;
}

async function main() {
  console.log('🍎 Adding Apple Developer Account to Database\n');
  
  // Read certificate files
  const apnsKey = readFile(path.join(secretsDir, 'AuthKey_F92T5PM6V7.p8'));
  
  // Convert certificates to PEM
  let passCert, wwdrCert;
  try {
    passCert = execSync(
      `openssl x509 -inform DER -in "${path.join(secretsDir, 'pass (2).cer')}" -outform PEM`,
      { encoding: 'utf-8' }
    ).trim();
    
    wwdrCert = execSync(
      `openssl x509 -inform DER -in "${path.join(secretsDir, 'AppleWWDRCAG4.cer')}" -outform PEM`,
      { encoding: 'utf-8' }
    ).trim();
  } catch (error) {
    console.error('❌ Error converting certificates:', error.message);
    process.exit(1);
  }
  
  // Extract private key
  const privateKey = extractPrivateKey(path.join(secretsDir, 'Certificates.p12'));
  
  if (!apnsKey || !passCert || !wwdrCert) {
    console.error('❌ Error: Could not read all required certificate files');
    process.exit(1);
  }
  
  if (!privateKey) {
    console.error('\n❌ Cannot proceed without private key');
    console.error('   Please extract it manually and update this script, or add via dashboard');
    process.exit(1);
  }
  
  // Prepare account data
  const accountData = {
    name: 'Account 1 - Main',
    team_id: 'DJ6CRGLPJM',
    pass_type_id: 'pass.com.mybrand.campaign1',
    apns_key_id: 'F92T5PM6V7',
    apns_auth_key: apnsKey,
    pass_signer_cert: passCert,
    pass_signer_key: privateKey,
    wwdr_cert: wwdrCert,
    status: 'ACTIVE',
  };
  
  console.log('\n📋 Account Data:');
  console.log(`   Name: ${accountData.name}`);
  console.log(`   Team ID: ${accountData.team_id}`);
  console.log(`   Pass Type ID: ${accountData.pass_type_id}`);
  console.log(`   APNS Key ID: ${accountData.apns_key_id}\n`);
  
  // Check if account already exists
  const { data: existing } = await supabase
    .from('apple_developer_accounts')
    .select('id, name')
    .eq('pass_type_id', accountData.pass_type_id)
    .single();
  
  if (existing) {
    console.log('⚠️  Account with this Pass Type ID already exists:');
    console.log(`   ID: ${existing.id}`);
    console.log(`   Name: ${existing.name}`);
    console.log('\n   To update it, delete it first via the dashboard or update this script');
    process.exit(0);
  }
  
  // Insert account
  console.log('📤 Inserting account into database...');
  const { data, error } = await supabase
    .from('apple_developer_accounts')
    .insert(accountData)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error inserting account:', error.message);
    if (error.code === 'PGRST116') {
      console.error('   The database table might not exist. Run the schema.sql first!');
    }
    process.exit(1);
  }
  
  console.log('✅ Account added successfully!');
  console.log(`   Account ID: ${data.id}`);
  console.log(`   Name: ${data.name}`);
  console.log(`   Status: ${data.status}`);
  console.log('\n🎉 Setup complete! Your Apple Developer Account is ready to use.');
}

main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

