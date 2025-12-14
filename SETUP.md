# Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in the root directory with the following:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://vvgvhlswsiqpnpwlcxud.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_HiwhxAUb3inMaBx_r8TZ6w_EvV2Cagz
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2Z3ZobHN3c2lxcG5wd2xjeHVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY4MDEwNCwiZXhwIjoyMDgxMjU2MTA0fQ.sL3SMqZCtgYSu3Eqq7KHwvjPqzcki2A6k60TXARddqo

# Vercel Cron Secret
VERCEL_CRON_SECRET=pC7gF9xW2rQ81vNzb4KLMt6uYH0qSdVp

# DigitalOcean Spaces Configuration
DIGITALOCEAN_SPACES_ENDPOINT=https://my-wallet-passes.sfo3.digitaloceanspaces.com
DIGITALOCEAN_SPACES_KEY=DO008MPWKAQLPXQEHCCJ
DIGITALOCEAN_SPACES_SECRET=va8Z1494r4UcCu5YBc39j2boGoa6h13J+Ta+V8Obgcs

# Application Secrets
ENCRYPTION_SECRET=pC7gF9xW2rQ81vNzb4KLMt6uYH0qSdVp
```

## Apple Developer Account Setup

To add your Apple Developer Account to the system, you'll need to provide the following information via the dashboard at `/dashboard/accounts`:

### Required Information:
1. **Team ID** - Your Apple Developer Team ID (found in Apple Developer portal)
2. **Pass Type ID** - Your Pass Type Identifier (e.g., `pass.com.yourcompany.appname`)
3. **APNS Key ID** - ✅ Already have: `F92T5PM6V7`
4. **APNS Auth Key** - ✅ Already have: Content of `AuthKey_F92T5PM6V7.p8`
5. **Pass Signer Certificate** - The content of your `pass.cer` file (exported from Keychain)
6. **Pass Signer Key** - The content of your private key (exported from `.p12` file)
7. **WWDR Certificate** - Apple Worldwide Developer Relations Certificate (download from Apple)

### How to Get Missing Certificates:

1. **Pass Signer Certificate (.cer)**:
   - Open Keychain Access on Mac
   - Find your Pass Type ID certificate
   - Export as `.cer` file
   - Copy the entire content (including BEGIN/END lines)

2. **Pass Signer Key (.p12)**:
   - In Keychain Access, right-click your certificate
   - Export as `.p12` file
   - Extract the private key content

3. **WWDR Certificate**:
   - Download from: https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer
   - Or search for "Apple Worldwide Developer Relations Certificate" on Apple's site
   - Copy the entire certificate content

4. **Team ID**:
   - Found in Apple Developer portal: https://developer.apple.com/account
   - Under "Membership" section

5. **Pass Type ID**:
   - Created in Apple Developer portal under "Certificates, Identifiers & Profiles"
   - Under "Identifiers" > "Pass Type IDs"

## Next Steps:

1. Create `.env.local` file with the environment variables above
2. Run the database schema: Execute `supabase/schema.sql` in your Supabase SQL Editor
3. Add your Apple Developer Account via the dashboard at `/dashboard/accounts`
4. Create a default pass template at `/dashboard/templates`
5. Test the system!

