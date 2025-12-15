'use client';

import { useState } from 'react';
import { Wallet, Check } from 'lucide-react';

export default function TestPassPage() {
  const [loading, setLoading] = useState(false);

  async function addToWallet() {
    setLoading(true);
    
    try {
      // Get the Vercel URL from environment or use the production URL
      const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL 
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : 'https://apple-pass-scaler.vercel.app';
      
      // Build the pass generation URL
      const passUrl = new URL(`${baseUrl}/api/generate-pass`);
      passUrl.searchParams.set('click_id', `test_${Date.now()}`);
      passUrl.searchParams.set('utm_source', 'test');
      passUrl.searchParams.set('utm_campaign', 'wallet_test');
      
      // Fetch the pass file using the direct download method
      const response = await fetch(passUrl.toString());
      
      if (!response.ok) {
        throw new Error(`Failed to generate pass: ${response.status}`);
      }
      
      // Convert response to Blob
      const blob = await response.blob();
      
      // Verify the MIME type
      if (blob.type !== 'application/vnd.apple.pkpass') {
        console.warn('Unexpected MIME type:', blob.type);
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
      link.click(); // This triggers the Wallet sheet on iOS
      
      // Clean up
      document.body.removeChild(link);
      setTimeout(() => {
        window.URL.revokeObjectURL(objectUrl);
      }, 100);
      
    } catch (error) {
      console.error('Error adding pass to wallet:', error);
      alert('Failed to add pass to wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-purple-600 mb-2">Important Step</h1>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" style={{ width: '33%' }}></div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
              <Wallet className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-900">
            This is Really Important!
          </h2>

          {/* Description */}
          <p className="text-gray-600 text-center mb-6">
            Add your <span className="text-purple-600 font-semibold">Local Saver Spot Wallet Pass</span> to receive your gift card digitally and get instant notifications about exclusive savings!
          </p>

          {/* Features List */}
          <div className="space-y-3 mb-8">
            <div className="bg-green-50 rounded-lg p-4 flex items-center gap-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-700">Receive your digital gift card instantly</span>
            </div>
            <div className="bg-green-50 rounded-lg p-4 flex items-center gap-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-700">Get notified about exclusive local deals</span>
            </div>
            <div className="bg-green-50 rounded-lg p-4 flex items-center gap-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-700">Easy access from your phone wallet</span>
            </div>
          </div>

          {/* Add to Wallet Button */}
          <button
            onClick={addToWallet}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Opening Wallet...</span>
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                <span>Add to Apple Wallet</span>
              </>
            )}
          </button>

          {/* Skip Link */}
          <p className="text-center text-gray-500 text-sm mt-4 cursor-pointer hover:text-gray-700">
            Skip for now
          </p>
        </div>
      </div>
    </div>
  );
}

