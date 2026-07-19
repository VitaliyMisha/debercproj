import type React from 'react';
import { useCallback, useRef } from 'react';

interface BottomSheetProps {
  onClose: () => void;
  /** id of the element that labels the dialog (aria-labelledby) */
  ariaLabelledBy?: string;
  children: React.ReactNode;
}

/**
 * Shared bottom sheet: blurred backdrop (tap to close), slide-up animation,
 * drag handle and swipe-down-to-close. Used by ConfirmSheet, PenaltySheet
 * and ShareSheet so they stay visually and behaviourally consistent.
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({ onClose, ariaLabelledBy, children }) => {
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartY.current === null) return;
      const delta = e.changedTouches[0].clientY - touchStartY.current;
      if (delta > 80) onClose();
      touchStartY.current = null;
    },
    [onClose]
  );

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
        aria-labelledby={ariaLabelledBy}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
        {children}
      </div>
    </div>
  );
};

export default BottomSheet;
