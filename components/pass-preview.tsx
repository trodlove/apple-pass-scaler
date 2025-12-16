'use client';

import { usePassEditorStore } from '@/stores/pass-editor-store';

export function PassPreview() {
  const passData = usePassEditorStore();

  const passStyles = {
    backgroundColor: passData.backgroundColor,
    color: passData.foregroundColor,
  };

  const labelStyles = {
    color: passData.labelColor,
  };

  // Get the best logo/icon/strip URL (prefer @2x, fallback to @1x)
  const logoUrl = passData.logo_2x_url || passData.logo_1x_url || '';
  const iconUrl = passData.icon_2x_url || passData.icon_1x_url || '';
  const stripUrl = passData.strip_2x_url || passData.strip_1x_url || '';

  return (
    <div className="w-[290px] mx-auto">
      {/* Pass Container */}
      <div
        style={passStyles}
        className="rounded-2xl shadow-2xl overflow-hidden relative"
      >
        {/* Header Section */}
        <div className="relative px-4 pt-4 pb-2">
          {/* Logo */}
          {logoUrl && (
            <div className="absolute top-4 left-4">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-8 w-auto"
                style={{ maxWidth: '160px' }}
              />
            </div>
          )}

          {/* Logo Text */}
          {passData.logoText && (
            <div className="absolute top-4 left-4" style={{ marginLeft: logoUrl ? '180px' : '0' }}>
              <span className="text-xs font-medium" style={labelStyles}>
                {passData.logoText}
              </span>
            </div>
          )}

          {/* Header Fields */}
          <div className="text-right mt-12">
            {passData.headerLabel && (
              <div className="text-xs font-medium mb-1" style={labelStyles}>
                {passData.headerLabel}
              </div>
            )}
            {passData.headerValue && (
              <div className="text-lg font-bold">
                {passData.headerValue}
              </div>
            )}
          </div>
        </div>

        {/* Strip Image */}
        {stripUrl && (
          <div className="w-full h-32 relative overflow-hidden">
            <img
              src={stripUrl}
              alt="Strip"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Primary Fields Section */}
        <div className="px-4 py-3">
          {/* Secondary Fields */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {passData.secondaryLeftLabel && (
              <div>
                <div className="text-xs font-medium mb-1" style={labelStyles}>
                  {passData.secondaryLeftLabel}
                </div>
                <div className="text-sm font-semibold">
                  {passData.secondaryLeftValue || ''}
                </div>
              </div>
            )}
            {passData.secondaryRightLabel && (
              <div>
                <div className="text-xs font-medium mb-1" style={labelStyles}>
                  {passData.secondaryRightLabel}
                </div>
                <div className="text-sm font-semibold">
                  {passData.secondaryRightValue || ''}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Barcode Section */}
        <div className="px-4 pb-4">
          <div className="bg-white/20 rounded-lg p-3 flex items-center justify-center">
            {passData.barcodeMessage ? (
              <div className="text-center">
                <div className="w-24 h-24 bg-white/30 rounded mx-auto mb-2 flex items-center justify-center">
                  <div className="text-xs opacity-60">QR</div>
                </div>
                <div className="text-xs opacity-80" style={labelStyles}>
                  {passData.barcodeMessage.substring(0, 20)}...
                </div>
              </div>
            ) : (
              <div className="text-xs opacity-60">QR Code Placeholder</div>
            )}
          </div>
        </div>

        {/* Icon (for notification preview) */}
        {iconUrl && (
          <div className="absolute top-4 left-4 opacity-0 pointer-events-none">
            <img src={iconUrl} alt="Icon" className="w-8 h-8 rounded" />
          </div>
        )}
      </div>

      {/* Notification Preview */}
      <div className="mt-6">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-start gap-3">
            {iconUrl && (
              <img src={iconUrl} alt="Icon" className="w-10 h-10 rounded" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-gray-900">
                  {passData.organizationName || 'Wallet Pass'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-gray-700">
                {passData.notificationMessage || 'Welcome! Check back for updates.'}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">iOS Lock Screen Preview</p>
        </div>
      </div>
    </div>
  );
}

