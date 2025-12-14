import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/templates
 * Fetch all pass templates
 */
export async function GET() {
  try {
    const { data: templates, error } = await supabaseAdmin
      .from('pass_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    return NextResponse.json(templates || [], { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates
 * Create a new pass template
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, pass_style, fields } = body;

    if (!name || !pass_style || !fields) {
      return NextResponse.json(
        { error: 'name, pass_style, and fields are required' },
        { status: 400 }
      );
    }

    const { data: template, error } = await supabaseAdmin
      .from('pass_templates')
      .insert({
        name,
        pass_style,
        fields,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      );
    }

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

