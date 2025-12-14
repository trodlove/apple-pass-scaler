# Credentials Setup Summary

## ✅ What You've Provided

### Supabase (Complete)
- ✅ Project URL: `https://vvgvhlswsiqpnpwlcxud.supabase.co`
- ✅ Publishable Key: `sb_publishable_HiwhxAUb3inMaBx_r8TZ6w_EvV2Cagz`
- ✅ Service Role Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- ✅ Project ID: `vvgvhlswsiqpnpwlcxud`

### DigitalOcean Spaces (Complete)
- ✅ Endpoint: `https://my-wallet-passes.sfo3.digitaloceanspaces.com`
- ✅ Access Key: `DO008MPWKAQLPXQEHCCJ`
- ✅ Secret Key: `va8Z1494r4UcCu5YBc39j2boGoa6h13J+Ta+V8Obgcs`

### Apple Developer Account (Partial)
- ✅ APNS Key ID: `F92T5PM6V7`
- ✅ APNS Auth Key: Available in `~/Desktop/project-secrets/apple_account_1/AuthKey_F92T5PM6V7.p8`

### Application Secrets (Complete)
- ✅ Encryption Secret: `pC7gF9xW2rQ81vNzb4KLMt6uYH0qSdVp`
- ✅ Vercel Cron Secret: `pC7gF9xW2rQ81vNzb4KLMt6uYH0qSdVp`

## ⚠️ What's Still Needed

To complete the Apple Developer Account setup, you need to provide:

### 1. Team ID
- **Where to find**: Apple Developer Portal → Account → Membership
- **Format**: Usually 10 characters (e.g., `ABC123DEFG`)

### 2. Pass Type ID
- **Where to find**: Apple Developer Portal → Certificates, Identifiers & Profiles → Identifiers → Pass Type IDs
- **Format**: Reverse domain notation (e.g., `pass.com.yourcompany.appname`)

### 3. Pass Signer Certificate (.cer)
- **How to get**:
  1. Open Keychain Access on your Mac
  2. Find your Pass Type ID certificate
  3. Right-click → Export as `.cer`
  4. Open the file and copy the entire content (including `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`)

### 4. Pass Signer Key (Private Key from .p12)
- **How to get**:
  1. In Keychain Access, right-click your certificate
  2. Export as `.p12` file (you'll need to set a password)
  3. Extract the private key content from the .p12 file
  4. Copy the entire key content (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)

### 5. WWDR Certificate (Apple Worldwide Developer Relations)
- **How to get**:
  1. Download from: https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer
  2. Or search "Apple Worldwide Developer Relations Certificate" on Apple's site
  3. Open the downloaded file and copy the entire certificate content

### 6. APNS Auth Key Content
- **Location**: `~/Desktop/project-secrets/apple_account_1/AuthKey_F92T5PM6V7.p8`
- **Action**: Copy the entire file content (it's already in the file)

## 🚀 Quick Setup Steps

1. **Create `.env.local` file**:
   ```bash
   ./scripts/setup-env.sh
   ```
   Or manually create it using the template in `SETUP.md`

2. **Run database schema**:
   - Go to your Supabase dashboard
   - Open SQL Editor
   - Copy and paste the contents of `supabase/schema.sql`
   - Execute the SQL

3. **Add Apple Developer Account**:
   - Start the dev server: `npm run dev`
   - Go to `http://localhost:3000/dashboard/accounts`
   - Click "Add Account"
   - Fill in all the required fields:
     - Name: Give it a friendly name (e.g., "Account 1 - Main")
     - Team ID: Your Apple Team ID
     - Pass Type ID: Your Pass Type Identifier
     - APNS Key ID: `F92T5PM6V7` (pre-filled)
     - APNS Auth Key: Copy content from `AuthKey_F92T5PM6V7.p8`
     - Pass Signer Cert: Content of your `.cer` file
     - Pass Signer Key: Private key from your `.p12` file
     - WWDR Cert: Apple WWDR certificate content

4. **Create a Pass Template**:
   - Go to `/dashboard/templates`
   - Create a default template with basic fields

5. **Test the System**:
   - Visit `/api/issue-pass-and-redirect?click_id=test123&redirect_url=https://example.com`
   - This should generate a pass and redirect you

## 📝 Notes

- The APNS Key ID (`F92T5PM6V7`) is already pre-filled in the accounts form
- All environment variables are set up in the setup script
- The database schema needs to be run once in Supabase
- You can add multiple Apple Developer Accounts for the churn-and-burn strategy

## 🔒 Security Reminders

- Never commit `.env.local` to git (it's in `.gitignore`)
- Keep your Apple certificates secure
- The service role key has full database access - keep it secret
- Rotate secrets periodically

