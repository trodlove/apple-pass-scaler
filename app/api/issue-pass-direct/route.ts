import { NextRequest, NextResponse } from 'next/server';
import { getActiveAppleAccount } from '@/lib/apple/credentials';
import { generatePassBuffer } from '@/lib/apple/pass-generation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateToken, generateSerialNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/issue-pass-direct
 * Issues a pass and serves it directly (no HTML page)
 * Stores redirect URL in cookie for later use
 */
export async function GET(request: NextRequest) {
  try {
    // Capture all query parameters
    const searchParams = request.nextUrl.searchParams;
    const clickId = searchParams.get('click_id');
    let redirectUrl = searchParams.get('redirect_url') || 'https://example.com';
    
    // Ensure redirect URL is properly decoded and valid
    try {
      redirectUrl = decodeURIComponent(redirectUrl);
      new URL(redirectUrl);
    } catch (error) {
      console.error('Invalid redirect URL:', redirectUrl);
      redirectUrl = 'https://example.com';
    }
    
    // Capture all tracking parameters
    const trackingParams: Record<string, any> = {};
    const internalParams = ['redirect_url'];
    searchParams.forEach((value, key) => {
      if (!internalParams.includes(key)) {
        trackingParams[key] = value;
      }
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
      redirect_url: redirectUrl,
      webServiceURL: `${request.nextUrl.origin}/api/apple`,
      ...trackingParams,
      organizationName: 'Apple Pass Ferda Scaler',
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
      return new NextResponse('Failed to save pass to database', { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Detect iOS for proper content disposition
    const userAgent = request.headers.get('user-agent') || '';
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const disposition = isIOS ? 'inline' : 'attachment';

    // Return the pass file directly with redirect URL in cookie
    const response = new NextResponse(passBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `${disposition}; filename="pass.pkpass"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });

    // Set redirect URL in cookie (expires in 5 minutes)
    response.cookies.set('pass_redirect_url', redirectUrl, {
      httpOnly: false, // Allow JavaScript to read it
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300, // 5 minutes
      path: '/',
    });

    // Also set in a custom header for alternative access
    response.headers.set('X-Pass-Redirect-URL', redirectUrl);

    return response;
  } catch (error) {
    console.error('Error in issue-pass-direct:', error);
    return new NextResponse('Failed to generate pass', { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

