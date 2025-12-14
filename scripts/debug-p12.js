#!/usr/bin/env node

/**
 * Debug script to see what's happening with the .p12 file
 */

const { spawn } = require('child_process');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

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

console.log('🔍 Debugging .p12 File');
console.log('======================\n');

// Check if file exists
if (!fs.existsSync(p12File)) {
  console.error('❌ File not found:', p12File);
  process.exit(1);
}

console.log('✅ File exists');
console.log(`   Path: ${p12File}`);
console.log(`   Size: ${fs.statSync(p12File).size} bytes\n`);

// Try to list contents
console.log('📋 Attempting to list .p12 contents...\n');

async function testExtraction(password) {
  return new Promise((resolve) => {
    const openssl = spawn('openssl', [
      'pkcs12',
      '-in', p12File,
      '-info',
      '-noout',
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
      resolve({ code, stdout, stderr });
    });
  });
}

async function main() {
  // Try empty password first
  console.log('1️⃣  Testing with empty password:');
  const result1 = await testExtraction('');
  console.log('   Exit code:', result1.code);
  if (result1.stderr) {
    console.log('   Error:', result1.stderr.trim());
  }
  if (result1.stdout) {
    console.log('   Output:', result1.stdout.trim().substring(0, 200));
  }
  console.log('');
  
  // Try with user password
  const password = await question('2️⃣  Enter password to test: ');
  console.log('\n   Testing with provided password...\n');
  
  const result2 = await testExtraction(password);
  console.log('   Exit code:', result2.code);
  if (result2.stderr) {
    console.log('   Error:', result2.stderr.trim());
  }
  if (result2.stdout) {
    console.log('   Output:', result2.stdout.trim().substring(0, 200));
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (result2.code === 0) {
    console.log('✅ Password is correct! The file is valid.');
    console.log('\n💡 The issue might be with the extraction method.');
    console.log('   Try the manual command:');
    console.log(`   openssl pkcs12 -in "${p12File}" -nocerts -nodes`);
  } else {
    console.log('❌ Password test failed.');
    console.log('\n💡 Possible issues:');
    console.log('   1. Wrong password');
    console.log('   2. File is corrupted');
    console.log('   3. File format issue');
    console.log('\n💡 Solutions:');
    console.log('   1. Re-export the certificate from Keychain Access');
    console.log('   2. Make sure you\'re using the correct .p12 file');
    console.log('   3. Try exporting without a password (empty password)');
  }
  
  rl.close();
}

main();

