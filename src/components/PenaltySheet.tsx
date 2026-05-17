import React, { useCallback, useRef } from 'react';

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
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    if (delta > 80) onClose();
    touchStartY.current = null;
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop — окремий шар, кліком закриває */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full bg-card-bg rounded-t-2xl p-6 pb-10 border-t border-white/10 shadow-2xl"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-sans font-semibold text-lg">{label}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрити"
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
          Проведіть вниз або торкніться фону щоб закрити
        </p>
      </div>
    </div>
  );
};

export default PenaltySheet;
