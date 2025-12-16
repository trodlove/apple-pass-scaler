'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Wallet, Check } from 'lucide-react';

export default function SharePassPage() {
  const params = useParams();
  const passId = params.passId as string;
  const [loading, setLoading] = useState(false);
  const [passData, setPassData] = useState<any>(null);
  const [testingNotification, setTestingNotification] = useState(false);
  const [notificationResult, setNotificationResult] = useState<string | null>(null);

  useEffect(() => {
    fetchPassData();
  }, [passId]);

  async function fetchPassData() {
    try {
      const response = await fetch(`/api/passes/${passId}`);
      if (response.ok) {
        const data = await response.json();
        setPassData(data);
      }
    } catch (error) {
      console.error('Error fetching pass:', error);
    }
  }

  async function testNotification() {
    if (!passData) return;
    
    setTestingNotification(true);
    setNotificationResult(null);
    
    try {
      const response = await fetch('/api/test-specific-pass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serialNumber: passData.serial_number,
          message: 'Check this new offer out!',
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setNotificationResult(`✅ Success! Sent to ${data.details.notifications.sent} device(s).`);
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
    if (!passData) return;
    
    setLoading(true);
    
    try {
      const baseUrl = typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://apple-pass-scaler.vercel.app';
      
      // Use the download-pass endpoint which regenerates the pass with latest data
      const passUrl = new URL(`${baseUrl}/api/download-pass`);
      passUrl.searchParams.set('serial', passData.serial_number);
      passUrl.searchParams.set('token', passData.authentication_token);
      
      // Direct navigation approach - iOS recognizes .pkpass files automatically
      window.location.href = passUrl.toString();
      
    } catch (error) {
      console.error('Error adding pass to wallet:', error);
      setLoading(false);
      alert('Failed to add pass to wallet. Please try again.');
    }
  }

  if (!passData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const orgName = passData.pass_data?.organizationName || 'Wallet Pass';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-purple-600 mb-2">Important Step</h1>
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
            Add your <span className="text-purple-600 font-semibold">{orgName} Wallet Pass</span> to receive your gift card digitally and get instant notifications about exclusive savings!
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

