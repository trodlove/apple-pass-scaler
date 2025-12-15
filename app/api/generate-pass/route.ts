import { NextRequest, NextResponse } from 'next/server';
import { getActiveAppleAccount } from '@/lib/apple/credentials';
import { generatePassBuffer } from '@/lib/apple/pass-generation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateToken, generateSerialNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/generate-pass
 * Generates and serves a .pkpass file with proper MIME type
 * This endpoint is designed for direct download via fetch() + Blob
 */
export async function GET(request: NextRequest) {
  try {
    // Capture all query parameters
    const searchParams = request.nextUrl.searchParams;
    const clickId = searchParams.get('click_id');
    
    // Capture all tracking parameters
    const trackingParams: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      trackingParams[key] = value;
    });

    // Get active Apple account for pass generation
    const appleCredentials = await getActiveAppleAccount();
    if (!appleCredentials) {
      return new NextResponse('No active Apple Developer Account available', { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Generate serial number and authentication token
    const serialNumber = generateSerialNumber();
    const authenticationToken = generateToken();

    // Get default template
    const { data: template, error: templateError } = await supabaseAdmin
      .from('pass_templates')
      .select('*')
      .limit(1)
      .single();

    if (templateError && templateError.code !== 'PGRST116') {
      console.error('Error fetching template:', templateError);
    }

    // Prepare pass data with tracking parameters
    const passData = {
      serialNumber,
      authenticationToken,
      click_id: clickId,
      webServiceURL: `${request.nextUrl.origin}/api/apple/v1`,
      ...trackingParams,
      organizationName: 'Apple Pass Scaler',
      description: 'Wallet Pass',
      backgroundColor: 'rgb(255, 255, 255)',
      foregroundColor: 'rgb(0, 0, 0)',
    };

    // Generate the pass buffer
    const templateData = template ? {
      pass_style: template.pass_style,
      fields: template.fields,
    } : {
      pass_style: 'generic',
      fields: {},
    };

    const passBuffer = await generatePassBuffer(passData, templateData, appleCredentials);

    // Get the Apple account ID for storing in the database
    const { data: appleAccount } = await supabaseAdmin
      .from('apple_developer_accounts')
      .select('id')
      .eq('pass_type_id', appleCredentials.pass_type_id)
      .single();

    // Create pass record in database
    const { error: insertError } = await supabaseAdmin
      .from('passes')
      .insert({
        serial_number: serialNumber,
        authentication_token: authenticationToken,
        template_id: template?.id || null,
        apple_account_id: appleAccount?.id || null,
        pass_data: passData,
        revenue: 0.00,
      });

    if (insertError) {
      console.error('Error inserting pass:', insertError);
      // Continue anyway - the pass file is already generated
    }

    // Return the pass file with correct MIME type
    // This is critical: "application/vnd.apple.pkpass" tells iOS to show Wallet sheet
    // Using "inline" instead of "attachment" works better for direct navigation on iOS
    return new NextResponse(passBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': 'inline; filename="pass.pkpass"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*', // Allow CORS for direct navigation
      },
    });
  } catch (error) {
    console.error('Error in generate-pass:', error);
    return new NextResponse('Failed to generate pass', { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

