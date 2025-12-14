import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/passes
 * Fetch all passes for the dashboard
 */
export async function GET() {
  try {
    const { data: passes, error } = await supabaseAdmin
      .from('passes')
      .select('*')
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

