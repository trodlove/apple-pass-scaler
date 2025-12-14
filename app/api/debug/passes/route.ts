import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/passes
 * Debug endpoint to check passes and their webServiceURL configuration
 */
export async function GET() {
  try {
    // Get all passes with full details
    const { data: passes, error: passesError } = await supabaseAdmin
      .from('passes')
      .select('id, serial_number, authentication_token, apple_account_id, pass_data, created_at, last_updated_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (passesError) {
      return NextResponse.json({
        error: 'Failed to fetch passes',
        details: passesError.message,
      }, { status: 500 });
    }

    // Get all devices
    const { data: devices, error: devicesError } = await supabaseAdmin
      .from('devices')
      .select('id, device_library_identifier, push_token, created_at');

    // Get all registrations with join
    const { data: registrations, error: regError } = await supabaseAdmin
      .from('registrations')
      .select('device_id, pass_id, devices(device_library_identifier), passes(serial_number)');

    // Analyze passes
    const analyzedPasses = passes?.map(p => {
      const passData = p.pass_data as any;
      return {
        id: p.id,
        serial_number: p.serial_number,
        authentication_token: p.authentication_token ? `${p.authentication_token.substring(0, 10)}...` : 'MISSING',
        apple_account_id: p.apple_account_id,
        has_web_service: !!passData?.webServiceURL,
        web_service_url: passData?.webServiceURL || 'NOT SET',
        has_auth_token: !!p.authentication_token,
        notification_message: passData?.notificationMessage || 'NOT SET',
        created_at: p.created_at,
        last_updated_at: p.last_updated_at,
        // Check if this pass has any registrations
        registrations: registrations?.filter((r: any) => r.pass_id === p.id).length || 0,
      };
    }) || [];

    // Count passes with/without webServiceURL
    const withWebService = analyzedPasses.filter(p => p.has_web_service).length;
    const withoutWebService = analyzedPasses.length - withWebService;

    return NextResponse.json({
      summary: {
        total_passes: passes?.length || 0,
        passes_with_web_service: withWebService,
        passes_without_web_service: withoutWebService,
        total_devices: devices?.length || 0,
        total_registrations: registrations?.length || 0,
      },
      passes: analyzedPasses,
      devices: devices?.map(d => ({
        id: d.id,
        device_library_identifier: d.device_library_identifier,
        push_token: d.push_token ? `${d.push_token.substring(0, 20)}...` : 'MISSING',
        created_at: d.created_at,
      })) || [],
      registrations: registrations?.map((r: any) => ({
        device_id: r.device_id,
        pass_id: r.pass_id,
        device_identifier: r.devices?.device_library_identifier || 'Unknown',
        pass_serial: r.passes?.serial_number || 'Unknown',
      })) || [],
      errors: {
        devices: devicesError?.message,
        registrations: regError?.message,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Error in debug passes:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

