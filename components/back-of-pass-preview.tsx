'use client';

import { usePassEditorStore } from '@/stores/pass-editor-store';

export function BackOfPassPreview() {
  const passData = usePassEditorStore();
  const iconUrl = passData.icon_2x_url || passData.icon_1x_url || '';

  return (
    <div className="flex flex-col items-center mt-6">
      {/* iOS Pass Back Container - Dark Mode Style - iPhone 13 dimensions */}
      <div 
        className="bg-[#1C1C1E] rounded-2xl overflow-hidden text-white"
        style={{ width: '280px' }}
      >
        {/* Mini Pass Preview at Top */}
        <div className="flex justify-center pt-5 pb-3">
          <div 
            className="w-20 h-14 rounded-lg shadow-lg overflow-hidden"
            style={{ backgroundColor: passData.backgroundColor || '#B5A094' }}
          >
            <div className="p-1.5 h-full flex flex-col justify-between">
              <div className="flex items-center gap-1">
                {iconUrl ? (
                  <img src={iconUrl} alt="" className="w-2.5 h-2.5 rounded-sm" />
                ) : (
                  <div className="w-2.5 h-2.5 bg-black/30 rounded-sm" />
                )}
                <span className="text-[4px] text-black/80 truncate">{passData.logoText || 'Logo'}</span>
              </div>
              <div className="text-[5px] text-black/80">{passData.organizationName || 'Apple Pass Scaler'}</div>
              <div className="flex justify-between text-[3px] text-black/60">
                <span>{passData.secondaryLeftValue || 'value'}</span>
                <span>{passData.secondaryRightValue || 'value'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pass Title */}
        <div className="text-center pb-2">
          <h3 className="text-lg font-semibold">Wallet Pass</h3>
          <p className="text-xs text-gray-400">Updated 1 minute ago</p>
        </div>

        {/* Toggles Section */}
        <div className="mx-3 mt-3 bg-[#2C2C2E] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-700/50">
            <span className="text-[14px]">Automatic Updates</span>
            <div className="w-10 h-6 bg-green-500 rounded-full relative">
              <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow" />
            </div>
          </div>
          <div className="flex items-center justify-between px-3 py-2.5">
            <span className="text-[14px]">Allow Notifications</span>
            <div className="w-10 h-6 bg-green-500 rounded-full relative">
              <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow" />
            </div>
          </div>
        </div>

        {/* Fields Section */}
        <div className="mx-3 mt-3 mb-4 bg-[#2C2C2E] rounded-xl overflow-hidden">
          {/* Latest News */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-700/50">
            <span className="text-[14px] text-gray-300">Latest news:</span>
            <span className="text-[14px] text-blue-400 text-right max-w-[120px] truncate">
              {passData.latestNewsText || 'testes'}
            </span>
          </div>

          {/* Make Money */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-700/50">
            <span className="text-[14px] text-gray-300">Make more money:</span>
            <span className="text-[14px] text-blue-400">Make Money</span>
          </div>

          {/* Redeem Cash */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-700/50">
            <span className="text-[14px] text-gray-300">Redeem your cash:</span>
            <span className="text-[14px] text-blue-400">Redeem Earnings</span>
          </div>

          {/* Share and Earn */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-700/50">
            <span className="text-[14px] text-gray-300">Share and earn:</span>
            <span className="text-[14px] text-blue-400">Pass the Gravy</span>
          </div>

          {/* Last Update */}
          <div className="flex items-start justify-between px-3 py-2.5 border-b border-gray-700/50">
            <span className="text-[14px] text-gray-300 shrink-0">Last Update:</span>
            <span className="text-[14px] text-gray-100 text-right ml-2">
              {passData.notificationMessage || 'Check this new offer out!'}
            </span>
          </div>

          {/* Customer Service */}
          <div className="flex items-center justify-between px-3 py-2.5">
            <span className="text-[14px] text-gray-300">Customer service:</span>
            <span className="text-[14px] text-blue-400">Get Help</span>
          </div>
        </div>
      </div>
    </div>
  );
}
