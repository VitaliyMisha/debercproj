import React from 'react';

interface ConfirmSheetProps {
  title: string;
  description?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmSheet: React.FC<ConfirmSheetProps> = ({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}) => (
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
      onClick={onCancel}
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
      aria-labelledby="confirm-sheet-title"
    >
      {/* Drag handle */}
      <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

      {/* Title */}
      <h3
        id="confirm-sheet-title"
        className="text-white text-lg font-semibold text-center font-sans mb-1"
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-white/45 text-sm text-center font-sans leading-relaxed mb-6">
          {description}
        </p>
      )}

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
          Скасувати
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmSheet;
