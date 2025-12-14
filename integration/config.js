// Auto-configured Vercel URL
// This is automatically set based on your deployment
const WALLET_PASS_CONFIG = {
  // Your Vercel deployment URL - automatically detected
  PASS_BASE_URL: 'https://apple-pass-scaler.vercel.app'
};

// Make it available globally
if (typeof window !== 'undefined') {
  window.WALLET_PASS_CONFIG = WALLET_PASS_CONFIG;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WALLET_PASS_CONFIG;
}

