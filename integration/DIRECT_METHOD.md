# Direct Download Method - Complete Guide

## Overview

The direct download method uses `fetch() + Blob + createObjectURL` to trigger the Wallet sheet directly, similar to how LockScreen AI does it. This approach **bypasses the Safari security popup** and shows the Wallet "Add Pass" sheet immediately.

## How It Works

### Frontend Flow

1. **User clicks button** → `addToWalletAndContinue()` function executes
2. **Fetch pass file** → `fetch('/api/generate-pass?click_id=xxx')`
3. **Convert to Blob** → `await response.blob()`
4. **Create object URL** → `window.URL.createObjectURL(blob)`
5. **Trigger download** → Create `<a>` tag, set `href` to object URL, programmatically click
6. **iOS intercepts** → Recognizes MIME type `application/vnd.apple.pkpass` and shows Wallet sheet
7. **Wait 1 second** → `setTimeout(1000)`
8. **Redirect** → `window.location.href = nextStepUrl`

### Backend Flow

1. **Receive request** → GET `/api/generate-pass?click_id=xxx&utm_source=xxx`
2. **Generate pass** → Create pass record in database, generate `.pkpass` file
3. **Return file** → Serve with headers:
   - `Content-Type: application/vnd.apple.pkpass` (CRITICAL - tells iOS to show Wallet)
   - `Content-Disposition: attachment; filename="pass.pkpass"`

## Key Technical Requirements

### MIME Type (Critical!)

The backend **MUST** serve the file with MIME type `application/vnd.apple.pkpass`. This is what tells iOS to intercept the download and show the Wallet sheet instead of treating it as a regular file.

```typescript
// Backend - app/api/generate-pass/route.ts
return new NextResponse(passBuffer, {
  headers: {
    'Content-Type': 'application/vnd.apple.pkpass', // ← CRITICAL
    'Content-Disposition': 'attachment; filename="pass.pkpass"',
  },
});
```

### Frontend Implementation

```javascript
// Fetch the pass file
const response = await fetch(passUrl.toString());

// Convert to Blob
const blob = await response.blob();

// Verify MIME type (should be application/vnd.apple.pkpass)
if (blob.type !== 'application/vnd.apple.pkpass') {
  console.warn('Unexpected MIME type:', blob.type);
}

// Create object URL
const objectUrl = window.URL.createObjectURL(blob);

// Create and click link
const link = document.createElement('a');
link.href = objectUrl;
link.download = 'pass.pkpass';
link.click();

// Clean up
window.URL.revokeObjectURL(objectUrl);

// Redirect after 1 second
setTimeout(() => {
  window.location.href = nextStepUrl;
}, 1000);
```

## Why This Works

1. **MIME Type Recognition**: iOS Safari recognizes `application/vnd.apple.pkpass` and intercepts the download
2. **No Navigation**: We stay on the same page (no `window.location.href` to pass file)
3. **Programmatic Trigger**: Using `createObjectURL()` + programmatic click triggers the Wallet sheet
4. **Bypasses Popup**: Because we're not navigating to the file, Safari doesn't show its security popup

## Comparison: Direct vs Page-Based

| Feature | Direct Method | Page-Based Method |
|---------|--------------|-------------------|
| Safari Popup | ❌ None | ✅ Shows (unavoidable) |
| Intermediate Page | ❌ None | ✅ Shows loading page |
| User Taps | 2 (button + Add) | 3 (button + Allow + Add) |
| Redirect Timing | 1 second fixed | Detects return from Wallet |
| Implementation | fetch() + Blob | iframe + page visibility |

## Files

- **Backend:** `app/api/generate-pass/route.ts`
- **Frontend HTML:** `integration/funnel-button-direct.html`
- **Frontend JS:** `integration/funnel-button-direct.js`

## Testing

1. Deploy to Vercel
2. Open your quiz funnel on iPhone
3. Click "Add to Wallet" button
4. **Expected:** Wallet "Add Pass" sheet appears immediately (no Safari popup)
5. Tap "Add" in Wallet
6. **Expected:** After 1 second, redirects to next step

## Troubleshooting

### Wallet sheet doesn't appear
- ✅ Verify backend serves `Content-Type: application/vnd.apple.pkpass`
- ✅ Check browser console for errors
- ✅ Verify pass file is valid (test with direct URL)

### Redirect happens too fast
- Increase timeout: `setTimeout(..., 2000)` instead of 1000

### Parameters not preserved
- Check that `urlParams.forEach()` is copying all parameters
- Verify redirect URL includes all query params

## Best Practices

1. **Always verify MIME type** in frontend before triggering download
2. **Clean up object URLs** to prevent memory leaks
3. **Handle errors gracefully** - show user-friendly messages
4. **Preserve all tracking parameters** - important for analytics
5. **Test on real device** - simulators may behave differently

