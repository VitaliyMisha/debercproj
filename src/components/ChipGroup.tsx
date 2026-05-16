import React from 'react';

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

export function ChipGroup<T extends string | number>({
  options,
  value,
  onChange,
  className = '',
}: ChipGroupProps<T>) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={`
              px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-150
              active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-to/60
              ${
                active
                  ? 'bg-primary border-primary text-white shadow-md'
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
