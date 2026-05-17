import React, { useCallback } from 'react';

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
  const handleBackdrop = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={handleBackdrop}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full bg-card-bg rounded-t-2xl p-6 pb-10 border-t border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />

        <h3 className="text-white font-sans font-semibold text-lg mb-6 text-center">
          {label}
        </h3>

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
          Проведіть вліво/вправо або потягніть повзунок
        </p>
      </div>
    </div>
  );
};

export default PenaltySheet;
