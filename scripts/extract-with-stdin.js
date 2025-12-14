#!/usr/bin/env node

/**
 * Alternative extraction method using stdin for password
 * This handles special characters better
 */

const { spawn } = require('child_process');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

const p12File = path.join(process.env.HOME || require('os').homedir(), 'Desktop/project-secrets/apple_account_1/Certificates.p12');

async function extractWithStdin(password) {
  return new Promise((resolve, reject) => {
    // Use stdin for password input (more reliable with special chars)
    const openssl = spawn('openssl', [
      'pkcs12',
      '-in', p12File,
      '-nocerts',
      '-nodes',
      '-passin', 'stdin'
    ]);
    
    let stdout = '';
    let stderr = '';
    
    // Write password to stdin
    openssl.stdin.write(password + '\n');
    openssl.stdin.end();
    
    openssl.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    openssl.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    openssl.on('close', (code) => {
      if (code !== 0) {
        if (stderr.includes('Mac verify error') || stderr.includes('invalid password')) {
          resolve(null);
        } else {
          reject(new Error(`OpenSSL error: ${stderr}`));
        }
        return;
      }
      
      const match = stdout.match(/-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA )?PRIVATE KEY-----/);
      if (match) {
        resolve(match[0].trim());
      } else {
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
  console.log('🔐 Alternative Private Key Extraction (using stdin)\n');
  console.log('This method handles special characters better.\n');
  
  const password = await question('Enter .p12 password: ');
  
  console.log('\n📋 Extracting private key...');
  
  try {
    const privateKey = await extractWithStdin(password);
    
    if (!privateKey) {
      console.error('❌ Failed to extract. Wrong password or file issue.');
      console.error('\n💡 Try:');
      console.error('   1. Verify the password is correct');
      console.error('   2. Check if the .p12 file is valid');
      console.error('   3. Try: openssl pkcs12 -in "' + p12File + '" -nocerts -nodes');
      rl.close();
      process.exit(1);
    }
    
    console.log('✅ Private key extracted successfully!\n');
    console.log('📋 First 100 characters of key:');
    console.log(privateKey.substring(0, 100) + '...\n');
    
    // Save to file
    const fs = require('fs');
    fs.writeFileSync('extracted-private-key.txt', privateKey);
    console.log('✅ Saved to: extracted-private-key.txt');
    console.log('\n💡 You can now use this in the final-setup script or add it manually via dashboard.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

main();

