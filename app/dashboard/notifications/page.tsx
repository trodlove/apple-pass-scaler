'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Send, Moon } from 'lucide-react';
import type { Pass } from '@/lib/types';

function NotificationsContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [passes, setPasses] = useState<Pass[]>([]);
  const [selectedPassId, setSelectedPassId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [deliveryType, setDeliveryType] = useState<'immediate' | 'scheduled'>('immediate');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    fetchPasses();
    const passId = searchParams?.get('passId');
    if (passId) {
      setSelectedPassId(passId);
    }
  }, [searchParams]);

  async function fetchPasses() {
    try {
      const response = await fetch('/api/passes');
      if (response.ok) {
        const data = await response.json();
        setPasses(data);
        if (data.length > 0 && !selectedPassId) {
          setSelectedPassId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching passes:', error);
    }
  }

  async function handleSend() {
    if (!selectedPassId || !message.trim()) {
      toast({
        title: 'Error',
        description: 'Please select a pass and enter a message',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      if (deliveryType === 'immediate') {
        // Send to specific pass
        const response = await fetch('/api/test-specific-pass', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            serialNumber: passes.find(p => p.id === selectedPassId)?.serial_number,
            message: message.trim(),
          }),
        });

        if (response.ok) {
          toast({
            title: 'Success',
            description: 'Notification sent successfully',
          });
          setMessage('');
        } else {
          const data = await response.json();
          toast({
            title: 'Error',
            description: data.error || 'Failed to send notification',
            variant: 'destructive',
          });
        }
      } else {
        // TODO: Implement scheduling
        toast({
          title: 'Coming Soon',
          description: 'Scheduled notifications will be available soon',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const selectedPass = passes.find(p => p.id === selectedPassId);
  const passData = selectedPass?.pass_data as any;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Schedule Notification</h1>
        <p className="text-gray-600">Send push notifications to your pass holders.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create Notification Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Notification</CardTitle>
            <CardDescription>Configure your notification settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Select Pass */}
            <div className="space-y-2">
              <Label htmlFor="pass">Select Pass</Label>
              <select
                id="pass"
                value={selectedPassId}
                onChange={(e) => setSelectedPassId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Choose a pass...</option>
                {passes.map((pass) => {
                  const orgName = (pass.pass_data as any)?.organizationName || 'Untitled Pass';
                  return (
                    <option key={pass.id} value={pass.id}>
                      {orgName}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your notification message..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[120px]"
              />
            </div>

            {/* Delivery Time */}
            <div className="space-y-2">
              <Label>Delivery Time</Label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="send-immediately"
                    name="delivery"
                    checked={deliveryType === 'immediate'}
                    onChange={() => setDeliveryType('immediate')}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="send-immediately" className="font-normal cursor-pointer">
                    Send Immediately
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="schedule-later"
                    name="delivery"
                    checked={deliveryType === 'scheduled'}
                    onChange={() => setDeliveryType('scheduled')}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="schedule-later" className="font-normal cursor-pointer">
                    Schedule for Later
                  </Label>
                </div>
              </div>
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={loading || !selectedPassId || !message.trim()}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {loading ? (
                'Sending...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Now
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Preview</CardTitle>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <Moon className="h-4 w-4" />
                {darkMode ? 'Dark' : 'Light'}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedPass ? (
              <div className="space-y-4">
                {/* Notification Preview */}
                <div
                  className={`rounded-lg p-4 shadow-sm ${
                    darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {passData?.icon && (
                      <img
                        src={passData.icon}
                        alt="Icon"
                        className="w-10 h-10 rounded"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`font-semibold text-sm ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          {passData?.organizationName || 'TEST'}
                        </span>
                        <span
                          className={`text-xs ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          {new Date().toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p
                        className={`text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        {message || 'Your notification message will appear here'}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Notification Preview
                </p>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Select a pass to preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
      <NotificationsContent />
    </Suspense>
  );
}

