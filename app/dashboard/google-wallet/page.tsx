'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function GoogleWalletDashboard() {
  // Create Class State
  const [classId, setClassId] = useState('');
  const [issuerName, setIssuerName] = useState('');
  const [classTitle, setClassTitle] = useState('');
  const [classLoading, setClassLoading] = useState(false);
  const [classResult, setClassResult] = useState<any>(null);

  // Create Pass State
  const [passClassId, setPassClassId] = useState('');
  const [affiliateLink, setAffiliateLink] = useState('');
  const [passTitle, setPassTitle] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passResult, setPassResult] = useState<any>(null);

  // Broadcast State
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<any>(null);

  // Create Pass Class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setClassLoading(true);
    setClassResult(null);

    try {
      const response = await fetch('/api/google-wallet/create-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          issuerName,
          title: classTitle,
        }),
      });

      const data = await response.json();
      setClassResult(data);
    } catch (error: any) {
      setClassResult({ error: error.message });
    } finally {
      setClassLoading(false);
    }
  };

  // Create Pass
  const handleCreatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassLoading(true);
    setPassResult(null);

    try {
      const response = await fetch('/api/google-wallet/create-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: passClassId,
          affiliateLink,
          title: passTitle || undefined,
        }),
      });

      const data = await response.json();
      setPassResult(data);
    } catch (error: any) {
      setPassResult({ error: error.message });
    } finally {
      setPassLoading(false);
    }
  };

  // Send Broadcast
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcastLoading(true);
    setBroadcastResult(null);

    try {
      const response = await fetch('/api/google-wallet/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: broadcastMessage,
          title: broadcastTitle || undefined,
        }),
      });

      const data = await response.json();
      setBroadcastResult(data);
    } catch (error: any) {
      setBroadcastResult({ error: error.message });
    } finally {
      setBroadcastLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Google Wallet</h1>
        <p className="text-gray-600">
          Create and manage Google Wallet passes with affiliate links.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Section 1: Create Pass Class */}
        <Card>
          <CardHeader>
            <CardTitle>1. Create Pass Class</CardTitle>
            <CardDescription>
              Create a new pass class (template) in Google Wallet. You only need to do this once per template.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="classId">Class ID</Label>
                  <Input
                    id="classId"
                    placeholder="e.g., affiliate_pass_v1"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issuerName">Issuer Name</Label>
                  <Input
                    id="issuerName"
                    placeholder="e.g., My Company"
                    value={issuerName}
                    onChange={(e) => setIssuerName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classTitle">Title</Label>
                  <Input
                    id="classTitle"
                    placeholder="e.g., Exclusive Rewards"
                    value={classTitle}
                    onChange={(e) => setClassTitle(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={classLoading}>
                {classLoading ? 'Creating...' : 'Create Pass Class'}
              </Button>
            </form>

            {classResult && (
              <div className={`mt-4 p-4 rounded-lg ${classResult.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(classResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Issue Test Pass */}
        <Card>
          <CardHeader>
            <CardTitle>2. Issue Test Pass</CardTitle>
            <CardDescription>
              Create a new pass with an affiliate link. Returns a Save to Google Wallet URL.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePass} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passClassId">Class ID</Label>
                  <Input
                    id="passClassId"
                    placeholder="e.g., affiliate_pass_v1"
                    value={passClassId}
                    onChange={(e) => setPassClassId(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="affiliateLink">Affiliate Link</Label>
                  <Input
                    id="affiliateLink"
                    placeholder="https://your-affiliate-link.com"
                    value={affiliateLink}
                    onChange={(e) => setAffiliateLink(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passTitle">Title (optional)</Label>
                  <Input
                    id="passTitle"
                    placeholder="e.g., Your exclusive offer!"
                    value={passTitle}
                    onChange={(e) => setPassTitle(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" disabled={passLoading}>
                {passLoading ? 'Creating...' : 'Create Pass'}
              </Button>
            </form>

            {passResult && (
              <div className={`mt-4 p-4 rounded-lg ${passResult.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {passResult.saveUrl && (
                  <div className="mb-4">
                    <a
                      href={passResult.saveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      Add to Google Wallet
                    </a>
                  </div>
                )}
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(passResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 3: Send Notification */}
        <Card>
          <CardHeader>
            <CardTitle>3. Send Notification</CardTitle>
            <CardDescription>
              Broadcast a message to all passes. This updates every pass and triggers a push notification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBroadcast} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="broadcastTitle">Title (optional)</Label>
                  <Input
                    id="broadcastTitle"
                    placeholder="e.g., New Offer!"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="broadcastMessage">Message</Label>
                  <Input
                    id="broadcastMessage"
                    placeholder="e.g., Check out our latest deals!"
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={broadcastLoading}>
                {broadcastLoading ? 'Sending...' : 'Send Broadcast'}
              </Button>
            </form>

            {broadcastResult && (
              <div className={`mt-4 p-4 rounded-lg ${broadcastResult.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(broadcastResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
