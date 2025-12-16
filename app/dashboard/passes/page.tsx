'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HeroBanner } from '@/components/hero-banner';
import { PassCard } from '@/components/pass-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Pass } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function PassesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [passes, setPasses] = useState<Pass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPasses();
  }, []);

  async function fetchPasses() {
    try {
      const response = await fetch('/api/passes');
      if (response.ok) {
        const data = await response.json();
        setPasses(data);
      }
    } catch (error) {
      console.error('Error fetching passes:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleCreatePass() {
    router.push('/dashboard/passes/new');
  }

  function handleShare(pass: Pass) {
    // TODO: Implement share functionality
    toast({
      title: 'Share',
      description: 'Share functionality coming soon',
    });
  }

  function handleNotify(pass: Pass) {
    router.push(`/dashboard/notifications?passId=${pass.id}`);
  }

  function handleEdit(pass: Pass) {
    router.push(`/dashboard/passes/${pass.id}/edit`);
  }

  async function handleDownload(pass: Pass) {
    try {
      const response = await fetch(`/api/passes/${pass.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${pass.serial_number}.pkpass`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast({
          title: 'Success',
          description: 'Pass downloaded successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download pass',
        variant: 'destructive',
      });
    }
  }

  async function handleDelete(pass: Pass) {
    if (!confirm('Are you sure you want to delete this pass?')) return;
    
    try {
      const response = await fetch(`/api/passes/${pass.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setPasses(passes.filter(p => p.id !== pass.id));
        toast({
          title: 'Success',
          description: 'Pass deleted successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete pass',
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <HeroBanner 
        passesUsed={passes.length}
        totalPasses={100} // TODO: Get from account limits
        onCreatePass={handleCreatePass}
      />

      {/* Apple Passes Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Apple Passes</h2>
        <p className="text-gray-600 mb-6">View and manage all your generated passes.</p>

        {passes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No passes yet</p>
                <Button onClick={handleCreatePass} className="bg-orange-500 hover:bg-orange-600">
                  Create Your First Pass
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {passes.map((pass) => (
              <PassCard
                key={pass.id}
                pass={pass}
                onShare={() => handleShare(pass)}
                onNotify={() => handleNotify(pass)}
                onEdit={() => handleEdit(pass)}
                onDownload={() => handleDownload(pass)}
                onDelete={() => handleDelete(pass)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
