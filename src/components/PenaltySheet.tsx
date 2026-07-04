import React from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from './BottomSheet';

interface PenaltySheetProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onClose: () => void;
}

export const PenaltySheet: React.FC<PenaltySheetProps> = ({
  label,
  value,
  onChange,
  onClose,
}) => {
  const { t } = useTranslation();

  return (
    <BottomSheet onClose={onClose} ariaLabelledBy="penalty-sheet-title">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 id="penalty-sheet-title" className="text-white font-sans font-semibold text-lg">{label}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="w-8 h-8 flex items-center justify-center rounded-full text-muted
            hover:text-white hover:bg-white/10 transition-colors text-lg leading-none"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center gap-4">
        <input
          id="penalty-range"
          name="penalty-range"
          type="range"
          min={-200}
          max={0}
          step={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-gold-from"
        />
        <span
          className="w-16 text-center text-xl font-bold"
          style={{
            color: value < 0 ? 'var(--color-score-neg)' : 'var(--color-score-pos)',
          }}
        >
          {value}
        </span>
      </div>

      <p className="text-muted text-sm text-center mt-4">
        {t('common.sheetCloseHint')}
      </p>
    </BottomSheet>
  );
};

export default PenaltySheet;
