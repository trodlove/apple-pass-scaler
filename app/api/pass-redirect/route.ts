import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pass-redirect
 * Minimal redirect handler that waits for user to return from Wallet
 * Reads redirect URL from query param or cookie
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let redirectUrl = searchParams.get('redirect_url');
    
    // If not in query param, try to get from cookie
    if (!redirectUrl) {
      redirectUrl = request.cookies.get('pass_redirect_url')?.value || null;
    }
    
    // Fallback
    if (!redirectUrl) {
      redirectUrl = 'https://example.com';
    }

    // Ensure redirect URL is properly decoded
    try {
      redirectUrl = decodeURIComponent(redirectUrl);
      new URL(redirectUrl);
    } catch (error) {
      console.error('Invalid redirect URL:', redirectUrl);
      redirectUrl = 'https://example.com';
    }

    // Return minimal HTML that detects when user returns from Wallet
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirecting...</title>
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
    <div class="spinner"></div>
    <p>Redirecting to next step...</p>
  </div>
  <script>
    (function() {
      const redirectUrl = ${JSON.stringify(redirectUrl)};
      let redirectTriggered = false;
      let pageWasHidden = false;
      
      function redirect() {
        if (redirectTriggered) return;
        redirectTriggered = true;
        window.location.href = redirectUrl;
      }
      
      // Detect when user returns from Wallet using Page Visibility API
      document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
          pageWasHidden = true;
        } else if (pageWasHidden) {
          // User returned from Wallet
          setTimeout(redirect, 300);
        }
      });
      
      // Fallback: Use focus/blur events
      let windowBlurred = false;
      window.addEventListener('blur', function() {
        windowBlurred = true;
      });
      
      window.addEventListener('focus', function() {
        if (windowBlurred && !redirectTriggered) {
          setTimeout(redirect, 300);
        }
      });
      
      // If page is already visible (user came back), redirect immediately
      if (!document.hidden && pageWasHidden) {
        setTimeout(redirect, 500);
      }
      
      // Ultimate fallback: Redirect after 10 seconds
      setTimeout(function() {
        if (!redirectTriggered) {
          redirect();
        }
      }, 10000);
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
    console.error('Error in pass-redirect:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

