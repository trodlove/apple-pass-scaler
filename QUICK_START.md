# Quick Start Guide

## ✅ What's Ready

All your credentials have been configured! Here's what's set up:

### Environment Variables
- ✅ Supabase (URL, keys)
- ✅ DigitalOcean Spaces
- ✅ Vercel Cron Secret
- ✅ Encryption Secret

### Apple Developer Account Info
- ✅ Team ID: `DJ6CRGLPJM`
- ✅ Pass Type ID: `pass.com.mybrand.campaign1`
- ✅ APNS Key ID: `F92T5PM6V7`
- ✅ APNS Auth Key: Available
- ✅ Pass Certificate: Available
- ✅ WWDR Certificate: Available

## 🚀 Setup Steps

### 1. Create Environment File

```bash
./scripts/setup-env.sh
```

Or manually create `.env.local` with the content from `SETUP.md`.

### 2. Run Database Schema

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/vvgvhlswsiqpnpwlcxud/sql)
2. Copy the entire contents of `supabase/schema.sql`
3. Paste and execute it

### 3. Extract Private Key from .p12

The only thing left is to extract the private key from your `.p12` file:

```bash
openssl pkcs12 -in ~/Desktop/project-secrets/apple_account_1/Certificates.p12 -nocerts -nodes
```

Enter the password when prompted, then copy the section between:
- `-----BEGIN PRIVATE KEY-----`
- `-----END PRIVATE KEY-----`

### 4. Add Apple Account via Dashboard

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Go to: `http://localhost:3000/dashboard/accounts`

3. Click "Add Account" and fill in:
   - **Name**: `Account 1 - Main` (or any name you prefer)
   - **Team ID**: `DJ6CRGLPJM` (pre-filled)
   - **Pass Type ID**: `pass.com.mybrand.campaign1`
   - **APNS Key ID**: `F92T5PM6V7` (pre-filled)
   - **APNS Auth Key**: Copy from `AuthKey_F92T5PM6V7.p8` file
   - **Pass Signer Cert**: Copy the PEM content (see helper script below)
   - **Pass Signer Key**: Paste the private key you extracted in step 3
   - **WWDR Cert**: Copy the PEM content (see helper script below)

### 5. Helper Script (Optional)

To get all certificate contents in PEM format, run:

```bash
./scripts/setup-apple-account.sh
```

This will:
- Convert certificates to PEM format
- Extract private key (if you provide the .p12 password)
- Save everything to `apple-account-data.txt`

## 📋 Certificate Contents

If you need the certificate contents, you can also run:

```bash
node scripts/prepare-account-data.js
```

This will display all the certificate contents that you can copy/paste.

## ✅ Verify Setup

Once the account is added:

1. Create a test pass template at `/dashboard/templates`
2. Test pass generation:
   ```
   http://localhost:3000/api/issue-pass-and-redirect?click_id=test123&redirect_url=https://example.com
   ```

## 🎯 You're All Set!

The platform is ready to:
- ✅ Issue Apple Wallet passes
- ✅ Track revenue via Redtrack postbacks
- ✅ Send push notifications
- ✅ Run automated sequences
- ✅ Manage everything via the dashboard

