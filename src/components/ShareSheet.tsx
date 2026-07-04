import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { BottomSheet } from './BottomSheet';

interface ShareSheetProps {
  shareUrl: string;
  onStopSharing: () => void;
  onClose: () => void;
}

export const ShareSheet: React.FC<ShareSheetProps> = ({ shareUrl, onStopSharing, onClose }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setCopied(true);
        if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
        copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  const handleStop = () => {
    onStopSharing();
    onClose();
  };

  return (
    <BottomSheet onClose={onClose} ariaLabelledBy="share-sheet-title">
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
    </BottomSheet>
  );
};

export default ShareSheet;
