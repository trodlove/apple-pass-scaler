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
  const backgroundColor = passData?.backgroundColor || '#000000';
  const foregroundColor = passData?.foregroundColor || '#FFFFFF';
  const labelColor = passData?.labelColor || '#CCCCCC';
  
  // Get image URLs (prefer @2x, fallback to @1x, then old format)
  const logoUrl = passData?.logo_2x_url || passData?.logo_1x_url || passData?.logo || '';
  const iconUrl = passData?.icon_2x_url || passData?.icon_1x_url || passData?.icon || '';
  const stripUrl = passData?.strip_2x_url || passData?.strip_1x_url || passData?.stripImage || '';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Pass Preview */}
      <div
        className="relative"
        style={{
          backgroundColor,
          color: foregroundColor,
          minHeight: '200px',
        }}
      >
        {/* Logo */}
        {logoUrl && !imageError && (
          <div className="absolute top-4 left-4">
            <img
              src={logoUrl}
              alt="Logo"
              className="h-8 w-auto"
              style={{ maxWidth: '120px' }}
              onError={() => setImageError(true)}
            />
          </div>
        )}
        
        {/* Icon (for notification) */}
        {iconUrl && !imageError && (
          <div className="absolute top-4 left-4" style={{ marginTop: logoUrl ? '40px' : '0' }}>
            <img
              src={iconUrl}
              alt="Icon"
              className="w-10 h-10 rounded"
              onError={() => setImageError(true)}
            />
          </div>
        )}

        {/* Header Fields */}
        <div className="absolute top-4 right-4 text-right">
          {passData?.headerLabel && (
            <div className="text-xs opacity-80 mb-1" style={{ color: labelColor }}>
              {passData.headerLabel}
            </div>
          )}
          {passData?.headerValue && (
            <div className="text-lg font-bold">{passData.headerValue}</div>
          )}
        </div>

        {/* Strip Image */}
        {stripUrl && (
          <div className="absolute top-20 left-0 right-0 h-32">
            <img
              src={stripUrl}
              alt="Strip"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Secondary Fields */}
        <div className="absolute bottom-16 left-4 right-4 grid grid-cols-2 gap-4">
          {passData?.secondaryLeftLabel && (
            <div>
              <div className="text-xs opacity-80 mb-1" style={{ color: labelColor }}>
                {passData.secondaryLeftLabel}
              </div>
              <div className="font-semibold">{passData.secondaryLeftValue || ''}</div>
            </div>
          )}
          {passData?.secondaryRightLabel && (
            <div>
              <div className="text-xs opacity-80 mb-1" style={{ color: labelColor }}>
                {passData.secondaryRightLabel}
              </div>
              <div className="font-semibold">{passData.secondaryRightValue || ''}</div>
            </div>
          )}
        </div>

        {/* QR Code Placeholder */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-white/20 rounded p-2">
            <div className="w-16 h-16 bg-white/30 rounded flex items-center justify-center">
              <div className="text-xs opacity-60">QR</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pass Info */}
      <div className="p-4 space-y-2">
        <div className="font-semibold text-gray-900">
          {passData?.organizationName || 'Untitled Pass'}
        </div>
        <div className="text-sm text-gray-600">
          {passData?.description || passData?.organizationName || 'No description'}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          {onShare && (
            <Button variant="outline" size="sm" onClick={onShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          )}
          {onNotify && (
            <Button variant="outline" size="sm" onClick={onNotify}>
              <Bell className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDownload && (
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

