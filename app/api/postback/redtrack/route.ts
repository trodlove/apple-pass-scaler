import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/postback/redtrack
 * Receives revenue postbacks from Redtrack and updates pass records
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clickId = searchParams.get('click_id');
    const revenueParam = searchParams.get('revenue');

    if (!clickId) {
      return NextResponse.json(
        { error: 'Missing click_id parameter' },
        { status: 400 }
      );
    }

    if (!revenueParam) {
      return NextResponse.json(
        { error: 'Missing revenue parameter' },
        { status: 400 }
      );
    }

    const revenue = parseFloat(revenueParam);
    if (isNaN(revenue) || revenue < 0) {
      return NextResponse.json(
        { error: 'Invalid revenue value' },
        { status: 400 }
      );
    }

    // Find the pass by querying the pass_data JSONB field for click_id
    const { data: passes, error: queryError } = await supabaseAdmin
      .from('passes')
      .select('id, revenue')
      .eq('pass_data->>click_id', clickId);

    if (queryError) {
      console.error('Error querying passes:', queryError);
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500 }
      );
    }

    if (!passes || passes.length === 0) {
      console.warn(`No pass found with click_id: ${clickId}`);
      return NextResponse.json(
        { error: 'Pass not found' },
        { status: 404 }
      );
    }

    // Update revenue atomically for all matching passes (should typically be just one)
    for (const pass of passes) {
      const { error: updateError } = await supabaseAdmin
        .from('passes')
        .update({ 
          revenue: (pass.revenue || 0) + revenue,
          last_updated_at: new Date().toISOString(),
        })
        .eq('id', pass.id);

      if (updateError) {
        console.error(`Error updating revenue for pass ${pass.id}:`, updateError);
        // Continue with other passes even if one fails
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Revenue updated for ${passes.length} pass(es)`,
    }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in postback handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

