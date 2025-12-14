import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sendSilentPushToMultiple } from '@/lib/apple/apns';
import { getAppleAccountById } from '@/lib/apple/credentials';

export const dynamic = 'force-dynamic';

/**
 * POST /api/test-notification
 * Sends a test notification "test good" to all registered devices
 */
export async function POST(request: NextRequest) {
  try {
    const message = 'test good';

    console.log('🧪 Starting test notification...');

    // Get all registered devices - try different query approaches
    let registrations: any[] = [];
    let registrationsError: any = null;

    // First try: Get all devices directly
    const { data: allDevices, error: devicesError } = await supabaseAdmin
      .from('devices')
      .select('id, push_token, device_library_identifier')
      .limit(100);

    if (!devicesError && allDevices && allDevices.length > 0) {
      console.log(`📱 Found ${allDevices.length} device(s) directly`);
      
      // Get registrations for these devices
      const { data: regs, error: regError } = await supabaseAdmin
        .from('registrations')
        .select('device_id, pass_id, passes(apple_account_id)')
        .in('device_id', allDevices.map(d => d.id));

      if (!regError && regs) {
        // Combine device and registration data
        registrations = regs.map(reg => ({
          device_id: reg.device_id,
          devices: allDevices.find(d => d.id === reg.device_id),
          passes: reg.passes,
        }));
        console.log(`📱 Found ${registrations.length} registration(s)`);
      }
    }

    // If no registrations found, try the original query
    if (registrations.length === 0) {
      const { data: regs, error: regError } = await supabaseAdmin
        .from('registrations')
        .select('device_id, device:devices(push_token, device_library_identifier), pass:passes(apple_account_id)')
        .limit(100);
      
      if (!regError && regs) {
        registrations = regs.map((r: any) => ({
          device_id: r.device_id,
          devices: r.device,
          passes: r.pass,
        }));
        registrationsError = null;
      } else {
        registrationsError = regError;
      }
    }

    if (registrationsError) {
      console.error('❌ Error fetching registrations:', registrationsError);
      return NextResponse.json(
        { error: 'Failed to fetch device registrations', details: registrationsError.message },
        { status: 500 }
      );
    }

    if (!registrations || registrations.length === 0) {
      console.log('⚠️ No registered devices found');
      return NextResponse.json(
        { error: 'No registered devices found. Make sure you have added a pass to your Wallet.' },
        { status: 404 }
      );
    }

    console.log(`📱 Found ${registrations.length} device registration(s)`);

    // Group tokens by apple_account_id
    const tokensByAccount = new Map<string, string[]>();
    const accountIds = new Set<string>();

    for (const reg of registrations) {
      const device = reg.devices as any;
      const pass = reg.passes as any;
      
      if (!device?.push_token || !pass?.apple_account_id) {
        console.warn('⚠️ Skipping registration - missing push_token or apple_account_id');
        continue;
      }

      accountIds.add(pass.apple_account_id);
      
      if (!tokensByAccount.has(pass.apple_account_id)) {
        tokensByAccount.set(pass.apple_account_id, []);
      }
      tokensByAccount.get(pass.apple_account_id)!.push(device.push_token);
    }

    console.log(`📦 Grouped tokens into ${accountIds.size} account(s)`);

    // Send notifications for each account
    let totalSuccess = 0;
    let totalFailed = 0;
    const errors: string[] = [];

    for (const accountId of accountIds) {
      const tokens = tokensByAccount.get(accountId) || [];
      if (tokens.length === 0) continue;

      console.log(`📤 Sending to ${tokens.length} device(s) for account ${accountId}`);

      // Get account credentials for this specific account
      const account = await getAppleAccountById(accountId);
      if (!account) {
        const errorMsg = `Apple account ${accountId} not found`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
        totalFailed += tokens.length;
        continue;
      }

      try {
        const credentials = {
          team_id: account.team_id,
          pass_type_id: account.pass_type_id,
          apns_key_id: account.apns_key_id,
          apns_auth_key: account.apns_auth_key,
          pass_signer_cert: account.pass_signer_cert,
          pass_signer_key: account.pass_signer_key,
          wwdr_cert: account.wwdr_cert,
        };

        console.log(`🔑 Using account: ${account.pass_type_id}`);

        const { success, failed } = await sendSilentPushToMultiple(tokens, credentials, message);
        totalSuccess += success;
        totalFailed += failed;

        if (failed > 0) {
          errors.push(`${failed} notification(s) failed for account ${accountId}`);
        }
      } catch (error) {
        const errorMsg = `Error sending notifications for account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
        totalFailed += tokens.length;
      }
    }

    const result = {
      success: totalSuccess > 0,
      message: totalSuccess > 0 
        ? `Test notification "${message}" sent successfully to ${totalSuccess} device(s)`
        : `Failed to send test notification`,
      notifications: {
        sent: totalSuccess,
        failed: totalFailed,
        total: totalSuccess + totalFailed,
      },
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('✅ Test notification complete:', result);

    return NextResponse.json(result, { 
      status: totalSuccess > 0 ? 200 : 500 
    });
  } catch (error) {
    console.error('❌ Unexpected error in test notification:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

