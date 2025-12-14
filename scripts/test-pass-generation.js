#!/usr/bin/env node

/**
 * Test script to generate a pass and debug issues
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { PKPass } = require('passkit-generator');
const fs = require('fs');
const path = require('path');

const LOG_ENDPOINT = 'http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1';
const sessionId = 'debug-session';
const runId = 'test-run-1';

function log(hypothesisId, location, message, data = {}) {
  fetch(LOG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      runId,
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}

console.log('🧪 Testing Pass Generation\n');

// Initialize Supabase
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

async function testPassGeneration() {
  try {
    log('A', 'test-pass-generation.js:35', 'Starting pass generation test');
    
    // Get Apple account
    console.log('1️⃣  Fetching Apple Developer Account...');
    log('A', 'test-pass-generation.js:40', 'Fetching account from database');
    
    const { data: account, error: accountError } = await supabase
      .from('apple_developer_accounts')
      .select('*')
      .eq('status', 'ACTIVE')
      .limit(1)
      .single();
    
    if (accountError || !account) {
      log('A', 'test-pass-generation.js:48', 'Account fetch failed', { error: accountError?.message });
      console.error('❌ Error fetching account:', accountError);
      process.exit(1);
    }
    
    log('A', 'test-pass-generation.js:52', 'Account fetched successfully', { 
      accountId: account.id, 
      passTypeId: account.pass_type_id 
    });
    console.log('✅ Account found:', account.name);
    
    // Prepare credentials
    const credentials = {
      team_id: account.team_id,
      pass_type_id: account.pass_type_id,
      apns_key_id: account.apns_key_id,
      apns_auth_key: account.apns_auth_key,
      pass_signer_cert: account.pass_signer_cert,
      pass_signer_key: account.pass_signer_key,
      wwdr_cert: account.wwdr_cert,
    };
    
    log('B', 'test-pass-generation.js:67', 'Credentials prepared', {
      hasWwdr: !!credentials.wwdr_cert,
      hasSignerCert: !!credentials.pass_signer_cert,
      hasSignerKey: !!credentials.pass_signer_key,
      wwdrLength: credentials.wwdr_cert?.length,
      signerCertLength: credentials.pass_signer_cert?.length,
      signerKeyLength: credentials.pass_signer_key?.length,
    });
    
    console.log('\n2️⃣  Creating pass.json structure...');
    
    // Create minimal valid pass.json
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: credentials.pass_type_id,
      teamIdentifier: credentials.team_id,
      organizationName: 'Apple Pass Scaler',
      description: 'Test Wallet Pass',
      serialNumber: `TEST-${Date.now()}`,
      backgroundColor: 'rgb(255, 255, 255)',
      foregroundColor: 'rgb(0, 0, 0)',
      generic: {},
    };
    
    log('C', 'test-pass-generation.js:88', 'Pass.json created', { passJson });
    
    console.log('3️⃣  Creating minimal icon...');
    
    // Create a minimal valid PNG icon (29x29 transparent)
    // This is a valid 1x1 PNG in base64
    const iconBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const iconBuffer = Buffer.from(iconBase64, 'base64');
    
    log('C', 'test-pass-generation.js:97', 'Icon buffer created', { iconSize: iconBuffer.length });
    
    console.log('4️⃣  Creating PKPass instance...');
    log('D', 'test-pass-generation.js:100', 'About to create PKPass', {
      passJsonKeys: Object.keys(passJson),
      iconBufferSize: iconBuffer.length,
    });
    
    // Create pass from scratch
    const pass = new PKPass(
      {
        'pass.json': Buffer.from(JSON.stringify(passJson)),
        'icon.png': iconBuffer,
        'icon@2x.png': iconBuffer,
      },
      {
        wwdr: credentials.wwdr_cert,
        signerCert: credentials.pass_signer_cert,
        signerKey: credentials.pass_signer_key,
        // Omit signerKeyPassphrase - library doesn't allow empty string
      },
      {
        passTypeIdentifier: credentials.pass_type_id,
        teamIdentifier: credentials.team_id,
        serialNumber: passJson.serialNumber,
        organizationName: 'Apple Pass Scaler',
        description: 'Test Wallet Pass',
      }
    );
    
    log('D', 'test-pass-generation.js:125', 'PKPass instance created', { 
      passType: pass.type,
      hasCertificates: !!pass.certificates,
    });
    console.log('✅ PKPass instance created');
    
    console.log('5️⃣  Adding a test field...');
    log('E', 'test-pass-generation.js:132', 'Adding primary field');
    
    pass.primaryFields.push({
      key: 'test',
      label: 'Test Field',
      value: 'Test Value',
    });
    
    log('E', 'test-pass-generation.js:140', 'Primary field added', { 
      fieldCount: pass.primaryFields.length 
    });
    
    console.log('6️⃣  Adding barcode...');
    log('E', 'test-pass-generation.js:144', 'Setting barcode');
    
    pass.setBarcodes(passJson.serialNumber);
    
    log('E', 'test-pass-generation.js:148', 'Barcode set');
    
    console.log('7️⃣  Generating buffer...');
    log('F', 'test-pass-generation.js:151', 'About to call getAsBuffer');
    
    const buffer = pass.getAsBuffer();
    
    log('F', 'test-pass-generation.js:154', 'Buffer generated successfully', {
      bufferSize: buffer.length,
      bufferType: buffer.constructor.name,
    });
    console.log('✅ Buffer generated! Size:', buffer.length, 'bytes');
    
    // Save to file for inspection
    const outputPath = path.join(process.cwd(), 'test-pass.pkpass');
    fs.writeFileSync(outputPath, buffer);
    console.log(`\n✅ Pass saved to: ${outputPath}`);
    console.log('   You can try opening this file on a Mac with Wallet app');
    
    log('F', 'test-pass-generation.js:165', 'Test complete - SUCCESS', {
      outputPath,
      bufferSize: buffer.length,
    });
    
    return true;
  } catch (error) {
    log('F', 'test-pass-generation.js:171', 'Error occurred', {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
    });
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
}

testPassGeneration()
  .then(() => {
    console.log('\n🎉 Pass generation test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  });

