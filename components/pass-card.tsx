'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Bell, Edit, Download, Trash2 } from 'lucide-react';
import type { Pass } from '@/lib/types';

interface PassCardProps {
  pass: Pass;
  onShare?: () => void;
  onNotify?: () => void;
  onEdit?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
}

export function PassCard({ pass, onShare, onNotify, onEdit, onDownload, onDelete }: PassCardProps) {
  const passData = pass.pass_data as any;
  const [imageError, setImageError] = useState(false);

  // Get colors with defaults
  const backgroundColor = passData?.backgroundColor || '#B5A094';
  const foregroundColor = passData?.foregroundColor || '#000000';
  const labelColor = passData?.labelColor || '#666666';
  
  // Get image URLs (prefer @2x, fallback to @1x, then old format)
  const iconUrl = passData?.icon_2x_url || passData?.icon_1x_url || passData?.icon || '';
  const stripUrl = passData?.strip_2x_url || passData?.strip_1x_url || passData?.stripImage || '';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-[340px]">
      {/* Pass Preview - matches iOS Wallet exactly */}
      <div
        className="relative rounded-t-xl overflow-hidden"
        style={{
          backgroundColor,
          color: foregroundColor,
          height: '380px',
        }}
      >
        {/* === TOP HEADER ROW === */}
        <div className="flex items-start justify-between px-4 pt-4">
          {/* Left: Icon + Logo Text */}
          <div className="flex items-center gap-2">
            {iconUrl && !imageError ? (
              <img
                src={iconUrl}
                alt="Icon"
                className="w-10 h-10 rounded-lg object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
              >
                <div className="w-5 h-6 bg-black/50 rounded-sm" />
              </div>
            )}
            <span 
              className="text-base font-medium"
              style={{ color: foregroundColor }}
            >
              {passData?.logoText || 'Logo'}
            </span>
          </div>

          {/* Right: Header Field */}
          <div className="text-right">
            <div 
              className="text-[10px] uppercase tracking-wide font-medium"
              style={{ color: labelColor }}
            >
              {passData?.headerLabel || 'HEADER'}
            </div>
            <div 
              className="text-xl font-semibold leading-tight"
              style={{ color: foregroundColor }}
            >
              {passData?.headerValue || 'value'}
            </div>
          </div>
        </div>

        {/* === PRIMARY FIELD === */}
        <div className="px-4 mt-4">
          <div 
            className="text-[10px] uppercase tracking-wide font-medium"
            style={{ color: labelColor }}
          >
            {passData?.primaryLabel || 'WELCOME'}
          </div>
          <div 
            className="text-2xl font-semibold leading-tight"
            style={{ color: foregroundColor }}
          >
            {passData?.primaryValue || passData?.organizationName || 'Apple Pass Scaler'}
          </div>
        </div>

        {/* === STRIP IMAGE (if exists) === */}
        {stripUrl && (
          <div className="w-full h-24 mt-3 overflow-hidden">
            <img
              src={stripUrl}
              alt="Strip"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* === SECONDARY FIELDS === */}
        <div className="flex justify-between px-4 mt-4">
          <div>
            <div 
              className="text-[10px] uppercase tracking-wide font-medium"
              style={{ color: labelColor }}
            >
              {passData?.secondaryLeftLabel || 'LEFT'}
            </div>
            <div 
              className="text-base font-medium"
              style={{ color: foregroundColor }}
            >
              {passData?.secondaryLeftValue || 'value'}
            </div>
          </div>
          <div className="text-right">
            <div 
              className="text-[10px] uppercase tracking-wide font-medium"
              style={{ color: labelColor }}
            >
              {passData?.secondaryRightLabel || 'RIGHT'}
            </div>
            <div 
              className="text-base font-medium"
              style={{ color: foregroundColor }}
            >
              {passData?.secondaryRightValue || 'value'}
            </div>
          </div>
        </div>

        {/* === QR CODE === */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div className="bg-white rounded-xl p-2.5 shadow-lg">
            <div className="w-20 h-20 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <rect x="0" y="0" width="100" height="100" fill="white"/>
                <rect x="5" y="5" width="25" height="25" fill="black"/>
                <rect x="10" y="10" width="15" height="15" fill="white"/>
                <rect x="13" y="13" width="9" height="9" fill="black"/>
                <rect x="70" y="5" width="25" height="25" fill="black"/>
                <rect x="75" y="10" width="15" height="15" fill="white"/>
                <rect x="78" y="13" width="9" height="9" fill="black"/>
                <rect x="5" y="70" width="25" height="25" fill="black"/>
                <rect x="10" y="75" width="15" height="15" fill="white"/>
                <rect x="13" y="78" width="9" height="9" fill="black"/>
                <rect x="38" y="8" width="5" height="5" fill="black"/>
                <rect x="48" y="8" width="5" height="5" fill="black"/>
                <rect x="38" y="38" width="5" height="5" fill="black"/>
                <rect x="48" y="43" width="5" height="5" fill="black"/>
                <rect x="78" y="78" width="5" height="5" fill="black"/>
                <rect x="88" y="88" width="5" height="5" fill="black"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Pass Info */}
      <div className="p-4 space-y-2">
        <div className="font-semibold text-gray-900">
          {passData?.organizationName || 'Apple Pass Scaler'}
        </div>
        <div className="text-sm text-gray-500 truncate font-mono">
          {pass.serial_number}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          {onShare && (
            <Button variant="outline" size="sm" onClick={onShare} title="Share">
              <Share2 className="h-4 w-4" />
            </Button>
          )}
          {onNotify && (
            <Button variant="outline" size="sm" onClick={onNotify} title="Send Notification">
              <Bell className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit} title="Edit">
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDownload && (
            <Button variant="outline" size="sm" onClick={onDownload} title="Download">
              <Download className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700" title="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
