import { NextRequest, NextResponse } from 'next/server';
import { createPassClass } from '@/lib/google-wallet/client';
import type { CreateClassRequest } from '@/lib/google-wallet/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/google-wallet/create-class
 * Create a new Google Wallet Generic Pass Class (template)
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateClassRequest = await request.json();

    // Validate required fields
    if (!body.classId) {
      return NextResponse.json(
        { error: 'classId is required' },
        { status: 400 }
      );
    }

    if (!body.issuerName) {
      return NextResponse.json(
        { error: 'issuerName is required' },
        { status: 400 }
      );
    }

    if (!body.title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      );
    }

    // Create the pass class
    const result = await createPassClass({
      classId: body.classId,
      issuerName: body.issuerName,
      title: body.title,
      subtitle: body.subtitle,
      logoUrl: body.logoUrl,
      heroImageUrl: body.heroImageUrl,
    });

    return NextResponse.json({
      success: true,
      classId: result.classId,
      resourceId: result.resourceId,
      alreadyExists: result.alreadyExists || false,
      message: result.alreadyExists 
        ? 'Pass class already exists' 
        : 'Pass class created successfully',
    });
  } catch (error: any) {
    console.error('Error creating pass class:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create pass class',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
