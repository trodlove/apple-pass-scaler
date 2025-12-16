'use client';

import { usePassEditorStore } from '@/stores/pass-editor-store';

export function PassPreview() {
  const passData = usePassEditorStore();

  // Get the best logo/icon/strip URL (prefer @2x, fallback to @1x)
  const logoUrl = passData.logo_2x_url || passData.logo_1x_url || '';
  const iconUrl = passData.icon_2x_url || passData.icon_1x_url || '';
  const stripUrl = passData.strip_2x_url || passData.strip_1x_url || '';

  return (
    <div className="w-[290px] mx-auto">
      {/* Pass Container - matches iOS Wallet pass exactly */}
      <div
        className="rounded-[14px] overflow-hidden relative"
        style={{
          backgroundColor: passData.backgroundColor || '#B5A094',
          color: passData.foregroundColor || '#000000',
          aspectRatio: '0.63',
        }}
      >
        {/* === TOP HEADER ROW === */}
        <div className="flex items-start justify-between px-4 pt-4">
          {/* Left: Icon + Logo Text */}
          <div className="flex items-center gap-2">
            {iconUrl ? (
              <img
                src={iconUrl}
                alt="Icon"
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
              >
                <div className="w-5 h-6 bg-black/60 rounded-sm" />
              </div>
            )}
            <span 
              className="text-base font-medium"
              style={{ color: passData.foregroundColor || '#000000' }}
            >
              {passData.logoText || 'Logo Text'}
            </span>
          </div>

          {/* Right: Header Field */}
          <div className="text-right">
            <div 
              className="text-[10px] uppercase tracking-wide"
              style={{ color: passData.labelColor || '#666666' }}
            >
              {passData.headerLabel || 'HEADER'}
            </div>
            <div 
              className="text-lg font-semibold -mt-0.5"
              style={{ color: passData.foregroundColor || '#000000' }}
            >
              {passData.headerValue || 'Value'}
            </div>
          </div>
        </div>

        {/* === PRIMARY FIELD === */}
        <div className="px-4 mt-4">
          <div 
            className="text-[10px] uppercase tracking-wide"
            style={{ color: passData.labelColor || '#666666' }}
          >
            {passData.primaryLabel || 'WELCOME'}
          </div>
          <div 
            className="text-[26px] font-semibold leading-tight"
            style={{ color: passData.foregroundColor || '#000000' }}
          >
            {passData.primaryValue || passData.organizationName || 'Apple Pass Scaler'}
          </div>
        </div>

        {/* === STRIP IMAGE (if exists) === */}
        {stripUrl && (
          <div className="w-full h-28 mt-3 overflow-hidden">
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
              className="text-[10px] uppercase tracking-wide"
              style={{ color: passData.labelColor || '#666666' }}
            >
              {passData.secondaryLeftLabel || 'LEFT'}
            </div>
            <div 
              className="text-base font-medium"
              style={{ color: passData.foregroundColor || '#000000' }}
            >
              {passData.secondaryLeftValue || 'value'}
            </div>
          </div>
          <div className="text-right">
            <div 
              className="text-[10px] uppercase tracking-wide"
              style={{ color: passData.labelColor || '#666666' }}
            >
              {passData.secondaryRightLabel || 'RIGHT'}
            </div>
            <div 
              className="text-base font-medium"
              style={{ color: passData.foregroundColor || '#000000' }}
            >
              {passData.secondaryRightValue || 'value'}
            </div>
          </div>
        </div>

        {/* === QR CODE === */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div className="bg-white rounded-xl p-3 shadow-lg">
            <div className="w-[100px] h-[100px] flex items-center justify-center">
              {/* Simulated QR pattern */}
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <rect x="0" y="0" width="100" height="100" fill="white"/>
                {/* Corner squares */}
                <rect x="5" y="5" width="25" height="25" fill="black"/>
                <rect x="10" y="10" width="15" height="15" fill="white"/>
                <rect x="13" y="13" width="9" height="9" fill="black"/>
                
                <rect x="70" y="5" width="25" height="25" fill="black"/>
                <rect x="75" y="10" width="15" height="15" fill="white"/>
                <rect x="78" y="13" width="9" height="9" fill="black"/>
                
                <rect x="5" y="70" width="25" height="25" fill="black"/>
                <rect x="10" y="75" width="15" height="15" fill="white"/>
                <rect x="13" y="78" width="9" height="9" fill="black"/>
                
                {/* Random pattern */}
                <rect x="38" y="8" width="5" height="5" fill="black"/>
                <rect x="48" y="8" width="5" height="5" fill="black"/>
                <rect x="38" y="18" width="5" height="5" fill="black"/>
                <rect x="43" y="13" width="5" height="5" fill="black"/>
                <rect x="53" y="13" width="5" height="5" fill="black"/>
                <rect x="58" y="18" width="5" height="5" fill="black"/>
                
                <rect x="8" y="38" width="5" height="5" fill="black"/>
                <rect x="18" y="43" width="5" height="5" fill="black"/>
                <rect x="8" y="53" width="5" height="5" fill="black"/>
                <rect x="23" y="38" width="5" height="5" fill="black"/>
                <rect x="28" y="48" width="5" height="5" fill="black"/>
                
                <rect x="38" y="38" width="5" height="5" fill="black"/>
                <rect x="48" y="43" width="5" height="5" fill="black"/>
                <rect x="43" y="48" width="5" height="5" fill="black"/>
                <rect x="53" y="53" width="5" height="5" fill="black"/>
                <rect x="58" y="38" width="5" height="5" fill="black"/>
                
                <rect x="78" y="38" width="5" height="5" fill="black"/>
                <rect x="83" y="48" width="5" height="5" fill="black"/>
                <rect x="88" y="43" width="5" height="5" fill="black"/>
                <rect x="73" y="53" width="5" height="5" fill="black"/>
                
                <rect x="38" y="73" width="5" height="5" fill="black"/>
                <rect x="48" y="78" width="5" height="5" fill="black"/>
                <rect x="43" y="83" width="5" height="5" fill="black"/>
                <rect x="53" y="73" width="5" height="5" fill="black"/>
                <rect x="58" y="88" width="5" height="5" fill="black"/>
                <rect x="63" y="78" width="5" height="5" fill="black"/>
                
                <rect x="73" y="73" width="5" height="5" fill="black"/>
                <rect x="83" y="78" width="5" height="5" fill="black"/>
                <rect x="78" y="83" width="5" height="5" fill="black"/>
                <rect x="88" y="88" width="5" height="5" fill="black"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* === iOS LOCK SCREEN NOTIFICATION PREVIEW === */}
      <div className="mt-6">
        <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-lg border border-gray-200">
          <div className="flex items-start gap-3">
            {iconUrl ? (
              <img src={iconUrl} alt="Icon" className="w-10 h-10 rounded-lg" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gray-300 flex items-center justify-center">
                <div className="w-5 h-6 bg-gray-500 rounded-sm" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-semibold text-sm text-gray-900">
                  {passData.organizationName || 'Apple Pass Scaler'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-gray-700 truncate">
                {passData.notificationMessage || 'Check this new offer out!'}
              </p>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center uppercase tracking-wide">iOS Lock Screen Preview</p>
        </div>
      </div>
    </div>
  );
}
