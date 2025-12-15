import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/test-registration
 * Test endpoint to verify registration endpoint is accessible
 */
export async function GET(request: NextRequest) {
  try {
    // Get the most recent pass
    const { data: passes, error: passesError } = await supabaseAdmin
      .from('passes')
      .select('id, serial_number, authentication_token, pass_data')
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
    
    // Construct the registration URL that Wallet would call
    // Format: /api/apple/v1/devices/{deviceID}/registrations/{passTypeID}/{serialNumber}
    // We can't know the deviceID, but we can show what the URL structure should be
    
    return NextResponse.json({
      message: 'Registration endpoint test',
      pass: {
        id: pass.id,
        serial_number: pass.serial_number,
        has_auth_token: !!pass.authentication_token,
        web_service_url: (pass.pass_data as any)?.webServiceURL,
      },
      registration_endpoint_info: {
        base_url: `${baseUrl}/api/apple/v1`,
        format: 'POST /api/apple/v1/devices/{deviceID}/registrations/{passTypeID}/{serialNumber}',
        auth_header: `ApplePass ${pass.authentication_token}`,
        note: 'Wallet will automatically call this endpoint when the pass is added. Make sure the pass is actually in Wallet and try opening it.',
      },
      troubleshooting: [
        '1. Make sure the pass is actually added to Wallet (not just downloaded)',
        '2. Open the pass in Wallet - this sometimes triggers registration',
        '3. Wait a few seconds after adding - registration happens asynchronously',
        '4. Check Vercel logs for registration attempts',
        '5. Try removing and re-adding the pass to Wallet',
      ],
    }, { status: 200 });
  } catch (error) {
    console.error('Error in test-registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

