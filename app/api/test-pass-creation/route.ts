import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/test-pass-creation
 * Test endpoint to verify pass creation is working
 * This will show recent passes and their details
 */
export async function GET(request: NextRequest) {
  try {
    // Get the 5 most recent passes
    const { data: recentPasses, error: passesError } = await supabaseAdmin
      .from('passes')
      .select('id, serial_number, authentication_token, pass_data, created_at, apple_account_id')
      .order('created_at', { ascending: false })
      .limit(5);

    if (passesError) {
      return NextResponse.json({
        error: 'Failed to fetch passes',
        details: passesError.message,
      }, { status: 500 });
    }

    // Get total count
    const { count: totalPasses } = await supabaseAdmin
      .from('passes')
      .select('id', { count: 'exact', head: true });

    // Get device count
    const { count: deviceCount } = await supabaseAdmin
      .from('devices')
      .select('id', { count: 'exact', head: true });

    // Get registration count
    const { count: registrationCount } = await supabaseAdmin
      .from('registrations')
      .select('id', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      summary: {
        total_passes: totalPasses || 0,
        total_devices: deviceCount || 0,
        total_registrations: registrationCount || 0,
      },
      recent_passes: recentPasses?.map(p => {
        const passData = p.pass_data as any;
        return {
          id: p.id,
          serial_number: p.serial_number,
          has_web_service: !!passData?.webServiceURL,
          web_service_url: passData?.webServiceURL || 'NOT SET',
          has_auth_token: !!p.authentication_token,
          created_at: p.created_at,
          apple_account_id: p.apple_account_id,
        };
      }) || [],
      message: 'Pass creation is working. Check recent_passes to see if new passes are being created.',
    }, { status: 200 });
  } catch (error) {
    console.error('Error in test-pass-creation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

