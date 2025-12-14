#!/usr/bin/env node

/**
 * Final interactive setup - prompts for .p12 password and completes everything
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

const secretsDir = path.join(process.env.HOME || require('os').homedir(), 'Desktop/project-secrets/apple_account_1');
const p12File = path.join(secretsDir, 'Certificates.p12');

console.log('🚀 Final Setup - Adding Apple Developer Account\n');

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

async function extractPrivateKey(password) {
  return new Promise((resolve, reject) => {
    const openssl = spawn('openssl', [
      'pkcs12',
      '-in', p12File,
      '-nocerts',
      '-nodes',
      '-passin', `pass:${password}`
    ]);
    
    let stdout = '';
    let stderr = '';
    
    openssl.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    openssl.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    openssl.on('close', (code) => {
      if (code !== 0) {
        // Check if it's a password error
        if (stderr.includes('Mac verify error') || stderr.includes('invalid password')) {
          resolve(null); // Return null for wrong password
        } else {
          reject(new Error(`OpenSSL error: ${stderr}`));
        }
        return;
      }
      
      // Extract private key
      const match = stdout.match(/-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA )?PRIVATE KEY-----/);
      if (match) {
        resolve(match[0].trim());
      } else {
        // Try to find any private key format
        const rsaMatch = stdout.match(/-----BEGIN RSA PRIVATE KEY-----[\s\S]*?-----END RSA PRIVATE KEY-----/);
        if (rsaMatch) {
          resolve(rsaMatch[0].trim());
        } else {
          reject(new Error('Could not find private key in output'));
        }
      }
    });
    
    openssl.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  try {
    // Step 1: Get password
    console.log('🔐 Enter the password for Certificates.p12:');
    const password = await question('Password: ');
    
    if (!password) {
      console.log('\n⚠️  Trying with empty password...');
    }
    
    // Step 2: Extract private key
    console.log('\n📋 Extracting private key...');
    let privateKey;
    
    try {
      privateKey = await extractPrivateKey(password);
    } catch (error) {
      console.error('❌ Error during extraction:', error.message);
      rl.close();
      process.exit(1);
    }
    
    if (!privateKey) {
      console.error('❌ Failed to extract private key.');
      console.error('   This usually means the password is incorrect.');
      console.error('   Please verify:');
      console.error('   1. The password you entered is correct');
      console.error('   2. The .p12 file is the correct one');
      console.error('   3. Try re-exporting the certificate from Keychain Access');
      rl.close();
      process.exit(1);
    }
    
    console.log('✅ Private key extracted successfully!\n');
    
    // Step 3: Read other certificates
    console.log('📋 Reading certificate files...');
    const apnsKey = fs.readFileSync(path.join(secretsDir, 'AuthKey_F92T5PM6V7.p8'), 'utf-8').trim();
    const passCert = require('child_process').execSync(
      `openssl x509 -inform DER -in "${path.join(secretsDir, 'pass (2).cer')}" -outform PEM`,
      { encoding: 'utf-8' }
    ).trim();
    const wwdrCert = require('child_process').execSync(
      `openssl x509 -inform DER -in "${path.join(secretsDir, 'AppleWWDRCAG4.cer')}" -outform PEM`,
      { encoding: 'utf-8' }
    ).trim();
    
    console.log('✅ All certificates loaded\n');
    
    // Step 4: Prepare account data
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
    
    // Step 5: Check if account exists
    console.log('🔍 Checking if account already exists...');
    const { data: existing } = await supabase
      .from('apple_developer_accounts')
      .select('id, name')
      .eq('pass_type_id', accountData.pass_type_id)
      .single();
    
    if (existing) {
      console.log('⚠️  Account already exists:');
      console.log(`   ID: ${existing.id}`);
      console.log(`   Name: ${existing.name}`);
      
      const update = await question('\nUpdate existing account? (y/n): ');
      if (update.toLowerCase() === 'y') {
        const { error: updateError } = await supabase
          .from('apple_developer_accounts')
          .update(accountData)
          .eq('id', existing.id);
        
        if (updateError) {
          console.error('❌ Error updating account:', updateError.message);
          rl.close();
          process.exit(1);
        }
        console.log('✅ Account updated successfully!');
      } else {
        console.log('⏭️  Skipping account creation');
      }
      rl.close();
      return;
    }
    
    // Step 6: Insert account
    console.log('📤 Adding account to database...');
    const { data, error } = await supabase
      .from('apple_developer_accounts')
      .insert(accountData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error:', error.message);
      rl.close();
      process.exit(1);
    }
    
    console.log('\n✅ Account added successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Account ID: ${data.id}`);
    console.log(`   Name: ${data.name}`);
    console.log(`   Team ID: ${data.team_id}`);
    console.log(`   Pass Type ID: ${data.pass_type_id}`);
    console.log(`   Status: ${data.status}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎉 Setup complete! Your Apple Developer Account is ready to use.');
    console.log('\n💡 Next steps:');
    console.log('   1. Start dev server: npm run dev');
    console.log('   2. Visit: http://localhost:3000/dashboard');
    console.log('   3. Create a pass template at /dashboard/templates');
    console.log('   4. Test pass generation!\n');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  } finally {
    rl.close();
  }
}

main();
