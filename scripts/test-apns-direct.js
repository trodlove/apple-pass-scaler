/**
 * Direct APNs test script
 * Tests APNs notification sending with detailed error output
 */

const apn = require('apn');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

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

async function testAPNs() {
  try {
    console.log('🔍 Fetching pass and account data...\n');
    
    // Get the specific pass
    const { data: pass, error: passError } = await supabase
      .from('passes')
      .select('id, apple_account_id, serial_number')
      .eq('serial_number', 'PASS-1765841350336-40YOWWH')
      .single();

    if (passError || !pass) {
      console.error('❌ Pass not found:', passError);
      process.exit(1);
    }

    console.log('✅ Pass found:', pass.serial_number);

    // Get account
    const { data: account, error: accountError } = await supabase
      .from('apple_developer_accounts')
      .select('*')
      .eq('id', pass.apple_account_id)
      .single();

    if (accountError || !account) {
      console.error('❌ Account not found:', accountError);
      process.exit(1);
    }

    console.log('✅ Account found:', account.name);
    console.log('   Team ID:', account.team_id);
    console.log('   Pass Type ID:', account.pass_type_id);
    console.log('   APNS Key ID:', account.apns_key_id);

    // Get push token
    const { data: registrations } = await supabase
      .from('registrations')
      .select('device_id, devices(push_token)')
      .eq('pass_id', pass.id)
      .limit(1);

    if (!registrations || registrations.length === 0) {
      console.error('❌ No registrations found');
      process.exit(1);
    }

    let pushToken = registrations[0].devices?.push_token;
    if (!pushToken) {
      console.error('❌ No push token found');
      process.exit(1);
    }

    // Parse JSON if needed
    try {
      const parsed = JSON.parse(pushToken);
      if (parsed.pushToken) {
        pushToken = parsed.pushToken;
      }
    } catch (e) {
      // Not JSON, use as-is
    }

    console.log('✅ Push token found:', pushToken.substring(0, 20) + '...');
    console.log('   Token length:', pushToken.length);
    console.log('   Is valid format:', /^[0-9a-f]{64}$/i.test(pushToken));

    // Prepare key
    let authKey = account.apns_auth_key.trim();
    console.log('\n🔑 Key info:');
    console.log('   Length:', authKey.length);
    console.log('   Has BEGIN:', authKey.includes('BEGIN'));
    console.log('   Has END:', authKey.includes('END'));
    console.log('   First 50 chars:', authKey.substring(0, 50));

    // Configure APNs
    // Per the guide: key should be base64 encoded, then decoded: Buffer.from(key, "base64").toString("ascii")
    // We have PEM, so let's try the guide's approach: encode to base64, then decode back
    console.log('\n🔧 Testing guide\'s approach: base64 encode then decode...');
    
    // Step 1: Encode PEM to base64 (as if it was stored as base64)
    const base64Encoded = Buffer.from(authKey, 'utf-8').toString('base64');
    console.log('   Base64 encoded length:', base64Encoded.length);
    
    // Step 2: Decode from base64 to ascii (per guide: Buffer.from(key, "base64").toString("ascii"))
    const decodedKey = Buffer.from(base64Encoded, 'base64').toString('ascii');
    console.log('   Decoded back to PEM, matches original:', decodedKey === authKey);
    
    // Use the decoded key (should be same as original PEM)
    let options = {
      token: {
        key: decodedKey, // Use decoded key (per guide's approach)
        keyId: account.apns_key_id,
        teamId: account.team_id,
      },
      production: true, // MUST be true for Wallet
    };
    
    console.log('\n📱 Configuring APNs provider with decoded key...');

    console.log('\n📱 Configuring APNs provider...');
    console.log('   Production:', options.production);
    console.log('   Key ID:', options.token.keyId);
    console.log('   Team ID:', options.token.teamId);

    const provider = new apn.Provider(options);

    // Create notification
    const notification = new apn.Notification();
    notification.payload = {};
    notification.topic = account.pass_type_id;
    notification.priority = 5;
    notification.contentAvailable = true;

    console.log('\n📨 Notification:');
    console.log('   Topic:', notification.topic);
    console.log('   Priority:', notification.priority);
    console.log('   Content Available:', notification.contentAvailable);

    console.log('\n🚀 Sending notification...\n');
    const result = await provider.send(notification, pushToken);

    console.log('📊 Result:');
    console.log('   Sent:', result.sent.length);
    console.log('   Failed:', result.failed.length);

    if (result.sent.length > 0) {
      console.log('\n✅ SUCCESS! Notification sent:', result.sent[0]);
      process.exit(0);
    }

    if (result.failed.length > 0) {
      const failure = result.failed[0];
      const reason = failure.response?.reason;
      console.error('\n❌ FAILED:');
      console.error('   Device:', failure.device);
      console.error('   Status:', failure.status);
      console.error('   Reason:', reason);
      console.error('   Full Response:', JSON.stringify(failure.response, null, 2));
      
      if (reason === 'BadEnvironmentKeyInToken') {
        console.error('\n💡 BadEnvironmentKeyInToken means:');
        console.error('   1. The key might be expired/revoked');
        console.error('   2. The key might not have "Apple Push Notifications service (APNs)" enabled');
        console.error('   3. The key might not be "Team Scoped (All Topics)"');
        console.error('   4. The Key ID or Team ID might be wrong');
        console.error('\n   Check your Apple Developer account:');
        console.error('   - Go to Certificates, Identifiers & Profiles → Keys');
        console.error('   - Find key ID: ' + account.apns_key_id);
        console.error('   - Verify it has APNs enabled and is active');
      }
      
      process.exit(1);
    }

    console.log('\n⚠️  No result (unexpected)');
    process.exit(1);
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

testAPNs();

