import { NextRequest, NextResponse } from 'next/server';
import { updatePassObject } from '@/lib/google-wallet/client';
import type { UpdatePassRequest } from '@/lib/google-wallet/types';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/google-wallet/update-pass
 * Update a Google Wallet pass - this automatically triggers a push notification
 */
export async function PATCH(request: NextRequest) {
  try {
    const body: UpdatePassRequest = await request.json();

    // Validate required fields
    if (!body.passObjectId) {
      return NextResponse.json(
        { error: 'passObjectId is required' },
        { status: 400 }
      );
    }

    if (!body.title && !body.body && !body.heroImageUrl) {
      return NextResponse.json(
        { error: 'At least one update field (title, body, or heroImageUrl) is required' },
        { status: 400 }
      );
    }

    // Update the pass - this triggers a notification
    const result = await updatePassObject(body.passObjectId, {
      title: body.title,
      body: body.body,
      heroImageUrl: body.heroImageUrl,
    });

    return NextResponse.json({
      success: true,
      passObjectId: body.passObjectId,
      message: 'Pass updated successfully. A push notification has been triggered.',
    });
  } catch (error: any) {
    console.error('Error updating pass:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update pass',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
