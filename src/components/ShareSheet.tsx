import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';

interface ShareSheetProps {
  shareUrl: string;
  onStopSharing: () => void;
  onClose: () => void;
}

export const ShareSheet: React.FC<ShareSheetProps> = ({ shareUrl, onStopSharing, onClose }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStop = () => {
    onStopSharing();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          animation: 'fadeInBackdrop 200ms ease-out',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="relative bg-card-bg border-t border-white/10 rounded-t-3xl px-5 pt-4 pb-10"
        style={{
          animation: 'slideUpSheet 280ms cubic-bezier(0.34, 1.06, 0.64, 1)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-sheet-title"
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

        <h3 id="share-sheet-title" className="text-white text-lg font-semibold text-center font-sans mb-6">
          {t('share.title')}
        </h3>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white rounded-2xl">
            <QRCodeSVG value={shareUrl} size={180} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Copy link */}
          <button
            type="button"
            onClick={handleCopy}
            className="w-full h-12 rounded-2xl font-semibold text-sm text-white
              bg-white/10 border border-white/15
              hover:border-white/30 transition-all duration-150 active:scale-[0.97]"
          >
            {copied ? t('share.copied') : t('share.copyLink')}
          </button>

          {/* Stop sharing */}
          <button
            type="button"
            onClick={handleStop}
            className="w-full h-12 rounded-2xl font-semibold text-sm
              transition-all duration-150 active:scale-[0.97]"
            style={{
              color: '#FCA5A5',
              background: '#7F1D1D44',
              border: '1px solid #DC262640',
            }}
          >
            {t('share.stopSharing')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareSheet;
