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
            <h2 className="text-3xl font-bold text-white mb-4">
              Access to the world&apos;s highest attention channel.
            </h2>
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

          {/* Right Visual Elements */}
          <div className="flex items-center gap-4">
            {/* QR Code */}
            <div className="w-32 h-32 bg-orange-600 rounded-lg flex items-center justify-center">
              <div className="w-24 h-24 bg-white rounded flex items-center justify-center">
                <div className="text-xs text-gray-600">QR</div>
              </div>
            </div>

            {/* Pass Preview */}
            <div className="w-40 h-32 bg-pink-200 rounded-lg relative overflow-hidden">
              <div className="absolute top-2 left-2 text-xs font-semibold">YOUR LOGO</div>
              <div className="absolute top-2 right-2 text-xs">EXPIRE 31 Dec</div>
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="w-16 h-16 bg-black rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

