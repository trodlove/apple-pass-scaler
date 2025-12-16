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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" style={{ maxWidth: '320px' }}>
      {/* Pass Preview - proper flow layout */}
      <div
        className="rounded-t-xl overflow-hidden flex flex-col"
        style={{
          backgroundColor,
          color: foregroundColor,
        }}
      >
        {/* === HEADER ROW === */}
        <div className="flex items-start justify-between px-3 pt-3 pb-2">
          {/* Left: Icon + Logo Text */}
          <div className="flex items-center gap-1.5">
            {iconUrl && !imageError ? (
              <img
                src={iconUrl}
                alt="Icon"
                className="w-8 h-8 rounded-md object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div 
                className="w-8 h-8 rounded-md flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
              >
                <div className="w-4 h-5 bg-black/50 rounded-sm" />
              </div>
            )}
            <span 
              className="text-[13px] font-medium"
              style={{ color: foregroundColor }}
            >
              {passData?.logoText || 'Logo'}
            </span>
          </div>

          {/* Right: Header Field */}
          <div className="text-right">
            <div 
              className="text-[9px] uppercase tracking-wide font-medium"
              style={{ color: labelColor }}
            >
              {passData?.headerLabel || 'HEADER'}
            </div>
            <div 
              className="text-[16px] font-semibold leading-tight"
              style={{ color: foregroundColor }}
            >
              {passData?.headerValue || 'value'}
            </div>
          </div>
        </div>

        {/* === PRIMARY FIELD === */}
        <div className="px-3 pb-2">
          <div 
            className="text-[9px] uppercase tracking-wide font-medium"
            style={{ color: labelColor }}
          >
            {passData?.primaryLabel || 'WELCOME'}
          </div>
          <div 
            className="text-[20px] font-semibold leading-tight"
            style={{ color: foregroundColor }}
          >
            {passData?.primaryValue || passData?.organizationName || 'Apple Pass Scaler'}
          </div>
        </div>

        {/* === STRIP IMAGE (if exists) === */}
        {stripUrl && (
          <div className="w-full h-20 overflow-hidden">
            <img
              src={stripUrl}
              alt="Strip"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* === SECONDARY FIELDS === */}
        <div className="flex justify-between px-3 py-3">
          <div>
            <div 
              className="text-[9px] uppercase tracking-wide font-medium"
              style={{ color: labelColor }}
            >
              {passData?.secondaryLeftLabel || 'LEFT'}
            </div>
            <div 
              className="text-[13px] font-medium"
              style={{ color: foregroundColor }}
            >
              {passData?.secondaryLeftValue || 'value'}
            </div>
          </div>
          <div className="text-right">
            <div 
              className="text-[9px] uppercase tracking-wide font-medium"
              style={{ color: labelColor }}
            >
              {passData?.secondaryRightLabel || 'RIGHT'}
            </div>
            <div 
              className="text-[13px] font-medium"
              style={{ color: foregroundColor }}
            >
              {passData?.secondaryRightValue || 'value'}
            </div>
          </div>
        </div>

        {/* === SPACER === */}
        <div className="min-h-[40px]" />

        {/* === QR CODE === */}
        <div className="flex justify-center pb-4">
          <div className="bg-white rounded-lg p-2 shadow">
            <div className="w-16 h-16 flex items-center justify-center">
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
      <div className="p-3 space-y-1.5">
        <div className="font-semibold text-gray-900 text-[14px]">
          {passData?.organizationName || 'Apple Pass Scaler'}
        </div>
        <div className="text-[11px] text-gray-500 truncate font-mono">
          {pass.serial_number}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 pt-1.5">
          {onShare && (
            <Button variant="outline" size="sm" onClick={onShare} title="Share" className="h-8 w-8 p-0">
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {onNotify && (
            <Button variant="outline" size="sm" onClick={onNotify} title="Send Notification" className="h-8 w-8 p-0">
              <Bell className="h-3.5 w-3.5" />
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit} title="Edit" className="h-8 w-8 p-0">
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDownload && (
            <Button variant="outline" size="sm" onClick={onDownload} title="Download" className="h-8 w-8 p-0">
              <Download className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" size="sm" onClick={onDelete} className="h-8 w-8 p-0 text-red-600 hover:text-red-700" title="Delete">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
