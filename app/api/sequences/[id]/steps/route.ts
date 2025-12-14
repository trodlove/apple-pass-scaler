import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/sequences/[id]/steps
 * Fetch all steps for a sequence
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: steps, error } = await supabaseAdmin
      .from('sequence_steps')
      .select('*')
      .eq('sequence_id', params.id)
      .order('step_number', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch steps' },
        { status: 500 }
      );
    }

    return NextResponse.json(steps || [], { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sequences/[id]/steps
 * Add a step to a sequence
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { step_number, delay_hours, message_template } = body;

    if (!step_number || !message_template) {
      return NextResponse.json(
        { error: 'step_number and message_template are required' },
        { status: 400 }
      );
    }

    const { data: step, error } = await supabaseAdmin
      .from('sequence_steps')
      .insert({
        sequence_id: params.id,
        step_number,
        delay_hours: delay_hours || 24,
        message_template,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create step' },
        { status: 500 }
      );
    }

    return NextResponse.json(step, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

