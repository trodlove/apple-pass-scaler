import { NextRequest, NextResponse } from 'next/server';
import { getActiveAppleAccount } from '@/lib/apple/credentials';
import { generatePassBuffer } from '@/lib/apple/pass-generation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateToken, generateSerialNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/issue-pass-and-redirect
 * Issues a pass and redirects the user with tracking parameters
 */
export async function GET(request: NextRequest) {
  try {
    // Capture all query parameters
    const searchParams = request.nextUrl.searchParams;
    const clickId = searchParams.get('click_id');
    let redirectUrl = searchParams.get('redirect_url') || 'https://example.com';
    const delay = parseInt(searchParams.get('delay') || '3000', 10); // Default 3 seconds
    
    // Ensure redirect URL is properly decoded and valid
    try {
      redirectUrl = decodeURIComponent(redirectUrl);
      // Validate URL format
      new URL(redirectUrl);
    } catch (error) {
      console.error('Invalid redirect URL:', redirectUrl);
      redirectUrl = 'https://example.com';
    }
    
    // Capture all tracking parameters (utm_*, etc.) - exclude internal params
    const trackingParams: Record<string, any> = {};
    const internalParams = ['redirect_url', 'delay'];
    searchParams.forEach((value, key) => {
      if (!internalParams.includes(key)) {
        trackingParams[key] = value;
      }
    });

    // Get active Apple account for pass generation
    const appleCredentials = await getActiveAppleAccount();
    if (!appleCredentials) {
      return new NextResponse(
        '<html><body><h1>Error</h1><p>No active Apple Developer Account available</p></body></html>',
        { 
          status: 500,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Generate serial number and authentication token
    const serialNumber = generateSerialNumber();
    const authenticationToken = generateToken();

    // Get default template (you may want to make this configurable)
    const { data: template, error: templateError } = await supabaseAdmin
      .from('pass_templates')
      .select('*')
      .limit(1)
      .single();

    if (templateError && templateError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching template:', templateError);
    }

    // Prepare pass data with tracking parameters
    const passData = {
      serialNumber,
      authenticationToken,
      click_id: clickId,
      redirect_url: redirectUrl,
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

    // Create pass record in database FIRST (before serving download link)
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
      return new NextResponse(
        '<html><body><h1>Error</h1><p>Failed to save pass to database</p></body></html>',
        { 
          status: 500,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Store pass in a way that can be retrieved (we'll use a query param approach)
    // For now, let's create a download endpoint and redirect properly
    
    // Return HTML that triggers pass download and then redirects
    const passDownloadUrl = `${request.nextUrl.origin}/api/download-pass?serial=${serialNumber}&token=${authenticationToken}`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Adding to Wallet...</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
      max-width: 400px;
    }
    h2 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }
    p {
      font-size: 1rem;
      opacity: 0.9;
      margin-bottom: 0.5rem;
    }
    .spinner {
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top: 3px solid white;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 1rem auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Adding Pass to Wallet...</h2>
    <div class="spinner"></div>
    <p>Please wait while we prepare your pass.</p>
    <p style="font-size: 0.875rem; margin-top: 1rem; opacity: 0.7;">You will be redirected automatically.</p>
  </div>
  <script>
    (function() {
      const passUrl = ${JSON.stringify(passDownloadUrl)};
      const redirectUrl = ${JSON.stringify(redirectUrl)};
      
      // Method 1: Try direct navigation to pass file (works best on iOS)
      // This will trigger Wallet to open automatically
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      const redirectDelay = ${delay};
      
      if (isIOS) {
        // On iOS, directly navigate to the pass file
        window.location.href = passUrl;
        
        // Redirect after a delay (pass will open in Wallet, this redirects the browser)
        setTimeout(() => {
          window.location.href = ${JSON.stringify(redirectUrl)};
        }, redirectDelay);
      } else {
        // On other platforms, use download link
        const link = document.createElement('a');
        link.href = passUrl;
        link.download = 'pass.pkpass';
        link.style.display = 'none';
        document.body.appendChild(link);
        
        // Trigger download immediately
        setTimeout(() => {
          link.click();
        }, 100);
        
        // Redirect after delay (slightly shorter for desktop)
        setTimeout(() => {
          window.location.href = ${JSON.stringify(redirectUrl)};
        }, Math.max(redirectDelay - 500, 2000));
      }
    })();
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error in issue-pass-and-redirect:', error);
    return new NextResponse(
      '<html><body><h1>Error</h1><p>Failed to generate pass</p></body></html>',
      { 
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}

