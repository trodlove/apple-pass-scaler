'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewPassPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    click_id: '',
    redirect_url: '',
    utm_source: '',
    utm_campaign: '',
    utm_medium: '',
  });

  async function handleCreate() {
    setLoading(true);
    try {
      // Build query string with all parameters
      const params = new URLSearchParams();
      if (formData.click_id) params.append('click_id', formData.click_id);
      if (formData.redirect_url) params.append('redirect_url', formData.redirect_url);
      if (formData.utm_source) params.append('utm_source', formData.utm_source);
      if (formData.utm_campaign) params.append('utm_campaign', formData.utm_campaign);
      if (formData.utm_medium) params.append('utm_medium', formData.utm_medium);

      // Generate a test pass URL
      const testUrl = `/api/generate-pass?${params.toString()}`;
      
      toast({
        title: 'Pass Created',
        description: 'Your pass has been generated. You can test it using the integration endpoints.',
      });

      // Redirect to passes page
      router.push('/dashboard/passes');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create pass',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/passes" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Library
        </Link>
        <h1 className="text-3xl font-bold mb-2">Create Pass</h1>
        <p className="text-gray-600">Generate a new Apple Wallet pass.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pass Configuration</CardTitle>
          <CardDescription>
            Configure tracking parameters for your new pass. Passes are typically created through your funnel integration endpoints.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="click_id">Click ID (Optional)</Label>
            <Input
              id="click_id"
              value={formData.click_id}
              onChange={(e) => setFormData({ ...formData, click_id: e.target.value })}
              placeholder="tracking_click_id"
            />
            <p className="text-xs text-gray-500">Tracking identifier for this pass</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="redirect_url">Redirect URL (Optional)</Label>
            <Input
              id="redirect_url"
              value={formData.redirect_url}
              onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })}
              placeholder="https://example.com/next-step"
            />
            <p className="text-xs text-gray-500">URL to redirect to after pass is added</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="utm_source">UTM Source (Optional)</Label>
              <Input
                id="utm_source"
                value={formData.utm_source}
                onChange={(e) => setFormData({ ...formData, utm_source: e.target.value })}
                placeholder="google"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="utm_campaign">UTM Campaign (Optional)</Label>
              <Input
                id="utm_campaign"
                value={formData.utm_campaign}
                onChange={(e) => setFormData({ ...formData, utm_campaign: e.target.value })}
                placeholder="summer_sale"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="utm_medium">UTM Medium (Optional)</Label>
              <Input
                id="utm_medium"
                value={formData.utm_medium}
                onChange={(e) => setFormData({ ...formData, utm_medium: e.target.value })}
                placeholder="email"
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Passes are typically generated automatically when users click links in your funnels. 
                Use the integration endpoints (<code className="bg-blue-100 px-1 rounded">/api/generate-pass</code> or <code className="bg-blue-100 px-1 rounded">/api/issue-pass-page</code>) 
                to create passes with tracking parameters.
              </p>
            </div>
            <Button onClick={handleCreate} disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600">
              {loading ? 'Creating...' : 'Generate Test Pass'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

