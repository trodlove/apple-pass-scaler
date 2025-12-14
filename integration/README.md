# Apple Wallet Pass Integration Guide

This guide shows you how to integrate Apple Wallet pass generation into your quiz funnel.

## 🚀 Two Integration Methods

### Method 1: Direct Download (Recommended - Like LockScreen AI)
**File:** `funnel-button-direct.html` or `funnel-button-direct.js`

Uses `fetch() + Blob + createObjectURL` to trigger Wallet sheet directly:
- ✅ **Bypasses Safari popup** - Shows Wallet "Add Pass" sheet directly
- ✅ **No intermediate page** - Happens on your quiz page
- ✅ **1 second delay then redirect** - Automatic continuation
- ✅ **Preserves all URL parameters** - Full tracking support

**Flow:** Click button → Wallet sheet appears → Add pass → Auto-redirect after 1 second

### Method 2: Page-Based (Alternative)
**File:** `funnel-button.html` or `funnel-button.js`

Uses intermediate page with iframe:
- Shows loading page
- Detects when user returns from Wallet
- Redirects automatically

**Flow:** Click button → Loading page → Wallet opens → Return → Auto-redirect

## Quick Start

1. **Deploy your app to Vercel** (see `DEPLOYMENT.md`)
2. **Get your Vercel URL** (e.g., `https://apple-pass-scaler.vercel.app`)
3. **Copy the integration code** below into your quiz funnel
4. **Replace `YOUR_VERCEL_URL`** with your actual Vercel URL
5. **Set your next quiz step URL**

## Integration Options

### Option 1: Direct Download Method (Recommended)

**File:** `funnel-button-direct.html`

This is the **recommended method** - it uses `fetch() + Blob + createObjectURL` to trigger the Wallet sheet directly, similar to LockScreen AI. This bypasses the Safari popup.

Copy the entire contents of `funnel-button-direct.html` into your quiz funnel HTML where you want the button to appear.

**What to customize:**
- Replace `YOUR_VERCEL_URL` with your Vercel deployment URL
- Replace `https://your-quiz.com/next-step` with your actual next quiz step URL

**Example:**
```html
<!-- Before -->
const PASS_BASE_URL = 'https://YOUR_VERCEL_URL.vercel.app';

<!-- After -->
const PASS_BASE_URL = 'https://apple-pass-scaler.vercel.app';
```

**How it works:**
1. User clicks "Add to Wallet" button
2. JavaScript fetches the pass file using `fetch()`
3. Converts response to Blob
4. Creates object URL and triggers download
5. iOS intercepts and shows Wallet "Add Pass" sheet (no Safari popup!)
6. After 1 second, automatically redirects to next step

**Key Technical Details:**
- Backend serves file with MIME type: `application/vnd.apple.pkpass`
- Frontend uses `fetch()` → `Blob` → `createObjectURL()` → programmatic click
- This method bypasses Safari's security popup
- All URL parameters are preserved through the flow

### Option 2: Page-Based Method (Alternative)

**File:** `funnel-button.html`

Copy the entire contents of `funnel-button.html` into your quiz funnel HTML where you want the button to appear.

**What to customize:**
- Replace `YOUR_VERCEL_URL` with your Vercel deployment URL
- Replace `https://your-quiz.com/next-step` with your actual next quiz step URL

**Example:**
```html
<!-- Before -->
const PASS_BASE_URL = 'https://YOUR_VERCEL_URL.vercel.app';

<!-- After -->
const PASS_BASE_URL = 'https://apple-pass-scaler.vercel.app';
```

### Option 2: JavaScript Module

Use `funnel-button.js` for React, Vue, or vanilla JavaScript applications.

**Basic Usage:**
```javascript
// Import the function
import { openWalletPass } from './funnel-button.js';

// Or include the script tag
<script src="path/to/funnel-button.js"></script>

// Call the function
openWalletPass({
  passBaseUrl: 'https://apple-pass-scaler.vercel.app',
  nextStepUrl: 'https://your-quiz.com/next-step',
  clickId: 'optional-click-id',
  trackingParams: {
    utm_source: 'quiz',
    utm_campaign: 'funnel-1'
  }
});
```

**React Example:**
```jsx
import { openWalletPass } from './funnel-button.js';

function QuizStep() {
  const handleAddToWallet = () => {
    openWalletPass({
      passBaseUrl: 'https://apple-pass-scaler.vercel.app',
      nextStepUrl: 'https://your-quiz.com/next-step',
      clickId: `quiz_${Date.now()}`,
      trackingParams: {
        utm_source: 'quiz',
        step: 'wallet-pass'
      }
    });
  };

  return (
    <button onClick={handleAddToWallet}>
      Add to Apple Wallet
    </button>
  );
}
```

## How It Works (Frictionless Flow)

1. **User clicks "Add to Wallet" button** → This is the consent step in your quiz
2. **Navigates to pass page** → Minimal page loads with pass in background
3. **Pass opens automatically** → Loads in iframe, triggers Wallet
4. **Safari shows security popup** → User taps "Allow" (this is the only popup - Safari requirement)
5. **Pass opens in Wallet** → Automatically opens in Wallet app
6. **User adds pass or closes Wallet** → Returns to browser
7. **Auto-redirect detected** → Page visibility API detects return
8. **Redirects to next quiz step** → Seamless continuation

**Key Benefits:**
- ✅ User consents in your quiz UI (clear intent)
- ✅ Minimal loading page (just shows "Adding Pass...")
- ✅ Pass opens automatically (no extra clicks)
- ✅ Only one Safari popup (security requirement - can't be avoided)
- ✅ Automatic redirect on return (seamless)
- ✅ Works in Safari and in-app browsers

## URL Parameters

The **pass page endpoint** (`/api/issue-pass-page`) accepts these parameters:

### Required
- `redirect_url` - URL to redirect to after pass is added (URL-encoded)

### Optional
- `click_id` - Unique identifier for tracking (auto-generated if not provided)
- `utm_source`, `utm_campaign`, `utm_medium`, etc. - UTM tracking parameters
- Any other parameters - All are preserved and passed through

### Example URL
```
https://apple-pass-scaler.vercel.app/api/issue-pass-page?
  click_id=quiz_12345&
  redirect_url=https%3A%2F%2Fyour-quiz.com%2Fnext-step&
  utm_source=quiz&
  utm_campaign=funnel-1
```

**Note:** This endpoint serves a minimal HTML page that loads the pass in an iframe. The main page stays visible and detects when the user returns from Wallet, then redirects automatically.

## Customization

### Change Redirect Delay

Add `delay` parameter (in milliseconds):

```javascript
const passUrl = `${PASS_BASE_URL}/api/issue-pass-and-redirect?delay=5000`; // 5 seconds
```

### Preserve Tracking Parameters

The integration automatically:
- Preserves all UTM parameters from the current URL
- Passes through all query parameters
- Generates a unique `click_id` if not provided

### Custom Styling

The HTML button includes basic styling. Customize the `.wallet-pass-button` class:

```css
.wallet-pass-button {
  /* Your custom styles */
  background: your-color;
  padding: your-padding;
  /* etc. */
}
```

## Testing

### 1. Test Locally
```bash
npm run dev
# Visit: http://localhost:3000/api/issue-pass-and-redirect?click_id=test&redirect_url=https://example.com
```

### 2. Test on iPhone
1. Deploy to Vercel
2. Open the pass generation URL on your iPhone
3. Pass should open in Wallet automatically
4. Browser should redirect after 3 seconds

### 3. Test in Quiz Funnel
1. Add integration code to your quiz
2. Click the button
3. Verify pass opens in Wallet
4. Verify redirect to next step works

## Troubleshooting

### Pass Doesn't Open on iPhone
- Verify Apple Developer Account is added via dashboard
- Check that certificates are correct
- Ensure you're testing on a real iPhone (not simulator)
- Check browser console for errors

### Redirect Doesn't Work
- Verify `redirect_url` is properly URL-encoded
- Check that the redirect URL is accessible
- Increase `delay` parameter if needed
- Check browser console for JavaScript errors

### Button Doesn't Appear
- Check that HTML/CSS is properly included
- Verify JavaScript is loaded
- Check browser console for errors
- Ensure `PASS_BASE_URL` is set correctly

## Advanced Usage

### Multiple Pass Types
If you have multiple pass templates, you can add a `template_id` parameter:

```javascript
passUrl.searchParams.set('template_id', 'your-template-id');
```

### Custom Pass Data
Pass custom data through query parameters - they'll be stored in `pass_data`:

```javascript
passUrl.searchParams.set('user_name', 'John Doe');
passUrl.searchParams.set('discount_code', 'SAVE20');
```

### Revenue Tracking
After a purchase, update the pass revenue via the Redtrack postback:

```
POST /api/postback/redtrack
{
  "click_id": "click_12345",
  "revenue": 29.99
}
```

## Support

If you need help:
1. Check the deployment logs in Vercel
2. Test the endpoint directly
3. Verify all environment variables are set
4. Check Supabase database connection

## Next Steps

After integration:
1. ✅ Test pass generation works
2. ✅ Test redirect flow
3. ✅ Test on iPhone
4. ✅ Monitor pass generation in dashboard
5. ✅ Set up notification sequences (optional)

