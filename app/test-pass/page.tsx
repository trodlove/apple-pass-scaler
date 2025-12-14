'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestPassPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testPassCreation = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      // Test the pass generation endpoint
      const clickId = `test_${Date.now()}`;
      const testUrl = `https://apple-pass-scaler.vercel.app/api/generate-pass?click_id=${clickId}`;
      
      console.log('Testing pass generation:', testUrl);
      
      const response = await fetch(testUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      if (blob.type === 'application/vnd.apple.pkpass') {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'test-pass.pkpass';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setResult(`✅ Success! Pass file downloaded. Check the dashboard to see if it was created in the database.`);
      } else {
        const text = await blob.text();
        setResult(`❌ Error: ${text.substring(0, 200)}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const checkRecentPasses = async () => {
    setLoading(true);
    setResult('Checking...');
    
    try {
      const response = await fetch('https://apple-pass-scaler.vercel.app/api/test-pass-creation');
      const data = await response.json();
      
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Pass Creation Test</h1>
        
        <div className="space-y-4 mb-6">
          <Button onClick={testPassCreation} disabled={loading}>
            {loading ? 'Testing...' : 'Test Pass Generation'}
          </Button>
          
          <Button onClick={checkRecentPasses} disabled={loading} variant="outline">
            Check Recent Passes
          </Button>
        </div>
        
        {result && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Result:</h2>
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        )}
        
        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Integration Code (Current):</h2>
          <p className="text-sm text-gray-600 mb-2">
            Your integration should use this endpoint:
          </p>
          <code className="block bg-white p-4 rounded text-sm">
            https://apple-pass-scaler.vercel.app/api/generate-pass?click_id=YOUR_CLICK_ID
          </code>
          <p className="text-sm text-gray-600 mt-4">
            Make sure your funnel is using the code from <code>integration/COPY_PASTE_READY.html</code>
          </p>
        </div>
      </div>
    </div>
  );
}

