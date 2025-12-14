'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function CampaignsPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
      <h1 className="text-3xl font-bold mb-8">Campaigns</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Send Broadcast Message</CardTitle>
          <CardDescription>
            Send a message to all active passes. This will update all passes and trigger push notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Input
              id="message"
              type="text"
              placeholder="Enter your broadcast message..."
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
          <Button
            onClick={handleBroadcast}
            disabled={loading || !message.trim()}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Send Broadcast'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

