'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Send, ChevronUp } from 'lucide-react';

export default function CampaignsPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [deliveredNotifications, setDeliveredNotifications] = useState<any[]>([]);
  const [showDelivered, setShowDelivered] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch delivered notifications history
    fetchDeliveredNotifications();
  }, []);

  async function fetchDeliveredNotifications() {
    try {
      // In a real implementation, you'd fetch from a notifications log table
      // For now, we'll use sequence enrollments as a proxy
      const response = await fetch('/api/sequences');
      if (response.ok) {
        // This is a placeholder - in production you'd have a notifications log
        setDeliveredNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching delivered notifications:', error);
    }
  }

  async function handleBroadcast() {
    if (!message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message || 'Broadcast sent successfully',
        });
        setMessage('');
        // Refresh delivered notifications
        fetchDeliveredNotifications();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to send broadcast',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Campaigns</h1>
        <p className="text-gray-600">Manage your scheduled notification campaigns.</p>
      </div>

      {/* No Scheduled Campaigns */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No scheduled campaigns</h3>
            <p className="text-gray-600 mb-6">Schedule a campaign to get started.</p>
            <Button
              onClick={() => {
                // Scroll to create notification form
                document.getElementById('create-notification')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Schedule Notification
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create Notification */}
      <Card id="create-notification" className="mb-6">
        <CardHeader>
          <CardTitle>Create Notification</CardTitle>
          <CardDescription>Send push notifications to your pass holders.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Input
              id="message"
              type="text"
              placeholder="Enter your notification message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleBroadcast();
                }
              }}
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="send-immediately"
                name="delivery"
                defaultChecked
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
                className="w-4 h-4"
              />
              <Label htmlFor="schedule-later" className="font-normal cursor-pointer">
                Schedule for Later
              </Label>
            </div>
          </div>
          <Button
            onClick={handleBroadcast}
            disabled={loading || !message.trim()}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {loading ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Now
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Delivered Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Delivered Notifications</CardTitle>
            <button
              onClick={() => setShowDelivered(!showDelivered)}
              className="text-gray-500 hover:text-gray-700"
            >
              <ChevronUp
                className={`h-5 w-5 transition-transform ${showDelivered ? '' : 'rotate-180'}`}
              />
            </button>
          </div>
        </CardHeader>
        {showDelivered && (
          <CardContent>
            {deliveredNotifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No delivered notifications yet
              </div>
            ) : (
              <div className="space-y-2">
                {deliveredNotifications.map((notification, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{notification.message}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(notification.sentAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-sm text-green-600">Delivered</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
