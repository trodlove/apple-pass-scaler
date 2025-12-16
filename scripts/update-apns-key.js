const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

async function updateAccount() {
  try {
    console.log('🔄 Updating Apple Developer Account with new APNs key...\n');
    
    // Read the new key file
    const secretsDir = path.join(process.env.HOME, 'Desktop/project-secrets/apple_account_1');
    const newKeyPath = path.join(secretsDir, 'AuthKey_9VJ9ZK3AF9.p8');
    const newKey = fs.readFileSync(newKeyPath, 'utf-8').trim();
    
    console.log('✅ New key file read successfully');
    console.log(`   Key ID: 9VJ9ZK3AF9`);
    console.log(`   Key length: ${newKey.length} characters\n`);
    
    // Find the existing account
    console.log('🔍 Finding existing account...');
    const { data: accounts, error: fetchError } = await supabase
      .from('apple_developer_accounts')
      .select('id, name, team_id, pass_type_id, apns_key_id')
      .eq('status', 'ACTIVE')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Error fetching accounts:', fetchError.message);
      process.exit(1);
    }
    
    if (!accounts || accounts.length === 0) {
      console.error('❌ No active account found');
      process.exit(1);
    }
    
    const account = accounts[0];
    console.log('✅ Found account:');
    console.log(`   ID: ${account.id}`);
    console.log(`   Name: ${account.name}`);
    console.log(`   Team ID: ${account.team_id}`);
    console.log(`   Pass Type ID: ${account.pass_type_id}`);
    console.log(`   Old Key ID: ${account.apns_key_id}\n`);
    
    // Update the account with new key
    console.log('📤 Updating account with new APNs key...');
    const { data: updatedAccount, error: updateError } = await supabase
      .from('apple_developer_accounts')
      .update({
        apns_key_id: '9VJ9ZK3AF9',
        apns_auth_key: newKey,
        updated_at: new Date().toISOString(),
      })
      .eq('id', account.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating account:', updateError.message);
      process.exit(1);
    }
    
    console.log('✅ Account updated successfully!');
    console.log('\n📋 Updated Account Details:');
    console.log(`   Name: ${updatedAccount.name}`);
    console.log(`   Team ID: ${updatedAccount.team_id}`);
    console.log(`   Pass Type ID: ${updatedAccount.pass_type_id}`);
    console.log(`   New Key ID: ${updatedAccount.apns_key_id}`);
    console.log(`   Status: ${updatedAccount.status}`);
    console.log('\n🎉 APNs key update complete!');
    console.log('\n💡 Next step: Test the notification at:');
    console.log('   https://apple-pass-scaler.vercel.app/test-pass');
    console.log('');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

updateAccount();

