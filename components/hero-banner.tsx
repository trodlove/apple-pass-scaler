'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

interface HeroBannerProps {
  userName?: string;
  passesUsed?: number;
  totalPasses?: number;
  onCreatePass?: () => void;
}

export function HeroBanner({ 
  userName = 'Michael', 
  passesUsed = 1, 
  totalPasses = 1,
  onCreatePass 
}: HeroBannerProps) {
  return (
    <div className="mb-8">
      {/* Welcome Message */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          Hi {userName}, Welcome
        </h1>
      </div>

      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 p-8 mb-8">
        <div className="flex items-center justify-between">
          {/* Left Content */}
          <div className="flex-1">
            {onCreatePass ? (
              <Button
                onClick={onCreatePass}
                className="bg-black text-white border-2 border-white hover:bg-gray-900"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Pass
              </Button>
            ) : (
              <Link href="/dashboard/passes/new">
                <Button className="bg-black text-white border-2 border-white hover:bg-gray-900">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Pass
                </Button>
              </Link>
            )}
            <p className="text-white/90 text-sm mt-4">
              {passesUsed} of {totalPasses} passes used
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

