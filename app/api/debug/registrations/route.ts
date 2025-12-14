import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/registrations
 * Debug endpoint to check device registrations
 */
export async function GET() {
  try {
    // Get all devices
    const { data: devices, error: devicesError } = await supabaseAdmin
      .from('devices')
      .select('id, device_library_identifier, push_token, created_at');

    // Get all registrations
    const { data: registrations, error: regError } = await supabaseAdmin
      .from('registrations')
      .select('device_id, pass_id, created_at');

    // Get all passes
    const { data: passes, error: passesError } = await supabaseAdmin
      .from('passes')
      .select('id, serial_number, apple_account_id, pass_data, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      devices: {
        count: devices?.length || 0,
        data: devices || [],
        error: devicesError?.message,
      },
      registrations: {
        count: registrations?.length || 0,
        data: registrations || [],
        error: regError?.message,
      },
      recentPasses: {
        count: passes?.length || 0,
        data: passes?.map(p => ({
          id: p.id,
          serial_number: p.serial_number,
          apple_account_id: p.apple_account_id,
          has_web_service: !!(p.pass_data as any)?.webServiceURL,
          notification_message: (p.pass_data as any)?.notificationMessage || 'Not set',
        })) || [],
        error: passesError?.message,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Error in debug registrations:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

