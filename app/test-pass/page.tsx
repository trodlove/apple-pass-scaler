'use client';

import { useState } from 'react';
import { Wallet, Check } from 'lucide-react';

export default function TestPassPage() {
  const [loading, setLoading] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);
  const [notificationResult, setNotificationResult] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusInfo, setStatusInfo] = useState<any>(null);

  async function checkStatus() {
    setCheckingStatus(true);
    setStatusInfo(null);
    
    try {
      const response = await fetch('/api/debug/pass-status');
      const data = await response.json();
      
      if (response.ok) {
        setStatusInfo(data);
      } else {
        setStatusInfo({ error: data.error });
      }
    } catch (error) {
      setStatusInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setCheckingStatus(false);
    }
  }

  async function testNotification() {
    setTestingNotification(true);
    setNotificationResult(null);
    
    try {
      const response = await fetch('/api/test-notification', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setNotificationResult(`✅ Success! Sent to ${data.details.notifications.sent} device(s). Message: "${data.details.testMessage}"`);
      } else {
        setNotificationResult(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setNotificationResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTestingNotification(false);
    }
  }

  function addToWallet() {
    setLoading(true);
    
    try {
      // Get the Vercel URL from environment or use the production URL
      const baseUrl = typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://apple-pass-scaler.vercel.app';
      
      // Build the pass generation URL
      const passUrl = new URL(`${baseUrl}/api/generate-pass`);
      passUrl.searchParams.set('click_id', `test_${Date.now()}`);
      passUrl.searchParams.set('utm_source', 'test');
      passUrl.searchParams.set('utm_campaign', 'wallet_test');
      
      // Direct navigation approach - iOS recognizes .pkpass files automatically
      // This avoids CORS issues and works better on iOS Safari
      // iOS will automatically show the "Add to Wallet" sheet when it detects the .pkpass MIME type
      window.location.href = passUrl.toString();
      
      // Note: The page will navigate away, so we don't need to restore the loading state
      
    } catch (error) {
      console.error('Error adding pass to wallet:', error);
      setLoading(false);
      alert('Failed to add pass to wallet. Please try again.');
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

          {/* Diagnostic Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">
              Diagnostics
            </h3>
            <button
              onClick={checkStatus}
              disabled={checkingStatus}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-3 hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg mb-4"
            >
              {checkingStatus ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <span>🔍 Check Registration Status</span>
                </>
              )}
            </button>
            {statusInfo && (
              <div className="mt-4 p-4 rounded-lg bg-gray-50 text-sm">
                {statusInfo.error ? (
                  <div className="text-red-600">{statusInfo.error}</div>
                ) : (
                  <div className="space-y-2">
                    <div className="font-semibold">Total Passes: {statusInfo.total_passes}</div>
                    {statusInfo.passes && statusInfo.passes.length > 0 && (
                      <div className="space-y-3">
                        {statusInfo.passes.map((pass: any, idx: number) => (
                          <div key={idx} className="border rounded p-3 bg-white">
                            <div className="font-medium mb-2">Pass #{idx + 1}</div>
                            <div className="text-xs space-y-1">
                              <div>Serial: {pass.serial_number}</div>
                              <div>Has Web Service: {pass.has_web_service ? '✅' : '❌'}</div>
                              {pass.has_web_service && (
                                <div className="text-gray-600">URL: {pass.web_service_url}</div>
                              )}
                              <div>Registrations: {pass.registration_count}</div>
                              {pass.registrations.length > 0 && (
                                <div className="mt-2">
                                  <div className="font-medium">Registered Devices:</div>
                                  {pass.registrations.map((reg: any, rIdx: number) => (
                                    <div key={rIdx} className="ml-2 text-gray-600">
                                      • Device: {reg.device_library_identifier?.substring(0, 20)}...
                                      {reg.has_push_token ? ' ✅ Token' : ' ❌ No Token'}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Test Notification Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">
              Test Notifications
            </h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              After adding the pass to Wallet, click below to send a test notification
            </p>
            <button
              onClick={testNotification}
              disabled={testingNotification}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-3 hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
            >
              {testingNotification ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>📱 Send Test Notification</span>
                </>
              )}
            </button>
            {notificationResult && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${
                notificationResult.includes('✅') 
                  ? 'bg-green-50 text-green-800' 
                  : 'bg-red-50 text-red-800'
              }`}>
                {notificationResult}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

