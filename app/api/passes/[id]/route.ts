import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getActiveAppleAccount } from '@/lib/apple/credentials';
import { generatePassBuffer } from '@/lib/apple/pass-generation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/passes/[id]
 * Get a specific pass by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: pass, error } = await supabaseAdmin
      .from('passes')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching pass:', error);
      return NextResponse.json(
        { error: 'Pass not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(pass, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/passes/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/passes/[id]
 * Update a pass with new customization data
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { pass_data, regenerate } = body;

    // Get the existing pass
    const { data: existingPass, error: fetchError } = await supabaseAdmin
      .from('passes')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingPass) {
      return NextResponse.json(
        { error: 'Pass not found' },
        { status: 404 }
      );
    }

    // Update pass_data
    const updatedPassData = {
      ...existingPass.pass_data,
      ...pass_data,
    };

    // CRITICAL: Update both last_updated_at AND last_modified
    // last_modified is used by iOS to determine which passes need updating
    const updateTimestamp = new Date().toISOString();
    const { data: updatedPass, error: updateError } = await supabaseAdmin
      .from('passes')
      .update({
        pass_data: updatedPassData,
        last_updated_at: updateTimestamp,
        last_modified: updateTimestamp, // CRITICAL: iOS uses this to detect updates
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating pass:', updateError);
      return NextResponse.json(
        { error: 'Failed to update pass' },
        { status: 500 }
      );
    }

    // If regenerate is requested, regenerate the pass file
    if (regenerate) {
      try {
        const appleCredentials = await getActiveAppleAccount();
        if (!appleCredentials) {
          console.warn('No active Apple account found for regeneration');
        } else {
          // Get template if exists
          const { data: template } = await supabaseAdmin
            .from('pass_templates')
            .select('*')
            .eq('id', existingPass.template_id)
            .single();

          const templateData = template ? {
            pass_style: template.pass_style,
            fields: template.fields,
          } : {
            pass_style: 'generic',
            fields: {},
          };

          // Ensure pass data includes required fields for regeneration
          const passDataForRegeneration = {
            ...updatedPassData,
            serialNumber: existingPass.serial_number,
            authenticationToken: existingPass.authentication_token,
            webServiceURL: `${request.nextUrl.origin}/api/apple`,
          };

          // Regenerate pass buffer (this would typically be saved to storage)
          await generatePassBuffer(
            passDataForRegeneration as any,
            templateData,
            appleCredentials
          );

          // In production, you'd save this to DigitalOcean Spaces and update the pass URL
        }
      } catch (regenerateError) {
        console.error('Error regenerating pass:', regenerateError);
        // Don't fail the request if regeneration fails
      }
    }

    return NextResponse.json(updatedPass, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in PUT /api/passes/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

