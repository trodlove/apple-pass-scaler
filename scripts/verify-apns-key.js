/**
 * Verify APNs key format and test different configurations
 */

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

async function verifyKey() {
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

    const key = account.apns_auth_key;
    console.log('Key Analysis:');
    console.log('Length:', key.length);
    console.log('Has BEGIN:', key.includes('BEGIN'));
    console.log('Has END:', key.includes('END'));
    console.log('Has newlines:', key.includes('\n'));
    console.log('Has carriage returns:', key.includes('\r'));
    console.log('First 100 chars:', key.substring(0, 100));
    console.log('Last 100 chars:', key.substring(key.length - 100));
    
    // Check if it's valid PEM
    const lines = key.split('\n');
    console.log('\nLine count:', lines.length);
    console.log('First line:', lines[0]);
    console.log('Last line:', lines[lines.length - 1]);
    
    // Try to base64 encode it (as the guide suggests)
    const base64Key = Buffer.from(key, 'utf-8').toString('base64');
    console.log('\nBase64 encoded length:', base64Key.length);
    console.log('Base64 first 50 chars:', base64Key.substring(0, 50));
    
    // Decode it back
    const decoded = Buffer.from(base64Key, 'base64').toString('utf-8');
    console.log('Decoded matches original:', decoded === key);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyKey();

