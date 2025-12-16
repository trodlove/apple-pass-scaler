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
    const { data: registrations, error: registrationsError } = await supabaseAdmin
      .from('registrations')
      .select('pass_id, device_id, devices!inner(push_token)')
      .in('pass_id', passes.map(p => p.id));

    if (registrationsError) {
      console.error('Error fetching registrations:', registrationsError);
      return NextResponse.json(
        { error: 'Failed to fetch device registrations' },
        { status: 500 }
      );
    }

    // Update pass_data with the broadcast message
    // CRITICAL: Set both notificationMessage and broadcastMessage to ensure the notification field updates
    // Also ensure the message is unique so iOS detects the change
    const updateTimestamp = new Date().toISOString();
    const updatePromises = passes.map(pass => {
      // Use a unique message that includes timestamp to ensure iOS detects the change
      const uniqueMessage = `${message} - ${new Date().toLocaleTimeString()}`;
      
      const updatedPassData = {
        ...pass.pass_data,
        notificationMessage: uniqueMessage, // CRITICAL: This is what triggers the notification
        broadcastMessage: message, // Keep for backward compatibility
        broadcastAt: updateTimestamp,
      };

      return supabaseAdmin
        .from('passes')
        .update({
          pass_data: updatedPassData,
          last_updated_at: updateTimestamp,
          last_modified: updateTimestamp, // CRITICAL: iOS uses this to detect updates
        })
        .eq('id', pass.id);
    });

    await Promise.all(updatePromises);

    // Group push tokens by apple_account_id
    const tokensByAccount = new Map<string, string[]>();

    if (registrations) {
      for (const reg of registrations) {
        const pass = passes.find(p => p.id === reg.pass_id);
        if (!pass || !pass.apple_account_id) continue;

        const device = reg.devices as any;
        if (!device?.push_token) continue;
        
        // Parse JSON string if token is stored as JSON
        let token = device.push_token;
        try {
          const parsed = JSON.parse(token);
          if (parsed.pushToken) {
            token = parsed.pushToken;
          }
        } catch (e) {
          // Not JSON, use as-is
        }
        
        if (!tokensByAccount.has(pass.apple_account_id)) {
          tokensByAccount.set(pass.apple_account_id, []);
        }
        tokensByAccount.get(pass.apple_account_id)!.push(token);
      }
    }

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

