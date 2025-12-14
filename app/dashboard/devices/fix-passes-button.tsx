'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function FixPassesButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFix = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/fix-all-passes', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message || `Fixed ${data.fixed} of ${data.total} passes`,
        });
        // Reload the page after a short delay to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fix passes',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fix passes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleFix} disabled={isLoading} variant="default">
      {isLoading ? 'Fixing...' : 'Fix All Passes'}
    </Button>
  );
}

