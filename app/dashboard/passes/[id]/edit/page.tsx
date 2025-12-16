'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { usePassEditorStore } from '@/stores/pass-editor-store';
import { PassPreview } from '@/components/pass-preview';
import { ImageUpload } from '@/components/image-upload';
import { ColorPicker } from '@/components/color-picker';
import { useState } from 'react';

export default function EditPassPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const passId = params.id as string;

  const store = usePassEditorStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [pass, setPass] = useState<any>(null);

  useEffect(() => {
    fetchPass();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passId]);

  async function fetchPass() {
    try {
      const response = await fetch(`/api/passes/${passId}`);
      if (response.ok) {
        const data = await response.json();
        setPass(data);
        
        // Load data into Zustand store
        const passData = data.pass_data || {};
        store.loadFromPassData(passData);
      }
    } catch (error) {
      console.error('Error fetching pass:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pass',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Get all data from Zustand store
      const passData = {
        // Images - store all three resolutions
        logo_1x_url: store.logo_1x_url,
        logo_2x_url: store.logo_2x_url,
        logo_3x_url: store.logo_3x_url,
        icon_1x_url: store.icon_1x_url,
        icon_2x_url: store.icon_2x_url,
        icon_3x_url: store.icon_3x_url,
        strip_1x_url: store.strip_1x_url,
        strip_2x_url: store.strip_2x_url,
        strip_3x_url: store.strip_3x_url,
        
        // Backward compatibility - use @2x as default
        logo: store.logo_2x_url || store.logo_1x_url,
        icon: store.icon_2x_url || store.icon_1x_url,
        stripImage: store.strip_2x_url || store.strip_1x_url,
        
        // Configuration
        organizationName: store.organizationName,
        description: store.description,
        logoText: store.logoText,
        headerLabel: store.headerLabel,
        headerValue: store.headerValue,
        backgroundColor: store.backgroundColor,
        foregroundColor: store.foregroundColor,
        labelColor: store.labelColor,
        
        // Content
        secondaryLeftLabel: store.secondaryLeftLabel,
        secondaryLeftValue: store.secondaryLeftValue,
        secondaryRightLabel: store.secondaryRightLabel,
        secondaryRightValue: store.secondaryRightValue,
        websiteUrl: store.websiteUrl,
        
        // Back Fields
        latestNewsText: store.latestNewsText,
        latestNewsLink: store.latestNewsLink,
        makeMoneyLink: store.makeMoneyLink,
        redeemCashLink: store.redeemCashLink,
        shareEarnLink: store.shareEarnLink,
        notificationMessage: store.notificationMessage,
        customerServiceLink: store.customerServiceLink,
        
        // Barcode
        barcodeMessage: store.barcodeMessage,
      };

      const response = await fetch(`/api/passes/${passId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pass_data: passData,
          regenerate: true,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Pass updated successfully',
        });
        router.push('/dashboard/passes');
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to update pass',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving pass:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!pass) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Pass not found</p>
        <Link href="/dashboard/passes">
          <Button>Back to Passes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/passes" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Library
        </Link>
        <h1 className="text-3xl font-bold mb-2">Edit Pass</h1>
        <p className="text-gray-600">Update your Apple Pass details.</p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep === step
                    ? 'bg-blue-600 text-white'
                    : currentStep > step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep > step ? <Check className="h-5 w-5" /> : step}
              </div>
              {step < 4 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    currentStep > step ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-center mt-4 text-sm text-gray-600">
          Step {currentStep} of 4
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Pass Images</CardTitle>
                <CardDescription>Upload the images that will appear on your pass. Images will be automatically resized to Apple&apos;s required dimensions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ImageUpload imageType="logo" label="Logo" required />
                <ImageUpload imageType="icon" label="Icon" required />
                <ImageUpload imageType="strip" label="Strip Image" />
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Pass Configuration</CardTitle>
                <CardDescription>Configure your pass details and branding.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="organizationName">Organization Name</Label>
                    <Input
                      id="organizationName"
                      value={store.organizationName}
                      onChange={(e) => store.setPassProperty('organizationName', e.target.value)}
                      placeholder="Your Organization"
                    />
                    <p className="text-xs text-gray-500">Name of the organization issuing the pass.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Pass Description</Label>
                    <Input
                      id="description"
                      value={store.description}
                      onChange={(e) => store.setPassProperty('description', e.target.value)}
                      placeholder="Brief description"
                    />
                    <p className="text-xs text-gray-500">Brief description for accessibility purposes.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logoText">Logo Text</Label>
                  <Input
                    id="logoText"
                    value={store.logoText}
                    onChange={(e) => store.setPassProperty('logoText', e.target.value)}
                    placeholder="Text next to logo"
                  />
                  <p className="text-xs text-gray-500">Text that appears next to your logo.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="headerLabel">Header Field Label</Label>
                    <Input
                      id="headerLabel"
                      value={store.headerLabel}
                      onChange={(e) => store.setPassProperty('headerLabel', e.target.value)}
                      placeholder="MEMBER"
                      maxLength={25}
                    />
                    <p className="text-xs text-gray-500">Header label text.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="headerValue">Header Field Value</Label>
                    <Input
                      id="headerValue"
                      value={store.headerValue}
                      onChange={(e) => store.setPassProperty('headerValue', e.target.value)}
                      placeholder="GOLD MEMBER"
                      maxLength={30}
                    />
                    <p className="text-xs text-gray-500">Header value text.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Colors</Label>
                  <div className="grid gap-4 md:grid-cols-3">
                    <ColorPicker
                      label="Background Color"
                      value={store.backgroundColor}
                      onChange={(color) => store.setPassProperty('backgroundColor', color)}
                    />
                    <ColorPicker
                      label="Foreground Color"
                      value={store.foregroundColor}
                      onChange={(color) => store.setPassProperty('foregroundColor', color)}
                    />
                    <ColorPicker
                      label="Label Color"
                      value={store.labelColor}
                      onChange={(color) => store.setPassProperty('labelColor', color)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Pass Content</CardTitle>
                <CardDescription>Configure the fields and content that will appear on your pass.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="secondaryLeftLabel">Secondary Left Label</Label>
                    <Input
                      id="secondaryLeftLabel"
                      value={store.secondaryLeftLabel}
                      onChange={(e) => store.setPassProperty('secondaryLeftLabel', e.target.value)}
                      placeholder="Team"
                      maxLength={25}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryLeftValue">Secondary Left Value</Label>
                    <Input
                      id="secondaryLeftValue"
                      value={store.secondaryLeftValue}
                      onChange={(e) => store.setPassProperty('secondaryLeftValue', e.target.value)}
                      placeholder="Engineer"
                      maxLength={30}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="secondaryRightLabel">Secondary Right Label</Label>
                    <Input
                      id="secondaryRightLabel"
                      value={store.secondaryRightLabel}
                      onChange={(e) => store.setPassProperty('secondaryRightLabel', e.target.value)}
                      placeholder="Status"
                      maxLength={25}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryRightValue">Secondary Right Value</Label>
                    <Input
                      id="secondaryRightValue"
                      value={store.secondaryRightValue}
                      onChange={(e) => store.setPassProperty('secondaryRightValue', e.target.value)}
                      placeholder="Active"
                      maxLength={30}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    value={store.websiteUrl}
                    onChange={(e) => store.setPassProperty('websiteUrl', e.target.value)}
                    placeholder="https://example.com"
                  />
                  <p className="text-xs text-gray-500">This website will be linked on the back of the card.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Back of Pass Fields</CardTitle>
                <CardDescription>Configure the fields and links that appear on the back of your pass.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold text-sm">Latest News</h3>
                  <div className="space-y-2">
                    <Label htmlFor="latestNewsText">News Text</Label>
                    <Input
                      id="latestNewsText"
                      value={store.latestNewsText}
                      onChange={(e) => store.setPassProperty('latestNewsText', e.target.value)}
                      placeholder="Unlock bonuses up to 2X your earnings! Find your new daily bonus here."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="latestNewsLink">News Link</Label>
                    <Input
                      id="latestNewsLink"
                      type="url"
                      value={store.latestNewsLink}
                      onChange={(e) => store.setPassProperty('latestNewsLink', e.target.value)}
                      placeholder="https://example.com/latest-news"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="makeMoneyLink">Make Money Link</Label>
                  <Input
                    id="makeMoneyLink"
                    type="url"
                    value={store.makeMoneyLink}
                    onChange={(e) => store.setPassProperty('makeMoneyLink', e.target.value)}
                    placeholder="https://example.com/make-money"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="redeemCashLink">Redeem Cash Link</Label>
                  <Input
                    id="redeemCashLink"
                    type="url"
                    value={store.redeemCashLink}
                    onChange={(e) => store.setPassProperty('redeemCashLink', e.target.value)}
                    placeholder="https://example.com/redeem"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shareEarnLink">Share and Earn Link</Label>
                  <Input
                    id="shareEarnLink"
                    type="url"
                    value={store.shareEarnLink}
                    onChange={(e) => store.setPassProperty('shareEarnLink', e.target.value)}
                    placeholder="https://example.com/share"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerServiceLink">Customer Service Link</Label>
                  <Input
                    id="customerServiceLink"
                    type="url"
                    value={store.customerServiceLink}
                    onChange={(e) => store.setPassProperty('customerServiceLink', e.target.value)}
                    placeholder="https://example.com/support"
                  />
                </div>

                <div className="space-y-2 p-4 border rounded-lg bg-blue-50">
                  <Label htmlFor="notificationMessage">Notification Message (Last Update Field)</Label>
                  <Input
                    id="notificationMessage"
                    value={store.notificationMessage}
                    onChange={(e) => store.setPassProperty('notificationMessage', e.target.value)}
                    placeholder="Welcome! Check back for updates."
                  />
                  <p className="text-xs text-gray-500">
                    This message appears in the &quot;Last Update&quot; field on the back of the pass. When this changes, it triggers a push notification to users.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            {currentStep < 4 ? (
              <Button onClick={() => setCurrentStep(currentStep + 1)}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Updating...' : 'Update Pass'}
              </Button>
            )}
          </div>
        </div>

        {/* Preview Pane */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <PassPreview />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

