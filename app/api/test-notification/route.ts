import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sendSilentPushToMultiple } from '@/lib/apple/apns';
import { getAppleAccountById } from '@/lib/apple/credentials';

export const dynamic = 'force-dynamic';

/**
 * POST /api/test-notification
 * Sends a test notification to the most recently added pass
 * This is useful for testing notifications after adding a pass to Wallet
 */
export async function POST(request: NextRequest) {
  try {
    // Get the most recently created pass
    const { data: passes, error: passesError } = await supabaseAdmin
      .from('passes')
      .select('id, apple_account_id, pass_data, serial_number')
      .order('created_at', { ascending: false })
      .limit(1);

    if (passesError) {
      console.error('Error fetching passes:', passesError);
      return NextResponse.json(
        { error: 'Failed to fetch passes' },
        { status: 500 }
      );
    }

    if (!passes || passes.length === 0) {
      return NextResponse.json(
        { error: 'No passes found. Please add a pass to Wallet first.' },
        { status: 404 }
      );
    }

    const pass = passes[0];
    const testMessage = `Test notification - ${new Date().toLocaleTimeString()}`;

    // Get all registered devices for this pass
    // Use LEFT JOIN (without !inner) to match working examples
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
          error: 'No devices registered for this pass. Make sure you added the pass to Wallet on your iPhone.',
          passId: pass.id,
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

    const { error: updateError } = await supabaseAdmin
      .from('passes')
      .update({
        pass_data: updatedPassData,
        last_updated_at: new Date().toISOString(),
      })
      .eq('id', pass.id);

    if (updateError) {
      console.error('Error updating pass:', updateError);
      return NextResponse.json(
        { error: 'Failed to update pass' },
        { status: 500 }
      );
    }

    // #region agent log
    console.log('[Test Notification] Raw registrations:', JSON.stringify(registrations, null, 2));
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/test-notification/route.ts:88',message:'Extracting push tokens',data:{registrationsCount:registrations.length,registrationsRaw:JSON.stringify(registrations),firstReg:JSON.stringify(registrations[0]),devicesType:Array.isArray(registrations[0]?.devices)?'array':'object',hasDevices:!!registrations[0]?.devices},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    // Get push tokens
    // Handle both array and object cases for devices (Supabase can return either)
    const pushTokens = registrations
      .map((reg: any) => {
        // If devices is an array, get the first one
        if (Array.isArray(reg.devices)) {
          return reg.devices[0]?.push_token;
        }
        // If devices is an object, get push_token directly
        return reg.devices?.push_token;
      })
      .filter((token: string) => token && token.trim().length > 0);
    // #region agent log
    console.log('[Test Notification] Extracted push tokens:', pushTokens);
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/test-notification/route.ts:96',message:'Push tokens extracted',data:{pushTokenCount:pushTokens.length,pushTokens:pushTokens.map(t=>t.substring(0,20)+'...')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/test-notification/route.ts:92',message:'Push tokens extracted',data:{pushTokenCount:pushTokens.length,pushTokens:pushTokens.map(t=>t.substring(0,20)+'...')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion

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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/test-notification/route.ts:127',message:'About to send notifications',data:{pushTokenCount:pushTokens.length,pushTokens:pushTokens.map(t=>t.substring(0,20)+'...'),hasCredentials:!!credentials,teamId:credentials.team_id,passTypeId:credentials.pass_type_id,hasApnsKeyId:!!credentials.apns_key_id,hasApnsAuthKey:!!credentials.apns_auth_key},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    // Send push notifications
    const { success, failed } = await sendSilentPushToMultiple(pushTokens, credentials);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/test-notification/route.ts:130',message:'Notifications sent',data:{success,failed,total:pushTokens.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    return NextResponse.json({
      success: true,
      message: 'Test notification sent',
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
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Error in test-notification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

