#!/usr/bin/env node

/**
 * Script to automatically add Apple Developer Account to the database
 * This reads all certificates and creates the account via API
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const secretsDir = path.join(__dirname, '../../Desktop/project-secrets/apple_account_1');

// Read certificate files
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

// Extract private key from .p12 file
function extractPrivateKey(p12Path, password) {
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    const cmd = `openssl pkcs12 -in "${p12Path}" -nocerts -nodes -passin pass:${password} 2>/dev/null`;
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(new Error('Failed to extract private key. Wrong password?'));
        return;
      }
      
      // Extract the private key section
      const match = stdout.match(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/);
      if (match) {
        resolve(match[0]);
      } else {
        reject(new Error('Could not find private key in .p12 file'));
      }
    });
  });
}

async function main() {
  console.log('🍎 Apple Developer Account Setup\n');
  
  // Read all certificate files
  const apnsKey = readFile(path.join(secretsDir, 'AuthKey_F92T5PM6V7.p8'));
  const passCert = readFile(path.join(secretsDir, 'pass (2).cer'));
  const wwdrCert = readFile(path.join(secretsDir, 'AppleWWDRCAG4.cer'));
  
  if (!apnsKey || !passCert || !wwdrCert) {
    console.error('❌ Error: Could not read all certificate files');
    process.exit(1);
  }
  
  console.log('✅ Read certificate files:');
  console.log('  - APNS Key: AuthKey_F92T5PM6V7.p8');
  console.log('  - Pass Certificate: pass (2).cer');
  console.log('  - WWDR Certificate: AppleWWDRCAG4.cer\n');
  
  // Ask for .p12 password
  rl.question('Enter password for Certificates.p12 file (or press Enter if no password): ', async (password) => {
    let privateKey;
    
    try {
      privateKey = await extractPrivateKey(path.join(secretsDir, 'Certificates.p12'), password || '');
      console.log('✅ Extracted private key from .p12 file\n');
    } catch (error) {
      console.error('❌ Error:', error.message);
      console.log('\nYou can manually extract the private key and add it via the dashboard.');
      rl.close();
      process.exit(1);
    }
    
    // Prepare account data
    const accountData = {
      name: 'Account 1 - Main',
      team_id: 'DJ6CRGLPJM',
      pass_type_id: 'pass.com.mybrand.campaign1',
      apns_key_id: 'F92T5PM6V7',
      apns_auth_key: apnsKey.trim(),
      pass_signer_cert: passCert.trim(),
      pass_signer_key: privateKey.trim(),
      wwdr_cert: wwdrCert.trim(),
      status: 'ACTIVE'
    };
    
    console.log('📋 Account Data Prepared:');
    console.log(`  - Name: ${accountData.name}`);
    console.log(`  - Team ID: ${accountData.team_id}`);
    console.log(`  - Pass Type ID: ${accountData.pass_type_id}`);
    console.log(`  - APNS Key ID: ${accountData.apns_key_id}\n`);
    
    // Check if we should add via API or just output
    rl.question('Add account to database now? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        // Read .env.local to get the API URL
        const envPath = path.join(__dirname, '../.env.local');
        let apiUrl = 'http://localhost:3000';
        
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf-8');
          // Could parse NEXT_PUBLIC_VERCEL_URL or use localhost
        }
        
        console.log(`\n📤 Adding account via API at ${apiUrl}/api/accounts...`);
        
        fetch(`${apiUrl}/api/accounts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(accountData)
        })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            console.error('❌ Error:', data.error);
          } else {
            console.log('✅ Account added successfully!');
            console.log(`   Account ID: ${data.id}`);
          }
          rl.close();
        })
        .catch(error => {
          console.error('❌ Error:', error.message);
          console.log('\n💡 You can manually add the account via the dashboard at /dashboard/accounts');
          rl.close();
        });
      } else {
        console.log('\n📝 Account data prepared. Copy this JSON to add via dashboard:');
        console.log(JSON.stringify(accountData, null, 2));
        console.log('\n💡 Or visit: http://localhost:3000/dashboard/accounts');
        rl.close();
      }
    });
  });
}

main();

