import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/fix-all-passes
 * Ensures all passes have webServiceURL and notificationMessage set
 * This is critical for device registration and notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Get the origin URL (Vercel deployment URL)
    const origin = request.nextUrl.origin;
    const webServiceURL = `${origin}/api/apple/v1`;

    console.log(`🔧 Fixing all passes with webServiceURL: ${webServiceURL}`);

    // Get all passes
    const { data: passes, error: passesError } = await supabaseAdmin
      .from('passes')
      .select('id, pass_data, serial_number');

    if (passesError) {
      console.error('Error fetching passes:', passesError);
      return NextResponse.json(
        { error: 'Failed to fetch passes', details: passesError.message },
        { status: 500 }
      );
    }

    if (!passes || passes.length === 0) {
      return NextResponse.json({
        message: 'No passes found',
        fixed: 0,
        total: 0,
      }, { status: 200 });
    }

    let fixedCount = 0;
    const updates: any[] = [];

    // Update each pass to ensure it has webServiceURL and notificationMessage
    for (const pass of passes) {
      const passData = pass.pass_data as any || {};
      let needsUpdate = false;
      const updatedPassData = { ...passData };

      // Check if webServiceURL is missing or incorrect
      if (!passData.webServiceURL || passData.webServiceURL !== webServiceURL) {
        updatedPassData.webServiceURL = webServiceURL;
        needsUpdate = true;
        console.log(`  ✅ Updating webServiceURL for pass ${pass.serial_number}`);
      }

      // Check if notificationMessage is missing
      if (!passData.notificationMessage) {
        updatedPassData.notificationMessage = 'Welcome! Check back for updates.';
        needsUpdate = true;
        console.log(`  ✅ Adding notificationMessage for pass ${pass.serial_number}`);
      }

      // Check if authenticationToken exists in pass_data (for consistency)
      if (!passData.authenticationToken) {
        // We can't get it from the pass record here, but that's okay
        // The authenticationToken is stored separately in the passes table
      }

      if (needsUpdate) {
        updates.push({
          id: pass.id,
          pass_data: updatedPassData,
          last_updated_at: new Date().toISOString(),
        });
        fixedCount++;
      }
    }

    // Batch update all passes
    if (updates.length > 0) {
      console.log(`📝 Updating ${updates.length} pass(es)...`);

      for (const update of updates) {
        const { error: updateError } = await supabaseAdmin
          .from('passes')
          .update({
            pass_data: update.pass_data,
            last_updated_at: update.last_updated_at,
          })
          .eq('id', update.id);

        if (updateError) {
          console.error(`❌ Error updating pass ${update.id}:`, updateError);
        } else {
          console.log(`  ✅ Successfully updated pass ${update.id}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} of ${passes.length} passes`,
      fixed: fixedCount,
      total: passes.length,
      webServiceURL,
    }, { status: 200 });
  } catch (error) {
    console.error('Error in fix-all-passes:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

