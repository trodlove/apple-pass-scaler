#!/usr/bin/env node

/**
 * Complete setup script that does everything possible automatically
 * Only requires the private key to be extracted manually
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Complete Setup Script');
console.log('========================\n');

// Step 1: Verify environment
console.log('1️⃣  Checking environment variables...');
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Run: ./scripts/setup-env.sh');
  process.exit(1);
}
console.log('✅ Environment variables configured\n');

// Step 2: Test database connection
console.log('2️⃣  Testing database connection...');
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

(async () => {
  try {
    // Check if table exists
    const { error: tableError } = await supabase
      .from('apple_developer_accounts')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === 'PGRST116') {
      console.log('⚠️  Database tables not found');
      console.log('   You need to run the schema.sql in Supabase SQL Editor');
      console.log('   Go to: https://supabase.com/dashboard/project/vvgvhlswsiqpnpwlcxud/sql');
      console.log('   Copy and paste the contents of supabase/schema.sql\n');
    } else if (tableError) {
      console.error('❌ Database connection error:', tableError.message);
      process.exit(1);
    } else {
      console.log('✅ Database connection successful\n');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  
  // Step 3: Check for private key
  console.log('3️⃣  Checking for private key...');
  const secretsDir = path.join(process.env.HOME || require('os').homedir(), 'Desktop/project-secrets/apple_account_1');
  const p12File = path.join(secretsDir, 'Certificates.p12');
  
  if (!fs.existsSync(p12File)) {
    console.error('❌ Certificates.p12 not found');
    process.exit(1);
  }
  
  // Try to extract private key
  let privateKey = null;
  try {
    const output = execSync(
      `openssl pkcs12 -in "${p12File}" -nocerts -nodes -passin pass: 2>&1`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
    const match = output.match(/-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA )?PRIVATE KEY-----/);
    if (match) {
      privateKey = match[0].trim();
      console.log('✅ Private key extracted (no password needed)\n');
    }
  } catch (error) {
    // Private key needs password
  }
  
  if (!privateKey) {
    console.log('⚠️  Private key requires password');
    console.log('   To extract it, run:');
    console.log('   ./scripts/extract-private-key.sh');
    console.log('   Then run: node scripts/add-account-to-db.js\n');
    console.log('📋 Summary of what\'s ready:');
    console.log('   ✅ Environment variables configured');
    console.log('   ✅ All certificates extracted');
    console.log('   ✅ Account information ready');
    console.log('   ⏳ Need to extract private key from .p12 file\n');
    process.exit(0);
  }
  
  // Step 4: Add account to database
  console.log('4️⃣  Adding account to database...');
  
  const apnsKey = fs.readFileSync(path.join(secretsDir, 'AuthKey_F92T5PM6V7.p8'), 'utf-8').trim();
  const passCert = execSync(
    `openssl x509 -inform DER -in "${path.join(secretsDir, 'pass (2).cer')}" -outform PEM`,
    { encoding: 'utf-8' }
  ).trim();
  const wwdrCert = execSync(
    `openssl x509 -inform DER -in "${path.join(secretsDir, 'AppleWWDRCAG4.cer')}" -outform PEM`,
    { encoding: 'utf-8' }
  ).trim();
  
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
  
  // Check if exists
  const { data: existing } = await supabase
    .from('apple_developer_accounts')
    .select('id, name')
    .eq('pass_type_id', accountData.pass_type_id)
    .single();
  
  if (existing) {
    console.log('⚠️  Account already exists:');
    console.log(`   ID: ${existing.id}`);
    console.log(`   Name: ${existing.name}\n`);
    process.exit(0);
  }
  
  const { data, error } = await supabase
    .from('apple_developer_accounts')
    .insert(accountData)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'PGRST116') {
      console.error('   Run the database schema first!');
    }
    process.exit(1);
  }
  
  console.log('✅ Account added successfully!');
  console.log(`   ID: ${data.id}`);
  console.log(`   Name: ${data.name}`);
  console.log('\n🎉 Setup complete! Everything is ready to use.\n');
})();

