/**
 * Apple Wallet Pass Integration - Direct Download Method (JavaScript Module)
 * Uses fetch() + Blob + createObjectURL to trigger Wallet sheet directly
 * Similar to LockScreen AI approach - bypasses Safari popup
 */

/**
 * Adds pass to wallet and continues to next step
 * @param {Object} options - Configuration options
 * @param {string} options.passBaseUrl - Your Vercel deployment URL (e.g., 'https://apple-pass-scaler.vercel.app')
 * @param {string} options.nextStepUrl - URL to redirect to after pass is added
 * @param {string} [options.clickId] - Optional click ID (auto-generated if not provided)
 * @param {Object} [options.trackingParams] - Optional tracking parameters (utm_source, utm_campaign, etc.)
 * @param {Function} [options.onSuccess] - Optional callback on success
 * @param {Function} [options.onError] - Optional callback on error
 * @returns {Promise<void>}
 */
async function addToWalletAndContinue(options) {
  const {
    passBaseUrl,
    nextStepUrl,
    clickId,
    trackingParams = {},
    onSuccess,
    onError
  } = options;

  if (!passBaseUrl || !nextStepUrl) {
    const error = new Error('passBaseUrl and nextStepUrl are required');
    if (onError) onError(error);
    throw error;
  }

  // Get tracking parameters from current URL if not provided
  const urlParams = new URLSearchParams(window.location.search);
  const finalClickId = clickId || urlParams.get('click_id') || generateClickId();
  
  // Build the pass generation URL
  const passUrl = new URL(`${passBaseUrl}/api/generate-pass`);
  passUrl.searchParams.set('click_id', finalClickId);
  
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
    if (key !== 'click_id' && !trackingParams[key]) {
      passUrl.searchParams.set(key, value);
    }
  });

  try {
    // Fetch the pass file
    const response = await fetch(passUrl.toString());
    
    if (!response.ok) {
      throw new Error(`Failed to generate pass: ${response.status} ${response.statusText}`);
    }
    
    // Convert response to Blob
    const blob = await response.blob();
    
    // Verify the MIME type (should be application/vnd.apple.pkpass)
    if (blob.type !== 'application/vnd.apple.pkpass') {
      console.warn('Unexpected MIME type:', blob.type, 'Expected: application/vnd.apple.pkpass');
    }
    
    // Create object URL from Blob
    const objectUrl = window.URL.createObjectURL(blob);
    
    // Create temporary anchor element
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = 'pass.pkpass';
    link.style.display = 'none';
    
    // Append to body and click programmatically
    document.body.appendChild(link);
    link.click();
    
    // Clean up: remove link and revoke object URL
    document.body.removeChild(link);
    setTimeout(() => {
      window.URL.revokeObjectURL(objectUrl);
    }, 100);
    
    // Build redirect URL with all parameters
    const redirectUrl = new URL(nextStepUrl);
    
    // Preserve all original query parameters in redirect
    urlParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value);
    });
    
    // Add provided tracking params if not already present
    Object.entries(trackingParams).forEach(([key, value]) => {
      if (value && !redirectUrl.searchParams.has(key)) {
        redirectUrl.searchParams.set(key, value);
      }
    });
    
    // Wait 1 second then redirect to next step
    setTimeout(() => {
      window.location.href = redirectUrl.toString();
      if (onSuccess) onSuccess();
    }, 1000);
    
  } catch (error) {
    console.error('Error adding pass to wallet:', error);
    if (onError) {
      onError(error);
    } else {
      throw error;
    }
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
 * import { useCallback, useState } from 'react';
 * 
 * function useWalletPass(passBaseUrl, nextStepUrl) {
 *   const [loading, setLoading] = useState(false);
 *   const [error, setError] = useState(null);
 * 
 *   const handleAddToWallet = useCallback(async (clickId, trackingParams = {}) => {
 *     setLoading(true);
 *     setError(null);
 *     try {
 *       await addToWalletAndContinue({
 *         passBaseUrl,
 *         nextStepUrl,
 *         clickId,
 *         trackingParams,
 *         onSuccess: () => setLoading(false),
 *         onError: (err) => {
 *           setError(err);
 *           setLoading(false);
 *         }
 *       });
 *     } catch (err) {
 *       setError(err);
 *       setLoading(false);
 *     }
 *   }, [passBaseUrl, nextStepUrl]);
 * 
 *   return { handleAddToWallet, loading, error };
 * }
 */

/**
 * React Component Example
 * 
 * function WalletPassButton({ passBaseUrl, nextStepUrl, clickId, trackingParams, className }) {
 *   const [loading, setLoading] = useState(false);
 * 
 *   const handleClick = async () => {
 *     setLoading(true);
 *     try {
 *       await addToWalletAndContinue({
 *         passBaseUrl,
 *         nextStepUrl,
 *         clickId,
 *         trackingParams,
 *         onSuccess: () => setLoading(false),
 *         onError: () => setLoading(false)
 *       });
 *     } catch (error) {
 *       setLoading(false);
 *       alert('Failed to add pass. Please try again.');
 *     }
 *   };
 * 
 *   return (
 *     <button 
 *       onClick={handleClick} 
 *       className={className}
 *       disabled={loading}
 *     >
 *       {loading ? 'Opening Wallet...' : 'Add to Apple Wallet'}
 *     </button>
 *   );
 * }
 */

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { addToWalletAndContinue, generateClickId };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.addToWalletAndContinue = addToWalletAndContinue;
  window.generateClickId = generateClickId;
}

