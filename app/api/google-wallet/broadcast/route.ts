import { NextRequest, NextResponse } from 'next/server';
import { updatePassObject } from '@/lib/google-wallet/client';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { BroadcastRequest } from '@/lib/google-wallet/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/google-wallet/broadcast
 * Update all Google Wallet passes with a message - triggers push notifications
 */
export async function POST(request: NextRequest) {
  try {
    const body: BroadcastRequest = await request.json();

    // Validate required fields
    if (!body.message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      );
    }

    // Get all passes from database
    const { data: passes, error: dbError } = await supabaseAdmin
      .from('google_passes')
      .select('pass_object_id');

    if (dbError) {
      console.error('Error fetching passes:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch passes from database' },
        { status: 500 }
      );
    }

    if (!passes || passes.length === 0) {
      return NextResponse.json({
        success: true,
        totalPasses: 0,
        updated: 0,
        failed: 0,
        message: 'No passes found to broadcast to',
      });
    }

    // Update all passes - each update triggers a notification
    let updated = 0;
    let failed = 0;

    // Process in batches to avoid rate limiting
    const BATCH_SIZE = 10;
    const batches = [];
    for (let i = 0; i < passes.length; i += BATCH_SIZE) {
      batches.push(passes.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      const results = await Promise.allSettled(
        batch.map(pass => 
          updatePassObject(pass.pass_object_id, {
            title: body.title || 'New Update!',
            body: body.message,
          })
        )
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          updated++;
        } else {
          failed++;
          console.error('Failed to update pass:', result.reason);
        }
      }

      // Small delay between batches to avoid rate limiting
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return NextResponse.json({
      success: true,
      totalPasses: passes.length,
      updated,
      failed,
      message: `Broadcast sent to ${updated} passes. ${failed} failed.`,
    });
  } catch (error: any) {
    console.error('Error broadcasting:', error);
    return NextResponse.json(
      { 
        error: 'Failed to broadcast',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
