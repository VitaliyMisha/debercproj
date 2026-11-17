import { Undo2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Odometer } from './Odometer';

export const UNDO_TOAST_MS = 5000;

interface UndoToastProps {
  roundNumber: number;
  onUndo: () => void;
  onExpire: () => void;
}

/**
 * "Round N added | Undo 5" — a one-tap fix for a mistyped round right after submit.
 * An outline drains around the pill over the countdown; the seconds roll on the Odometer.
 * Remount it (key) per round to restart the countdown.
 */
export const UndoToast: React.FC<UndoToastProps> = ({ roundNumber, onUndo, onExpire }) => {
  const { t } = useTranslation();
  const [left, setLeft] = useState(UNDO_TOAST_MS / 1000);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const tick = setInterval(() => setLeft((s) => Math.max(s - 1, 0)), 1000);
    const done = setTimeout(() => onExpireRef.current(), UNDO_TOAST_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(done);
    };
  }, []);

  return (
    <div className="undo-toast fixed bottom-4 left-1/2 z-40 -translate-x-1/2" role="status">
      <div className="relative flex items-center gap-3 h-11 rounded-full pl-4 pr-1.5 border border-white/10 bg-[#0d1712]/95 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" aria-hidden="true">
          <rect
            className="undo-toast-outline"
            width="100%"
            height="100%"
            // pill radius = half the fixed 44px toast height (rx="999" would clamp to half the WIDTH → an ellipse)
            rx={22}
            ry={22}
            pathLength={100}
            fill="none"
            stroke="currentColor"
            style={{ animationDuration: `${UNDO_TOAST_MS}ms` }}
          />
        </svg>
        <span className="text-sm text-white/80 whitespace-nowrap">{t('common.roundAdded', { n: roundNumber })}</span>
        <button
          type="button"
          onClick={onUndo}
          aria-label={t('common.undoRoundAria', { n: roundNumber })}
          className="h-8 px-3 rounded-full text-xs font-bold inline-flex items-center gap-1.5 transition-transform duration-150 active:scale-[0.95]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-to/60"
          style={{ background: '#7F1D1D88', color: '#FCA5A5', border: '1px solid #DC262655' }}
        >
          <Undo2 className="w-3.5 h-3.5" aria-hidden="true" />
          {t('common.cancel')}
          <span className="font-mono tabular-nums opacity-80">
            <Odometer value={left} />
          </span>
        </button>
      </div>
    </div>
  );
};

export default UndoToast;
