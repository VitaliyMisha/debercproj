import { useLayoutEffect, useRef, useState } from 'react';

interface ChipOption<T> {
  label: string;
  value: T;
}

interface ChipGroupProps<T> {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Insets of the active chip inside the group, plus which way the pill last moved. */
interface PillBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
  dir: 1 | -1;
  animate: boolean;
}

// "Two-edge" travel: the leading edge snaps ahead with overshoot, the trailing edge catches up — the pill stretches.
const LEAD = '240ms cubic-bezier(0.3, 1.3, 0.5, 1)';
const TRAIL = '460ms cubic-bezier(0.3, 0.9, 0.3, 1)';

export function ChipGroup<T extends string | number>({ options, value, onChange, className = '' }: ChipGroupProps<T>) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<PillBox | null>(null);

  const measure = (animate: boolean) => {
    const wrap = wrapRef.current;
    const el = wrap?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!wrap || !el || el.offsetWidth === 0) {
      setPill(null);
      return;
    }
    const left = el.offsetLeft;
    const top = el.offsetTop;
    const right = wrap.clientWidth - left - el.offsetWidth;
    const bottom = wrap.clientHeight - top - el.offsetHeight;
    setPill((prev) => ({ left, top, right, bottom, dir: prev && left < prev.left ? -1 : 1, animate: animate && prev !== null }));
  };
  const measureRef = useRef(measure);
  measureRef.current = measure;

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure exactly when the selection changes
  useLayoutEffect(() => measureRef.current(true), [value]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === 'undefined') return;
    // Layout changes (wrap, font load, rotation) re-place the pill without animating.
    const ro = new ResizeObserver(() => measureRef.current(false));
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className={`relative flex flex-wrap gap-2 ${className}`}>
      {pill && (
        <span
          aria-hidden="true"
          className="absolute rounded-full bg-primary shadow-md pointer-events-none"
          style={{
            left: pill.left,
            top: pill.top,
            right: pill.right,
            bottom: pill.bottom,
            transition: pill.animate
              ? `left ${pill.dir > 0 ? TRAIL : LEAD}, right ${pill.dir > 0 ? LEAD : TRAIL}, top 300ms ease, bottom 300ms ease`
              : 'none',
          }}
        />
      )}
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={`
              relative px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-150
              active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-to/60
              ${
                active
                  ? // the sliding pill paints the background once measured; until then the chip paints itself
                    `border-primary text-white ${pill ? 'bg-transparent' : 'bg-primary shadow-md'}`
                  : 'bg-card-bg border-white/10 text-muted hover:border-white/30 hover:text-white'
              }
            `}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default ChipGroup;
