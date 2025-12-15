/**
 * Test APNs key by generating a JWT token
 * This will verify if the key is valid
 */

const jwt = require('jsonwebtoken');
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

async function testJWT() {
  try {
    const { data: account } = await supabase
      .from('apple_developer_accounts')
      .select('*')
      .eq('apns_key_id', 'F92T5PM6V7')
      .single();

    if (!account) {
      console.error('❌ Account not found');
      process.exit(1);
    }

    const key = account.apns_auth_key.trim();
    console.log('Testing JWT generation with key...\n');

    // Generate JWT token (this is what APNs uses internally)
    const token = jwt.sign(
      {
        iss: account.team_id,
        iat: Math.floor(Date.now() / 1000),
      },
      key,
      {
        algorithm: 'ES256',
        keyid: account.apns_key_id,
      }
    );

    console.log('✅ JWT token generated successfully!');
    console.log('   Token length:', token.length);
    console.log('   Token preview:', token.substring(0, 50) + '...');
    console.log('\n✅ Key is valid for JWT generation');
    console.log('   This means the key format is correct');
    console.log('   If APNs still fails, the issue is likely:');
    console.log('   1. Key not enabled for APNs in Apple Developer');
    console.log('   2. Key expired/revoked');
    console.log('   3. Key not "Team Scoped (All Topics)"');
    
  } catch (error) {
    console.error('\n❌ JWT generation failed:');
    console.error('   Error:', error.message);
    if (error.message.includes('PEM')) {
      console.error('   This suggests the key format is wrong');
    } else if (error.message.includes('algorithm')) {
      console.error('   This suggests the key type is wrong (needs ES256)');
    }
    process.exit(1);
  }
}

testJWT();

