import { NextRequest, NextResponse } from 'next/server';
import { createPassWithSaveUrl } from '@/lib/google-wallet/client';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { CreatePassRequest } from '@/lib/google-wallet/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/google-wallet/create-pass
 * Create a new Google Wallet pass with appLinkData affiliate link
 * Returns a "Save to Google Wallet" URL
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreatePassRequest = await request.json();

    // Validate required fields
    if (!body.classId) {
      return NextResponse.json(
        { error: 'classId is required' },
        { status: 400 }
      );
    }

    if (!body.affiliateLink) {
      return NextResponse.json(
        { error: 'affiliateLink is required' },
        { status: 400 }
      );
    }

    // Generate a unique object ID
    const objectId = `pass_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create the pass and get save URL
    const result = await createPassWithSaveUrl({
      objectId,
      classId: body.classId,
      affiliateLink: body.affiliateLink,
      title: body.title,
      subtitle: body.subtitle,
      heroImageUrl: body.heroImageUrl,
      logoUrl: body.logoUrl,
      trackingData: body.trackingData,
    });

    // Store pass in database
    const { error: dbError } = await supabaseAdmin
      .from('google_passes')
      .insert({
        pass_class_id: body.classId,
        pass_object_id: result.resourceId,
        affiliate_link: body.affiliateLink,
        tracking_data: body.trackingData || null,
      });

    if (dbError) {
      console.error('Error storing pass in database:', dbError);
      // Continue anyway - the pass was created successfully
    }

    return NextResponse.json({
      success: true,
      passObjectId: result.resourceId,
      saveUrl: result.saveUrl,
      message: 'Pass created successfully. Use the saveUrl to add to Google Wallet.',
    });
  } catch (error: any) {
    console.error('Error creating pass:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create pass',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
