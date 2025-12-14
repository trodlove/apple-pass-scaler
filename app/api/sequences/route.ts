import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/sequences
 * Fetch all sequences
 */
export async function GET() {
  try {
    const { data: sequences, error } = await supabaseAdmin
      .from('sequences')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch sequences' },
        { status: 500 }
      );
    }

    return NextResponse.json(sequences || [], { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sequences
 * Create a new sequence
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const { data: sequence, error } = await supabaseAdmin
      .from('sequences')
      .insert({ name })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create sequence' },
        { status: 500 }
      );
    }

    return NextResponse.json(sequence, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

