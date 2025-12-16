import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/passes
 * Fetch only passes that have registered devices (passes actually installed on devices)
 */
export async function GET() {
  try {
    // First, get all pass IDs that have registrations
    const { data: registrations, error: regError } = await supabaseAdmin
      .from('registrations')
      .select('pass_id')
      .not('pass_id', 'is', null);

    if (regError) {
      console.error('Error fetching registrations:', regError);
      return NextResponse.json(
        { error: 'Failed to fetch registrations' },
        { status: 500 }
      );
    }

    // Extract unique pass IDs
    const passIdsWithDevices = [...new Set((registrations || []).map(r => r.pass_id))];

    if (passIdsWithDevices.length === 0) {
      // No passes have devices registered
      return NextResponse.json([], { status: 200 });
    }

    // Fetch only passes that have registered devices
    const { data: passes, error } = await supabaseAdmin
      .from('passes')
      .select('*')
      .in('id', passIdsWithDevices)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching passes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch passes' },
        { status: 500 }
      );
    }

    return NextResponse.json(passes || [], { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/passes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

