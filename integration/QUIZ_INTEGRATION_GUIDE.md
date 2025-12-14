# Quiz Funnel Integration Guide

## Quick Integration Steps

### Step 1: Copy the Integration Code

Copy the code from `funnel-button-direct.html` and customize these two values:

```javascript
const PASS_BASE_URL = 'https://YOUR_VERCEL_URL.vercel.app';  // ← Your Vercel URL
const nextStepUrl = 'https://your-quiz.com/next-step';        // ← Your next quiz step URL
```

### Step 2: Paste into Your Quiz Funnel

Paste the entire code block (button + script + styles) into your quiz funnel HTML where you want the "Add to Wallet" button to appear.

### Step 3: That's It!

The code automatically:
- ✅ Captures ALL UTM parameters from the current page URL
- ✅ Preserves ALL parameters through pass generation
- ✅ Redirects to next step with ALL parameters intact
- ✅ Tracks click_id for analytics

## How UTM Parameters Are Preserved

The integration automatically:

1. **Captures from current page:**
   ```javascript
   const urlParams = new URLSearchParams(window.location.search);
   // Gets: utm_source, utm_campaign, utm_medium, utm_term, utm_content, etc.
   ```

2. **Sends to pass generation:**
   ```javascript
   // All parameters are added to the API request
   urlParams.forEach((value, key) => {
     passUrl.searchParams.set(key, value);
   });
   ```

3. **Preserves in redirect:**
   ```javascript
   // All parameters are added to the redirect URL
   urlParams.forEach((value, key) => {
     redirectUrl.searchParams.set(key, value);
   });
   ```

## Complete Example

Here's a complete example you can copy-paste:

```html
<!-- Add to Wallet Button -->
<button 
  id="wallet-pass-btn" 
  class="wallet-pass-button"
  onclick="addToWalletAndContinue()"
>
  Add to Apple Wallet
</button>

<script>
async function addToWalletAndContinue() {
  // ⚠️ CUSTOMIZE THESE TWO VALUES:
  const PASS_BASE_URL = 'https://apple-pass-scaler.vercel.app';  // Your Vercel URL
  const nextStepUrl = 'https://your-quiz.com/quiz-step-2';        // Your next step URL
  
  // Automatically captures ALL URL parameters from current page
  const urlParams = new URLSearchParams(window.location.search);
  const clickId = urlParams.get('click_id') || generateClickId();
  
  // Build pass generation URL with all parameters
  const passUrl = new URL(`${PASS_BASE_URL}/api/generate-pass`);
  passUrl.searchParams.set('click_id', clickId);
  
  // Copy ALL query parameters to pass generation request
  urlParams.forEach((value, key) => {
    if (key !== 'click_id') {
      passUrl.searchParams.set(key, value);
    }
  });
  
  // Disable button and show loading
  const button = document.getElementById('wallet-pass-btn');
  if (button) {
    button.disabled = true;
    button.textContent = 'Opening Wallet...';
  }
  
  try {
    // Fetch pass file
    const response = await fetch(passUrl.toString());
    if (!response.ok) throw new Error(`Failed: ${response.status}`);
    
    // Convert to Blob and trigger Wallet
    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = 'pass.pkpass';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);
    
    // Build redirect URL with ALL parameters preserved
    const redirectUrl = new URL(nextStepUrl);
    urlParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value);
    });
    
    // Redirect after 1 second
    setTimeout(() => {
      window.location.href = redirectUrl.toString();
    }, 1000);
    
  } catch (error) {
    console.error('Error:', error);
    if (button) {
      button.disabled = false;
      button.textContent = 'Add to Apple Wallet';
    }
    alert('Failed to add pass. Please try again.');
  }
}

function generateClickId() {
  return 'click_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
</script>

<style>
.wallet-pass-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 16px 32px;
  font-size: 18px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 300px;
}

.wallet-pass-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.wallet-pass-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
```

## Parameter Flow Example

### Starting URL:
```
https://your-quiz.com/quiz-step-1?utm_source=facebook&utm_campaign=summer2024&utm_medium=cpc&click_id=abc123
```

### Pass Generation Request:
```
https://apple-pass-scaler.vercel.app/api/generate-pass?
  click_id=abc123&
  utm_source=facebook&
  utm_campaign=summer2024&
  utm_medium=cpc
```

### Redirect URL (Next Step):
```
https://your-quiz.com/quiz-step-2?
  utm_source=facebook&
  utm_campaign=summer2024&
  utm_medium=cpc&
  click_id=abc123
```

**All parameters are preserved!** ✅

## Customization Options

### Change Button Text
```html
<button onclick="addToWalletAndContinue()">
  Get Your Exclusive Pass  <!-- Custom text -->
</button>
```

### Change Redirect Delay
```javascript
// Change from 1000ms (1 second) to 2000ms (2 seconds)
setTimeout(() => {
  window.location.href = redirectUrl.toString();
}, 2000);  // ← Change this number
```

### Add Custom Tracking Parameters
```javascript
// Add custom parameters before redirect
redirectUrl.searchParams.set('wallet_added', 'true');
redirectUrl.searchParams.set('timestamp', Date.now().toString());
```

## Testing Checklist

- [ ] Button appears on quiz page
- [ ] Clicking button shows "Opening Wallet..." text
- [ ] Wallet sheet appears (no Safari popup)
- [ ] Pass can be added to Wallet
- [ ] Redirects to next step after 1 second
- [ ] All UTM parameters are preserved in redirect URL
- [ ] Works on iPhone Safari
- [ ] Works in in-app browsers (Facebook, Instagram, etc.)

## Troubleshooting

### Parameters Not Preserved
- Check browser console for errors
- Verify `urlParams.forEach()` is executing
- Test with: `console.log(redirectUrl.toString())` before redirect

### Redirect Not Working
- Increase delay: `setTimeout(..., 2000)`
- Check that `nextStepUrl` is correct
- Verify redirect URL is accessible

### Wallet Sheet Not Appearing
- Verify backend serves correct MIME type
- Check network tab for API response
- Test endpoint directly: `/api/generate-pass?click_id=test`

