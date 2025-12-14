import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/fix-passes
 * Updates all existing passes to ensure they have webServiceURL and notificationMessage
 * This is needed for passes that were created before these fields were added
 */
export async function POST(request: NextRequest) {
  try {
    // Get all passes
    const { data: passes, error: passesError } = await supabaseAdmin
      .from('passes')
      .select('id, pass_data');

    if (passesError) {
      return NextResponse.json(
        { error: 'Failed to fetch passes', details: passesError.message },
        { status: 500 }
      );
    }

    if (!passes || passes.length === 0) {
      return NextResponse.json(
        { message: 'No passes found', updated: 0 },
        { status: 200 }
      );
    }

    const origin = request.nextUrl.origin;
    let updatedCount = 0;

    // Update each pass
    for (const pass of passes) {
      const passData = pass.pass_data || {};
      let needsUpdate = false;
      const updatedPassData = { ...passData };

      // Ensure webServiceURL is set
      if (!updatedPassData.webServiceURL) {
        updatedPassData.webServiceURL = `${origin}/api/apple/v1`;
        needsUpdate = true;
      }

      // Ensure notificationMessage is set
      if (!updatedPassData.notificationMessage) {
        updatedPassData.notificationMessage = 'Welcome! Check back for updates.';
        needsUpdate = true;
      }

      if (needsUpdate) {
        const { error: updateError } = await supabaseAdmin
          .from('passes')
          .update({
            pass_data: updatedPassData,
            last_updated_at: new Date().toISOString(),
          })
          .eq('id', pass.id);

        if (!updateError) {
          updatedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} of ${passes.length} passes`,
      total: passes.length,
      updated: updatedCount,
    }, { status: 200 });
  } catch (error) {
    console.error('Error in fix-passes:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

