import { NextRequest, NextResponse } from 'next/server';
import { getActiveAppleAccount } from '@/lib/apple/credentials';
import { generatePassBuffer } from '@/lib/apple/pass-generation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateToken, generateSerialNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/issue-pass-page
 * Serves a page that loads the pass in an iframe and handles redirect
 * This allows the main page to stay visible and detect when user returns
 */
export async function GET(request: NextRequest) {
  try {
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
      return new NextResponse(
        '<html><body><h1>Error</h1><p>Failed to save pass to database</p></body></html>',
        { 
          status: 500,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Create pass download URL
    const passDownloadUrl = `${request.nextUrl.origin}/api/download-pass?serial=${serialNumber}&token=${authenticationToken}`;
    
    // Return HTML page that loads pass in iframe and handles redirect
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
    iframe {
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Adding Pass to Wallet...</h2>
    <div class="spinner"></div>
    <p>Your pass is opening in Wallet.</p>
    <p style="font-size: 0.875rem; margin-top: 1rem; opacity: 0.7;">You will be redirected when you return.</p>
  </div>
  <iframe id="passFrame" src="${passDownloadUrl}"></iframe>
  <script>
    (function() {
      const redirectUrl = ${JSON.stringify(redirectUrl)};
      let redirectTriggered = false;
      let pageWasHidden = false;
      let passOpened = false;
      
      function redirect() {
        if (redirectTriggered) return;
        redirectTriggered = true;
        window.location.href = redirectUrl;
      }
      
      // Load pass in iframe - this will trigger Wallet
      const iframe = document.getElementById('passFrame');
      iframe.onload = function() {
        passOpened = true;
      };
      
      // Also try direct link click as backup
      const link = document.createElement('a');
      link.href = ${JSON.stringify(passDownloadUrl)};
      link.style.display = 'none';
      document.body.appendChild(link);
      
      setTimeout(() => {
        link.click();
        passOpened = true;
      }, 100);
      
      // Detect when user returns from Wallet using Page Visibility API
      document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
          pageWasHidden = true;
        } else if (pageWasHidden && passOpened) {
          // User returned from Wallet
          setTimeout(redirect, 500);
        }
      });
      
      // Fallback: Use focus/blur events
      let windowBlurred = false;
      window.addEventListener('blur', function() {
        if (passOpened) {
          windowBlurred = true;
        }
      });
      
      window.addEventListener('focus', function() {
        if (windowBlurred && passOpened && !redirectTriggered) {
          setTimeout(redirect, 500);
        }
      });
      
      // Ultimate fallback: Redirect after 30 seconds
      setTimeout(function() {
        if (!redirectTriggered) {
          redirect();
        }
      }, 30000);
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
    console.error('Error in issue-pass-page:', error);
    return new NextResponse(
      '<html><body><h1>Error</h1><p>Failed to generate pass</p></body></html>',
      { 
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}

