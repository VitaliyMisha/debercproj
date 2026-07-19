import type React from 'react';
import { useId, useState } from 'react';

interface NameInputProps {
  id?: string;
  name?: string;
  value: string;
  placeholder?: string;
  suggestions: string[];
  onChange: (value: string) => void;
}

export const NameInput: React.FC<NameInputProps> = ({ id, name, value, placeholder, suggestions, onChange }) => {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const listId = useId();

  const filtered =
    value.trim().length > 0
      ? suggestions.filter((s) => s.toLowerCase().includes(value.trim().toLowerCase()) && s.toLowerCase() !== value.trim().toLowerCase())
      : [];

  const showDropdown = open && filtered.length > 0;

  const select = (s: string) => {
    onChange(s);
    setOpen(false);
    setHighlighted(-1);
  };

  // APG combobox pattern: keyboard interaction lives on the input (ArrowUp/Down,
  // Enter, Escape + aria-activedescendant), options are not tab-focusable.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => (h + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => (h <= 0 ? filtered.length - 1 : h - 1));
    } else if (e.key === 'Enter' && highlighted >= 0 && highlighted < filtered.length) {
      e.preventDefault();
      select(filtered[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHighlighted(-1);
    }
  };

  return (
    <div className="relative flex-1 min-w-0">
      <input
        id={id}
        name={name}
        role="combobox"
        aria-expanded={showDropdown}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-activedescendant={showDropdown && highlighted >= 0 ? `${listId}-${highlighted}` : undefined}
        type="text"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlighted(-1);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)} // delay lets click on a suggestion fire before blur closes the list
        className="w-full bg-transparent border-b border-white/20 text-white placeholder-muted
          font-sans text-base py-1 focus:outline-none focus:border-gold-from transition-colors"
      />
      {showDropdown && (
        <ul
          id={listId}
          // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: canonical APG combobox markup — ul is the listbox popup
          role="listbox"
          className="absolute top-full mt-1 w-full z-50 rounded-xl bg-card-bg border border-white/10
            shadow-lg shadow-black/40 overflow-hidden"
        >
          {filtered.map((s, i) => (
            // biome-ignore lint/a11y/useFocusableInteractive: focus stays on the input; options are navigated via aria-activedescendant
            // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard selection is handled by the input's onKeyDown (Enter)
            <li
              key={s}
              id={`${listId}-${i}`}
              // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: canonical APG combobox markup — li is an option
              role="option"
              aria-selected={i === highlighted}
              onMouseDown={(e) => e.preventDefault()} // prevents blur from firing before click on iOS Safari
              onClick={() => select(s)}
              className={`px-4 py-3 min-h-[44px] flex items-center text-sm text-white/80 font-sans cursor-pointer
                hover:bg-white/10 active:bg-white/15 select-none ${i === highlighted ? 'bg-white/10' : ''}`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NameInput;
