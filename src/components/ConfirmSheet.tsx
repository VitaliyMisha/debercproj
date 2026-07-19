import type React from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from './BottomSheet';

interface ConfirmSheetProps {
  title: string;
  description?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmSheet: React.FC<ConfirmSheetProps> = ({ title, description, confirmLabel, onConfirm, onCancel }) => {
  const { t } = useTranslation();
  return (
    <BottomSheet onClose={onCancel} ariaLabelledBy="confirm-sheet-title">
      {/* Title */}
      <h3 id="confirm-sheet-title" className="text-white text-lg font-semibold text-center font-sans mb-1">
        {title}
      </h3>

      {/* Description */}
      {description && <p className="text-white/45 text-sm text-center font-sans leading-relaxed mb-6">{description}</p>}

      <div className={`flex flex-col gap-3 ${description ? '' : 'mt-6'}`}>
        {/* Confirm — danger style */}
        <button
          type="button"
          onClick={onConfirm}
          className="w-full h-14 rounded-2xl font-semibold text-base text-white
            transition-all duration-150 active:scale-[0.97]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
          style={{
            background: 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 50%, #B91C1C 100%)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            boxShadow: '0 4px 20px rgba(185,28,28,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {confirmLabel}
        </button>

        {/* Cancel */}
        <button
          type="button"
          onClick={onCancel}
          className="w-full h-12 rounded-2xl font-semibold text-sm text-white/60
            bg-white/5 border border-white/10
            hover:border-white/20 hover:text-white/80
            transition-all duration-150 active:scale-[0.97]"
        >
          {t('common.cancel')}
        </button>
      </div>
    </BottomSheet>
  );
};

export default ConfirmSheet;
