import React, { useState } from 'react';

interface NameInputProps {
  id?: string;
  name?: string;
  value: string;
  placeholder?: string;
  suggestions: string[];
  onChange: (value: string) => void;
}

export const NameInput: React.FC<NameInputProps> = ({
  id,
  name,
  value,
  placeholder,
  suggestions,
  onChange,
}) => {
  const [open, setOpen] = useState(false);

  const filtered = value.trim().length > 0
    ? suggestions.filter(
        (s) =>
          s.toLowerCase().includes(value.trim().toLowerCase()) &&
          s.toLowerCase() !== value.trim().toLowerCase(),
      )
    : [];

  const showDropdown = open && filtered.length > 0;

  return (
    <div className="relative flex-1 min-w-0">
      <input
        id={id}
        name={name}
        role="combobox"
        aria-expanded={showDropdown}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        type="text"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)} // delay lets click on a suggestion fire before blur closes the list
        className="w-full bg-transparent border-b border-white/20 text-white placeholder-muted
          font-sans text-base py-1 focus:outline-none focus:border-gold-from transition-colors"
      />
      {showDropdown && (
        <ul
          role="listbox"
          className="absolute top-full mt-1 w-full z-50 rounded-xl bg-card-bg border border-white/10
            shadow-lg shadow-black/40 overflow-hidden"
        >
          {filtered.map((s) => (
            <li
              key={s}
              role="option"
              aria-selected={false}
              onMouseDown={(e) => e.preventDefault()} // prevents blur from firing before click on iOS Safari
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
              className="px-4 py-3 min-h-[44px] flex items-center text-sm text-white/80 font-sans cursor-pointer
                hover:bg-white/10 active:bg-white/15 select-none"
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
