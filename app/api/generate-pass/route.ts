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
    console.log('📥 [Generate Pass] Request received');
    
    // Capture all query parameters
    const searchParams = request.nextUrl.searchParams;
    const clickId = searchParams.get('click_id');
    
    console.log(`📥 [Generate Pass] Click ID: ${clickId}`);
    
    // Capture all tracking parameters
    const trackingParams: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      trackingParams[key] = value;
    });

    // Get active Apple account for pass generation
    const appleCredentials = await getActiveAppleAccount();
    if (!appleCredentials) {
      console.error('❌ [Generate Pass] No active Apple Developer Account available');
      return new NextResponse('No active Apple Developer Account available', { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    console.log(`✅ [Generate Pass] Using Apple account: ${appleCredentials.pass_type_id}`);

    // Generate serial number and authentication token
    const serialNumber = generateSerialNumber();
    const authenticationToken = generateToken();
    
    console.log(`🔑 [Generate Pass] Generated serial: ${serialNumber.substring(0, 20)}...`);

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
      notificationMessage: 'Welcome! Check back for updates.', // Default notification message
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
    console.log(`💾 [Generate Pass] Inserting pass into database...`);
    const { data: insertedPass, error: insertError } = await supabaseAdmin
      .from('passes')
      .insert({
        serial_number: serialNumber,
        authentication_token: authenticationToken,
        template_id: template?.id || null,
        apple_account_id: appleAccount?.id || null,
        pass_data: passData,
        revenue: 0.00,
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ [Generate Pass] Error inserting pass:', insertError);
      // Continue anyway - the pass file is already generated
    } else {
      console.log(`✅ [Generate Pass] Pass created in database with ID: ${insertedPass?.id}`);
    }

    // Return the pass file with correct MIME type
    // This is critical: "application/vnd.apple.pkpass" tells iOS to show Wallet sheet
    return new NextResponse(passBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': 'attachment; filename="pass.pkpass"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
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

