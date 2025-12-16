'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, Check, Moon } from 'lucide-react';
import Link from 'next/link';
import type { Pass } from '@/lib/types';

export default function EditPassPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const passId = params.id as string;

  const [pass, setPass] = useState<Pass | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Images
    logo: '',
    icon: '',
    stripImage: '',
    
    // Step 2: Configuration
    organizationName: '',
    description: '',
    logoText: '',
    headerLabel: '',
    headerValue: '',
    backgroundColor: '#000000',
    foregroundColor: '#FFFFFF',
    labelColor: '#666666',
    
    // Step 3: Content
    secondaryLeftLabel: '',
    secondaryLeftValue: '',
    secondaryRightLabel: '',
    secondaryRightValue: '',
    websiteUrl: '',
    
    // Step 4: Back Fields
    latestNewsText: '',
    latestNewsLink: '',
    makeMoneyLink: '',
    redeemCashLink: '',
    shareEarnLink: '',
    notificationMessage: '',
    customerServiceLink: '',
  });

  useEffect(() => {
    fetchPass();
  }, [passId]);

  async function fetchPass() {
    try {
      const response = await fetch(`/api/passes/${passId}`);
      if (response.ok) {
        const data = await response.json();
        setPass(data);
        
        // Populate form with existing data
        const passData = data.pass_data || {};
        setFormData({
          logo: passData.logo || '',
          icon: passData.icon || '',
          stripImage: passData.stripImage || '',
          organizationName: passData.organizationName || '',
          description: passData.description || '',
          logoText: passData.logoText || '',
          headerLabel: passData.headerLabel || '',
          headerValue: passData.headerValue || '',
          backgroundColor: passData.backgroundColor || '#000000',
          foregroundColor: passData.foregroundColor || '#FFFFFF',
          labelColor: passData.labelColor || '#666666',
          secondaryLeftLabel: passData.secondaryLeftLabel || '',
          secondaryLeftValue: passData.secondaryLeftValue || '',
          secondaryRightLabel: passData.secondaryRightLabel || '',
          secondaryRightValue: passData.secondaryRightValue || '',
          websiteUrl: passData.websiteUrl || '',
          // Back Fields
          latestNewsText: passData.latestNewsText || '',
          latestNewsLink: passData.latestNewsLink || '',
          makeMoneyLink: passData.makeMoneyLink || '',
          redeemCashLink: passData.redeemCashLink || '',
          shareEarnLink: passData.shareEarnLink || '',
          notificationMessage: passData.notificationMessage || '',
          customerServiceLink: passData.customerServiceLink || '',
        });
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
      const updatedPassData = {
        ...formData,
      };

      const response = await fetch(`/api/passes/${passId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pass_data: updatedPassData,
          regenerate: true, // Regenerate the pass file
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

  function handleImageUpload(field: 'logo' | 'icon' | 'stripImage', file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setFormData({ ...formData, [field]: base64 });
    };
    reader.readAsDataURL(file);
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
                <CardDescription>Upload the images that will appear on your pass.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo */}
                <div>
                  <Label htmlFor="logo" className="flex items-center gap-2 mb-2">
                    Logo
                    <span className="text-xs text-gray-500">(Required)</span>
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {formData.logo ? (
                      <div className="space-y-2">
                        <img src={formData.logo} alt="Logo" className="max-w-32 max-h-32 mx-auto" />
                        <p className="text-sm text-gray-600">Current Logo</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('logo-upload')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Click to replace
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Click to upload logo</p>
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('logo-upload')?.click()}
                        >
                          Upload Logo
                        </Button>
                      </div>
                    )}
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload('logo', file);
                      }}
                    />
                  </div>
                </div>

                {/* Icon */}
                <div>
                  <Label htmlFor="icon" className="flex items-center gap-2 mb-2">
                    Icon
                    <span className="text-xs text-gray-500">(Required)</span>
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {formData.icon ? (
                      <div className="space-y-2">
                        <img src={formData.icon} alt="Icon" className="max-w-32 max-h-32 mx-auto" />
                        <p className="text-sm text-gray-600">Current Icon</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('icon-upload')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Click to replace
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Click to upload icon</p>
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('icon-upload')?.click()}
                        >
                          Upload Icon
                        </Button>
                      </div>
                    )}
                    <input
                      id="icon-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload('icon', file);
                      }}
                    />
                  </div>
                </div>

                {/* Strip Image */}
                <div>
                  <Label htmlFor="stripImage" className="flex items-center gap-2 mb-2">
                    Strip Image
                    <span className="text-xs text-gray-500">(Optional)</span>
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {formData.stripImage ? (
                      <div className="space-y-2">
                        <img src={formData.stripImage} alt="Strip" className="max-w-full max-h-48 mx-auto" />
                        <p className="text-sm text-gray-600">Current Strip</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('strip-upload')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Click to replace
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Click to upload strip image</p>
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('strip-upload')?.click()}
                        >
                          Upload Strip Image
                        </Button>
                      </div>
                    )}
                    <input
                      id="strip-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload('stripImage', file);
                      }}
                    />
                  </div>
                </div>
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
                      value={formData.organizationName}
                      onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                      placeholder="Your Organization"
                    />
                    <p className="text-xs text-gray-500">Name of the organization issuing the pass.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Pass Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description"
                    />
                    <p className="text-xs text-gray-500">Brief description for accessibility purposes.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logoText">Logo Text</Label>
                  <Input
                    id="logoText"
                    value={formData.logoText}
                    onChange={(e) => setFormData({ ...formData, logoText: e.target.value })}
                    placeholder="Text next to logo"
                  />
                  <p className="text-xs text-gray-500">Text that appears next to your logo.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="headerLabel">Header Field Label</Label>
                    <Input
                      id="headerLabel"
                      value={formData.headerLabel}
                      onChange={(e) => setFormData({ ...formData, headerLabel: e.target.value })}
                      placeholder="MEMBER"
                      maxLength={25}
                    />
                    <p className="text-xs text-gray-500">Header label text.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="headerValue">Header Field Value</Label>
                    <Input
                      id="headerValue"
                      value={formData.headerValue}
                      onChange={(e) => setFormData({ ...formData, headerValue: e.target.value })}
                      placeholder="GOLD MEMBER"
                      maxLength={30}
                    />
                    <p className="text-xs text-gray-500">Header value text.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Colors</Label>
                    <div className="grid gap-4 md:grid-cols-3 mt-2">
                      <div className="space-y-2">
                        <Label htmlFor="backgroundColor" className="text-sm">Background Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            id="backgroundColor"
                            value={formData.backgroundColor}
                            onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                            className="w-16 h-10 rounded border"
                          />
                          <Input
                            value={formData.backgroundColor}
                            onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="foregroundColor" className="text-sm">Foreground Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            id="foregroundColor"
                            value={formData.foregroundColor}
                            onChange={(e) => setFormData({ ...formData, foregroundColor: e.target.value })}
                            className="w-16 h-10 rounded border"
                          />
                          <Input
                            value={formData.foregroundColor}
                            onChange={(e) => setFormData({ ...formData, foregroundColor: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labelColor" className="text-sm">Label Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            id="labelColor"
                            value={formData.labelColor}
                            onChange={(e) => setFormData({ ...formData, labelColor: e.target.value })}
                            className="w-16 h-10 rounded border"
                          />
                          <Input
                            value={formData.labelColor}
                            onChange={(e) => setFormData({ ...formData, labelColor: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
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
                      value={formData.secondaryLeftLabel}
                      onChange={(e) => setFormData({ ...formData, secondaryLeftLabel: e.target.value })}
                      placeholder="Team"
                      maxLength={25}
                    />
                    <p className="text-xs text-gray-500">6/25</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryLeftValue">Secondary Left Value</Label>
                    <Input
                      id="secondaryLeftValue"
                      value={formData.secondaryLeftValue}
                      onChange={(e) => setFormData({ ...formData, secondaryLeftValue: e.target.value })}
                      placeholder="Engineer"
                      maxLength={30}
                    />
                    <p className="text-xs text-gray-500">6/30</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="secondaryRightLabel">Secondary Right Label</Label>
                    <Input
                      id="secondaryRightLabel"
                      value={formData.secondaryRightLabel}
                      onChange={(e) => setFormData({ ...formData, secondaryRightLabel: e.target.value })}
                      placeholder="Status"
                      maxLength={25}
                    />
                    <p className="text-xs text-gray-500">6/25</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryRightValue">Secondary Right Value</Label>
                    <Input
                      id="secondaryRightValue"
                      value={formData.secondaryRightValue}
                      onChange={(e) => setFormData({ ...formData, secondaryRightValue: e.target.value })}
                      placeholder="Active"
                      maxLength={30}
                    />
                    <p className="text-xs text-gray-500">6/30</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
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
                {/* Latest News */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold text-sm">Latest News</h3>
                  <div className="space-y-2">
                    <Label htmlFor="latestNewsText">News Text</Label>
                    <Input
                      id="latestNewsText"
                      value={formData.latestNewsText}
                      onChange={(e) => setFormData({ ...formData, latestNewsText: e.target.value })}
                      placeholder="Unlock bonuses up to 2X your earnings! Find your new daily bonus here."
                    />
                    <p className="text-xs text-gray-500">The text that will appear for the latest news field.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="latestNewsLink">News Link</Label>
                    <Input
                      id="latestNewsLink"
                      type="url"
                      value={formData.latestNewsLink}
                      onChange={(e) => setFormData({ ...formData, latestNewsLink: e.target.value })}
                      placeholder="https://example.com/latest-news"
                    />
                    <p className="text-xs text-gray-500">The clickable link URL for the latest news.</p>
                  </div>
                </div>

                {/* Make Money Link */}
                <div className="space-y-2">
                  <Label htmlFor="makeMoneyLink">Make Money Link</Label>
                  <Input
                    id="makeMoneyLink"
                    type="url"
                    value={formData.makeMoneyLink}
                    onChange={(e) => setFormData({ ...formData, makeMoneyLink: e.target.value })}
                    placeholder="https://example.com/make-money"
                  />
                  <p className="text-xs text-gray-500">Link that appears as "Make Money" on the back of the pass.</p>
                </div>

                {/* Redeem Cash Link */}
                <div className="space-y-2">
                  <Label htmlFor="redeemCashLink">Redeem Cash Link</Label>
                  <Input
                    id="redeemCashLink"
                    type="url"
                    value={formData.redeemCashLink}
                    onChange={(e) => setFormData({ ...formData, redeemCashLink: e.target.value })}
                    placeholder="https://example.com/redeem"
                  />
                  <p className="text-xs text-gray-500">Link that appears as "Redeem Earnings" on the back of the pass.</p>
                </div>

                {/* Share and Earn Link */}
                <div className="space-y-2">
                  <Label htmlFor="shareEarnLink">Share and Earn Link</Label>
                  <Input
                    id="shareEarnLink"
                    type="url"
                    value={formData.shareEarnLink}
                    onChange={(e) => setFormData({ ...formData, shareEarnLink: e.target.value })}
                    placeholder="https://example.com/share"
                  />
                    <p className="text-xs text-gray-500">Link that appears as &quot;Pass the Gravy&quot; on the back of the pass.</p>
                </div>

                {/* Customer Service Link */}
                <div className="space-y-2">
                  <Label htmlFor="customerServiceLink">Customer Service Link</Label>
                  <Input
                    id="customerServiceLink"
                    type="url"
                    value={formData.customerServiceLink}
                    onChange={(e) => setFormData({ ...formData, customerServiceLink: e.target.value })}
                    placeholder="https://example.com/support"
                  />
                  <p className="text-xs text-gray-500">Link that appears as &quot;Get Help&quot; on the back of the pass.</p>
                </div>

                {/* Notification Message */}
                <div className="space-y-2 p-4 border rounded-lg bg-blue-50">
                  <Label htmlFor="notificationMessage">Notification Message (Last Update Field)</Label>
                  <Input
                    id="notificationMessage"
                    value={formData.notificationMessage}
                    onChange={(e) => setFormData({ ...formData, notificationMessage: e.target.value })}
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
              <div className="bg-black rounded-lg p-4 mb-4">
                {/* Pass Preview */}
                <div
                  className="rounded-lg p-6 text-white"
                  style={{
                    backgroundColor: formData.backgroundColor,
                    color: formData.foregroundColor,
                  }}
                >
                  {formData.logo && (
                    <img src={formData.logo} alt="Logo" className="w-12 h-12 mb-2" />
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      {formData.headerLabel && (
                        <div className="text-sm opacity-80">{formData.headerLabel}</div>
                      )}
                      {formData.headerValue && (
                        <div className="text-lg font-bold">{formData.headerValue}</div>
                      )}
                    </div>
                  </div>
                  {formData.stripImage && (
                    <img src={formData.stripImage} alt="Strip" className="w-full mb-4 rounded" />
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    {formData.secondaryLeftLabel && (
                      <div>
                        <div className="opacity-80">{formData.secondaryLeftLabel}</div>
                        <div className="font-semibold">{formData.secondaryLeftValue}</div>
                      </div>
                    )}
                    {formData.secondaryRightLabel && (
                      <div>
                        <div className="opacity-80">{formData.secondaryRightLabel}</div>
                        <div className="font-semibold">{formData.secondaryRightValue}</div>
                      </div>
                    )}
                  </div>
                  <div className="bg-white/20 rounded p-2 text-center">
                    <div className="text-xs">QR Code Placeholder</div>
                  </div>
                </div>
              </div>

              {/* Notification Preview */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <Label>Notification Preview</Label>
                  <button className="text-xs text-gray-500 flex items-center gap-1">
                    <Moon className="h-3 w-3" />
                    Dark
                  </button>
                </div>
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    {formData.icon && (
                      <img src={formData.icon} alt="Icon" className="w-10 h-10 rounded" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{formData.organizationName || 'TEST'}</span>
                        <span className="text-xs text-gray-500">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        Welcome to {formData.organizationName || 'TEST'}! Tap to view your exclusive offers and rewards.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">iOS Lock Screen Preview</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

