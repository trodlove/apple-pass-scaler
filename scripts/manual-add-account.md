# Manual Account Addition Guide

If automated extraction isn't working, here's how to add the account manually:

## Step 1: Extract Private Key Manually

Open Terminal and run:

```bash
openssl pkcs12 -in ~/Desktop/project-secrets/apple_account_1/Certificates.p12 -nocerts -nodes
```

Enter your password when prompted. You'll see output like:

```
Enter Import Password:
MAC verified OK
Bag Attributes
    friendlyName: ...
    localKeyID: ...
Key Attributes: <No Attributes>
-----BEGIN PRIVATE KEY-----
[... key content ...]
-----END PRIVATE KEY-----
```

**Copy everything from `-----BEGIN PRIVATE KEY-----` to `-----END PRIVATE KEY-----`** (including those lines).

## Step 2: Get Other Certificate Contents

Run these commands to get the certificate contents:

```bash
# APNS Key (already have this)
cat ~/Desktop/project-secrets/apple_account_1/AuthKey_F92T5PM6V7.p8

# Pass Certificate (convert to PEM)
openssl x509 -inform DER -in ~/Desktop/project-secrets/apple_account_1/"pass (2).cer" -outform PEM

# WWDR Certificate (convert to PEM)
openssl x509 -inform DER -in ~/Desktop/project-secrets/apple_account_1/AppleWWDRCAG4.cer -outform PEM
```

## Step 3: Add via Dashboard

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Go to: http://localhost:3000/dashboard/accounts

3. Click "Add Account"

4. Fill in the form:
   - **Name**: `Account 1 - Main`
   - **Team ID**: `DJ6CRGLPJM`
   - **Pass Type ID**: `pass.com.mybrand.campaign1`
   - **APNS Key ID**: `F92T5PM6V7`
   - **APNS Auth Key**: Paste the content from `AuthKey_F92T5PM6V7.p8`
   - **Pass Signer Cert**: Paste the PEM output from step 2
   - **Pass Signer Key**: Paste the private key you copied in step 1
   - **WWDR Cert**: Paste the WWDR PEM output from step 2

5. Click "Create Account"

## Alternative: Use SQL Directly

If the dashboard doesn't work, you can insert directly via Supabase SQL Editor:

1. Go to: https://supabase.com/dashboard/project/vvgvhlswsiqpnpwlcxud/sql

2. Run this SQL (replace the certificate values):

```sql
INSERT INTO apple_developer_accounts (
  name,
  team_id,
  pass_type_id,
  apns_key_id,
  apns_auth_key,
  pass_signer_cert,
  pass_signer_key,
  wwdr_cert,
  status
) VALUES (
  'Account 1 - Main',
  'DJ6CRGLPJM',
  'pass.com.mybrand.campaign1',
  'F92T5PM6V7',
  '-----BEGIN PRIVATE KEY-----
[PASTE APNS KEY HERE]
-----END PRIVATE KEY-----',
  '-----BEGIN CERTIFICATE-----
[PASTE PASS CERT HERE]
-----END CERTIFICATE-----',
  '-----BEGIN PRIVATE KEY-----
[PASTE PRIVATE KEY HERE]
-----END PRIVATE KEY-----',
  '-----BEGIN CERTIFICATE-----
[PASTE WWDR CERT HERE]
-----END CERTIFICATE-----',
  'ACTIVE'
);
```

Replace the `[PASTE ... HERE]` sections with the actual certificate contents.

