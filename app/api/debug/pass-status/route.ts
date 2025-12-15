import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/pass-status
 * Diagnostic endpoint to check pass status and registrations
 */
export async function GET(request: NextRequest) {
  try {
    // Get the most recently created pass
    const { data: passes, error: passesError } = await supabaseAdmin
      .from('passes')
      .select('id, serial_number, authentication_token, pass_data, apple_account_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (passesError) {
      return NextResponse.json(
        { error: 'Failed to fetch passes', details: passesError },
        { status: 500 }
      );
    }

    if (!passes || passes.length === 0) {
      return NextResponse.json(
        { error: 'No passes found' },
        { status: 404 }
      );
    }

    // Get registration info for each pass
    const passesWithStatus = await Promise.all(
      passes.map(async (pass) => {
        const { data: registrations } = await supabaseAdmin
          .from('registrations')
          .select('device_id, devices(device_library_identifier, push_token)')
          .eq('pass_id', pass.id);

        return {
          id: pass.id,
          serial_number: pass.serial_number,
          created_at: pass.created_at,
          has_web_service: !!(pass.pass_data as any)?.webServiceURL,
          web_service_url: (pass.pass_data as any)?.webServiceURL,
          has_auth_token: !!pass.authentication_token,
          apple_account_id: pass.apple_account_id,
          registrations: registrations?.map((r: any) => ({
            device_id: r.device_id,
            device_library_identifier: r.devices?.device_library_identifier,
            has_push_token: !!r.devices?.push_token,
          })) || [],
          registration_count: registrations?.length || 0,
        };
      })
    );

    return NextResponse.json({
      total_passes: passes.length,
      passes: passesWithStatus,
    }, { status: 200 });
  } catch (error) {
    console.error('Error in debug/pass-status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

