import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generatePassBuffer } from '@/lib/apple/pass-generation';
import { getActiveAppleAccount } from '@/lib/apple/credentials';

export const dynamic = 'force-dynamic';

/**
 * GET /api/download-pass
 * Downloads a pass file by serial number and token
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const serialNumber = searchParams.get('serial');
    const token = searchParams.get('token');

    if (!serialNumber || !token) {
      return new NextResponse('Missing parameters', { status: 400 });
    }

    // Fetch pass from database
    const { data: pass, error: passError } = await supabaseAdmin
      .from('passes')
      .select('*, pass_templates(*), apple_developer_accounts(*)')
      .eq('serial_number', serialNumber)
      .eq('authentication_token', token)
      .single();

    if (passError || !pass) {
      console.error('Error fetching pass:', passError);
      return new NextResponse('Pass not found', { status: 404 });
    }

    // Get Apple credentials
    const appleCredentials = await getActiveAppleAccount();
    if (!appleCredentials) {
      return new NextResponse('No active Apple account', { status: 500 });
    }

    // Prepare template data
    const templateData = pass.pass_templates ? {
      pass_style: pass.pass_templates.pass_style,
      fields: pass.pass_templates.fields,
    } : {
      pass_style: 'generic',
      fields: {},
    };

    // Prepare pass data with all required fields
    const passDataForGeneration = {
      ...pass.pass_data,
      serialNumber: pass.serial_number,
      authenticationToken: pass.authentication_token,
      webServiceURL: `${request.nextUrl.origin}/api/apple`,
    };

    console.log('[Download Pass] Generating pass with data:', {
      serialNumber: passDataForGeneration.serialNumber,
      hasIcon: !!(passDataForGeneration.icon_2x_url || passDataForGeneration.icon_1x_url || passDataForGeneration.icon),
      hasLogo: !!(passDataForGeneration.logo_2x_url || passDataForGeneration.logo_1x_url || passDataForGeneration.logo),
      hasStrip: !!(passDataForGeneration.strip_2x_url || passDataForGeneration.strip_1x_url || passDataForGeneration.stripImage),
      organizationName: passDataForGeneration.organizationName,
    });

    // Generate pass buffer
    const passBuffer = await generatePassBuffer(
      passDataForGeneration,
      templateData,
      appleCredentials
    );

    // Return the pass file
    // Use inline disposition on iOS to avoid download prompt
    const userAgent = request.headers.get('user-agent') || '';
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const disposition = isIOS ? 'inline' : 'attachment';
    
    return new NextResponse(passBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `${disposition}; filename="pass.pkpass"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error in download-pass:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

