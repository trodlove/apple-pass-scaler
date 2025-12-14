#!/usr/bin/env node

/**
 * Add account to database using the extracted private key
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const secretsDir = path.join(process.env.HOME || require('os').homedir(), 'Desktop/project-secrets/apple_account_1');

// The private key from terminal
const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCwqtYUpb61+b5J
0zQ1R2Jx6z4yoz9NYN2h8/+NkcxfvioPjRy4S7MhQVKtRGAdl99QkgI7OlRDSMVp
WbEDeVANCeyasidjS18p5/Yft3KoNyS3yFYF3VacTjuG5MB1Z7RFGm++MnOyv8mL
Drs2yCg3aXCrqrVoZOVYsy1bJf7kiFYl66Bkc3Up81d9e01ABvekqR6mSBKIQVv8
5icTTG+oldgJOSdYSB4cyg/ny1Wm1HLgBbVGNuSfbOd2q2TZOkBRCVh5NJfxRoo/
Q7uz6lxYhxulilnQlcvk1kiiHN1DXOqizXcaQLbbwC+RPDLANhGyWdcwYxjq0lNa
qhjuBLA5AgMBAAECggEADsvwLECJjZJCRsqit8enziTGy9Tya1eumG7oO4I3nNk/
ipfmDOWCNknTU+HDLxdWQ9hGyZEkF5KTvjQd6E2Tz9PB9l7vf5iDeu4LpjJmLwKX
V7E2yzzzkRnYUH7+Q5cQ+SyyqTpuiE0Z40Szl24COEnjfu1ITlsM/nXbWaQACkHh
V4PHZvEtUCzmWptq/lhsn6vNlirqgUhk8ZpGvD3QbdWtUk5p9LZhBvxvzYEcXqa6
siVcWfrgqVRemx9eBiZFrDakZma1nmlBYTNIQYNOCX91XMDaEPULa7IGOBvSqNOF
UuJZJr32g/19TwaavGqw6EVnNATc0UMU3gg6s3nlgQKBgQDcicGVMiw6E3IPGQ9z
00BPRdRUe6lO2/wYkJ9WLb/eS+wwZe1juFHMrr3MXD/jGXeXr4mjKf8uFvbkhDIY
GJx09BjpnJGmv16jJwomKkXfLGj2CRHM9ds6Ul17JvVBl3fbD1HIvIa19QiPI8as
RY9Z5ZNQIHJDaWdQN3sGE5gpsQKBgQDNEy4+vsYThZaqT1npest2glma1FyZaLIb
jAb/msL2xVyZsZRqQle2PuvQKeMiWDyQ5lOQq/6BB10QE4q8YaVnoHUXdXdtY2U7
EdnoJPhR2qnWIQIYo7yOdaDei23/KxH3icwti7UATBAiDyjcwoBplqj7r6DzEZVC
y0PvAHQJCQKBgQCgP8UXaUazyI93owkUa6tuLtpzrQvAjp7nJqdxEns5x0dPf7D4
ZeWialLl3R5bIZVB9j53/js7PVqXf+t6kN+XKAu2LJu1Y5cbzHFWfB8bZIS8SqjR
mtB614CvzQYnbC2eUsplp3/nVa6rfB6P7VeVxfi+H2WH0F5O7pGJP9GwcQKBgQCK
ciyCR6DJhSJWEAQPT8sUUqPTlxJ8ruWvGzWOUhjVKCB/0hb0NZ2pd4kTm3OvuAoL
eLNps/O5gBMfy1GaJAHal8T09WSPAM9StZZ61pqeCBUoblhP8hpVwqu8Ej1MSvNy
PiENjoe/j5pEpB9eCiFPJ1slr0flUTWHRlqye4faoQKBgQDS1lWW9z+Wmx3inAlh
55hhymZnDIhYUn0hXwUMpOFPJjE9hwJI3jf0ym63ix8jjxPyRnq/aEn6UJpRt5y2
tUNd+zv8re/2lV/njRIZrNQZsSDuA27NtSLOKRiXeUle3c6OrPIwYCMtZ4nfhvHx
cKNfFB5knI07LiBCAXAJcUjrWg==
-----END PRIVATE KEY-----`;

console.log('🚀 Adding Apple Developer Account to Database\n');

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

async function main() {
  try {
    // Read other certificates
    console.log('📋 Reading certificate files...');
    const apnsKey = fs.readFileSync(path.join(secretsDir, 'AuthKey_F92T5PM6V7.p8'), 'utf-8').trim();
    const passCert = execSync(
      `openssl x509 -inform DER -in "${path.join(secretsDir, 'pass (2).cer')}" -outform PEM`,
      { encoding: 'utf-8' }
    ).trim();
    const wwdrCert = execSync(
      `openssl x509 -inform DER -in "${path.join(secretsDir, 'AppleWWDRCAG4.cer')}" -outform PEM`,
      { encoding: 'utf-8' }
    ).trim();
    
    console.log('✅ All certificates loaded\n');
    
    // Prepare account data
    const accountData = {
      name: 'Account 1 - Main',
      team_id: 'DJ6CRGLPJM',
      pass_type_id: 'pass.com.mybrand.campaign1',
      apns_key_id: 'F92T5PM6V7',
      apns_auth_key: apnsKey,
      pass_signer_cert: passCert,
      pass_signer_key: privateKey.trim(),
      wwdr_cert: wwdrCert,
      status: 'ACTIVE',
    };
    
    // Check if account exists
    console.log('🔍 Checking if account already exists...');
    const { data: existing } = await supabase
      .from('apple_developer_accounts')
      .select('id, name')
      .eq('pass_type_id', accountData.pass_type_id)
      .single();
    
    if (existing) {
      console.log('⚠️  Account already exists, updating...');
      const { error: updateError } = await supabase
        .from('apple_developer_accounts')
        .update(accountData)
        .eq('id', existing.id);
      
      if (updateError) {
        console.error('❌ Error updating account:', updateError.message);
        process.exit(1);
      }
      console.log('✅ Account updated successfully!');
    } else {
      // Insert account
      console.log('📤 Adding account to database...');
      const { data, error } = await supabase
        .from('apple_developer_accounts')
        .insert(accountData)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      }
      
      console.log('✅ Account added successfully!');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Setup Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Your Apple Developer Account is ready!');
    console.log('\n📋 Account Details:');
    console.log(`   Name: ${accountData.name}`);
    console.log(`   Team ID: ${accountData.team_id}`);
    console.log(`   Pass Type ID: ${accountData.pass_type_id}`);
    console.log(`   Status: ${accountData.status}`);
    console.log('\n🚀 You can now start the dev server:');
    console.log('   npm run dev');
    console.log('\n💡 Next steps:');
    console.log('   1. Visit: http://localhost:3000/dashboard');
    console.log('   2. Create a pass template at /dashboard/templates');
    console.log('   3. Test pass generation!');
    console.log('');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

main();

