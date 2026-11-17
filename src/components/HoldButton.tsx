import { Check } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** How long the press must be held. The timer — not the CSS fill — confirms, so reduced motion still works. */
export const HOLD_MS = 1200;

interface HoldButtonProps {
  label: React.ReactNode;
  ariaLabel: string;
  onComplete: () => void;
  className?: string;
  style?: React.CSSProperties;
  /** Colour of the fill that grows while held. */
  fill?: string;
}

type Phase = 'idle' | 'holding' | 'done';

/**
 * Press-and-hold confirmation for destructive actions (new game, undo round) — replaces a confirm sheet.
 * The fill grows linearly under the label; an early release drains it back, shakes and shows a "hold" hint.
 * Assistive tech activates with a synthetic click (detail 0): that is deliberate, so it confirms at once.
 */
export const HoldButton: React.FC<HoldButtonProps> = ({ label, ariaLabel, onComplete, className = '', style, fill = '#B91C1C' }) => {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('idle');
  const [nope, setNope] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const phaseRef = useRef<Phase>('idle');
  phaseRef.current = phase;

  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  const clearAll = () => {
    for (const id of timers.current) clearTimeout(id);
    timers.current = [];
  };
  // Unmount only: a per-render cleanup would kill the hold timer mid-press.
  useEffect(
    () => () => {
      for (const id of timers.current) clearTimeout(id);
    },
    []
  );

  const complete = () => {
    clearAll();
    setPhase('done');
    setNope(false);
    if ('vibrate' in navigator) navigator.vibrate(15);
    onComplete();
    later(() => setPhase('idle'), 1200);
  };

  const start = () => {
    if (phaseRef.current !== 'idle') return;
    clearAll();
    setNope(false);
    setPhase('holding');
    later(complete, HOLD_MS);
  };

  const cancel = () => {
    if (phaseRef.current !== 'holding') return;
    clearAll();
    setPhase('idle');
    setNope(true);
    later(() => setNope(false), 1400);
  };

  const isKey = (e: React.KeyboardEvent) => e.key === 'Enter' || e.key === ' ';

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-description={t('common.holdHint')}
      onPointerDown={(e) => {
        // Touch pointers are implicitly captured; release it so sliding off the button fires pointerleave → cancel.
        if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
        start();
      }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (!isKey(e)) return;
        e.preventDefault();
        if (!e.repeat) start();
      }}
      onKeyUp={(e) => {
        if (!isKey(e)) return;
        e.preventDefault();
        cancel();
      }}
      onClick={(e) => {
        if (e.detail === 0 && phaseRef.current === 'idle') complete();
      }}
      className={`hold-btn relative overflow-hidden select-none touch-none ${nope ? 'hold-nope' : ''} ${className}`}
      style={style}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: fill,
          clipPath: phase === 'idle' ? 'inset(0 100% 0 0)' : 'inset(0 0 0 0)',
          transition: phase === 'holding' ? `clip-path ${HOLD_MS}ms linear` : 'clip-path 300ms cubic-bezier(0.23, 1, 0.32, 1)',
        }}
      />
      <span className="relative inline-flex items-center justify-center gap-1">
        {phase === 'done' ? <Check className="hold-check w-4 h-4" aria-hidden="true" /> : nope ? t('common.holdHint') : label}
      </span>
    </button>
  );
};

export default HoldButton;
