'use client';

import { usePassEditorStore } from '@/stores/pass-editor-store';

export function BackOfPassPreview() {
  const passData = usePassEditorStore();

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <h3 className="font-semibold text-lg mb-4 text-gray-900">Back of Pass Preview</h3>
      
      <div className="space-y-4">
        {/* Latest News */}
        {passData.latestNewsText && (
          <div className="border-b pb-3">
            <div className="text-sm font-medium text-gray-700 mb-1">Latest News</div>
            <div className="text-sm text-gray-600">
              {passData.latestNewsLink ? (
                <a href={passData.latestNewsLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {passData.latestNewsText}
                </a>
              ) : (
                <span>{passData.latestNewsText}</span>
              )}
            </div>
          </div>
        )}

        {/* Make Money Link */}
        {passData.makeMoneyLink && (
          <div className="border-b pb-3">
            <a href={passData.makeMoneyLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
              Make Money
            </a>
          </div>
        )}

        {/* Redeem Cash Link */}
        {passData.redeemCashLink && (
          <div className="border-b pb-3">
            <a href={passData.redeemCashLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
              Redeem Earnings
            </a>
          </div>
        )}

        {/* Share and Earn Link */}
        {passData.shareEarnLink && (
          <div className="border-b pb-3">
            <a href={passData.shareEarnLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
              Pass the Gravy
            </a>
          </div>
        )}

        {/* Last Update / Notification Message */}
        {passData.notificationMessage && (
          <div className="border-b pb-3">
            <div className="text-sm font-medium text-gray-700 mb-1">Last Update</div>
            <div className="text-sm text-gray-600">{passData.notificationMessage}</div>
          </div>
        )}

        {/* Customer Service Link */}
        {passData.customerServiceLink && (
          <div>
            <a href={passData.customerServiceLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
              Get Help
            </a>
          </div>
        )}

        {!passData.latestNewsText && !passData.makeMoneyLink && !passData.redeemCashLink && !passData.shareEarnLink && !passData.notificationMessage && !passData.customerServiceLink && (
          <div className="text-sm text-gray-500 text-center py-4">
            No back fields configured yet
          </div>
        )}
      </div>
    </div>
  );
}

