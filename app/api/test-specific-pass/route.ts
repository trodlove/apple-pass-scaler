import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sendSilentPushToMultiple } from '@/lib/apple/apns';
import { getAppleAccountById } from '@/lib/apple/credentials';

export const dynamic = 'force-dynamic';

/**
 * POST /api/test-specific-pass
 * Sends a test notification to a specific pass by serial number
 */
export async function POST(request: NextRequest) {
  try {
    const { serialNumber } = await request.json();

    if (!serialNumber) {
      return NextResponse.json(
        { error: 'serialNumber is required' },
        { status: 400 }
      );
    }

    // Get the specific pass
    const { data: pass, error: passError } = await supabaseAdmin
      .from('passes')
      .select('id, apple_account_id, pass_data, serial_number')
      .eq('serial_number', serialNumber)
      .single();

    if (passError || !pass) {
      return NextResponse.json(
        { error: 'Pass not found', serialNumber },
        { status: 404 }
      );
    }

    // CRITICAL: Use a unique message that's different from the current value
    // iOS only shows notification if the field value actually changes
    const currentMessage = pass.pass_data?.notificationMessage || pass.pass_data?.broadcastMessage || 'Welcome! Check back for updates.';
    const testMessage = `🚀 Test notification - ${new Date().toLocaleTimeString()} - ${Math.random().toString(36).substring(7)}`;
    
    console.log('[Test Specific Pass] Notification update:', {
      serialNumber: pass.serial_number,
      passId: pass.id,
      currentMessage: currentMessage.substring(0, 50),
      newMessage: testMessage.substring(0, 50),
      willChange: currentMessage !== testMessage,
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/test-specific-pass/route.ts:40',message:'Updating notification message',data:{serialNumber:pass.serial_number,currentMessage:currentMessage.substring(0,50),newMessage:testMessage.substring(0,50),willChange:currentMessage!==testMessage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // Get all registered devices for this pass
    const { data: registrations, error: registrationsError } = await supabaseAdmin
      .from('registrations')
      .select('device_id, devices(push_token)')
      .eq('pass_id', pass.id);

    if (registrationsError) {
      console.error('Error fetching registrations:', registrationsError);
      return NextResponse.json(
        { error: 'Failed to fetch device registrations' },
        { status: 500 }
      );
    }

    if (!registrations || registrations.length === 0) {
      return NextResponse.json(
        { 
          error: 'No devices registered for this pass',
          serialNumber: pass.serial_number,
        },
        { status: 404 }
      );
    }

    // Update pass_data with test notification message
    const updatedPassData = {
      ...pass.pass_data,
      notificationMessage: testMessage,
      notificationSentAt: new Date().toISOString(),
    };

    const updateTimestamp = new Date().toISOString();
    const { error: updateError, data: updatedPass } = await supabaseAdmin
      .from('passes')
      .update({
        pass_data: updatedPassData,
        last_updated_at: updateTimestamp,
      })
      .eq('id', pass.id)
      .select('last_updated_at')
      .single();
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/test-specific-pass/route.ts:75',message:'Pass updated in database',data:{serialNumber:pass.serial_number,updateTimestamp,hasError:!!updateError,updatedLastUpdatedAt:updatedPass?.last_updated_at},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    if (updateError) {
      console.error('Error updating pass:', updateError);
      return NextResponse.json(
        { error: 'Failed to update pass' },
        { status: 500 }
      );
    }

    // Get push tokens - parse JSON if needed
    const pushTokens = registrations
      .map((reg: any) => {
        let token: string | undefined;
        if (Array.isArray(reg.devices)) {
          token = reg.devices[0]?.push_token;
        } else {
          token = reg.devices?.push_token;
        }
        
        if (!token) return null;
        
        // Parse JSON string if token is stored as JSON
        try {
          const parsed = JSON.parse(token);
          if (parsed.pushToken) {
            return parsed.pushToken;
          }
        } catch (e) {
          // Not JSON, use as-is
        }
        
        return token;
      })
      .filter((token: string | null): token is string => !!token && token.trim().length > 0);

    if (pushTokens.length === 0) {
      return NextResponse.json(
        { error: 'No push tokens found for registered devices' },
        { status: 404 }
      );
    }

    // Get Apple account credentials
    if (!pass.apple_account_id) {
      return NextResponse.json(
        { error: 'Pass has no associated Apple account' },
        { status: 500 }
      );
    }

    const account = await getAppleAccountById(pass.apple_account_id);
    if (!account) {
      return NextResponse.json(
        { error: 'Apple account not found' },
        { status: 500 }
      );
    }

    const credentials = {
      team_id: account.team_id,
      pass_type_id: account.pass_type_id,
      apns_key_id: account.apns_key_id,
      apns_auth_key: account.apns_auth_key,
      pass_signer_cert: account.pass_signer_cert,
      pass_signer_key: account.pass_signer_key,
      wwdr_cert: account.wwdr_cert,
    };

    // Log before sending
    await fetch(`${request.nextUrl.origin}/api/debug/log-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: '[Test Specific Pass] About to send push notifications',
        data: { serialNumber: pass.serial_number, pushTokenCount: pushTokens.length, testMessage },
        level: 'info',
      }),
    }).catch(() => {});

    // Send push notifications
    const result = await sendSilentPushToMultiple(pushTokens, credentials);
    const success = result.success;
    const failed = result.failed;
    const errorDetails = result.errors || [];
    
    // Log after sending
    await fetch(`${request.nextUrl.origin}/api/debug/log-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: '[Test Specific Pass] Push notifications sent',
        data: { serialNumber: pass.serial_number, success, failed, errors: errorDetails, testMessage },
        level: success > 0 ? 'info' : 'error',
      }),
    }).catch(() => {});

    // Get detailed error info from console logs if available
    // The actual error will be in Vercel logs, but we can return what we know
    return NextResponse.json({
      success: success > 0,
      message: success > 0 ? 'Test notification sent successfully' : 'Failed to send notification',
      details: {
        passId: pass.id,
        serialNumber: pass.serial_number,
        testMessage,
        notifications: {
          sent: success,
          failed,
          total: pushTokens.length,
        },
        devices: pushTokens.length,
        pushTokenPreview: pushTokens[0]?.substring(0, 20) + '...',
        credentials: {
          hasKey: !!credentials.apns_auth_key,
          keyId: credentials.apns_key_id,
          teamId: credentials.team_id,
          passTypeId: credentials.pass_type_id,
        },
        errorDetails: errorDetails || [],
        apnsError: errorDetails?.[0] || 'No error details',
        note: 'Check Vercel logs for detailed APNs error (BadEnvironmentKeyInToken, etc.)',
      },
    }, { status: success > 0 ? 200 : 500 });
  } catch (error) {
    console.error('Error in test-specific-pass:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

