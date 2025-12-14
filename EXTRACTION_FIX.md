# Fix for OpenSSL RC2-40-CBC Error

## The Problem

Your `.p12` file uses old encryption (RC2-40-CBC) which OpenSSL 3.0+ doesn't support by default. You're getting this error:

```
error:0308010C:digital envelope routines:inner_evp_generic_fetch:unsupported
Algorithm (RC2-40-CBC : 0)
```

## Solution 1: Use Legacy Flag (Easiest)

Run this command with the `-legacy` flag:

```bash
openssl pkcs12 -in ~/Desktop/project-secrets/apple_account_1/Certificates.p12 -nocerts -nodes -legacy
```

Enter your password when prompted. This should work!

Or use the script:
```bash
./scripts/extract-key-simple.sh
```

## Solution 2: Import to Keychain Access (Most Reliable)

If Solution 1 doesn't work:

1. **Open Keychain Access** (Applications → Utilities)

2. **Import the .p12 file:**
   - File → Import Items
   - Navigate to: `~/Desktop/project-secrets/apple_account_1/Certificates.p12`
   - Click "Open"
   - Enter your password when prompted

3. **Find the certificate:**
   - Search for "pass.com.mybrand.campaign1" or "Pass Type ID"
   - You should see your certificate

4. **Export the private key:**
   - Right-click the certificate
   - Select "Export..."
   - Choose format: **"Privacy Enhanced Mail (.pem)"**
   - Save it (you can name it `certificate.pem`)
   - You may be prompted to set a password - you can leave it empty or set one

5. **Extract the private key from the .pem file:**
   ```bash
   openssl rsa -in certificate.pem -out private-key.pem
   ```
   
   Or if it asks for a password:
   ```bash
   openssl rsa -in certificate.pem -out private-key.pem -passin pass:your-password
   ```

6. **Copy the private key:**
   ```bash
   cat private-key.pem
   ```
   
   Copy everything from `-----BEGIN PRIVATE KEY-----` to `-----END PRIVATE KEY-----`

## Solution 3: Re-export with Modern Encryption

If you have access to the original certificate in Keychain:

1. Find your Pass Type ID certificate in Keychain Access
2. Right-click → Export
3. Choose format: **"Personal Information Exchange (.p12)"**
4. **Important:** When exporting, choose a password and make sure it uses modern encryption
5. Use this new .p12 file instead

## Quick Test

Try the legacy flag first:
```bash
openssl pkcs12 -in ~/Desktop/project-secrets/apple_account_1/Certificates.p12 -nocerts -nodes -legacy
```

If that works, you're done! Just copy the private key section.

