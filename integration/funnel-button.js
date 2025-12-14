/**
 * Apple Wallet Pass Integration - JavaScript Module
 * Use this for React, Vue, or vanilla JavaScript applications
 */

/**
 * Opens the wallet pass generation page
 * @param {Object} options - Configuration options
 * @param {string} options.passBaseUrl - Your Vercel deployment URL (e.g., 'https://apple-pass-scaler.vercel.app')
 * @param {string} options.nextStepUrl - URL to redirect to after pass is added
 * @param {string} [options.clickId] - Optional click ID (auto-generated if not provided)
 * @param {Object} [options.trackingParams] - Optional tracking parameters (utm_source, utm_campaign, etc.)
 * @param {boolean} [options.openInNewTab=false] - Whether to open in new tab (default: same tab)
 */
function openWalletPass(options) {
  const {
    passBaseUrl,
    nextStepUrl,
    clickId,
    trackingParams = {},
    openInNewTab = false
  } = options;

  if (!passBaseUrl || !nextStepUrl) {
    console.error('openWalletPass: passBaseUrl and nextStepUrl are required');
    return;
  }

  // Get tracking parameters from current URL if not provided
  const urlParams = new URLSearchParams(window.location.search);
  const finalClickId = clickId || urlParams.get('click_id') || generateClickId();
  
  // Build the pass generation URL using the page endpoint
  // This loads the pass in an iframe so we can detect when user returns
  const passUrl = new URL(`${passBaseUrl}/api/issue-pass-page`);
  passUrl.searchParams.set('click_id', finalClickId);
  passUrl.searchParams.set('redirect_url', encodeURIComponent(nextStepUrl));
  
  // Add provided tracking parameters
  Object.entries(trackingParams).forEach(([key, value]) => {
    if (value) {
      passUrl.searchParams.set(key, value);
    }
  });
  
  // Preserve UTM parameters from current URL if not in trackingParams
  ['utm_source', 'utm_campaign', 'utm_medium', 'utm_term', 'utm_content'].forEach(param => {
    if (!trackingParams[param] && urlParams.get(param)) {
      passUrl.searchParams.set(param, urlParams.get(param));
    }
  });
  
  // Copy all other query parameters
  urlParams.forEach((value, key) => {
    if (!['click_id', 'redirect_url'].includes(key) && !trackingParams[key]) {
      passUrl.searchParams.set(key, value);
    }
  });
  
  // Open pass generation page
  if (openInNewTab) {
    window.open(passUrl.toString(), '_blank');
  } else {
    window.location.href = passUrl.toString();
  }
}

/**
 * Generates a unique click ID
 * @returns {string} Unique click ID
 */
function generateClickId() {
  return 'click_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * React Hook Example
 * 
 * import { useCallback } from 'react';
 * 
 * function useWalletPass(passBaseUrl, nextStepUrl) {
 *   const handleAddToWallet = useCallback((clickId, trackingParams = {}) => {
 *     openWalletPass({
 *       passBaseUrl,
 *       nextStepUrl,
 *       clickId,
 *       trackingParams
 *     });
 *   }, [passBaseUrl, nextStepUrl]);
 * 
 *   return { handleAddToWallet };
 * }
 */

/**
 * React Component Example
 * 
 * function WalletPassButton({ passBaseUrl, nextStepUrl, clickId, trackingParams, className }) {
 *   const handleClick = () => {
 *     openWalletPass({
 *       passBaseUrl,
 *       nextStepUrl,
 *       clickId,
 *       trackingParams
 *     });
 *   };
 * 
 *   return (
 *     <button onClick={handleClick} className={className}>
 *       Add to Apple Wallet
 *     </button>
 *   );
 * }
 */

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { openWalletPass, generateClickId };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.openWalletPass = openWalletPass;
  window.generateClickId = generateClickId;
}

