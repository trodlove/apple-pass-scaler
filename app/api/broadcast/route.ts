import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sendSilentPushToMultiple } from '@/lib/apple/apns';
import { getAppleAccountById } from '@/lib/apple/credentials';

/**
 * POST /api/broadcast
 * Sends a broadcast message to all active passes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Get all passes that are active (you may want to add a status field to passes table)
    // For now, we'll update all passes
    const { data: passes, error: passesError } = await supabaseAdmin
      .from('passes')
      .select('id, apple_account_id, pass_data');

    if (passesError) {
      console.error('Error fetching passes:', passesError);
      return NextResponse.json(
        { error: 'Failed to fetch passes' },
        { status: 500 }
      );
    }

    if (!passes || passes.length === 0) {
      return NextResponse.json(
        { message: 'No passes found to broadcast to' },
        { status: 200 }
      );
    }

    // Group passes by apple_account_id to batch push notifications
    const passesByAccount = new Map<string, string[]>();
    const accountIds = new Set<string>();

    for (const pass of passes) {
      if (!pass.apple_account_id) continue;
      
      accountIds.add(pass.apple_account_id);
      
      if (!passesByAccount.has(pass.apple_account_id)) {
        passesByAccount.set(pass.apple_account_id, []);
      }
    }

    // Get all registered devices for these passes
    // Try multiple query approaches to find registrations
    let registrations: any[] = [];
    let registrationsError: any = null;

    // First, get all devices
    const { data: allDevices, error: devicesError } = await supabaseAdmin
      .from('devices')
      .select('id, push_token, device_library_identifier');

    console.log(`📱 Found ${allDevices?.length || 0} device(s) in database`);

    if (!devicesError && allDevices && allDevices.length > 0) {
      // Get registrations for these devices
      const { data: regs, error: regError } = await supabaseAdmin
        .from('registrations')
        .select('device_id, pass_id, passes(apple_account_id)')
        .in('device_id', allDevices.map(d => d.id))
        .in('pass_id', passes.map(p => p.id));

      if (!regError && regs) {
        // Combine device and registration data
        registrations = regs.map(reg => ({
          device_id: reg.device_id,
          pass_id: reg.pass_id,
          devices: allDevices.find(d => d.id === reg.device_id),
          passes: reg.passes,
        }));
        console.log(`📱 Found ${registrations.length} registration(s) with devices`);
      } else {
        registrationsError = regError;
        console.error('Error fetching registrations:', regError);
      }
    } else {
      console.warn('⚠️ No devices found in database. Make sure you have added a pass to your Wallet.');
    }

    // If still no registrations, try the original query as fallback
    if (registrations.length === 0) {
      const { data: regs, error: regError } = await supabaseAdmin
        .from('registrations')
        .select('pass_id, device_id, device:devices(push_token), pass:passes(apple_account_id)')
        .in('pass_id', passes.map(p => p.id));

      if (!regError && regs) {
        registrations = regs.map((r: any) => ({
          device_id: r.device_id,
          pass_id: r.pass_id,
          devices: r.device,
          passes: r.pass,
        }));
        console.log(`📱 Found ${registrations.length} registration(s) with fallback query`);
      } else if (regError) {
        console.error('Error with fallback registration query:', regError);
      }
    }

    // Update pass_data with the notification message
    // CRITICAL: This updates the notificationField value which triggers the notification
    // The field with changeMessage will show this message when the pass is updated
    const updatePromises = passes.map(pass => {
      const updatedPassData = {
        ...pass.pass_data,
        notificationMessage: message, // This is the field that will trigger the notification
        broadcastAt: new Date().toISOString(),
      };

      return supabaseAdmin
        .from('passes')
        .update({
          pass_data: updatedPassData,
          last_updated_at: new Date().toISOString(), // Update timestamp triggers pass update detection
        })
        .eq('id', pass.id);
    });

    await Promise.all(updatePromises);
    console.log(`✅ Updated ${passes.length} pass(es) with notification message: "${message}"`);

    // Group push tokens by apple_account_id
    const tokensByAccount = new Map<string, string[]>();

    console.log(`📦 Processing ${registrations.length} registration(s)...`);

    for (const reg of registrations) {
      const pass = passes.find(p => p.id === reg.pass_id);
      if (!pass || !pass.apple_account_id) {
        console.warn(`⚠️ Skipping registration - pass ${reg.pass_id} not found or no apple_account_id`);
        continue;
      }

      const device = reg.devices as any;
      if (!device?.push_token) {
        console.warn(`⚠️ Skipping registration - device ${reg.device_id} has no push_token`);
        continue;
      }

      if (!tokensByAccount.has(pass.apple_account_id)) {
        tokensByAccount.set(pass.apple_account_id, []);
      }
      tokensByAccount.get(pass.apple_account_id)!.push(device.push_token);
      console.log(`✅ Added push token for account ${pass.apple_account_id}`);
    }

    console.log(`📦 Grouped ${Array.from(tokensByAccount.values()).flat().length} push token(s) into ${tokensByAccount.size} account(s)`);

    // Send push notifications for each account
    let totalSuccess = 0;
    let totalFailed = 0;

    for (const accountId of accountIds) {
      const tokens = tokensByAccount.get(accountId) || [];
      if (tokens.length === 0) {
        console.log(`No push tokens found for account ${accountId}, skipping notifications`);
        continue;
      }

      // Get account credentials
      const account = await getAppleAccountById(accountId);
      if (!account) {
        console.warn(`Account ${accountId} not found, skipping push notifications`);
        totalFailed += tokens.length; // Count all tokens as failed
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

        // Send SILENT push notifications (no message parameter - silent pushes only)
        // The actual notification text comes from the pass field with changeMessage
        const { success, failed } = await sendSilentPushToMultiple(tokens, credentials);
        totalSuccess += success;
        totalFailed += failed;
      } catch (error) {
        console.error(`Error sending push notifications for account ${accountId}:`, error);
        totalFailed += tokens.length; // Count all tokens as failed
      }
    }

    return NextResponse.json({
      success: true,
      message: `Broadcast sent to ${passes.length} passes`,
      notifications: {
        sent: totalSuccess,
        failed: totalFailed,
        total: totalSuccess + totalFailed,
      },
      passesUpdated: passes.length,
    }, { status: 200 });
  } catch (error) {
    console.error('Error in broadcast:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

