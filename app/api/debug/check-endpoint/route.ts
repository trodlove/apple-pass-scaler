import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/check-endpoint
 * Check if the Apple Web Service endpoint is accessible and working
 */
export async function GET(request: NextRequest) {
  try {
    // Get the most recent pass
    const { data: passes, error: passesError } = await supabaseAdmin
      .from('passes')
      .select('id, serial_number, authentication_token, pass_data, apple_account_id')
      .order('created_at', { ascending: false })
      .limit(1);

    if (passesError || !passes || passes.length === 0) {
      return NextResponse.json(
        { error: 'No passes found' },
        { status: 404 }
      );
    }

    const pass = passes[0];
    const baseUrl = request.nextUrl.origin;
    const webServiceUrl = (pass.pass_data as any)?.webServiceURL || `${baseUrl}/api/apple`;
    
    // Test if we can construct the registration endpoint URL
    // Note: We can't actually test it without a real device, but we can verify the structure
    
    return NextResponse.json({
      endpoint_status: 'Endpoint is configured',
      pass_info: {
        serial_number: pass.serial_number,
        has_auth_token: !!pass.authentication_token,
        auth_token_preview: pass.authentication_token ? `${pass.authentication_token.substring(0, 10)}...` : 'None',
        web_service_url: webServiceUrl,
        has_apple_account: !!pass.apple_account_id,
      },
      registration_endpoint: {
        url_format: `${webServiceUrl}/devices/{deviceID}/registrations/{passTypeID}/${pass.serial_number}`,
        method: 'POST',
        auth_header_format: `ApplePass ${pass.authentication_token}`,
        note: 'Wallet will call this automatically when the pass is added',
      },
      troubleshooting: {
        if_no_registration: [
          '1. Make sure you actually TAPPED "Add" in the Wallet sheet (not just dismissed it)',
          '2. Open the pass in Wallet app - this triggers registration',
          '3. Wait 30-60 seconds after adding - registration is asynchronous',
          '4. Check Vercel function logs for "[Device Registration]" or "[Apple Web Service]" messages',
          '5. Verify the webServiceURL is accessible: ' + webServiceUrl,
          '6. Try removing the pass (Wallet → Pass → Info → Remove) and re-adding',
        ],
        how_to_remove_pass: [
          'Method 1: Open Wallet → Tap the pass → Tap "i" (info) button → Scroll down → "Remove Pass"',
          'Method 2: Open Wallet → Tap the pass → Swipe down → "Remove"',
          'Method 3: If pass doesn\'t appear, it may not be fully added - try adding a fresh one',
        ],
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Error in check-endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

